-- =====================================================================
-- Session 12: Roadmaps, Courses, Colleges, AI Guidance (v3 Release)
-- Author: Likhith
-- Date: 2026-10-10
-- =====================================================================

-- 1. Ensure required enum values and tables exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'roadmap_step_kind') then
    create type roadmap_step_kind as enum (
      'course', 'exam', 'skill', 'project', 'internship', 'job_prep', 'general'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'plan_status') then
    create type plan_status as enum ('active', 'completed', 'abandoned');
  end if;
  if not exists (select 1 from pg_type where typname = 'progress_status') then
    create type progress_status as enum ('todo', 'in_progress', 'completed', 'skipped');
  end if;
  if not exists (select 1 from pg_type where typname = 'course_level') then
    create type course_level as enum (
      'undergraduate', 'postgraduate', 'diploma', 'certificate', 'doctoral'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'institution_type') then
    create type institution_type as enum (
      'university', 'college', 'institute', 'polytechnic', 'autonomous'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'institution_ownership') then
    create type institution_ownership as enum (
      'central_govt', 'state_govt', 'private', 'deemed'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'message_role') then
    create type message_role as enum ('user', 'assistant', 'system');
  end if;
end $$;

-- 2. Extend institutions table if needed
alter table institutions add column if not exists ranking_text text;
alter table institutions add column if not exists placement_stats jsonb default '{"highest_package":"-","avg_package":"-","top_recruiters":[]}';
alter table institutions add column if not exists campus_facilities text[] default '{}';

