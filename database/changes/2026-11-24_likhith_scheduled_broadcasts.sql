-- Why: admins schedule special notifications (festival greetings, planned updates) for a later time.
-- The notifications scheduler sends each row once when send_at passes (status scheduled → sending → sent/failed).
-- input = the AdminBroadcastInput (title, body, link, audience, channels) exactly as the admin entered it.
-- New table → needs Likhith (database/changes/README.md rule 4). Safe to re-run.
-- Run this BEFORE deploying the API that uses it.

create table if not exists scheduled_broadcasts (
  id          uuid primary key default gen_random_uuid(),
  input       jsonb not null,
  send_at     timestamptz not null,
  -- scheduled | sending | sent | failed | cancelled
  status      text not null default 'scheduled',
  notified    int,
  last_error  text,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);

create index if not exists idx_scheduled_broadcasts_due on scheduled_broadcasts(send_at) where status = 'scheduled';
-- Staff-only data: no anon/authenticated access via Supabase's REST API; the API connects as owner.
alter table scheduled_broadcasts enable row level security;
