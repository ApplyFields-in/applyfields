-- database/changes/2026-10-06_karthik_staff_roles.sql
-- Why: Initial super_admin staff account for the Internal Portal

-- Ensure super_admin user row exists
insert into users (id, email, password_hash, status, created_at, updated_at)
values (
  'a0000000-0000-0000-0000-000000000001',
  'applyfields@gmail.com',
  null,
  'active',
  now(),
  now()
)
on conflict (email) do nothing;

-- Ensure user_profiles has full name
insert into user_profiles (user_id, full_name, created_at, updated_at)
select id, 'ApplyFields Admin', now(), now()
from users
where email = 'applyfields@gmail.com'
on conflict (user_id) do update set full_name = 'ApplyFields Admin';

-- Insert into user_roles with role 'super_admin'
insert into user_roles (user_id, role, granted_at)
select id, 'super_admin'::staff_role, now()
from users
where email = 'applyfields@gmail.com'
on conflict (user_id, role) do nothing;