-- 3. Seed Starter Colleges / Institutions (Where user will add more data later)
insert into institutions (
  id, slug, name, short_name, type, ownership, state_code, city, district,
  website, description, accreditation, established_year, ranking_text,
  fees_text, placement_stats, campus_facilities, status
) values
(
  'e1000000-0000-0000-0000-000000000001',
  'iit-madras',
  'Indian Institute of Technology Madras',
  'IIT Madras',
  'institute',
  'government',
  'TN',
  'Chennai',
  'Chennai',
  'https://www.iitm.ac.in',
  'Premier engineering institute of national importance, known for world-class research, technology innovation, and top NIRF ranking in India.',
  '{"nirf_overall": 1, "nirf_engineering": 1, "naac": "A++"}'::jsonb,
  1959,
  'NIRF Rank #1 (Overall & Engineering)',
  '₹2,10,000 / year (Subsidized with 100% fee waiver for eligible SC/ST/EWS)',
  '{"highest_package": "₹1.31 Cr/yr", "avg_package": "₹21.4 LPA", "top_recruiters": ["Google", "Microsoft", "Texas Instruments", "Qualcomm", "Goldman Sachs"]}'::jsonb,
  array['High-Performance Computing Cluster', 'Research Park', 'Hostels & Mess', 'Olympic Swimming Pool', 'Innovation Centre'],
  'published'
),
(
  'e1000000-0000-0000-0000-000000000002',
  'bits-pilani',
  'Birla Institute of Technology and Science Pilani',
  'BITS Pilani',
  'university',
  'deemed',
  'RJ',
  'Pilani',
  'Jhunjhunu',
  'https://www.bits-pilani.ac.in',
  'Premier private deemed university renowned for its rigorous merit-based admissions, zero-reservation policy, and strong industry Practice School programme.',
  '{"nirf_engineering": 25, "naac": "A"}'::jsonb,
  1964,
  'NIRF Engineering #25 · Grade A NAAC',
  '₹5,40,000 / year (Merit-cum-Need scholarships up to 80% available)',
  '{"highest_package": "₹60 LPA", "avg_package": "₹19.2 LPA", "top_recruiters": ["Google", "Amazon", "Apple", "McKinsey", "Morgan Stanley"]}'::jsonb,
  array['Practice School Industry Network', 'Incubation Centre', 'Round-the-clock Library', 'Sports Complex'],
  'published'
),
(
  'e1000000-0000-0000-0000-000000000003',
  'aiims-new-delhi',
  'All India Institute of Medical Sciences New Delhi',
  'AIIMS New Delhi',
  'institute',
  'government',
  'DL',
  'New Delhi',
  'New Delhi',
  'https://www.aiims.edu',
  'Apex public medical research university and hospital, universally recognized as India’s highest-ranked medical college with subsidised healthcare and clinical education.',
  '{"nirf_medical": 1}'::jsonb,
  1956,
  'NIRF Medical #1',
  '₹1,628 / year (Full nominal central government subsidy)',
  '{"highest_package": "Clinical Residency Stipend", "avg_package": "₹15–20 LPA Post-PG", "top_recruiters": ["Top Central Hospitals", "WHO", "Global Research Fellowships"]}'::jsonb,
  array['1500+ Bed Teaching Hospital', 'Emergency Medicine Trauma Centre', 'Advanced Pathology Labs', 'Central Medical Library'],
  'published'
),
(
  'e1000000-0000-0000-0000-000000000004',
  'nlsiu-bengaluru',
  'National Law School of India University',
  'NLSIU Bengaluru',
  'university',
  'government',
  'KA',
  'Bengaluru',
  'Bengaluru Urban',
  'https://www.nls.ac.in',
  'Premier national law university in India, pioneering 5-year integrated legal education and consistently ranked #1 for law admissions through CLAT.',
  '{"nirf_law": 1}'::jsonb,
  1987,
  'NIRF Law #1',
  '₹3,20,000 / year (Need-based fee waivers available)',
  '{"highest_package": "₹22 LPA (Domestic) / £45k (Magic Circle Law Firms)", "avg_package": "₹16 LPA", "top_recruiters": ["Shardul Amarchand Mangaldas", "Cyril Amarchand", "Trilegal", "AZB & Partners", "Linklaters"]}'::jsonb,
  array['Moot Court Halls', 'Shri Narayan Rao Melgiri National Law Library', 'Legal Aid Clinic'],
  'published'
),
(
  'e1000000-0000-0000-0000-000000000005',
  'iim-bangalore',
  'Indian Institute of Management Bangalore',
  'IIM Bangalore',
  'institute',
  'government',
  'KA',
  'Bengaluru',
  'Bengaluru Urban',
  'https://www.iimb.ac.in',
  'India’s leading graduate business school renowned globally for management consulting, finance, and entrepreneurship research.',
  '{"nirf_management": 2, "equis": true}'::jsonb,
  1973,
  'NIRF Management #2 · EQUIS Accredited',
  '₹24,50,000 (Total 2-year MBA Programme)',
  '{"highest_package": "₹1.15 Cr/yr", "avg_package": "₹35.3 LPA", "top_recruiters": ["Bain & Company", "Boston Consulting Group", "McKinsey", "Goldman Sachs", "Amazon"]}'::jsonb,
  array['NSRCEL Startup Incubator', 'Executive Conference Halls', 'Bloomberg Terminals Lab', 'Open Amphitheatre'],
  'published'
)
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  accreditation = excluded.accreditation,
  ranking_text = excluded.ranking_text,
  fees_text = excluded.fees_text,
  placement_stats = excluded.placement_stats,
  campus_facilities = excluded.campus_facilities,
  status = excluded.status;

