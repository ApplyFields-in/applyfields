-- database/changes/2026-10-07_starter_orgs_doctypes.sql
-- Session 02: starter organisations and document types so the admin portal
-- has real rows for the organisation picker and document readiness checks.
-- Run once against the Supabase DB, then `prisma db pull && prisma generate`.

-- =====================================================================
-- 1. ORGANISATIONS
-- =====================================================================

insert into organizations (slug, name, short_name, level, state_code, website) values
  -- Central bodies
  ('ssc',   'Staff Selection Commission',              'SSC',   'central', null, 'https://ssc.gov.in'),
  ('upsc',  'Union Public Service Commission',          'UPSC',  'central', null, 'https://upsc.gov.in'),
  ('nta',   'National Testing Agency',                  'NTA',   'central', null, 'https://nta.ac.in'),
  ('rrb',   'Railway Recruitment Boards',               'RRB',   'central', null, 'https://indianrailways.gov.in/railwayboard/view_section.jsp?lang=0&id=0,7,1281'),
  ('ibps',  'Institute of Banking Personnel Selection', 'IBPS',  'central', null, 'https://ibps.in'),
  ('nsp',   'National Scholarships Portal',             'NSP',   'central', null, 'https://scholarships.gov.in'),
  ('cbse',  'Central Board of Secondary Education',     'CBSE',  'central', null, 'https://cbse.gov.in'),
  ('ugc',   'University Grants Commission',             'UGC',   'central', null, 'https://ugc.gov.in'),
  -- Andhra Pradesh
  ('appsc', 'Andhra Pradesh Public Service Commission', 'APPSC', 'state', 'AP', 'https://psc.ap.gov.in'),
  ('ap-police', 'AP State Level Police Recruitment Board', 'AP Police', 'state', 'AP', 'https://slprb.ap.gov.in'),
  ('ap-dsc', 'AP District Selection Committee',         'AP DSC','state', 'AP', null),
  -- Telangana
  ('tspsc', 'Telangana State Public Service Commission','TSPSC', 'state', 'TS', 'https://tspsc.gov.in'),
  ('ts-police', 'TS State Level Police Recruitment Board','TS Police','state','TS','https://tslprb.in'),
  -- Other major state PSCs (add more as scraping covers them)
  ('kpsc',  'Karnataka Public Service Commission',      'KPSC',  'state', 'KA', 'https://kpsc.kar.nic.in'),
  ('tnpsc', 'Tamil Nadu Public Service Commission',     'TNPSC', 'state', 'TN', 'https://tnpsc.gov.in'),
  ('rpsc',  'Rajasthan Public Service Commission',      'RPSC',  'state', 'RJ', 'https://rpsc.rajasthan.gov.in')
on conflict (slug) do nothing;

-- =====================================================================
-- 2. DOCUMENT TYPES
-- =====================================================================

insert into document_types (code, name, category, has_expiry, description, sort_order) values
  -- Identity
  ('aadhaar',           'Aadhaar card',                'identity',    false, 'UIDAI Aadhaar (masked — never store full number)', 10),
  ('pan',               'PAN card',                    'identity',    false, 'Income Tax PAN',                                   20),
  ('voter_id',          'Voter ID (EPIC)',             'identity',    false, 'Election Commission photo ID',                     30),
  ('passport',          'Passport',                    'identity',    true,  'Indian passport',                                  40),
  ('driving_licence',   'Driving licence',             'identity',    true,  'State RTO driving licence',                        50),
  -- Education
  ('class_10_marksheet','Class 10 marksheet',          'education',   false, 'SSC / CBSE / ICSE board marksheet',                100),
  ('class_12_marksheet','Class 12 marksheet',          'education',   false, 'Intermediate / HSC / ISC board marksheet',         110),
  ('degree_certificate','Degree certificate',          'education',   false, 'UG / PG degree certificate or provisional',        120),
  ('diploma_certificate','Diploma certificate',        'education',   false, 'Polytechnic or professional diploma',              130),
  ('pg_certificate',    'PG certificate',              'education',   false, 'Post-graduation degree certificate',               140),
  -- Certificates
  ('caste_certificate', 'Caste / community certificate','certificate',false, 'SC/ST/OBC/EWS certificate from the MRO/Tahsildar',200),
  ('income_certificate','Income certificate',          'certificate', true,  'Annual income certificate from the MRO',           210),
  ('domicile',          'Domicile / residence certificate','certificate',true,'State domicile or residence proof',               220),
  ('ews_certificate',   'EWS certificate',             'certificate', true,  'Economically Weaker Section certificate',          230),
  ('disability_certificate','Disability certificate',  'certificate', true,  'PwBD certificate from the medical board',          240),
  ('ex_serviceman',     'Ex-serviceman certificate',   'certificate', false, 'Discharge certificate or NOC',                     250),
  ('noc',               'No Objection Certificate',    'certificate', false, 'NOC from current employer or department',          260),
  -- Photos
  ('photo',             'Passport-size photograph',    'photo',       false, 'Recent passport-size photo (white background)',    300),
  ('signature',         'Scanned signature',           'photo',       false, 'Signature scan (black ink, white background)',     310),
  ('left_thumb',        'Left thumb impression',       'photo',       false, 'Left thumb impression scan',                      320),
  -- Other
  ('experience_letter', 'Experience letter',           'other',       false, 'Work experience letter from employer',             400),
  ('noc_employer',      'NOC from employer',           'other',       false, 'No Objection Certificate from current employer',   410)
on conflict (code) do nothing;
