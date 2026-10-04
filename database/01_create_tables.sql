-- =====================================================================
--  APPLYFIELDS — DATABASE SCHEMA  (66 tables)
--  File: database/01_create_tables.sql   ·   Owner: Likhith
--
--  HOW TO RUN (takes a few seconds)
--    1. Supabase → your DEV project → SQL Editor → "New query"
--    2. Paste this whole file → click "Run"
--    3. Run it ONE time, on an EMPTY database.
--       It runs as one transaction: if any line fails, NOTHING is created.
--    4. Check: Table Editor shows 66 tables, all with "RLS enabled".
--    5. When everything is tested, run the same file on the PROD project.
--
--  CONTENTS
--     0. Setup                          9. Payments            (LATER)
--     1. Allowed values (enums)        10. My activity
--     2. Users & account               11. Notifications
--     3. Profile                       12. Document sharing    (LATER)
--     4. Organisations, exams,         13. Search, support & internal
--        colleges & courses            14. Scrapers
--     5. Apply Mode                    15. Indexes (speed)
--     6. Career Mode                   16. Automatic triggers
--     7. Documents                     17. Security (RLS + lock Supabase API keys)
--     8. Partners             (LATER)
--
--  Tables marked LATER are created now (empty) but used from Month 3+.
--
--  CONVENTIONS
--    · Every table has  id uuid  (link tables use two ids instead)
--    · created_at / updated_at are filled automatically (also for Python)
--    · Money in content (fees, salaries, income) = whole rupees
--    · Money in payment tables = paise (₹1 = 100 paise — Razorpay uses paise)
--    · Missing official info → NULL + field_status  (see docs/job-format.md)
-- =====================================================================

begin;

set local search_path = public, extensions;


-- =====================================================================
-- 0. SETUP
-- =====================================================================

-- pg_trgm = fast "search as you type". Supabase keeps extensions in the "extensions" schema.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'extensions') then
    create schema extensions;
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create extension pg_trgm with schema extensions;
  end if;
end;
$$;

-- Sets updated_at = now() on every UPDATE (works for Prisma AND Python)
create function set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Builds the full-text search vector for search_index
create function search_index_build_vector() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.search_vector :=
       setweight(to_tsvector('simple', coalesce(new.title, '')),    'A')
    || setweight(to_tsvector('simple', coalesce(new.subtitle, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(new.keywords, '')), 'C');
  return new;
end;
$$;

-- audit_logs rows can be added, never changed or deleted
create function prevent_audit_log_changes() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_logs is append-only: rows cannot be changed or deleted';
end;
$$;


-- =====================================================================
-- 1. ALLOWED VALUES (enums) — a column of this type accepts only these
-- =====================================================================

-- people & accounts
create type user_status          as enum ('active', 'suspended', 'deleted');
create type staff_role           as enum ('super_admin', 'admin', 'reviewer', 'content_editor', 'support');
create type otp_purpose          as enum ('verify_email', 'verify_phone', 'login', 'reset_password');
create type consent_purpose      as enum ('terms', 'privacy', 'sms', 'whatsapp', 'email_updates', 'analytics');
create type gender               as enum ('male', 'female', 'transgender', 'prefer_not_to_say');
create type gender_rule          as enum ('any', 'male', 'female', 'transgender');
create type social_category      as enum ('GEN', 'OBC', 'SC', 'ST', 'EWS');
create type education_status     as enum ('completed', 'pursuing');
create type score_type           as enum ('percentage', 'cgpa', 'grade');

-- content
create type org_level            as enum ('central', 'state', 'district', 'local');
create type content_status       as enum ('draft', 'published', 'closed', 'archived');
create type opportunity_type     as enum ('govt_job', 'exam', 'scholarship', 'admission');
create type opportunity_category as enum (
  'central_govt', 'state_govt', 'district', 'panchayat', 'municipal', 'psu',   -- government jobs
  'railways', 'banking', 'defence', 'police',
  'entrance', 'competitive', 'recruitment',                                    -- exams
  'central', 'state',                                                          -- scholarships
  'college', 'university', 'course',                                           -- admissions
  'other');
create type date_kind            as enum ('notification_date', 'application_start', 'application_end',
  'fee_last_date', 'correction_window', 'admit_card', 'exam_date', 'answer_key', 'result',
  'interview', 'counselling', 'other');
create type update_kind          as enum ('admit_card', 'answer_key', 'result', 'correction_window',
  'date_change', 'extension', 'counselling', 'other');
create type version_status       as enum ('pending', 'approved', 'rejected');
create type institution_type     as enum ('college', 'university', 'institute', 'school', 'training_centre');
create type institution_ownership as enum ('government', 'private', 'deemed', 'autonomous', 'aided');
create type course_level         as enum ('certificate', 'iti', 'diploma', 'ug', 'pg', 'phd');

-- career mode
create type skill_kind           as enum ('technical', 'soft', 'domain', 'language');
create type roadmap_step_kind    as enum ('education', 'course', 'exam', 'skill', 'certification',
  'project', 'internship', 'job', 'milestone');
create type plan_status          as enum ('active', 'paused', 'completed');
create type progress_status      as enum ('todo', 'in_progress', 'done', 'skipped');
create type message_role         as enum ('user', 'assistant');

-- user activity & notifications
create type item_type            as enum ('opportunity', 'exam', 'service', 'institution', 'course',
  'career', 'roadmap', 'partner', 'update');
create type application_mode     as enum ('official', 'applyfields_assisted', 'partner_assisted');
create type application_status   as enum ('planning', 'applied', 'admit_card_received', 'exam_attended',
  'result_awaited', 'selected', 'not_selected', 'completed', 'withdrawn');
create type reminder_status      as enum ('pending', 'sent', 'cancelled', 'failed');
create type notification_type    as enum ('new_job', 'new_exam', 'new_scholarship', 'new_admission',
  'service_update', 'closing_reminder', 'saved_item_changed', 'admit_card', 'answer_key', 'result',
  'correction_window', 'date_change', 'profile_match', 'document_expiry', 'request_update',
  'account_security', 'system');
create type notification_channel as enum ('in_app', 'email', 'sms', 'push', 'whatsapp');
create type delivery_status      as enum ('pending', 'sent', 'delivered', 'failed');

-- documents, support, scrapers
create type doc_source           as enum ('upload', 'digilocker');
create type document_action      as enum ('upload', 'view', 'download', 'share', 'revoke', 'delete');
create type case_status          as enum ('open', 'in_review', 'resolved', 'rejected', 'closed');
create type report_reason        as enum ('incorrect_info', 'broken_link', 'fake_or_scam',
  'partner_issue', 'service_complaint', 'other');
create type scrape_run_status    as enum ('running', 'success', 'partial', 'failed');
create type scraped_doc_status   as enum ('new', 'extracted', 'failed', 'ignored', 'linked');

-- partners & payments (LATER)
create type partner_type         as enum ('meeseva', 'csc', 'xerox_printing', 'browsing_centre',
  'typing_centre', 'passport_studio', 'application_assistance', 'consultant', 'college',
  'university', 'training_institute', 'other');
create type verification_status  as enum ('pending', 'verified', 'rejected', 'suspended');
create type partner_member_role  as enum ('owner', 'staff');
create type request_status       as enum ('new', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled');
create type payout_status        as enum ('pending', 'processing', 'paid', 'failed');
create type plan_audience        as enum ('user', 'partner');
create type billing_period       as enum ('monthly', 'quarterly', 'yearly', 'one_time');
create type subscription_status  as enum ('pending', 'active', 'expired', 'cancelled');
create type payment_purpose      as enum ('user_subscription', 'partner_subscription', 'convenience_fee', 'service_charge');
create type payment_status       as enum ('created', 'paid', 'failed', 'refunded');
create type device_platform      as enum ('android', 'ios', 'web');
create type enquiry_status       as enum ('new', 'responded', 'closed');


-- =====================================================================
-- 2. USERS & ACCOUNT  (5 tables)
-- =====================================================================

create table users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text unique check (email = lower(email)),
  phone                 text unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),   -- +91XXXXXXXXXX
  password_hash         text,
  status                user_status not null default 'active',
  email_verified_at     timestamptz,
  phone_verified_at     timestamptz,
  mfa_enabled           boolean not null default false,
  mfa_secret_encrypted  text,
  last_login_at         timestamptz,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint users_need_email_or_phone check (status = 'deleted' or email is not null or phone is not null)
);
comment on table users is 'Login accounts for citizens, partners and ApplyFields staff.';