-- 4. Seed Starter Courses
insert into courses (
  id, slug, name, short_name, level, stream, description,
  eligibility_text, min_qualification, duration_months, skills_developed,
  career_outcomes, status
) values
(
  'c1000000-0000-0000-0000-000000000001',
  'btech-cse',
  'Bachelor of Technology in Computer Science & Engineering',
  'B.Tech CSE',
  'ug',
  'Engineering & Technology',
  'Four-year comprehensive undergraduate engineering programme focusing on software systems, algorithms, computer architecture, databases, cloud computing, and artificial intelligence.',
  'Class 12 with Physics, Mathematics, and Chemistry/Computer Science with minimum 60% aggregate. Valid score in entrance exams (JEE Main / State CETs).',
  '12th',
  48,
  array['Data Structures', 'Algorithms', 'Full Stack Web Development', 'Database Management', 'Computer Networks', 'Operating Systems', 'System Design'],
  'Software Engineer, Full Stack Developer, Systems Architect, AI/ML Specialist, Cloud Engineer',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000002',
  'mbbs',
  'Bachelor of Medicine and Bachelor of Surgery',
  'MBBS',
  'ug',
  'Medicine & Allied Health',
  'Five-and-a-half-year undergraduate medical programme including 1 year of compulsory rotating clinical internship, qualifying graduates as certified medical practitioners.',
  'Class 12 with Physics, Chemistry, Biology/Biotechnology, and English with minimum 50% marks (40% for reserved categories). Mandatory NEET-UG qualification.',
  '12th',
  66,
  array['Human Anatomy', 'Physiology', 'Pathology', 'Pharmacology', 'Clinical Diagnostics', 'Surgery Fundamentals', 'Patient Ethics & Care'],
  'General Physician, Medical Officer, Clinical Specialist (Post-PG MD/MS), Medical Researcher',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000003',
  'ba-llb-honours',
  'Integrated Bachelor of Arts and Bachelor of Laws (Honours)',
  'B.A. LL.B. (Hons)',
  'ug',
  'Law & Judicial Studies',
  'Five-year integrated dual degree program combining humanities foundations with comprehensive professional legal training, jurisprudence, and constitutional law.',
  'Class 12 in any stream (Science/Commerce/Arts) with at least 45% marks. Admission through CLAT or AILET.',
  '12th',
  60,
  array['Constitutional Law', 'Corporate Jurisprudence', 'Criminal Law', 'Legal Drafting', 'Moot Court Advocacy', 'Contract Negotiation'],
  'Corporate Counsel, Litigator, Judicial Magistrate, Legal Consultant, Policy Analyst',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000004',
  'bcom-honours',
  'Bachelor of Commerce (Honours)',
  'B.Com (Hons)',
  'ug',
  'Commerce & Banking',
  'Three-year undergraduate program providing foundational and advanced training in corporate finance, taxation, economics, business analytics, and auditing.',
  'Class 12 with Mathematics or Business Mathematics and Commerce with minimum 55% marks.',
  '12th',
  36,
  array['Financial Accounting', 'Cost Accounting', 'Income Tax Law', 'Financial Analysis', 'Auditing & Compliance', 'Corporate Valuation'],
  'Investment Analyst, Financial Controller, Chartered Accountant (with ICAI), Tax Consultant',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000005',
  'commercial-pilot-training',
  'Commercial Pilot Licence Ground & Flight Training',
  'CPL Training',
  'certificate',
  'Aviation & Aerospace',
  'Intensive dual training program combining DGCA ground theoretical examinations (Navigation, Meteorology, Air Regulations) and minimum 200 hours of certified flying hours.',
  'Class 12 with Physics and Mathematics (minimum 50%). DGCA Class 1 Medical Fitness certificate.',
  '12th',
  24,
  array['Air Navigation', 'Aviation Meteorology', 'Radio Telephony', 'Instrument Flying', 'Crew Resource Management', 'Emergency Procedures'],
  'First Officer (Airline Pilot), Commercial Charter Pilot, Flight Instructor',
  'published'
)
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  stream = excluded.stream,
  description = excluded.description,
  eligibility_text = excluded.eligibility_text,
  skills_developed = excluded.skills_developed,
  career_outcomes = excluded.career_outcomes,
  status = excluded.status;

-- 5. Link Institutions to Courses (institution_courses)
insert into institution_courses (institution_id, course_id, seats, fee_per_year, fees_text, duration_months, admission_process, mode)
values
(
  'e1000000-0000-0000-0000-000000000001', -- IIT Madras
  'c1000000-0000-0000-0000-000000000001', -- B.Tech CSE
  85,
  210000,
  '₹2,10,000 / year',
  48,
  'Admissions strictly through JEE Advanced ranks via JoSAA centralised counseling.',
  'regular'
),
(
  'e1000000-0000-0000-0000-000000000002', -- BITS Pilani
  'c1000000-0000-0000-0000-000000000001', -- B.Tech CSE
  120,
  540000,
  '₹5,40,000 / year',
  48,
  'Admissions strictly via BITSAT online entrance examination cutoff marks.',
  'regular'
),
(
  'e1000000-0000-0000-0000-000000000003', -- AIIMS New Delhi
  'c1000000-0000-0000-0000-000000000002', -- MBBS
  125,
  1628,
  '₹1,628 total nominal fee',
  66,
  'Top percentile cutoffs in All-India NEET-UG via MCC National Counselling.',
  'regular'
),
(
  'e1000000-0000-0000-0000-000000000004', -- NLSIU Bengaluru
  'c1000000-0000-0000-0000-000000000003', -- B.A. LL.B. (Hons)
  240,
  320000,
  '₹3,20,000 / year',
  60,
  'Common Law Admission Test (CLAT-UG) top national ranks via Consortium of NLUs.',
  'regular'
)
on conflict (institution_id, course_id) do update set
  seats = excluded.seats,
  fee_per_year = excluded.fee_per_year,
  fees_text = excluded.fees_text,
  admission_process = excluded.admission_process;

