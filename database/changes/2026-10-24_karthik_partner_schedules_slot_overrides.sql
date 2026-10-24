-- Why: Session 18 — Backend Schedule & Slot Reservation Engine.
-- Provides weekly schedule configuration, operating hours, lunch breaks, capacity limits,
-- and holiday/blackout date overrides for partner centers.

-- 1. Partner weekly schedules matrix
create table if not exists partner_schedules (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun, 1=Mon, ..., 6=Sat
  open_time text not null default '09:00',
  close_time text not null default '20:00',
  has_break boolean not null default true,
  break_start text default '13:00',
  break_end text default '14:00',
  slot_duration_minutes int not null default 30 check (slot_duration_minutes in (15, 30, 45, 60)),
  max_concurrent_bookings int not null default 2 check (max_concurrent_bookings between 1 and 10),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_partner_schedules_day unique (partner_id, day_of_week)
);

-- 2. Partner slot date overrides / holiday blackouts
create table if not exists partner_slot_overrides (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  override_date date not null,
  is_closed boolean not null default true,
  reason text,
  created_at timestamptz not null default now(),
  constraint uq_partner_slot_overrides_date unique (partner_id, override_date)
);

-- 3. Optimized indexes for schedule queries, override checks, and reservation lookups
create index if not exists idx_partner_schedules_partner on partner_schedules(partner_id, is_active);
create index if not exists idx_partner_slot_overrides_lookup on partner_slot_overrides(partner_id, override_date);
create index if not exists idx_service_requests_slot_capacity on service_requests(partner_id, appointment_at, status);

comment on table partner_schedules is 'Weekly operating hours, duration, break times, and concurrency limit per day of week for a partner center.';
comment on table partner_slot_overrides is 'Specific date overrides (holidays, blackout dates, special closures) for a partner center.';