create table user_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  refresh_token_hash  text not null unique,
  device_name         text,
  user_agent          text,
  ip_address          text,
  last_used_at        timestamptz,
  expires_at          timestamptz not null,
  revoked_at          timestamptz,
  created_at          timestamptz not null default now()
);
comment on table user_sessions is 'Logged-in devices. Stores a HASH of the refresh token, never the token itself.';

create table otp_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  target      text not null,                        -- the email or phone the code was sent to
  purpose     otp_purpose not null,
  code_hash   text not null,
  attempts    smallint not null default 0,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
comment on table otp_codes is 'One-time codes (hashed) for email/phone verification, OTP login and password reset.';

create table user_roles (
  user_id     uuid not null references users(id) on delete cascade,
  role        staff_role not null,
  granted_by  uuid references users(id) on delete set null,
  granted_at  timestamptz not null default now(),
  primary key (user_id, role)
);
comment on table user_roles is 'ApplyFields staff roles for the Internal Portal. Normal users have no rows here.';

create table consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  purpose         consent_purpose not null,
  policy_version  text not null,
  granted         boolean not null,
  granted_at      timestamptz not null default now(),
  withdrawn_at    timestamptz,
  ip_address      text
);
comment on table consents is 'What the user agreed to and when (terms, privacy, SMS…). Needed for the DPDP Act.';


-- =====================================================================
-- 3. PROFILE  (4 tables)
-- =====================================================================