-- 6. Link Careers to Courses (career_courses)
-- Note: careers seeded in session 11: software-engineer, ias-civil-services, medical-doctor, commercial-pilot
insert into career_courses (career_id, course_id)
select c.id, 'c1000000-0000-0000-0000-000000000001'::uuid from careers c where c.slug = 'software-engineer'
on conflict do nothing;

insert into career_courses (career_id, course_id)
select c.id, 'c1000000-0000-0000-0000-000000000002'::uuid from careers c where c.slug = 'medical-doctor'
on conflict do nothing;

insert into career_courses (career_id, course_id)
select c.id, 'c1000000-0000-0000-0000-000000000005'::uuid from careers c where c.slug = 'commercial-pilot'
on conflict do nothing;

insert into career_courses (career_id, course_id)
select c.id, 'c1000000-0000-0000-0000-000000000003'::uuid from careers c where c.slug = 'ias-civil-services'
on conflict do nothing;

-- 7. Seed Roadmaps & Steps
insert into roadmaps (
  id, slug, career_id, title, description, for_stage, estimated_duration_text, status
)
select
  'd1000000-0000-0000-0000-000000000001',
  'software-engineer-roadmap',
  c.id,
  'Software Engineer Milestone Roadmap',
  'A structured 4-stage milestone trajectory guiding students from high school through college degrees, programming foundations, internships, and entry-level software engineering jobs.',
  'Class 11 to Early Professional',
  '4–5 Years',
  'published'
from careers c where c.slug = 'software-engineer'
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

insert into roadmaps (
  id, slug, career_id, title, description, for_stage, estimated_duration_text, status
)
select
  'd1000000-0000-0000-0000-000000000002',
  'ias-civil-services-roadmap',
  c.id,
  'UPSC Civil Services (IAS/IPS) Roadmap',
  'A step-by-step preparation plan starting from graduation degree, general studies foundation, NCERT mastery, answer writing practice, and UPSC CSE Prelims/Mains/Interview clearance.',
  'Undergraduate & Graduate',
  '2–3 Years',
  'published'
from careers c where c.slug = 'ias-civil-services'
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status;

-- 8. Seed Roadmap Steps for Software Engineer
delete from roadmap_steps where roadmap_id = 'd1000000-0000-0000-0000-000000000001';

insert into roadmap_steps (
  roadmap_id, stage, sort_order, kind, title, description,
  course_id, resources, estimated_duration_text, is_milestone
) values
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 1: High School & Entrance Foundations',
  1,
  'skill',
  'Master Class 11–12 Mathematics & Basics of Python/C++',
  'Build strong analytical foundations in algebra, coordinate geometry, and fundamental logic. Write your first scripts in Python or C++.',
  null,
  '[{"title":"CS50 Introduction to Computer Science","url":"https://cs50.harvard.edu","type":"platform"}]'::jsonb,
  '6–12 Months',
  false
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 1: High School & Entrance Foundations',
  2,
  'exam',
  'Clear Engineering Entrance Exams (JEE Main / State CET)',
  'Qualify for competitive engineering admissions across national and state universities for Computer Science programmes.',
  null,
  '[{"title":"NTA JEE Information Portal","url":"https://jeemain.nta.nic.in","type":"platform"}]'::jsonb,
  'Target Exam Year',
  true
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 2: Core Engineering & Systems',
  3,
  'course',
  'Enroll in B.Tech Computer Science / Allied IT Degree',
  'Undertake accredited 4-year degree coursework covering Data Structures, Algorithms, Computer Architecture, and DBMS.',
  'c1000000-0000-0000-0000-000000000001',
  '[{"title":"MIT OpenCourseWare 6.006","url":"https://ocw.mit.edu","type":"course"}]'::jsonb,
  'Years 1 & 2',
  true
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 2: Core Engineering & Systems',
  4,
  'skill',
  'Data Structures, Algorithms & LeetCode Problem Solving',
  'Solve 150+ standard DSA problems in Arrays, Hash Maps, Trees, Graphs, and Dynamic Programming.',
  null,
  '[{"title":"NeetCode 150 Roadmap","url":"https://neetcode.io","type":"platform"},{"title":"Introduction to Algorithms (CLRS)","type":"book"}]'::jsonb,
  '6 Months',
  true
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 3: Full Stack Projects & Open Source',
  5,
  'project',
  'Ship 2 Production-Grade Fullstack Web/Mobile Applications',
  'Develop and deploy complete end-to-end applications with relational database, authentication, API, and cloud deployment.',
  null,
  '[{"title":"Full Stack Open by University of Helsinki","url":"https://fullstackopen.com","type":"platform"}]'::jsonb,
  '4 Months',
  false
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 3: Full Stack Projects & Open Source',
  6,
  'internship',
  'Complete Summer Software Engineering Internship',
  'Gain hands-on industry experience collaborating with senior developers, reviewing pull requests, and working on production code.',
  null,
  '[{"title":"ApplyFields Tech Internships Board","url":"/jobs","type":"platform"}]'::jsonb,
  '2–3 Months',
  true
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 4: Job Preparation & Launch',
  7,
  'skill',
  'System Design & Behavioral Interview Preparation',
  'Learn scalable system design patterns (caching, load balancers, database sharding) and mock behavioral rounds using the STAR format.',
  null,
  '[{"title":"System Design Primer by Donne Martin","url":"https://github.com/donnemartin/system-design-primer","type":"platform"}]'::jsonb,
  '2 Months',
  false
),
(
  'd1000000-0000-0000-0000-000000000001',
  'Stage 4: Job Preparation & Launch',
  8,
  'job',
  'Secure Full-time Entry-Level SDE Offer',
  'Negotiate offer letters, complete onboarding documentation, and start your career as an Associate or Software Development Engineer 1.',
  null,
  '[]'::jsonb,
  'Milestone',
  true
);

