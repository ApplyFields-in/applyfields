-- Why: Session 11 — Career Foundation (v3 Career Mode).
-- Adapts existing career tables (careers, career_categories, career_profiles).
-- Adds pathway_steps, learning_resources (platforms, books, videos), skills, pros/cons, and linked_opportunities.
-- Syncs with search_index so careers appear in universal search.

-- 1. Extend careers table with pathways and learning resources
alter table careers add column if not exists pathway_steps jsonb not null default '[]'::jsonb;
alter table careers add column if not exists learning_resources jsonb not null default '[]'::jsonb; -- platforms, books, videos
alter table careers add column if not exists skills text[] not null default '{}';
alter table careers add column if not exists pros text[] not null default '{}';
alter table careers add column if not exists cons text[] not null default '{}';
alter table careers add column if not exists linked_opportunities jsonb not null default '[]'::jsonb;
alter table careers add column if not exists views_count int not null default 0;

create index if not exists idx_careers_category on careers(category_id);
create index if not exists idx_careers_status on careers(status);
create index if not exists idx_careers_slug on careers(slug);

-- 2. Sync function for careers into search_index
create or replace function career_search_index_refresh(p_id uuid) returns void
language sql set search_path = '' as $$
  delete from public.search_index where item_type = 'career' and item_id = p_id;

  insert into public.search_index (item_type, item_id, title, subtitle, keywords, state_codes, url_path, deadline)
  select 'career'::public.item_type, c.id, c.title,
         cat.name,
         concat_ws(' ', 'career', 'career option', cat.name, c.summary,
                   c.what_it_involves, c.education_required,
                   array_to_string(c.skills, ' '), array_to_string(c.learning_areas, ' ')),
         array['ALL']::text[],
         '/career/' || c.slug,
         null
  from public.careers c
  join public.career_categories cat on cat.id = c.category_id
  where c.id = p_id and c.status = 'published';
$$;

revoke execute on function career_search_index_refresh(uuid) from public, anon, authenticated, service_role;

create or replace function career_search_index_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.career_search_index_refresh(coalesce(new.id, old.id));
  return null;
end;
$$;

drop trigger if exists career_search_index_sync on careers;
create trigger career_search_index_sync after insert or update or delete on careers
  for each row execute function career_search_index_sync();

-- 3. Seed Career Categories
insert into career_categories (slug, name, description, icon, sort_order)
values
  ('tech-software', 'Software & Technology', 'Software development, AI, data science, cybersecurity, and cloud architecture.', 'Code', 1),
  ('civil-services', 'Civil Services & Governance', 'Administration, diplomacy, policy formulation, and state public services.', 'Landmark', 2),
  ('defense-police', 'Defense & Armed Forces', 'Army, Navy, Air Force, paramilitary forces, and state law enforcement.', 'ShieldCheck', 3),
  ('medicine-healthcare', 'Medicine & Healthcare', 'Clinical medicine, surgery, nursing, pharmacy, and biomedical research.', 'Stethoscope', 4),
  ('banking-finance', 'Banking & Finance', 'Public & private banking, investment analysis, chartered accountancy, and economics.', 'Coins', 5),
  ('aviation-aerospace', 'Aviation & Aerospace', 'Commercial flying, aeronautics, air traffic control, and space technology.', 'Plane', 6)
on conflict (slug) do update
  set name = excluded.name, description = excluded.description, icon = excluded.icon, sort_order = excluded.sort_order;

-- 4. Seed Careers with Pathway Steps & Learning Resources (Platforms, Books, Videos)

