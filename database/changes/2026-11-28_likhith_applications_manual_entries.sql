-- Why: "My Applications → Add application" lets a citizen track something that isn't an ApplyFields
-- listing (no opportunity or service). The old check demanded exactly one link, so those rows could
-- never be saved: the API kept them in server memory and they vanished. Now: at most one link.
-- The manual entry's own title/organization live in the row's notes JSON (no new columns).
-- Safe to re-run.
alter table applications drop constraint if exists applications_one_item;
alter table applications add constraint applications_one_item check (num_nonnulls(opportunity_id, service_id) <= 1);
