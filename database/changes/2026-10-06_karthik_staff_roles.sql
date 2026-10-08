-- database/changes/2026-10-06_karthik_staff_roles.sql
-- Why: Initial super_admin staff account for the Internal Portal

-- Ensure super_admin user row exists (password: AWSEDRF!2102)
insert into users (id, email, password_hash, status, created_at, updated_at)
values (
  'a0000000-0000-0000-0000-000000000001',
  'applyfields@gmail.com',
  '$argon2id$v=19$m=19456,p=1,t=2$AUCV0OQsuw76viGCm8QGJQ$hDTA9RIEo3fnOVGvWwTe3kXXhW6E8x8AuxLN2sSdjBc',
  'active',
  now(),
  now()
)
on conflict (email) do update set password_hash = excluded.password_hash, status = 'active';

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
