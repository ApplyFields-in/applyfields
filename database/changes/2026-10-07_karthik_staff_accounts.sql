-- database/changes/2026-10-07_karthik_staff_accounts.sql
-- Why: Seed 4 staff role accounts for the Internal Portal (admin, reviewer, content_editor, support)
-- Passwords:
--   admin:          adminAPPLY@123
--   reviewer:        reviewerAPPLY@123
--   content_editor:  editorAPPLY@123
--   support:         supportAPPLY@123

-- 1. admin account: applyfieldsadmin@gmail.com and alias appyfieldsadmin@gmail.com
insert into users (id, email, password_hash, status, created_at, updated_at)
values
  ('77f67ed0-fbc7-4fe6-921d-fcc1618573d2', 'applyfieldsadmin@gmail.com', '$argon2id$v=19$m=19456,p=1,t=2$FbcfR3D+onYwDV/GrjyYbA$XF2SooDJPRSVJtgjwBR1B9LoKs6o3ajbnDebzoRvJaE', 'active', now(), now()),
  ('8cad3692-8121-497e-95a2-c1dae11821b3', 'appyfieldsadmin@gmail.com', '$argon2id$v=19$m=19456,p=1,t=2$FbcfR3D+onYwDV/GrjyYbA$XF2SooDJPRSVJtgjwBR1B9LoKs6o3ajbnDebzoRvJaE', 'active', now(), now())
on conflict (email) do update set password_hash = excluded.password_hash, status = 'active';

insert into user_profiles (user_id, full_name, created_at, updated_at)
select id, 'ApplyFields Admin', now(), now()
from users
where email in ('applyfieldsadmin@gmail.com', 'appyfieldsadmin@gmail.com')
on conflict (user_id) do update set full_name = 'ApplyFields Admin';

insert into user_roles (user_id, role, granted_at)
select id, 'admin'::staff_role, now()
from users
where email in ('applyfieldsadmin@gmail.com', 'appyfieldsadmin@gmail.com')
on conflict (user_id, role) do nothing;

-- 2. reviewer account: applyfieldsreviewer@gmail.com
insert into users (id, email, password_hash, status, created_at, updated_at)
values ('39d615b1-0e3d-432f-89c5-756615a63978', 'applyfieldsreviewer@gmail.com', '$argon2id$v=19$m=19456,p=1,t=2$fksIB+ADZUj567HiPTs6TQ$ybPnL0Lz4KUMTHxR8Am6ntTaUcdL9velzgc5rUdDzIg', 'active', now(), now())
on conflict (email) do update set password_hash = excluded.password_hash, status = 'active';

insert into user_profiles (user_id, full_name, created_at, updated_at)
select id, 'ApplyFields Reviewer', now(), now()
from users
where email = 'applyfieldsreviewer@gmail.com'
on conflict (user_id) do update set full_name = 'ApplyFields Reviewer';

insert into user_roles (user_id, role, granted_at)
select id, 'reviewer'::staff_role, now()
from users
where email = 'applyfieldsreviewer@gmail.com'
on conflict (user_id, role) do nothing;

-- 3. content_editor account: applyfieldseditor@gmail.com
insert into users (id, email, password_hash, status, created_at, updated_at)
values ('99918961-0b0d-4e2b-9820-c7ac4f8f7ee3', 'applyfieldseditor@gmail.com', '$argon2id$v=19$m=19456,p=1,t=2$Xq22jQ25WiIKv2ikMjoavA$4WcbNJjvfAgZXS21IkWFBMu3qr5ZCp7E2imQ8iKKs5E', 'active', now(), now())
on conflict (email) do update set password_hash = excluded.password_hash, status = 'active';

insert into user_profiles (user_id, full_name, created_at, updated_at)
select id, 'ApplyFields Content Editor', now(), now()
from users
where email = 'applyfieldseditor@gmail.com'
on conflict (user_id) do update set full_name = 'ApplyFields Content Editor';

insert into user_roles (user_id, role, granted_at)
select id, 'content_editor'::staff_role, now()
from users
where email = 'applyfieldseditor@gmail.com'
on conflict (user_id, role) do nothing;

-- 4. support account: applyfieldssupport@gmail.com
insert into users (id, email, password_hash, status, created_at, updated_at)
values ('d2d04071-6df7-4fb2-885a-29faf85930e4', 'applyfieldssupport@gmail.com', '$argon2id$v=19$m=19456,p=1,t=2$wh2hvKJHCgmWJ+8Y4sdRLQ$I/ZVl6jeqqE5RQpgeIWNv0czSOsL3Kp43ujv1ZGRNLA', 'active', now(), now())
on conflict (email) do update set password_hash = excluded.password_hash, status = 'active';

insert into user_profiles (user_id, full_name, created_at, updated_at)
select id, 'ApplyFields Support', now(), now()
from users
where email = 'applyfieldssupport@gmail.com'
on conflict (user_id) do update set full_name = 'ApplyFields Support';

insert into user_roles (user_id, role, granted_at)
select id, 'support'::staff_role, now()
from users
where email = 'applyfieldssupport@gmail.com'
on conflict (user_id, role) do nothing;
