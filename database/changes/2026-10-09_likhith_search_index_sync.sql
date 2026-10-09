-- Why: Session 09 — universal search (GET /search). search_index already has its indexes from
-- 01_create_tables.sql: GIN on search_vector (full-text) and GIN title gin_trgm_ops (typos).
-- This fills it. A trigger on opportunities and gov_services re-syncs the row after every insert,
-- update or delete, so the index holds PUBLISHED items only, whichever path changed them
-- (review, admin edit, auto-close, scraper). The API never writes search_index itself.
-- ponytail: an organisation rename only reaches the index when its items are next saved;
-- add an organizations trigger if renames become common.

-- Rebuilds one item's search_index row from its source table (deletes it when not published).
create or replace function search_index_refresh(p_type item_type, p_id uuid) returns void
language sql set search_path = '' as $$
  delete from public.search_index where item_type = p_type and item_id = p_id;

  insert into public.search_index (item_type, item_id, title, subtitle, keywords, state_codes, url_path, deadline)
  select p_type, o.id, o.title,
         g.name || case when strpos(g.name, g.short_name) = 0 then ' (' || g.short_name || ')' else '' end,
         concat_ws(' ', case o.type when 'govt_job' then 'government job' else o.type::text end,
                   replace(o.category::text, '_', ' '), o.notification_number),
         o.state_codes,
         case o.type when 'govt_job' then '/jobs/' when 'exam' then '/exams/'
                     when 'scholarship' then '/scholarships/' else '/admissions/' end || o.slug,
         o.application_end
  from public.opportunities o
  join public.organizations g on g.id = o.organization_id
  where p_type = 'opportunity' and o.id = p_id and o.status = 'published'
  union all
  select p_type, s.id, s.name,
         concat_ws(' ', s.authority_name, g.name, g.short_name),
         concat_ws(' ', 'government service', s.category, s.description),
         s.state_codes, '/services/' || s.slug, null
  from public.gov_services s
  left join public.organizations g on g.id = s.organization_id
  where p_type = 'service' and s.id = p_id and s.status = 'published';
$$;

-- Supabase lets anon/authenticated call public functions over its REST API; nobody should call this one.
revoke execute on function search_index_refresh(item_type, uuid) from public, anon, authenticated, service_role;

-- security definer: the scraper login (ingestion_writer) and developer logins have no rights on search_index.
create or replace function search_index_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.search_index_refresh(
    (case tg_table_name when 'opportunities' then 'opportunity' else 'service' end)::public.item_type,
    coalesce(new.id, old.id));
  return null;
end;
$$;

drop trigger if exists search_index_sync on opportunities;
create trigger search_index_sync after insert or update or delete on opportunities
  for each row execute function search_index_sync();

drop trigger if exists search_index_sync on gov_services;
create trigger search_index_sync after insert or update or delete on gov_services
  for each row execute function search_index_sync();

-- Backfill what is already published.
select search_index_refresh('opportunity', id) from opportunities where status = 'published';
select search_index_refresh('service', id) from gov_services where status = 'published';

comment on table search_index is 'One row per PUBLISHED searchable item. Powers universal search. Kept in sync by the search_index_sync triggers.';