-- 9. Auto-sync trigger for courses and institutions into search_index
create or replace function s12_search_index_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'courses' then
    delete from public.search_index where item_type = 'course' and item_id = coalesce(new.id, old.id);
    if new.status = 'published' then
      insert into public.search_index (item_type, item_id, title, subtitle, keywords, state_codes, url_path)
      values (
        'course', new.id, new.name,
        coalesce(new.short_name, new.stream, new.level::text),
        concat_ws(' ', 'course degree', new.level::text, new.stream, new.min_qualification, array_to_string(new.skills_developed, ' ')),
        '{ALL}'::text[],
        '/career/courses/' || new.slug
      );
    end if;
  elsif tg_table_name = 'institutions' then
    delete from public.search_index where item_type = 'institution' and item_id = coalesce(new.id, old.id);
    if new.status = 'published' then
      insert into public.search_index (item_type, item_id, title, subtitle, keywords, state_codes, url_path)
      values (
        'institution', new.id, new.name,
        concat_ws(' · ', coalesce(new.short_name, new.city), new.district, new.state_code),
        concat_ws(' ', 'college university institution', new.type::text, new.ownership::text, new.city, new.district),
        case when new.state_code is not null then array[new.state_code] else '{ALL}'::text[] end,
        '/career/colleges/' || new.slug
      );
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_courses_search_sync on courses;
create trigger trg_courses_search_sync after insert or update or delete on courses
  for each row execute function s12_search_index_sync();

drop trigger if exists trg_institutions_search_sync on institutions;
create trigger trg_institutions_search_sync after insert or update or delete on institutions
  for each row execute function s12_search_index_sync();

-- Backfill published courses and institutions into search_index
insert into search_index (item_type, item_id, title, subtitle, keywords, state_codes, url_path)
select
  'course', c.id, c.name,
  coalesce(c.short_name, c.stream, c.level::text),
  concat_ws(' ', 'course degree', c.level::text, c.stream, c.min_qualification, array_to_string(c.skills_developed, ' ')),
  '{ALL}'::text[],
  '/career/courses/' || c.slug
from courses c where c.status = 'published'
on conflict do nothing;

insert into search_index (item_type, item_id, title, subtitle, keywords, state_codes, url_path)
select
  'institution', i.id, i.name,
  concat_ws(' · ', coalesce(i.short_name, i.city), i.district, i.state_code),
  concat_ws(' ', 'college university institution', i.type::text, i.ownership::text, i.city, i.district),
  case when i.state_code is not null then array[i.state_code] else '{ALL}'::text[] end,
  '/career/colleges/' || i.slug
from institutions i where i.status = 'published'
on conflict do nothing;
