-- Why: Priority 1 & 2 — Competitive Exam Scores persistence & Public Profile sharing
-- 1. Persistent storage for candidate competitive exam benchmarks (GATE, JEE, NEET, CAT, UGC-NET, etc.)
-- 2. Public handle and portfolio visibility toggle for verified candidate profiles

-- 1. Create table for user competitive exam scores
create table if not exists user_competitive_exam_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  exam_type varchar(50) not null,
  exam_name varchar(255) not null,
  year int not null,
  roll_number varchar(100),
  registration_number varchar(100),
  discipline_or_paper varchar(200),
  score varchar(100),
  marks varchar(100),
  percentile varchar(50),
  all_india_rank varchar(50),
  category_rank varchar(50),
  award_or_status varchar(255),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_competitive_exam_scores_user on user_competitive_exam_scores(user_id);

-- 2. Add public profile portfolio sharing columns to user_profiles
alter table user_profiles add column if not exists is_public boolean not null default false;
alter table user_profiles add column if not exists handle varchar(100);

create unique index if not exists uq_user_profiles_handle on user_profiles(handle) where handle is not null;
create index if not exists idx_user_profiles_handle on user_profiles(handle);

comment on table user_competitive_exam_scores is 'Verified and self-reported competitive examination scores (GATE, JEE, NEET, etc.) for candidates.';
comment on column user_profiles.is_public is 'Controls whether the candidate portfolio is accessible publicly at /u/[handle]. Default false.';
comment on column user_profiles.handle is 'Unique public URL handle for the candidate portfolio.';
