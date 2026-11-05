-- Why: real passkey sign-in (WebAuthn: fingerprint / face / device PIN). The old "passkey" login
-- only set users.mfa_enabled and then signed anyone in from an email alone; it is switched off in
-- the API. Each row here is one passkey: its credential id and the PUBLIC key the device created.
-- Sign-in checks the device's signature against public_key, so nothing secret is stored.
-- New table → needs Likhith (database/changes/README.md rule 4). Safe to re-run.

create table if not exists user_passkeys (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  -- base64url credential id from the authenticator; looked up on every sign-in
  credential_id  text not null unique,
  -- COSE public key bytes
  public_key     bytea not null,
  -- signature counter (replay protection for authenticators that keep one; many passkeys report 0)
  counter        bigint not null default 0,
  transports     text[] not null default '{}',
  -- 'singleDevice' | 'multiDevice' (synced, e.g. iCloud Keychain / Google Password Manager)
  device_type    text,
  backed_up      boolean not null default false,
  name           text,
  last_used_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists user_passkeys_user_id_idx on user_passkeys (user_id);

-- Same lock-down as every other table (01_create_tables.sql section 17): only the API's own login reaches it.
alter table user_passkeys enable row level security;
revoke all on table user_passkeys from anon, authenticated, service_role;

-- users.mfa_enabled was set by the fake enrolment with no passkey behind it. From now on it means
-- "has at least one real passkey", kept in step by the API.
update users u set mfa_enabled = false
where mfa_enabled = true
  and not exists (select 1 from user_passkeys p where p.user_id = u.id);