create table user_profiles (
  user_id               uuid primary key references users(id) on delete cascade,
  full_name             text,
  date_of_birth         date,
  gender                gender,
  category              social_category,
  is_pwbd               boolean not null default false,
  pwbd_type             text,                                   -- locomotor, visual, hearing…
  is_ex_serviceman      boolean not null default false,
  is_minority           boolean not null default false,
  special_conditions    text[] not null default '{}',           -- widow, divorced_woman, sports_quota…
  annual_family_income  integer check (annual_family_income >= 0),
  state_code            text check (state_code ~ '^[A-Z]{2}$'),
  district              text,
  domicile_state_code   text check (domicile_state_code ~ '^[A-Z]{2}$'),
  preferred_language    text not null default 'en',             -- en, te, hi
  avatar_url            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table user_profiles is 'Personal details used for eligibility: DOB, gender, category, income, state…';

create table user_education (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references users(id) on delete cascade,
  level                text not null check (level in ('10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd')),
  degree               text,                                    -- SSC, Intermediate, B.Tech, B.Sc…
  stream               text,                                    -- MPC, BiPC, CSE, Commerce…
  board_or_university  text,
  institution_name     text,
  year_of_passing      smallint check (year_of_passing between 1950 and 2100),
  score                numeric(5, 2),
  score_type           score_type,
  status               education_status not null default 'completed',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table user_education is 'One row per qualification (10th, 12th, degree…). Used for eligibility.';

create table notification_preferences (
  user_id               uuid primary key references users(id) on delete cascade,
  email_enabled         boolean not null default true,
  sms_enabled           boolean not null default false,
  push_enabled          boolean not null default true,
  whatsapp_enabled      boolean not null default false,
  muted_types           text[] not null default '{}',           -- notification types the user turned off
  reminder_days_before  integer[] not null default '{7,3,1}',
  quiet_hours_start     time,
  quiet_hours_end       time,
  updated_at            timestamptz not null default now()
);
comment on table notification_preferences is 'Which alerts the user wants, on which channels, and how many days before deadlines.';

create table career_profiles (
  user_id                uuid primary key references users(id) on delete cascade,
  education_stage        text check (education_stage in ('class_8_10', 'class_11_12', 'diploma',
                           'undergraduate', 'postgraduate', 'graduate_job_seeker', 'working')),
  current_qualification  text,
  subjects               text[] not null default '{}',
  interests              text[] not null default '{}',
  skills                 text[] not null default '{}',          -- skill slugs
  career_interests       text[] not null default '{}',          -- career slugs
  goals                  text,
  preferred_direction    text check (preferred_direction in ('higher_studies', 'government_job',
                           'private_job', 'business', 'not_sure')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table career_profiles is 'Career Mode profile: education stage, subjects, interests, skills, goals.';


-- =====================================================================
-- 4. ORGANISATIONS, EXAMS, COLLEGES & COURSES  (6 tables)
-- =====================================================================

create table organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  short_name   text,
  slug         text not null unique,
  level        org_level not null,
  state_code   text check (state_code ~ '^[A-Z]{2}$'),
  website      text,
  logo_url     text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table organizations is 'Who publishes opportunities: SSC, UPSC, APPSC, NTA, banks, universities…';

create table exams (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name                 text not null,                           -- "SSC CGL", "JEE Main"
  short_name           text,
  organization_id      uuid references organizations(id) on delete set null,
  category             text check (category in ('entrance', 'competitive', 'recruitment')),
  description          text,
  eligibility_summary  text,
  frequency            text,                                    -- yearly, twice a year…
  exam_pattern         jsonb,
  syllabus             jsonb,                                   -- {"text": …, "url": …}
  previous_papers      jsonb not null default '[]',
  official_website     text,
  status               content_status not null default 'draft',
  field_status         jsonb not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table exams is 'Permanent exam pages (SSC CGL, JEE Main, NEET). Each year''s notification is an opportunity linked here.';

create table institutions (
  id                        uuid primary key default gen_random_uuid(),
  slug                      text not null unique,
  name                      text not null,
  short_name                text,
  type                      institution_type not null,
  ownership                 institution_ownership,
  affiliated_university_id  uuid references institutions(id) on delete set null,
  state_code                text check (state_code ~ '^[A-Z]{2}$'),
  district                  text,
  city                      text,
  address                   text,
  pincode                   text check (pincode ~ '^[1-9][0-9]{5}$'),
  latitude                  numeric(9, 6),
  longitude                 numeric(9, 6),
  website                   text,
  logo_url                  text,
  description               text,
  accreditation             jsonb not null default '{}',        -- {"naac": "A+", "nirf_rank": 45}
  established_year          smallint,
  fees_text                 text,
  contact_email             text,
  contact_phone             text,
  status                    content_status not null default 'draft',
  field_status              jsonb not null default '{}',
  last_verified_at          timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
comment on table institutions is 'Colleges and universities (Career Mode + Admissions).';

create table courses (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,                             -- "B.Tech Computer Science", "MBBS"
  short_name         text,
  level              course_level not null,
  stream             text,
  description        text,
  eligibility_text   text,
  min_qualification  text check (min_qualification in ('10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd')),
  duration_months    smallint,
  skills_developed   text[] not null default '{}',
  career_outcomes    text,
  status             content_status not null default 'draft',
  field_status       jsonb not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table courses is 'Courses/programmes: what they are, eligibility, duration, skills.';

create table institution_courses (
  institution_id     uuid not null references institutions(id) on delete cascade,
  course_id          uuid not null references courses(id) on delete cascade,
  seats              integer,
  fee_per_year       integer,                                   -- rupees
  fees_text          text,
  duration_months    smallint,
  admission_process  text,
  mode               text not null default 'regular' check (mode in ('regular', 'distance', 'online', 'part_time')),
  primary key (institution_id, course_id)
);
comment on table institution_courses is 'Which college offers which course (seats, fees, admission process).';

create table course_exams (
  course_id  uuid not null references courses(id) on delete cascade,
  exam_id    uuid not null references exams(id) on delete cascade,
  primary key (course_id, exam_id)
);
comment on table course_exams is 'Entrance exams that lead to a course.';


-- =====================================================================
-- 5. APPLY MODE  (7 tables)
-- =====================================================================

create table opportunities (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  type                  opportunity_type not null,
  category              opportunity_category not null,
  title                 text not null,
  organization_id       uuid not null references organizations(id),
  exam_id               uuid references exams(id) on delete set null,
  institution_id        uuid references institutions(id) on delete set null,
  course_id             uuid references courses(id) on delete set null,
  notification_number   text,
  summary               text,
  state_codes           text[] not null default '{ALL}',
  districts             text[] not null default '{}',
  vacancies_total       integer,
  fees                  jsonb not null default '[]',          -- [{"category":"GEN","gender":"any","amount":100}]
  fee_text              text,
  payment_modes         text[] not null default '{}',
  selection_process     text[] not null default '{}',
  required_documents    jsonb not null default '[]',
  syllabus              jsonb,
  previous_papers       jsonb not null default '[]',
  benefits_text         text,
  -- official links
  notification_pdf_url  text,
  official_page_url     text,
  apply_url             text,
  official_website      text,
  -- copies of the key dates (fast "closing soon" lists)
  application_start     date,
  application_end       date,
  -- status & missing data
  status                content_status not null default 'draft',
  field_status          jsonb not null default '{}',
  -- where it came from (filled by the scraper)
  source_key            text,
  source_url            text,
  source_content_hash   text,
  source_fetched_at     timestamptz,
  extractor_version     text,
  ai_model              text,
  confidence            numeric(3, 2) check (confidence between 0 and 1),
  -- review
  reviewed_by           uuid references users(id) on delete set null,
  published_by          uuid references users(id) on delete set null,
  published_at          timestamptz,
  last_verified_at      timestamptz,
  closed_at             timestamptz,
  version               integer not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint opportunities_need_official_link_to_publish
    check (status = 'draft' or notification_pdf_url is not null or official_page_url is not null)
);
comment on table opportunities is 'Every government job, exam notification, scholarship and admission (column "type" says which). Scrapers create drafts; reviewers publish.';

create table opportunity_posts (
  id                     uuid primary key default gen_random_uuid(),
  opportunity_id         uuid not null references opportunities(id) on delete cascade,
  name                   text not null,
  vacancies_total        integer,
  vacancies_by_category  jsonb,                               -- {"GEN": 50, "OBC": 32, …}
  pay_level              text,
  salary_min             integer,                             -- monthly, rupees
  salary_max             integer,
  salary_text            text,
  sort_order             smallint not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table opportunity_posts is 'Posts inside one notification, each with its own vacancies and pay.';

create table opportunity_eligibility (
  id                     uuid primary key default gen_random_uuid(),
  opportunity_id         uuid not null references opportunities(id) on delete cascade,
  post_id                uuid references opportunity_posts(id) on delete cascade,   -- NULL = applies to all posts
  age_min                smallint,
  age_max                smallint,
  age_as_on_date         date,
  age_relaxations        jsonb not null default '[]',         -- [{"category":"OBC","years":3},{"gender":"female","years":5}]
  qualification_level    text check (qualification_level in ('10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd')),
  qualification_streams  text[] not null default '{}',
  min_percentage         numeric(5, 2),
  final_year_allowed     boolean,
  gender                 gender_rule not null default 'any',
  domicile_states        text[] not null default '{}',        -- empty = no state restriction
  categories_allowed     text[] not null default '{}'         -- empty = all categories
                           check (categories_allowed <@ array['GEN', 'OBC', 'SC', 'ST', 'EWS', 'PWBD', 'EXS']),
  income_max             integer,                             -- annual family income, rupees
  other_conditions       text[] not null default '{}',
  official_text          text,                                -- the exact wording from the notification
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint opportunity_eligibility_age_range check (age_min is null or age_max is null or age_min <= age_max)
);
comment on table opportunity_eligibility is 'Eligibility rules (age, qualification, gender, category, state, income). Always keeps the official wording.';

create table opportunity_dates (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references opportunities(id) on delete cascade,
  kind            date_kind not null,
  date            date not null,
  end_date        date,
  is_tentative    boolean not null default false,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint opportunity_dates_valid_range check (end_date is null or end_date >= date)
);
comment on table opportunity_dates is 'All important dates (last date, exam date, admit card…). Reminders are built from these.';

create table opportunity_versions (
  id                   uuid primary key default gen_random_uuid(),
  opportunity_id       uuid not null references opportunities(id) on delete cascade,
  version_no           integer not null,
  status               version_status not null default 'pending',
  snapshot             jsonb not null,                        -- the full opportunity at this version
  changed_fields       text[] not null default '{}',
  change_note          text,
  scraped_document_id  uuid,                                  -- foreign key added in section 14
  created_by           uuid references users(id) on delete set null,   -- NULL = created by a scraper
  reviewed_by          uuid references users(id) on delete set null,
  reviewed_at          timestamptz,
  created_at           timestamptz not null default now(),
  unique (opportunity_id, version_no)
);
comment on table opportunity_versions is 'Change history. Scrapers add changes as "pending"; a reviewer approves them before they go live.';

create table gov_services (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  category              text,                                 -- identity, certificates, property, transport, welfare…
  organization_id       uuid references organizations(id) on delete set null,
  description           text,                                 -- what it is
  who_needs_it          text,
  eligibility_text      text,
  required_documents    jsonb not null default '[]',
  fees                  jsonb not null default '[]',
  fee_text              text,
  process_steps         jsonb not null default '[]',
  processing_time_text  text,
  authority_name        text,
  authority_level       org_level,
  state_codes           text[] not null default '{ALL}',
  official_url          text,
  apply_url             text,
  assistance_available  boolean not null default false,
  status                content_status not null default 'draft',
  field_status          jsonb not null default '{}',
  created_by            uuid references users(id) on delete set null,
  published_at          timestamptz,
  last_verified_at      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table gov_services is 'Government services (PAN, passport, certificates, MeeSeva…). Entered by the ApplyFields team, not scraped.';

create table updates (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid references opportunities(id) on delete cascade,
  service_id      uuid references gov_services(id) on delete cascade,
  kind            update_kind not null,
  title           text not null,
  date            date,
  url             text,
  summary         text,
  status          content_status not null default 'draft',
  source_url      text,
  published_by    uuid references users(id) on delete set null,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint updates_belong_to_one_item check (num_nonnulls(opportunity_id, service_id) = 1)
);
comment on table updates is 'Admit cards, results, answer keys, date changes… for an opportunity or a service. Publishing one notifies everyone who saved it.';


-- =====================================================================
-- 6. CAREER MODE  (12 tables)
-- =====================================================================

create table career_categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  icon         text,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table career_categories is 'Career groups: Engineering, Medical, Government Services, Arts…';

create table careers (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  category_id         uuid references career_categories(id) on delete set null,
  title               text not null,
  summary             text,
  what_it_involves    text,
  education_required  text,
  salary_text         text,
  outlook_text        text,
  learning_areas      text[] not null default '{}',
  related_filters     jsonb not null default '{}',            -- how to find live jobs/scholarships for this career
  status              content_status not null default 'draft',
  field_status        jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table careers is 'Career profiles (Software Engineer, Doctor, IAS Officer…).';

create table skills (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  kind         skill_kind,
  description  text,
  created_at   timestamptz not null default now()
);
comment on table skills is 'Master list of skills.';

create table career_courses (
  career_id  uuid not null references careers(id) on delete cascade,
  course_id  uuid not null references courses(id) on delete cascade,
  primary key (career_id, course_id)
);
comment on table career_courses is 'Courses that lead to a career.';

create table career_exams (
  career_id  uuid not null references careers(id) on delete cascade,
  exam_id    uuid not null references exams(id) on delete cascade,
  primary key (career_id, exam_id)
);
comment on table career_exams is 'Exams connected to a career (entrance or recruitment).';

create table career_skills (
  career_id   uuid not null references careers(id) on delete cascade,
  skill_id    uuid not null references skills(id) on delete cascade,
  importance  smallint not null default 3 check (importance between 1 and 5),
  primary key (career_id, skill_id)
);
comment on table career_skills is 'Skills needed for a career (importance 1–5).';

create table roadmaps (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique,
  career_id                uuid references careers(id) on delete cascade,
  title                    text not null,
  description              text,
  for_stage                text,                              -- after_10th, after_12th, graduate…
  estimated_duration_text  text,
  status                   content_status not null default 'draft',
  version                  integer not null default 1,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
comment on table roadmaps is 'A step-by-step path towards a career.';

create table roadmap_steps (
  id                       uuid primary key default gen_random_uuid(),
  roadmap_id               uuid not null references roadmaps(id) on delete cascade,
  stage                    text,                              -- "Class 11–12", "Degree", "Job preparation"
  sort_order               smallint not null default 0,
  kind                     roadmap_step_kind not null,
  title                    text not null,
  description              text,
  course_id                uuid references courses(id) on delete set null,
  exam_id                  uuid references exams(id) on delete set null,
  skill_id                 uuid references skills(id) on delete set null,
  resources                jsonb not null default '[]',       -- suggested learning links
  estimated_duration_text  text,
  is_milestone             boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
comment on table roadmap_steps is 'Ordered steps and milestones of a roadmap.';

create table user_roadmaps (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  roadmap_id    uuid not null references roadmaps(id) on delete cascade,
  status        plan_status not null default 'active',
  target_date   date,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, roadmap_id)
);
comment on table user_roadmaps is 'Roadmaps a user has started.';

create table user_roadmap_progress (
  user_roadmap_id  uuid not null references user_roadmaps(id) on delete cascade,
  step_id          uuid not null references roadmap_steps(id) on delete cascade,
  status           progress_status not null default 'todo',
  completed_at     timestamptz,
  note             text,
  updated_at       timestamptz not null default now(),
  primary key (user_roadmap_id, step_id)
);
comment on table user_roadmap_progress is 'Progress on each roadmap step.';

create table guidance_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table guidance_conversations is 'AI career guidance chats.';

create table guidance_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references guidance_conversations(id) on delete cascade,
  role             message_role not null,
  content          text not null,
  sources          jsonb not null default '[]',               -- careers/courses the answer was based on
  created_at       timestamptz not null default now()
);
comment on table guidance_messages is 'Messages inside an AI career guidance chat.';


-- =====================================================================
-- 7. DOCUMENTS  (2 tables)
-- =====================================================================

create table document_types (
  code         text primary key,                             -- photo, signature, class_10_marksheet, caste_certificate…
  name         text not null,
  category     text,                                         -- identity, education, certificate, photo, other
  has_expiry   boolean not null default false,
  description  text,
  sort_order   smallint not null default 0
);
comment on table document_types is 'Standard document list. Opportunities and services use the same codes, so we can show "document readiness".';

create table user_documents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  document_type_code  text not null references document_types(code),
  title               text,
  storage_path        text not null,                         -- path in the PRIVATE Storage bucket "user-documents"
  file_name           text,
  mime_type           text,
  size_bytes          integer,
  issued_on           date,
  expires_on          date,
  issuing_authority   text,
  details             jsonb not null default '{}',
  source              doc_source not null default 'upload',
  digilocker_uri      text,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table user_documents is 'The user''s documents (file stored in private Storage). Never store full Aadhaar numbers.';


-- =====================================================================
-- 8. PARTNERS  (8 tables — LATER, Month 4)
-- =====================================================================

create table partners (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  type                 partner_type not null,
  business_name        text not null,
  description          text,
  logo_url             text,
  owner_name           text,
  phone                text,
  whatsapp             text,
  email                text,
  address              text,
  state_code           text check (state_code ~ '^[A-Z]{2}$'),
  district             text,
  city                 text,
  pincode              text check (pincode ~ '^[1-9][0-9]{5}$'),
  latitude             numeric(9, 6),
  longitude            numeric(9, 6),
  service_areas        text[] not null default '{}',         -- pincodes or districts served
  working_hours        jsonb not null default '{}',          -- {"mon": ["09:00", "18:00"], …}
  is_available         boolean not null default true,
  institution_id       uuid references institutions(id) on delete set null,   -- for college/university partners
  verification_status  verification_status not null default 'pending',
  verified_at          timestamptz,
  verified_by          uuid references users(id) on delete set null,
  is_listed            boolean not null default false,       -- shown to users only after verification
  rating_avg           numeric(3, 2) not null default 0,
  rating_count         integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table partners is 'LATER (Month 4). Verified assistance partners: MeeSeva, CSC, xerox/browsing centres, consultants, institutions.';

create table partner_members (
  partner_id  uuid not null references partners(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        partner_member_role not null default 'owner',
  created_at  timestamptz not null default now(),
  primary key (partner_id, user_id)
);
comment on table partner_members is 'LATER. Which user accounts can manage a partner.';

create table partner_documents (
  id             uuid primary key default gen_random_uuid(),
  partner_id     uuid not null references partners(id) on delete cascade,
  document_kind  text not null,                              -- gst_certificate, shop_licence, meeseva_authorisation…
  storage_path   text not null,
  status         verification_status not null default 'pending',
  reviewer_note  text,
  reviewed_by    uuid references users(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);
comment on table partner_documents is 'LATER. Documents a partner uploads to get verified.';

create table partner_services (
  id                   uuid primary key default gen_random_uuid(),
  partner_id           uuid not null references partners(id) on delete cascade,
  service_id           uuid references gov_services(id) on delete set null,
  name                 text not null,
  description          text,
  charge_paise         integer check (charge_paise >= 0),
  charge_text          text,
  estimated_time_text  text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table partner_services is 'LATER. Services a partner offers and their charges.';

create table service_requests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references users(id) on delete set null,
  partner_id          uuid not null references partners(id),
  partner_service_id  uuid references partner_services(id) on delete set null,
  service_id          uuid references gov_services(id) on delete set null,
  opportunity_id      uuid references opportunities(id) on delete set null,
  status              request_status not null default 'new',
  appointment_at      timestamptz,
  user_note           text,
  partner_note        text,
  quoted_paise        integer check (quoted_paise >= 0),
  final_paise         integer check (final_paise >= 0),
  cancelled_reason    text,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
comment on table service_requests is 'LATER. Bookings/requests from users to partners.';

create table service_request_events (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references service_requests(id) on delete cascade,
  from_status    request_status,
  to_status      request_status not null,
  note           text,
  actor_user_id  uuid references users(id) on delete set null,
  created_at     timestamptz not null default now()
);
comment on table service_request_events is 'LATER. Status history of each request.';

create table partner_reviews (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references partners(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  request_id  uuid unique references service_requests(id) on delete set null,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table partner_reviews is 'LATER. Ratings and reviews (one per completed request).';

create table partner_payouts (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references partners(id),
  period_start      date not null,
  period_end        date not null,
  gross_paise       integer not null default 0,
  commission_paise  integer not null default 0,
  net_paise         integer not null default 0,
  status            payout_status not null default 'pending',
  paid_at           timestamptz,
  reference         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint partner_payouts_valid_period check (period_end >= period_start)
);
comment on table partner_payouts is 'LATER. Partner earnings settlements.';


-- =====================================================================
-- 9. PAYMENTS  (3 tables — LATER, Month 5–6)
-- =====================================================================

create table subscription_plans (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,                      -- user_basic_monthly, partner_pro_yearly…
  audience        plan_audience not null,
  partner_type    partner_type,                              -- partner plans can differ by partner type
  name            text not null,
  price_paise     integer not null check (price_paise >= 0),
  billing_period  billing_period not null,
  benefits        jsonb not null default '[]',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table subscription_plans is 'LATER. Paid plans (₹50 user plan, partner plans).';

create table subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  plan_id                   uuid not null references subscription_plans(id),
  user_id                   uuid references users(id) on delete set null,
  partner_id                uuid references partners(id) on delete set null,
  status                    subscription_status not null default 'pending',
  starts_at                 timestamptz,
  ends_at                   timestamptz,
  auto_renew                boolean not null default false,
  razorpay_subscription_id  text unique,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint subscriptions_one_owner check (num_nonnulls(user_id, partner_id) <= 1)
);
comment on table subscriptions is 'LATER. Who is subscribed to which plan.';

create table payments (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references users(id) on delete set null,
  partner_id             uuid references partners(id) on delete set null,
  purpose                payment_purpose not null,
  amount_paise           integer not null check (amount_paise > 0),
  currency               text not null default 'INR',
  status                 payment_status not null default 'created',
  service_request_id     uuid references service_requests(id) on delete set null,
  subscription_id        uuid references subscriptions(id) on delete set null,
  razorpay_order_id      text unique,
  razorpay_payment_id    text unique,
  refunded_amount_paise  integer not null default 0,
  failure_reason         text,
  paid_at                timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
comment on table payments is 'LATER. Every payment (Razorpay), in paise. The user always sees the amount before paying.';


-- =====================================================================
-- 10. MY ACTIVITY  (4 tables)
-- =====================================================================

create table saved_items (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  item_type         item_type not null,
  item_id           uuid not null,
  reminder_enabled  boolean not null default true,
  note              text,
  created_at        timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
comment on table saved_items is 'Anything a user saves (jobs, exams, services, colleges, courses, careers, roadmaps).';

create table reminders (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references users(id) on delete cascade,
  item_type            item_type not null,
  item_id              uuid not null,
  opportunity_date_id  uuid references opportunity_dates(id) on delete cascade,
  title                text,
  remind_at            timestamptz not null,
  channels             text[] not null default '{in_app,email}',
  status               reminder_status not null default 'pending',
  sent_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table reminders is 'Scheduled reminders. When a date changes, pending reminders are cancelled and recreated.';

create table recently_viewed (
  user_id    uuid not null references users(id) on delete cascade,
  item_type  item_type not null,
  item_id    uuid not null,
  viewed_at  timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);
comment on table recently_viewed is 'Recently viewed items for the home page.';

create table applications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  opportunity_id      uuid references opportunities(id) on delete cascade,
  service_id          uuid references gov_services(id) on delete cascade,
  service_request_id  uuid references service_requests(id) on delete set null,
  mode                application_mode not null default 'official',
  status              application_status not null default 'planning',
  application_number  text,
  applied_on          date,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint applications_one_item check (num_nonnulls(opportunity_id, service_id) = 1),
  unique (user_id, opportunity_id),
  unique (user_id, service_id)
);
comment on table applications is 'The user''s own tracking of what they applied for. Entered by the user — never shown as official.';


-- =====================================================================
-- 11. NOTIFICATIONS  (4 tables)
-- =====================================================================

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text,
  link        text,                                          -- page to open, e.g. /jobs/ssc-cgl-2026
  item_type   item_type,
  item_id     uuid,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
comment on table notifications is 'In-app notification inbox.';

create table notification_deliveries (
  id                   uuid primary key default gen_random_uuid(),
  notification_id      uuid not null references notifications(id) on delete cascade,
  channel              notification_channel not null,
  status               delivery_status not null default 'pending',
  provider             text,                                 -- resend, msg91, expo…
  provider_message_id  text,
  attempts             smallint not null default 0,
  last_error           text,
  sent_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
comment on table notification_deliveries is 'Email/SMS/push sending status (pending, sent, failed).';

create table notification_templates (
  id               uuid primary key default gen_random_uuid(),
  key              text not null,                            -- deadline_reminder, admit_card_released…
  channel          notification_channel not null,
  language         text not null default 'en',
  subject          text,
  body             text not null,
  dlt_template_id  text,                                     -- required for SMS in India
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (key, channel, language)
);
comment on table notification_templates is 'Message templates managed in the Internal Portal.';

create table push_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  platform      device_platform not null,
  token         text not null unique,
  last_seen_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
comment on table push_tokens is 'LATER (Month 3). Mobile push notification tokens.';


-- =====================================================================
-- 12. DOCUMENT SHARING  (2 tables — LATER)
-- =====================================================================

create table document_shares (
  id                  uuid primary key default gen_random_uuid(),
  document_id         uuid not null references user_documents(id) on delete cascade,
  owner_user_id       uuid not null references users(id) on delete cascade,
  partner_id          uuid references partners(id) on delete cascade,
  service_request_id  uuid references service_requests(id) on delete set null,
  expires_at          timestamptz not null,
  revoked_at          timestamptz,
  created_at          timestamptz not null default now()
);
comment on table document_shares is 'LATER. A document shared with a partner for a limited time. Can be revoked.';

create table document_access_logs (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references user_documents(id) on delete cascade,
  share_id       uuid references document_shares(id) on delete set null,
  actor_user_id  uuid references users(id) on delete set null,
  partner_id     uuid references partners(id) on delete set null,
  action         document_action not null,
  ip_address     text,
  created_at     timestamptz not null default now()
);
comment on table document_access_logs is 'LATER. Who uploaded/viewed/downloaded/shared each document and when.';


-- =====================================================================
-- 13. SEARCH, SUPPORT & INTERNAL  (6 tables)
-- =====================================================================

create table search_index (
  id             uuid primary key default gen_random_uuid(),
  item_type      item_type not null,
  item_id        uuid not null,
  title          text not null,
  subtitle       text,                                       -- e.g. organisation name
  keywords       text,
  state_codes    text[] not null default '{ALL}',
  url_path       text not null,                              -- /jobs/ssc-cgl-2026
  deadline       date,
  is_active      boolean not null default true,
  search_vector  tsvector,                                   -- filled automatically by a trigger
  updated_at     timestamptz not null default now(),
  unique (item_type, item_id)
);
comment on table search_index is 'One row per searchable item of every type. Powers universal search. Filled by the API when content is published.';

create table reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid references users(id) on delete set null,
  item_type        item_type not null,
  item_id          uuid not null,
  reason           report_reason not null,
  details          text,
  status           case_status not null default 'open',
  assigned_to      uuid references users(id) on delete set null,
  resolution_note  text,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table reports is '"Report incorrect information", broken links, scams and partner complaints.';

create table support_tickets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete set null,
  contact_email   text,
  category        text,                                      -- account, payment, assistance, documents, other
  subject         text not null,
  message         text not null,
  status          case_status not null default 'open',
  assigned_to     uuid references users(id) on delete set null,
  internal_notes  jsonb not null default '[]',
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table support_tickets is 'Contact/support requests from users.';

create table help_articles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  language    text not null default 'en',
  category    text not null,                                 -- how_it_works, apply_mode, career_mode, documents, payments…
  title       text not null,
  body        text not null,                                 -- markdown
  sort_order  smallint not null default 0,
  status      content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (slug, language)
);
comment on table help_articles is 'Help centre articles and FAQs.';

create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid,                                         -- staff user id (no foreign key on purpose: logs outlive accounts)
  action       text not null,                                -- opportunity.publish, user.suspend…
  target_type  text,
  target_id    uuid,
  details      jsonb not null default '{}',
  ip_address   text,
  created_at   timestamptz not null default now()
);
comment on table audit_logs is 'Who did what in the Internal Portal. Append-only: rows can never be edited or deleted.';

create table institution_enquiries (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references institutions(id) on delete cascade,
  user_id         uuid references users(id) on delete set null,
  course_id       uuid references courses(id) on delete set null,
  name            text,
  phone           text,
  email           text,
  message         text not null,
  status          enquiry_status not null default 'new',
  response        text,
  responded_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table institution_enquiries is 'LATER. Student enquiries to partner colleges/universities.';


-- =====================================================================
-- 14. SCRAPERS  (3 tables — written by Harsha's Python service)
-- =====================================================================

create table scrape_sources (
  id                    uuid primary key default gen_random_uuid(),
  key                   text not null unique,                -- "ssc" = app/scrapers/ssc.py
  name                  text not null,
  organization_id       uuid references organizations(id) on delete set null,
  list_url              text not null,                       -- the official notifications page
  kind                  text not null default 'html' check (kind in ('html', 'pdf', 'rss', 'api')),
  is_active             boolean not null default true,
  interval_hours        smallint not null default 6,
  last_run_at           timestamptz,
  last_success_at       timestamptz,
  consecutive_failures  smallint not null default 0,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table scrape_sources is 'The official websites we scrape (SSC, UPSC, APPSC…).';

create table scrape_runs (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references scrape_sources(id) on delete cascade,
  status       scrape_run_status not null default 'running',
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  items_found  integer not null default 0,
  new_items    integer not null default 0,
  error        text
);
comment on table scrape_runs is 'One row per scraper run (to monitor failures).';

create table scraped_documents (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid not null references scrape_sources(id) on delete cascade,
  run_id          uuid references scrape_runs(id) on delete set null,
  url             text not null,
  title           text,
  published_on    date,
  content_hash    text not null,                             -- SHA-256 of the file: same hash = nothing changed
  storage_path    text,                                      -- copy of the PDF in Storage bucket "notification-pdfs"
  mime_type       text,
  status          scraped_doc_status not null default 'new',
  opportunity_id  uuid references opportunities(id) on delete set null,
  update_id       uuid references updates(id) on delete set null,
  extraction      jsonb,                                     -- raw extraction output (for debugging)
  confidence      numeric(3, 2) check (confidence between 0 and 1),
  error           text,
  fetched_at      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (url, content_hash)
);
comment on table scraped_documents is 'Every notice/PDF the scrapers found. Same URL + same hash is never processed twice.';

-- link a version to the scraped file that caused it (added here because of table order)
alter table opportunity_versions
  add constraint opportunity_versions_scraped_document_id_fkey
  foreign key (scraped_document_id) references scraped_documents(id) on delete set null;


-- =====================================================================
-- 15. INDEXES — make common lookups fast
-- =====================================================================

-- users & profile
create index on user_sessions (user_id);
create index on otp_codes (target, purpose);
create index on consents (user_id);
create index on user_education (user_id);

-- organisations, exams, colleges & courses
create index on exams (organization_id);
create index on institutions (state_code, district);
create index on courses (level);
create index on institution_courses (course_id);
create index on course_exams (exam_id);

-- apply mode
create index on opportunities (status, type, application_end);   -- "open jobs closing soon"
create index on opportunities (organization_id);
create index on opportunities (exam_id);
create index on opportunities (institution_id);
create index on opportunities (source_url);                      -- change detection
create index on opportunities using gin (state_codes);           -- filter by state
create index on opportunity_posts (opportunity_id);
create index on opportunity_eligibility (opportunity_id);
create index on opportunity_eligibility (post_id);
create index on opportunity_eligibility (age_max, qualification_level);
create index on opportunity_dates (opportunity_id);
create index on opportunity_dates (kind, date);
create index on opportunity_versions (opportunity_id, status);
create index on gov_services (status);
create index on gov_services using gin (state_codes);
create index on updates (opportunity_id);
create index on updates (service_id);
create index on updates (status, published_at);

-- career mode
create index on careers (category_id);
create index on career_courses (course_id);
create index on career_exams (exam_id);
create index on career_skills (skill_id);
create index on roadmaps (career_id);
create index on roadmap_steps (roadmap_id, sort_order);
create index on user_roadmaps (user_id);
create index on user_roadmap_progress (step_id);
create index on guidance_conversations (user_id);
create index on guidance_messages (conversation_id, created_at);

-- documents
create index on user_documents (user_id);
create index on user_documents (expires_on);                     -- "document expiring soon" alerts

-- partners & payments
create index on partners (state_code, district);
create index on partners (type, verification_status);
create index on partner_members (user_id);
create index on partner_documents (partner_id);
create index on partner_services (partner_id);
create index on partner_services (service_id);
create index on service_requests (user_id);
create index on service_requests (partner_id, status);
create index on service_request_events (request_id);
create index on partner_reviews (partner_id);
create index on partner_payouts (partner_id);
create index on subscriptions (user_id);
create index on subscriptions (partner_id);
create index on payments (user_id);
create index on payments (status);

-- my activity
create index on saved_items (item_type, item_id);               -- "who saved this?" → send them updates
create index on reminders (status, remind_at);                  -- "which reminders are due now?"
create index on reminders (user_id);
create index on reminders (opportunity_date_id);
create index on applications (opportunity_id);

-- notifications
create index on notifications (user_id, created_at desc);
create index on notification_deliveries (notification_id);
create index on notification_deliveries (status);
create index on push_tokens (user_id);

-- document sharing
create index on document_shares (document_id);
create index on document_access_logs (document_id);

-- search, support & internal
create index on search_index using gin (search_vector);          -- full-text search
create index on search_index using gin (title gin_trgm_ops);     -- suggestions while typing
create index on search_index using gin (state_codes);
create index on reports (status);
create index on support_tickets (status);
create index on audit_logs (target_type, target_id);
create index on audit_logs (actor_id);
create index on audit_logs (created_at);
create index on institution_enquiries (institution_id);

-- scrapers
create index on scrape_runs (source_id, started_at);
create index on scraped_documents (source_id);
create index on scraped_documents (status);
create index on scraped_documents (url);                         -- same URL + new hash = changed notice

-- Every remaining foreign key gets an index too (faster joins and deletes,
-- and keeps Supabase's Performance Advisor free of "unindexed foreign key" warnings)
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, a.attname as col
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and c.connamespace = 'public'::regnamespace
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    execute format('create index on %s (%I)', r.tbl, r.col);
  end loop;
end;
$$;


-- =====================================================================
-- 16. AUTOMATIC TRIGGERS
-- =====================================================================

-- updated_at → refreshed automatically on every table that has it
do $$
declare t record;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t.table_name);
  end loop;
end;
$$;

-- search_index.search_vector → rebuilt whenever a row is added or changed
create trigger search_index_build_vector
  before insert or update on search_index
  for each row execute function search_index_build_vector();

-- audit_logs → append-only
create trigger audit_logs_append_only
  before update or delete on audit_logs
  for each row execute function prevent_audit_log_changes();


-- =====================================================================
-- 17. SECURITY
--  Our apps never use Supabase's automatic public API (the anon /
--  service_role keys). The website calls NestJS; NestJS and Python
--  connect with a database login. So we lock the public API completely:
--   a) Row Level Security ON for every table, with no policies →
--      the anon key cannot read or change a single row.
--   b) Remove table permissions from Supabase's API roles (anon,
--      authenticated, service_role) — for these tables AND future ones.
--  Section 17 is safe to run again on its own (e.g. after adding tables).
-- =====================================================================

do $$
declare t record;
begin
  -- only our tables (skips tables owned by Supabase/extensions, e.g. PostGIS's spatial_ref_sys)
  for t in select tablename from pg_tables
           where schemaname = 'public' and pg_has_role(current_user, tableowner, 'USAGE') loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on table public.%I from anon, authenticated, service_role', t.tablename);
  end loop;
end;
$$;

-- and for every table/sequence we create in the future
alter default privileges in schema public revoke all on tables    from anon, authenticated, service_role;
alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;

commit;


-- =====================================================================
-- CHECK IT WORKED (run these one at a time in a new query)
--   select count(*) from pg_tables where schemaname = 'public';
--      → 66
--   select tablename from pg_tables where schemaname = 'public' and not rowsecurity;
--      → no rows (every table has RLS on)
-- =====================================================================