-- Career 1: Software Engineer
insert into careers (
  category_id, slug, title, summary, what_it_involves, education_required, salary_text, outlook_text,
  learning_areas, pros, cons, pathway_steps, learning_resources, skills, linked_opportunities, status
)
select
  cat.id,
  'software-engineer',
  'Software Engineer',
  'Design, develop, and maintain high-scale software systems, web applications, and algorithms.',
  'Software Engineers build applications, services, and architectures powering everyday digital products. In India, opportunities span global tech companies, high-growth startups, and public sector enterprises like ISRO, DRDO, and NIC.',
  'B.Tech / B.E. / BCA / MCA / B.Sc in Computer Science or related degree',
  '₹6 LPA – ₹32 LPA',
  'Very High Demand & Rapid Growth',
  array['Computer Science', 'Algorithms', 'Web & Cloud Systems', 'Data Management'],
  array['High earning potential', 'Remote work flexibility', 'Global career mobility', 'Continuous learning and innovation'],
  array['Screen fatigue & sedentary lifestyle', 'Fast obsolescence requires constant upskilling', 'Competitive entry-level job market'],
  '[
    {"step": 1, "title": "Class 10+2 with Physics, Chemistry & Maths", "description": "Build strong foundations in mathematics, logical reasoning, and introductory coding.", "duration": "2 Years"},
    {"step": 2, "title": "Undergraduate Degree (B.Tech / B.E. / BCA / B.Sc CS)", "description": "Earn a degree in Computer Science, IT, or related engineering branch through national or state exams.", "duration": "3-4 Years"},
    {"step": 3, "title": "Master Core CS Concepts & Practical Projects", "description": "Data structures, algorithms, databases, web development, and Git version control.", "duration": "Ongoing"},
    {"step": 4, "title": "Internships & Open Source Contribution", "description": "Gain hands-on industry experience building real-world software products and collaborating with teams.", "duration": "6 Months"},
    {"step": 5, "title": "Entry-Level SDE Role / Campus Placements", "description": "Join tech companies or public sector tech divisions as Junior Software Engineer.", "duration": "Career Launch"}
  ]'::jsonb,
  '[
    {"type": "platform", "title": "LeetCode & HackerRank", "provider_or_author": "LeetCode", "url": "https://leetcode.com", "description": "Industry-standard platform for practicing data structures, algorithms, and technical interview problems.", "is_free": true},
    {"type": "platform", "title": "NPTEL & SWAYAM (IIT Faculty CS Courses)", "provider_or_author": "Ministry of Education (India)", "url": "https://nptel.ac.in", "description": "Free university-grade CS courses from IIT & IISc professors covering Operating Systems, DBMS, and Compilers.", "is_free": true},
    {"type": "book", "title": "Cracking the Coding Interview", "provider_or_author": "Gayle Laakmann McDowell", "url": "", "description": "The quintessential interview preparation book covering algorithms, system design, and behavioral questions.", "is_free": false},
    {"type": "book", "title": "Clean Code: A Handbook of Agile Software Craftsmanship", "provider_or_author": "Robert C. Martin", "url": "", "description": "Foundational guide on writing maintainable, professional, and elegant software code.", "is_free": false},
    {"type": "video", "title": "CS50: Introduction to Computer Science", "provider_or_author": "Harvard University (YouTube)", "url": "https://www.youtube.com/@cs50", "description": "The world-famous introductory course by Prof. David J. Malan covering foundational computer science concepts.", "is_free": true},
    {"type": "video", "title": "freeCodeCamp Full-Length Courses", "provider_or_author": "freeCodeCamp (YouTube)", "url": "https://www.youtube.com/@freecodecamp", "description": "Comprehensive, ad-free 10+ hour video bootcamps on Python, React, Next.js, and SQL.", "is_free": true}
  ]'::jsonb,
  array['Data Structures', 'Algorithms', 'TypeScript', 'Python', 'SQL & Databases', 'System Design'],
  '[
    {"type": "exam", "title": "JEE Main (Engineering Admission)", "url": "/exams/jee-main-2026"},
    {"type": "scholarship", "title": "NSP Post Matric Scholarship", "url": "/scholarships/nsp-post-matric-2026"}
  ]'::jsonb,
  'published'
