-- Why: Session 16 Part B — Native W3C Web Push & In-App Notification Infrastructure
-- Provisions push_subscriptions table for browser push tokens (Chrome FCM, Apple APNs, Firefox Autopush).

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table push_subscriptions is 'W3C Web Push subscriptions with VAPID credentials per user device.';

create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_created on push_subscriptions(created_at desc);

-- Automatically update updated_at timestamp on record modification
create or replace function set_push_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_push_subscriptions_updated_at on push_subscriptions;
create trigger trg_push_subscriptions_updated_at
before update on push_subscriptions
for each row execute function set_push_subscriptions_updated_at();
