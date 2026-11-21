-- Why: first-sign-in setup ("What brings you here?", interests, where to work/study). Home ranks
-- recommendations by these answers (docs/superpowers/specs/2026-11-21-onboarding-preferences-design.md).
-- One row per user. Education, state and date of birth are NOT here: the setup writes those into
-- user_profiles / user_education so there is one copy of them.
-- New table → needs Likhith (database/changes/README.md rule 4). Safe to re-run.
-- Run this BEFORE deploying the API that reads it (the API tolerates its absence, but setup can't save).

create table if not exists user_preferences (
  user_id        uuid primary key references users(id) on delete cascade,
  -- school_student | college_student | job_seeker | exam_prep
  personas       text[] not null default '{}',
  -- railways | banking | ssc | upsc | defence | police | teaching | state_psc | psu
  -- | scholarships | entrance | jobs_after_graduation | admissions
  interests      text[] not null default '{}',
  location_scope text check (location_scope in ('state', 'state_central', 'all')),
  -- true when they pressed "Skip for now"
  skipped        boolean not null default false,
  -- set on finish or skip; null = setup not done yet (Home sends them to /welcome)
  onboarded_at   timestamptz,
  updated_at     timestamptz not null default now()
);

-- Same lock-down as every other table (01_create_tables.sql section 17): only the API reaches it.
alter table user_preferences enable row level security;
revoke all on table user_preferences from anon, authenticated, service_role;
