-- Why: Session 13 — Module 1: Partner Portal & Verification Network.
-- Partners tables (partners, partner_members, partner_documents, partner_services)
-- were provisioned in 01_create_tables.sql (Month 4 schema).
-- This migration activates search indexing, performance indexes, and partner lookup optimization.

-- 1. Performance indexes for partner discovery & rate cards
create index if not exists idx_partners_listed_status on partners(is_listed, verification_status);
create index if not exists idx_partners_geo on partners(state_code, district, city);
create index if not exists idx_partner_services_active on partner_services(partner_id, is_active);

-- 2. Sync function for verified and listed partners into universal search_index
create or replace function partner_search_index_refresh(p_id uuid) returns void
language sql set search_path = '' as $$
  delete from public.search_index where item_type = 'partner' and item_id = p_id;

  insert into public.search_index (item_type, item_id, title, subtitle, keywords, state_codes, url_path, deadline)
  select 'partner'::public.item_type, p.id, p.business_name,
         concat_ws(' · ', replace(p.type::text, '_', ' '), p.city, p.district),
         concat_ws(' ', 'partner', 'assistance', 'facilitation center', replace(p.type::text, '_', ' '),
                   p.business_name, coalesce(p.owner_name, ''), coalesce(p.city, ''),
                   coalesce(p.district, ''), coalesce(p.state_code, ''), coalesce(p.pincode, ''),
                   coalesce(p.description, '')),
         case when p.state_code is not null then array[p.state_code] else array['ALL']::text[] end,
         '/assistance?partner=' || p.slug,
         null
  from public.partners p
  where p.id = p_id and p.is_listed = true and p.verification_status = 'verified';
$$;

revoke execute on function partner_search_index_refresh(uuid) from public, anon, authenticated, service_role;

create or replace function partner_search_index_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.partner_search_index_refresh(coalesce(new.id, old.id));
  return null;
end;
$$;

drop trigger if exists partner_search_index_sync on partners;
create trigger partner_search_index_sync after insert or update or delete on partners
  for each row execute function partner_search_index_sync();

-- 3. Backfill any existing verified and listed partners
select partner_search_index_refresh(id) from partners where is_listed = true and verification_status = 'verified';

comment on function partner_search_index_refresh(uuid) is 'Keeps verified & listed partners synced in universal search_index.';