from career_categories cat where cat.slug = 'tech-software'
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, pathway_steps = excluded.pathway_steps,
  learning_resources = excluded.learning_resources, skills = excluded.skills, status = 'published';

-- Career 2: Civil Services Officer (IAS/IPS)
insert into careers (
  category_id, slug, title, summary, what_it_involves, education_required, salary_text, outlook_text,
  learning_areas, pros, cons, pathway_steps, learning_resources, skills, linked_opportunities, status
)
select
  cat.id,
  'civil-services-officer',
  'Civil Services Officer (IAS / IPS / IFS)',
  'Lead district administration, law enforcement, public policy implementation, and diplomatic missions.',
  'Indian Civil Services Officers (IAS, IPS, IFS, IRS) hold key administrative and governance posts across India. They manage districts, enact welfare policies, maintain public order, and represent the nation globally.',
  'Graduation in any discipline from a recognized university (B.A., B.Sc., B.Com., B.Tech., MBBS)',
  'Level 10 Pay Matrix (₹56,100 – ₹2,50,000/month) + Govt Benefits',
  'Prestigious, Lifelong Public Leadership',
  array['Indian Polity & Constitution', 'Public Administration', 'Economics & Social Development', 'Ethics & Governance'],
  array['Immense direct societal impact', 'High public respect and prestige', 'Govt accommodation, medical and pension security', 'Diverse administrative roles across ministries'],
  array['Frequent transfers and postings', 'High work pressure and public accountability', 'Demanding 24/7 duty during emergencies'],
  '[
    {"step": 1, "title": "Complete Class 10+2 in Any Stream", "description": "Strong foundation in general awareness, history, polity, and current affairs.", "duration": "2 Years"},
    {"step": 2, "title": "Earn Any Recognized Bachelor Degree", "description": "UPSC eligibility requires any graduation (B.A., B.Sc., B.Com., B.Tech., MBBS).", "duration": "3-4 Years"},
    {"step": 3, "title": "Prepare for UPSC Civil Services Examination (CSE)", "description": "Master Prelims (GS + CSAT), Mains (9 written papers), and chosen Optional Subject.", "duration": "1-2 Years"},
    {"step": 4, "title": "UPSC CSE Prelims, Mains & Personality Test", "description": "Clear the three-stage national examination conducted annually.", "duration": "1 Year"},
    {"step": 5, "title": "Foundation Training at LBSNAA / SVPNPA", "description": "Undergo officer training at Mussoorie or Hyderabad before field posting as Assistant Collector or ASP.", "duration": "2 Years"}
  ]'::jsonb,
  '[
    {"type": "book", "title": "Indian Polity", "provider_or_author": "M. Laxmikanth", "url": "", "description": "The indispensable standard textbook for UPSC Indian Polity and Constitution.", "is_free": false},
    {"type": "book", "title": "India''s Struggle for Independence", "provider_or_author": "Bipan Chandra", "url": "", "description": "Definitive reading on the Indian national movement and modern history.", "is_free": false},
    {"type": "platform", "title": "Press Information Bureau (PIB)", "provider_or_author": "Government of India", "url": "https://pib.gov.in", "description": "Authentic official source for daily government decisions, schemes, cabinet briefings, and official reports.", "is_free": true},
    {"type": "video", "title": "Sansad TV (Perspective & Policy Discussions)", "provider_or_author": "Sansad TV (YouTube)", "url": "https://www.youtube.com/@SansadTV", "description": "Authoritative debates and policy analyses directly relevant to Mains GS papers and interview preparation.", "is_free": true},
    {"type": "platform", "title": "UPSC Official Portal", "provider_or_author": "Union Public Service Commission", "url": "https://upsc.gov.in", "description": "Official syllabus, previous years question papers, notifications, and examination guidelines.", "is_free": true}
  ]'::jsonb,
  array['Public Administration', 'Crisis Management', 'Policy Formulation', 'Communication', 'Ethics & Integrity'],
  '[
    {"type": "job", "title": "SSC CGL (Central Secretariat Officer)", "url": "/jobs/ssc-cgl-2026"}
  ]'::jsonb,
  'published'
