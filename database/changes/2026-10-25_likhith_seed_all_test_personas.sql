-- =====================================================================
--  APPLYFIELDS — ALL TEST PERSONAS & CREDENTIALS
--  File: database/changes/2026-10-25_likhith_seed_all_test_personas.sql
--
--  Universal Password for all test personas: Applyfields@2026
-- =====================================================================

BEGIN;

-- Common Argon2id hash for password: Applyfields@2026
-- ($argon2id$v=19$m=19456,p=1,t=2$c1gIGLBUO6ou7ipgSJnjrg$z4jn8/O35VoYIstv/5oNEbbEo3+acHJIe5yFeIZHIGg)

-- =====================================================================
-- 1. SUPER ADMIN (applyfieldsadmin@gmail.com)
-- =====================================================================
INSERT INTO users (id, email, phone, password_hash, status, created_at, updated_at)
VALUES (
  '77f67ed0-fbc7-4fe6-921d-fcc1618573d2',
  'applyfieldsadmin@gmail.com',
  '+919876500001',
  '$argon2id$v=19$m=19456,p=1,t=2$c1gIGLBUO6ou7ipgSJnjrg$z4jn8/O35VoYIstv/5oNEbbEo3+acHJIe5yFeIZHIGg',
  'active', now(), now()
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = excluded.password_hash,
  status = 'active';

INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
VALUES ('77f67ed0-fbc7-4fe6-921d-fcc1618573d2', 'Likhith Kumar (Super Admin)', now(), now())
ON CONFLICT (user_id) DO UPDATE SET full_name = excluded.full_name;

INSERT INTO user_roles (user_id, role, granted_at)
VALUES 
  ('77f67ed0-fbc7-4fe6-921d-fcc1618573d2', 'super_admin'::staff_role, now()),
  ('77f67ed0-fbc7-4fe6-921d-fcc1618573d2', 'admin'::staff_role, now())
ON CONFLICT (user_id, role) DO NOTHING;


-- =====================================================================
-- 2. REVIEWER / MODERATOR (applyfieldsreviewer@gmail.com)
-- =====================================================================
INSERT INTO users (id, email, phone, password_hash, status, created_at, updated_at)
VALUES (
  '39d615b1-0e3d-432f-89c5-756615a63978',
  'applyfieldsreviewer@gmail.com',
  '+919876500002',
  '$argon2id$v=19$m=19456,p=1,t=2$c1gIGLBUO6ou7ipgSJnjrg$z4jn8/O35VoYIstv/5oNEbbEo3+acHJIe5yFeIZHIGg',
  'active', now(), now()
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = excluded.password_hash,
  status = 'active';

INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
VALUES ('39d615b1-0e3d-432f-89c5-756615a63978', 'Karthik Yendluri (Reviewer)', now(), now())
ON CONFLICT (user_id) DO UPDATE SET full_name = excluded.full_name;

INSERT INTO user_roles (user_id, role, granted_at)
VALUES ('39d615b1-0e3d-432f-89c5-756615a63978', 'reviewer'::staff_role, now())
ON CONFLICT (user_id, role) DO NOTHING;


-- =====================================================================
-- 3. CONTENT EDITOR (applyfieldseditor@gmail.com)
-- =====================================================================
INSERT INTO users (id, email, phone, password_hash, status, created_at, updated_at)
VALUES (
  '99918961-0b0d-4e2b-9820-c7ac4f8f7ee3',
  'applyfieldseditor@gmail.com',
  '+919876500003',
  '$argon2id$v=19$m=19456,p=1,t=2$c1gIGLBUO6ou7ipgSJnjrg$z4jn8/O35VoYIstv/5oNEbbEo3+acHJIe5yFeIZHIGg',
  'active', now(), now()
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = excluded.password_hash,
  status = 'active';

INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
VALUES ('99918961-0b0d-4e2b-9820-c7ac4f8f7ee3', 'Harsha Vardhan (Content Editor)', now(), now())
ON CONFLICT (user_id) DO UPDATE SET full_name = excluded.full_name;

INSERT INTO user_roles (user_id, role, granted_at)
VALUES ('99918961-0b0d-4e2b-9820-c7ac4f8f7ee3', 'content_editor'::staff_role, now())
ON CONFLICT (user_id, role) DO NOTHING;


-- =====================================================================
-- 4. CITIZEN / STUDENT USER (student@applyfields.in / +919876543210)
-- =====================================================================
INSERT INTO users (id, email, phone, password_hash, status, created_at, updated_at)
VALUES (
  '55555555-5555-4555-a555-555555555555',
  'student@applyfields.in',
  '+919876543210',
  '$argon2id$v=19$m=19456,p=1,t=2$c1gIGLBUO6ou7ipgSJnjrg$z4jn8/O35VoYIstv/5oNEbbEo3+acHJIe5yFeIZHIGg',
  'active', now(), now()
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = excluded.password_hash,
  status = 'active';

INSERT INTO user_profiles (
  user_id, full_name, gender, category, state_code, date_of_birth, created_at, updated_at
)
VALUES (
  '55555555-5555-4555-a555-555555555555',
  'Rahul Sharma (Student)',
  'male'::gender,
  'OBC'::social_category,
  'TS',
  '2002-05-15',
  now(), now()
)
ON CONFLICT (user_id) DO UPDATE SET 
  full_name = excluded.full_name,
  state_code = excluded.state_code;


-- =====================================================================
-- 5. PARTNER OPERATOR (partner@applyfields.in / +919876543211)
-- =====================================================================
INSERT INTO users (id, email, phone, password_hash, status, created_at, updated_at)
VALUES (
  '66666666-6666-4666-a666-666666666666',
  'partner@applyfields.in',
  '+919876543211',
  '$argon2id$v=19$m=19456,p=1,t=2$c1gIGLBUO6ou7ipgSJnjrg$z4jn8/O35VoYIstv/5oNEbbEo3+acHJIe5yFeIZHIGg',
  'active', now(), now()
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = excluded.password_hash,
  status = 'active';

INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
VALUES ('66666666-6666-4666-a666-666666666666', 'Srinivas Rao (Partner)', now(), now())
ON CONFLICT (user_id) DO UPDATE SET full_name = excluded.full_name;

-- Ensure Partner Center exists
INSERT INTO partners (
  id, slug, type, business_name, description, owner_name, phone, whatsapp, email,
  address, state_code, district, city, pincode, is_available, verification_status,
  is_listed, rating_avg, rating_count, created_at, updated_at
)
VALUES (
  '77777777-7777-4777-a777-777777777777',
  'sri-balaji-meeseva-hyderabad',
  'meeseva'::partner_type,
  'Sri Balaji MeeSeva & Digital Seva Hub',
  'Authorized MeeSeva and CSC Citizen facilitation center. Certified for PAN cards, Aadhaar services, caste & income certificates.',
  'Srinivas Rao',
  '+919876543211',
  '+919876543211',
  'partner@applyfields.in',
  'Shop 4, Ameerpet Main Road, Opp Metro Pillar 1042',
  'TS',
  'Hyderabad',
  'Hyderabad',
  '500038',
  true,
  'verified'::verification_status,
  true,
  4.90,
  128,
  now(), now()
)
ON CONFLICT (slug) DO UPDATE SET 
  verification_status = 'verified'::verification_status,
  is_listed = true;

-- Link Partner User to Partner Center
INSERT INTO partner_members (partner_id, user_id, role, created_at)
VALUES (
  '77777777-7777-4777-a777-777777777777',
  '66666666-6666-4666-a666-666666666666',
  'owner'::partner_member_role,
  now()
)
ON CONFLICT (partner_id, user_id) DO NOTHING;


-- =====================================================================
-- 6. COLLEGE ADMISSIONS OFFICER (college@applyfields.in / +919876543212)
-- =====================================================================
INSERT INTO users (id, email, phone, password_hash, status, created_at, updated_at)
VALUES (
  '88888888-8888-4888-a888-888888888888',
  'college@applyfields.in',
  '+919876543212',
  '$argon2id$v=19$m=19456,p=1,t=2$c1gIGLBUO6ou7ipgSJnjrg$z4jn8/O35VoYIstv/5oNEbbEo3+acHJIe5yFeIZHIGg',
  'active', now(), now()
)
ON CONFLICT (email) DO UPDATE SET 
  password_hash = excluded.password_hash,
  status = 'active';

INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
VALUES ('88888888-8888-4888-a888-888888888888', 'Dr. Ramesh Babu (College Officer)', now(), now())
ON CONFLICT (user_id) DO UPDATE SET full_name = excluded.full_name;

-- Ensure College Partner exists
INSERT INTO partners (
  id, slug, type, business_name, description, owner_name, phone, email,
  address, state_code, district, city, pincode, is_available, verification_status,
  is_listed, rating_avg, rating_count, created_at, updated_at
)
VALUES (
  '99999999-9999-4999-a999-999999999999',
  'vignan-institute-technology-science',
  'college'::partner_type,
  'Vignan Institute of Technology & Science',
  'NAAC A+ Accredited Engineering & Technology Campus. Recognized under UGC / AICTE.',
  'Dr. Ramesh Babu',
  '+919876543212',
  'college@applyfields.in',
  'Deshmukhi Village, Pochampally Mandal, Near Ramoji Film City',
  'TS',
  'Yadadri Bhuvanagiri',
  'Hyderabad Outer',
  '508284',
  true,
  'verified'::verification_status,
  true,
  4.85,
  310,
  now(), now()
)
ON CONFLICT (slug) DO UPDATE SET 
  verification_status = 'verified'::verification_status,
  is_listed = true;

-- Link College User to College Partner
INSERT INTO partner_members (partner_id, user_id, role, created_at)
VALUES (
  '99999999-9999-4999-a999-999999999999',
  '88888888-8888-4888-a888-888888888888',
  'owner'::partner_member_role,
  now()
)
ON CONFLICT (partner_id, user_id) DO NOTHING;

COMMIT;
