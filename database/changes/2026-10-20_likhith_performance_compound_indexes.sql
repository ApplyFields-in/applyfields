-- Why: Session 15 — Performance Acceleration & Database Retrieval Optimization
-- Provisions high-throughput compound & partial indexes for opportunities, partners, bookings, notifications and saved items.

-- 1. Opportunities: #1 platform query is published opportunities sorted by closing soonest
create index if not exists idx_opportunities_pub_closing
  on public.opportunities(status, application_end asc)
  where status = 'published';

-- 2. Opportunities: Category filter tabs on published records
create index if not exists idx_opportunities_pub_category
  on public.opportunities(category, status, application_end asc)
  where status = 'published';

-- 3. Opportunities: Newly published feeds & homepage carousels
create index if not exists idx_opportunities_pub_latest
  on public.opportunities(status, published_at desc)
  where status = 'published';

-- 4. Partners: Public directory sorted by rating and recency
create index if not exists idx_partners_directory_verified
  on public.partners(is_listed, verification_status, rating_avg desc, created_at desc)
  where is_listed = true and verification_status = 'verified';

-- 5. Partners: Location lookups by state, city and pincode
create index if not exists idx_partners_location_lookup
  on public.partners(state_code, city, pincode)
  where is_listed = true and verification_status = 'verified';

-- 6. Service Requests: Citizen personal booking timeline
create index if not exists idx_service_requests_user_timeline
  on public.service_requests(user_id, created_at desc);

-- 7. Service Requests: Partner operator booking queue desk
create index if not exists idx_service_requests_partner_queue
  on public.service_requests(partner_id, status, appointment_at asc, created_at desc);

-- 8. Saved Items: Candidate saved dashboard list
create index if not exists idx_saved_items_user_recent
  on public.saved_items(user_id, created_at desc);

-- 9. Notifications: Instant unread badge counter and drawer
create index if not exists idx_notifications_unread_fast
  on public.notifications(user_id, created_at desc)
  where read_at is null;

-- 10. Partner Services: Storefront active service catalog
create index if not exists idx_partner_services_storefront
  on public.partner_services(partner_id, is_active, name asc);
