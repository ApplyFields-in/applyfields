-- database/changes/2026-10-06_karthik_staff_roles.sql
-- Why: Likhith is the first super_admin staff account for the Internal Portal

-- Ensure Likhith's user row exists. No password in git: the row is created with
-- a NULL password_hash, so the account sets its password via the reset flow.
insert into users (id, email, password_hash, status, created_at, updated_at)
values (
  'a0000000-0000-0000-0000-000000000001',
  'likhithmanakala@gmail.com',
  null,
  'active',
  now(),
  now()
)
on conflict (email) do nothing;

-- Ensure user_profiles has Likhith's full name
insert into user_profiles (user_id, full_name, created_at, updated_at)
select id, 'Likhith Kumar Mankala', now(), now()
from users
where email = 'likhithmanakala@gmail.com'
on conflict (user_id) do update set full_name = 'Likhith Kumar Mankala';

-- Insert into user_roles with role 'super_admin'
insert into user_roles (user_id, role, granted_at)
select id, 'super_admin'::staff_role, now()
from users
where email = 'likhithmanakala@gmail.com'
on conflict (user_id, role) do nothing;