from career_categories cat where cat.slug = 'civil-services'
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, pathway_steps = excluded.pathway_steps,
  learning_resources = excluded.learning_resources, skills = excluded.skills, status = 'published';

-- Career 3: Commercial Pilot
insert into careers (
  category_id, slug, title, summary, what_it_involves, education_required, salary_text, outlook_text,
  learning_areas, pros, cons, pathway_steps, learning_resources, skills, linked_opportunities, status
)
select
  cat.id,
  'commercial-pilot',
  'Commercial Airline Pilot',
  'Fly passenger airliners and cargo planes domestically and internationally with top airlines.',
  'Commercial pilots operate modern commercial aircraft, navigating domestic and international flight routes while ensuring maximum passenger safety and operational punctuality.',
  'Class 10+2 with Physics and Mathematics (Minimum 50%)',
  '₹1.5 Lakhs – ₹8 Lakhs / month',
  'High Growth & Airline Fleet Expansion',
  array['Aviation Regulations', 'Air Navigation', 'Aviation Meteorology', 'Aircraft Technical & Engines'],
  array['Global travel and luxury layovers', 'High salary and perks', 'Exciting dynamic workplace', 'Structured duty rosters and legal rest periods'],
  array['High training cost upfront (₹40–60 Lakhs)', 'Rigorous recurring medical fitness checkups', 'Irregular hours and jet lag'],
  '[
    {"step": 1, "title": "Class 10+2 with Physics and Mathematics (Min 50%)", "description": "Mandatory DGCA eligibility criterion for Pilot training.", "duration": "2 Years"},
    {"step": 2, "title": "DGCA Class 2 and Class 1 Medical Examination", "description": "Obtain medical fitness clearance from approved DGCA medical examiners.", "duration": "2-3 Months"},
    {"step": 3, "title": "Flight Training School (Flying Hours + Ground School)", "description": "Complete 200 flying hours and pass DGCA theoretical exams (Navigation, Meteorology, Regulations, Technical).", "duration": "18-24 Months"},
    {"step": 4, "title": "Obtain Commercial Pilot License (CPL)", "description": "Receive official DGCA CPL with Instrument and Multi-Engine rating.", "duration": "Certification"},
    {"step": 5, "title": "Type Rating & Airline Cadet Induction", "description": "Undergo A320 or B737 type rating and join an airline as Junior First Officer.", "duration": "6 Months"}
  ]'::jsonb,
  '[
    {"type": "book", "title": "Oxford Aviation Ground Training Series", "provider_or_author": "Oxford Aviation Academy", "url": "", "description": "Comprehensive reference manuals for Air Navigation, Meteorology, and Aircraft General.", "is_free": false},
    {"type": "platform", "title": "DGCA eGCA Portal", "provider_or_author": "Directorate General of Civil Aviation", "url": "https://dgca.gov.in", "description": "Official portal for exam applications, medical rules, and pilot licensing.", "is_free": true},
    {"type": "video", "title": "Mentour Pilot Ground & Flight Principles", "provider_or_author": "Mentour Pilot (YouTube)", "url": "https://www.youtube.com/@MentourPilot", "description": "Professional airline captain breaking down flight systems, cockpit procedures, and aviation safety.", "is_free": true}
  ]'::jsonb,
  array['Aeronautical Decision Making', 'Multi-Tasking', 'Situational Awareness', 'Crew Coordination', 'Meteorology Understanding'],
  '[]'::jsonb,
  'published'
from career_categories cat where cat.slug = 'aviation-aerospace'
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, pathway_steps = excluded.pathway_steps,
  learning_resources = excluded.learning_resources, skills = excluded.skills, status = 'published';

