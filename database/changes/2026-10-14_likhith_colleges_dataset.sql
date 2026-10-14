-- =====================================================================
-- Session: Colleges & Universities Comprehensive Dataset Seeding
-- Author: Likhith
-- Date: 2026-10-14
-- Sources:
--   1. cleaned_institutions.xlsx (AICTE Institutions Register: 13,090 colleges)
--   2. LIST OF ENGINEERING TECHNOLOGY NBA ACCREDIATED.pdf (NBA Accredited engineering programs)
--
-- Notes:
--   - No database schema or table structures were altered.
--   - All check constraints and enums preserved strictly.
--   - Missing values populated with standardized "Data not given" / "Not Available".
--   - Seed script: apps/api/scripts/seed_colleges.js
-- =====================================================================

-- 1. Ensure Technical & Professional Courses Exist
insert into courses (
  id, slug, name, short_name, level, stream, description, eligibility_text,
  min_qualification, duration_months, skills_developed, career_outcomes, status
) values
(
  'c1000000-0000-0000-0000-000000000010',
  'btech-ece',
  'Bachelor of Technology in Electronics & Communication Engineering',
  'B.Tech ECE',
  'ug',
  'Engineering & Technology',
  'Undergraduate engineering program focused on electronic devices, circuits, signal processing, and communication networks.',
  '10+2 with Physics, Mathematics, and Chemistry with minimum 50% marks.',
  '12th',
  48,
  array['VLSI Design', 'Embedded Systems', 'Digital Signal Processing', 'IoT', 'Wireless Communications'],
  'Electronics Engineer, Embedded Systems Developer, Telecom Engineer, Hardware Architect',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000011',
  'btech-me',
  'Bachelor of Technology in Mechanical Engineering',
  'B.Tech ME',
  'ug',
  'Engineering & Technology',
  'Core engineering discipline covering mechanics, thermodynamics, fluid dynamics, CAD design, and advanced manufacturing.',
  '10+2 with Physics, Chemistry, and Mathematics from a recognized board.',
  '12th',
  48,
  array['CAD/CAM', 'Thermodynamics', 'Robotics & Automation', 'Finite Element Analysis', 'Manufacturing Systems'],
  'Mechanical Engineer, Design Analyst, Robotics Specialist, Manufacturing Manager',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000012',
  'btech-ce',
  'Bachelor of Technology in Civil Engineering',
  'B.Tech CE',
  'ug',
  'Engineering & Technology',
  'Engineering discipline dealing with structural design, construction, surveying, geotechnical analysis, and infrastructure management.',
  '10+2 with Physics, Mathematics, and Chemistry.',
  '12th',
  48,
  array['Structural Analysis', 'AutoCAD Civil 3D', 'Geotechnical Engineering', 'Project Management', 'Surveying'],
  'Civil Engineer, Structural Consultant, Urban Planning Specialist, Construction Project Manager',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000013',
  'btech-eee',
  'Bachelor of Technology in Electrical & Electronics Engineering',
  'B.Tech EEE',
  'ug',
  'Engineering & Technology',
  'Engineering branch encompassing electrical power generation, transmission, electrical machines, control systems, and power electronics.',
  '10+2 with Mathematics and Physics.',
  '12th',
  48,
  array['Power Systems', 'Control Systems', 'Renewable Energy', 'Power Electronics', 'Electrical Machines'],
  'Electrical Engineer, Power Grid Specialist, Control Systems Engineer, Renewable Energy Consultant',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000014',
  'btech-it',
  'Bachelor of Technology in Information Technology',
  'B.Tech IT',
  'ug',
  'Engineering & Technology',
  'Undergraduate course emphasizing software systems, network architecture, web development, cybersecurity, and cloud infrastructure.',
  '10+2 with Physics and Mathematics.',
  '12th',
  48,
  array['Software Engineering', 'Database Management', 'Cloud Computing', 'Cyber Security', 'Full-Stack Development'],
  'Software Engineer, Systems Architect, Cloud Operations Specialist, IT Consultant',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000015',
  'btech-chem',
  'Bachelor of Technology in Chemical Engineering',
  'B.Tech Chemical',
  'ug',
  'Engineering & Technology',
  'Discipline dealing with chemical process plants, material synthesis, petroleum refining, and environmental engineering.',
  '10+2 with Chemistry, Physics, and Mathematics.',
  '12th',
  48,
  array['Process Dynamics', 'Reaction Engineering', 'Thermodynamics', 'Biochemical Engineering', 'Process Safety'],
  'Chemical Process Engineer, Refinery Specialist, Safety Officer, Biochemical Researcher',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000016',
  'diploma-polytechnic',
  'Diploma in Engineering & Technology (Polytechnic)',
  'Polytechnic Diploma',
  'diploma',
  'Engineering & Technology',
  'Practical 3-year technical education diploma providing hands-on engineering competencies and lateral entry to B.Tech.',
  'Pass in 10th Class (SSC) with Mathematics and Science.',
  '10th',
  36,
  array['Technical Drawing', 'Workshop Practice', 'Circuit Testing', 'Machine Maintenance', 'Industrial Safety'],
  'Junior Engineer, Technical Supervisor, CAD Drafter, Plant Technician',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000017',
  'mba',
  'Master of Business Administration',
  'MBA',
  'pg',
  'Management & Business',
  'Postgraduate business management programme preparing leaders in Marketing, Finance, HR, Operations, and Business Analytics.',
  'Bachelor degree in any discipline with minimum 50% marks + CAT/MAT/State MBA CET.',
  'graduate',
  24,
  array['Financial Analysis', 'Strategic Management', 'Marketing Strategy', 'Operations Management', 'Leadership'],
  'Management Consultant, Business Analyst, Product Manager, Investment Banker',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000018',
  'mca',
  'Master of Computer Applications',
  'MCA',
  'pg',
  'Computer Applications',
  'Postgraduate programme covering enterprise software engineering, database administration, and cloud-native architecture.',
  'BCA/B.Sc Computer Science or Bachelor degree with Mathematics in 10+2.',
  'graduate',
  24,
  array['Enterprise Java/Python', 'Distributed Systems', 'Cloud Architecture', 'Database Design', 'Algorithm Optimization'],
  'Senior Software Engineer, Database Administrator, Systems Architect, Data Analyst',
  'published'
),
(
  'c1000000-0000-0000-0000-000000000019',
  'bpharm',
  'Bachelor of Pharmacy',
  'B.Pharm',
  'ug',
  'Pharmacy & Healthcare',
  'Undergraduate pharmaceutical degree covering pharmacognosy, pharmaceutics, medicinal chemistry, and drug formulations.',
  '10+2 with Physics, Chemistry, and Biology/Mathematics.',
  '12th',
  48,
  array['Pharmacology', 'Pharmaceutical Chemistry', 'Clinical Pharmacy', 'Drug Formulation', 'Quality Assurance'],
  'Pharmacist, Drug Safety Associate, Quality Control Chemist, Formulation Scientist',
  'published'
)
on conflict (slug) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  level = excluded.level,
  stream = excluded.stream,
  description = excluded.description,
  eligibility_text = excluded.eligibility_text,
  skills_developed = excluded.skills_developed,
  career_outcomes = excluded.career_outcomes,
  status = excluded.status;

-- 2. Institutions and Institution Courses Seed Verification
-- Executed via: node apps/api/scripts/seed_colleges.js
-- Total Institutions: 13,156 (13,151 imported + 5 initial seed)
-- Total Course Offerings: 14,777
