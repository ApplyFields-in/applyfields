-- Why: Session 13 — Module 2: Assistance Bookings & Citizen Assistance Workflow.
-- Service requests tables (service_requests, service_request_events, partner_reviews)
-- were provisioned in 01_create_tables.sql.
-- This migration activates automated partner rating recomputations and performance indexes.

-- 1. Performance indexes for citizen bookings & partner inboxes
create index if not exists idx_service_requests_user on service_requests(user_id, status);
create index if not exists idx_service_requests_partner on service_requests(partner_id, status);
create index if not exists idx_service_request_events_req on service_request_events(request_id);
create index if not exists idx_partner_reviews_partner on partner_reviews(partner_id, is_visible);

-- 2. Automated Partner Rating Recalculation Trigger
create or replace function partner_rating_recompute(p_partner_id uuid) returns void
language sql set search_path = '' as $$
  update public.partners
  set
    rating_avg = coalesce((
      select round(avg(rating)::numeric, 2)
      from public.partner_reviews
      where partner_id = p_partner_id and is_visible = true
    ), 0),
    rating_count = coalesce((
      select count(*)
      from public.partner_reviews
      where partner_id = p_partner_id and is_visible = true
    ), 0)
  where id = p_partner_id;
$$;

revoke execute on function partner_rating_recompute(uuid) from public, anon, authenticated, service_role;

create or replace function partner_reviews_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.partner_rating_recompute(coalesce(new.partner_id, old.partner_id));
  return null;
end;
$$;

drop trigger if exists partner_reviews_sync on partner_reviews;
create trigger partner_reviews_sync after insert or update or delete on partner_reviews
  for each row execute function partner_reviews_sync();

comment on function partner_rating_recompute(uuid) is 'Automatically updates partner rating_avg and rating_count when citizen reviews are submitted.';