-- Career 4: Doctor (MBBS)
insert into careers (
  category_id, slug, title, summary, what_it_involves, education_required, salary_text, outlook_text,
  learning_areas, pros, cons, pathway_steps, learning_resources, skills, linked_opportunities, status
)
select
  cat.id,
  'medical-doctor',
  'Doctor (MBBS & Specialists)',
  'Diagnose, treat, and heal patients in hospitals, clinics, emergency care, and public healthcare programs.',
  'Medical doctors care for individuals and communities, diagnosing illnesses, prescribing treatments, performing surgical procedures, and leading medical research and hospital care.',
  'Class 10+2 with PCB (Physics, Chemistry, Biology) + Qualified NEET-UG',
  '₹8 LPA – ₹35 LPA',
  'Evergreen High Demand',
  array['Human Anatomy', 'Physiology & Biochemistry', 'Pathology & Pharmacology', 'Clinical Medicine & Surgery'],
  array['Noble, life-saving profession', 'Unmatched job security', 'Lifelong continuous learning', 'Societal gratitude and trust'],
  array['Long demanding study years (5.5 yrs MBBS + 3 yrs PG)', 'Emotionally demanding working conditions', 'Sleep deprivation during residencies and emergency rotations'],
  '[
    {"step": 1, "title": "Class 10+2 with Physics, Chemistry & Biology (PCB)", "description": "Achieve high percentage and deep mastery of biology, chemistry, and physics.", "duration": "2 Years"},
    {"step": 2, "title": "Crack NEET-UG Entrance Examination", "description": "Qualify with competitive percentile for government or private medical college admission.", "duration": "1 Year"},
    {"step": 3, "title": "MBBS Degree (4.5 Years Academic + 1 Year Internship)", "description": "Anatomy, physiology, pathology, pharmacology, medicine, surgery, and rotatory hospital internship.", "duration": "5.5 Years"},
    {"step": 4, "title": "State / National Medical Commission Registration", "description": "Obtain license to practice as Registered Medical Practitioner (RMP).", "duration": "Certification"},
    {"step": 5, "title": "NEET-PG for Specialization (MD / MS / DNB)", "description": "Specialise in Cardiology, Surgery, Pediatrics, Radiodiagnosis, or Orthopedics.", "duration": "3 Years"}
  ]'::jsonb,
  '[
    {"type": "book", "title": "Harrison''s Principles of Internal Medicine", "provider_or_author": "McGraw-Hill", "url": "", "description": "The gold standard international textbook of internal medicine and clinical therapeutics.", "is_free": false},
    {"type": "book", "title": "Guyton and Hall Textbook of Medical Physiology", "provider_or_author": "John E. Hall", "url": "", "description": "Foundational physiology bible used across all medical colleges globally.", "is_free": false},
    {"type": "platform", "title": "National Medical Commission (NMC)", "provider_or_author": "NMC India", "url": "https://www.nmc.org.in", "description": "Official regulatory portal for medical colleges, curricula, and guidelines.", "is_free": true},
    {"type": "video", "title": "Ninja Nerd Science & Clinical Medicine", "provider_or_author": "Ninja Nerd (YouTube)", "url": "https://www.youtube.com/@NinjaNerdOfficial", "description": "World-class visual whiteboard lectures explaining medical mechanisms and pharmacology.", "is_free": true}
  ]'::jsonb,
  array['Clinical Diagnosis', 'Patient Empathy', 'Surgical Dexterity', 'Emergency Triage', 'Medical Ethics'],
  '[]'::jsonb,
  'published'
from career_categories cat where cat.slug = 'medicine-healthcare'
on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, pathway_steps = excluded.pathway_steps,
  learning_resources = excluded.learning_resources, skills = excluded.skills, status = 'published';

-- 5. Backfill careers into search_index
select career_search_index_refresh(id) from careers where status = 'published';
