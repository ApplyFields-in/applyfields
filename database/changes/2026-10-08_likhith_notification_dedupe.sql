-- Why: Session 08 — the database guarantees one notification per (user, event). A retry, a second
-- API instance or re-publishing an update can't notify the same person twice.
-- Keys look like 'update:<update id>' or 'reminder:<item id>:<event>:<date>:<days before>'.
-- Manual admin alerts use 'alert:<uuid>'. NULL = no dedupe.
alter table notifications add column dedupe_key text;
create unique index notifications_user_dedupe_key on notifications (user_id, dedupe_key);
