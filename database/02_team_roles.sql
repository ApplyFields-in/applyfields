-- =====================================================================
--  APPLYFIELDS — TEAM DATABASE LOGINS
--  File: database/02_team_roles.sql   ·   Run AFTER 01_create_tables.sql
--
--  WHAT THIS FILE DOES
--    Supabase gives you ONE all-powerful login: "postgres". Anyone with its
--    password can do anything — even delete the whole database. Instead of
--    sharing it, this file creates safer logins for the team:
--
--    app_developer  → Karthik & Harsha (DEV project)
--       YES  read, add, edit and delete rows
--       YES  add columns, rename columns, change a column's type or default,
--            add check / not-null / foreign-key rules, add new values to enums
--       NO   create new tables (or views, types, functions, indexes,
--            unique rules) — Postgres treats these as "creating"; ask Likhith
--       NO   drop tables, columns or types         (blocked by a guard)
--       NO   change permissions or RLS policies    (blocked by a guard)
--       NO   change the structure of audit_logs
--
--    ingestion_writer → the Python scraper
--       YES  create and edit DRAFT jobs, updates and pending changes
--       NO   publish anything, read users, change any structure
--
--  HOW IT WORKS
--    In Postgres only a table's OWNER can change its structure, so every
--    table is handed to a team role, "app_schema_owner". Likhith's postgres
--    login and the developers are members of it. Developers have no CREATE
--    permission on the schema, so they cannot add new tables, and two
--    guards (event triggers) stop them from dropping things or changing
--    permissions. Likhith's postgres login is never restricted.
--
--  HOW TO RUN
--    SQL Editor → New query → paste this file → Run.
--    Then create the real logins (section 6 at the bottom).
--    Check the guards are on:
--      select evtname from pg_event_trigger where evtname like 'guard%';   → 2 rows
-- =====================================================================

begin;

set local search_path = public;


-- =====================================================================
-- 1. ROLES
-- =====================================================================

create role app_schema_owner nologin;   -- owns the tables → may change their structure
create role app_developer    nologin;   -- group for Karthik, Harsha (and future developers)
create role ingestion_writer nologin;   -- the Python scraper

-- developers may change table structure
grant app_schema_owner to app_developer;

-- Likhith (the login running this file) keeps full control of the tables
do $$
begin
  if current_setting('server_version_num')::int >= 160000 then
    execute format('grant app_schema_owner to %I with inherit true, set true', current_user);
  else
    execute format('grant app_schema_owner to %I', current_user);
  end if;
end;
$$;

-- only Likhith may create new things in the schema
revoke create on schema public from public;
grant usage on schema public to app_developer, ingestion_writer;


-- =====================================================================
-- 2. HAND THE TABLES AND ENUMS TO THE TEAM
--    audit_logs stays with Likhith, so nobody can switch off its protection.
--    Re-run this section after Likhith adds new tables (safe to repeat).
-- =====================================================================

grant create on schema public to app_schema_owner;      -- Postgres needs this during the hand-over…
do $$
declare r record;
begin
  -- only tables/enums Likhith owns (skips Supabase/extension tables such as spatial_ref_sys)
  for r in select tablename from pg_tables
           where schemaname = 'public' and tablename <> 'audit_logs' and tableowner = current_user loop
    execute format('alter table public.%I owner to app_schema_owner', r.tablename);
    -- nobody empties a whole table by accident
    execute format('revoke truncate on table public.%I from app_schema_owner', r.tablename);
  end loop;
  for r in select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
           where n.nspname = 'public' and t.typtype = 'e' and pg_get_userbyid(t.typowner) = current_user loop
    execute format('alter type public.%I owner to app_schema_owner', r.typname);
  end loop;
end;
$$;
revoke create on schema public from app_schema_owner;   -- …and takes it away again: no new tables


-- =====================================================================
-- 3. DEVELOPERS — row access
--    They own every table except audit_logs, so they can already read and
--    write those rows. audit_logs: read and add only.
-- =====================================================================

grant select, insert on audit_logs to app_developer;
create policy developer_read on audit_logs for select to app_developer using (true);
create policy developer_add  on audit_logs for insert to app_developer with check (true);

-- tables Likhith creates later can be read/written by developers straight away
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_developer;


-- =====================================================================
-- 4. GUARDS — what developers may NOT do, even as table owners
--    (only the developer logins are checked; Likhith is never blocked)
-- =====================================================================

-- a) no dropping tables, columns, types, triggers or policies
create function guard_developer_drops() returns event_trigger
language plpgsql set search_path = '' as $$
declare obj record;
begin
  if (select rolsuper from pg_catalog.pg_roles where rolname = session_user)
     or not pg_catalog.pg_has_role(session_user, 'app_developer', 'USAGE') then
    return;                                    -- not a developer login: no limits
  end if;
  for obj in select * from pg_catalog.pg_event_trigger_dropped_objects() loop
    if obj.object_type in ('table', 'table column', 'type', 'schema', 'view', 'function', 'trigger', 'policy') then
      raise exception 'Developers cannot drop % "%". Ask Likhith.', obj.object_type, obj.object_identity;
    end if;
  end loop;
end;
$$;

-- b) no changing permissions or RLS policies (keeps the public API locked)
create function guard_developer_permissions() returns event_trigger
language plpgsql set search_path = '' as $$
begin
  if not (select rolsuper from pg_catalog.pg_roles where rolname = session_user)
     and pg_catalog.pg_has_role(session_user, 'app_developer', 'USAGE') then
    raise exception 'Developers cannot run "%". Ask Likhith.', tg_tag;
  end if;
end;
$$;

do $$
begin
  create event trigger guard_developer_drops on sql_drop
    execute function guard_developer_drops();
  create event trigger guard_developer_permissions on ddl_command_start
    when tag in ('GRANT', 'REVOKE', 'CREATE POLICY', 'ALTER POLICY', 'ALTER DEFAULT PRIVILEGES')
    execute function guard_developer_permissions();
exception when others then
  raise warning 'Guards NOT installed (%). Developers could drop tables or columns: rely on the PR rule.', sqlerrm;
end;
$$;


-- =====================================================================
-- 5. THE SCRAPER — drafts only
-- =====================================================================

-- reference data: read (and add organisations it hasn't seen before)
grant select on organizations, exams, document_types, scrape_sources to ingestion_writer;
grant insert on organizations to ingestion_writer;
grant update (last_run_at, last_success_at, consecutive_failures) on scrape_sources to ingestion_writer;

-- its own bookkeeping tables
grant select, insert, update on scrape_runs, scraped_documents to ingestion_writer;

-- content it creates as drafts
grant select, insert, update on opportunities, updates, opportunity_versions to ingestion_writer;
grant select, insert, update, delete on opportunity_posts, opportunity_eligibility, opportunity_dates to ingestion_writer;

-- reference & bookkeeping policies
create policy scraper_read   on organizations     for select to ingestion_writer using (true);
create policy scraper_add    on organizations     for insert to ingestion_writer with check (true);
create policy scraper_read   on exams             for select to ingestion_writer using (true);
create policy scraper_read   on document_types    for select to ingestion_writer using (true);
create policy scraper_read   on scrape_sources    for select to ingestion_writer using (true);
create policy scraper_update on scrape_sources    for update to ingestion_writer using (true) with check (true);
create policy scraper_all    on scrape_runs       for all    to ingestion_writer using (true) with check (true);
create policy scraper_all    on scraped_documents for all    to ingestion_writer using (true) with check (true);

-- opportunities: can READ everything (to detect changes), but only create/edit DRAFTS
create policy scraper_read         on opportunities for select to ingestion_writer using (true);
create policy scraper_insert_draft on opportunities for insert to ingestion_writer with check (status = 'draft');
create policy scraper_update_draft on opportunities for update to ingestion_writer
  using (status = 'draft') with check (status = 'draft');

-- posts / eligibility / dates: can only be written for DRAFT opportunities
do $$
declare t text;
begin
  foreach t in array array['opportunity_posts', 'opportunity_eligibility', 'opportunity_dates'] loop
    execute format('create policy scraper_read on public.%I for select to ingestion_writer using (true)', t);
    execute format(
      'create policy scraper_write_draft on public.%I for all to ingestion_writer '
      || 'using (exists (select 1 from public.opportunities o where o.id = opportunity_id and o.status = ''draft'')) '
      || 'with check (exists (select 1 from public.opportunities o where o.id = opportunity_id and o.status = ''draft''))',
      t);
  end loop;
end;
$$;

-- updates (admit cards, results…): read all, create/edit drafts only
create policy scraper_read         on updates for select to ingestion_writer using (true);
create policy scraper_insert_draft on updates for insert to ingestion_writer with check (status = 'draft');
create policy scraper_update_draft on updates for update to ingestion_writer
  using (status = 'draft') with check (status = 'draft');

-- changes to PUBLISHED opportunities go in as "pending" versions for a reviewer to approve
create policy scraper_read           on opportunity_versions for select to ingestion_writer using (true);
create policy scraper_insert_pending on opportunity_versions for insert to ingestion_writer with check (status = 'pending');
create policy scraper_update_pending on opportunity_versions for update to ingestion_writer
  using (status = 'pending') with check (status = 'pending');

commit;


-- =====================================================================
-- 6. CREATE THE ACTUAL LOGINS
--    Run these yourself, one at a time, in a NEW query. Use long random
--    passwords and share them privately. Do NOT save them in this file.
--
--      create role karthik_dev login password 'CHANGE-ME' in role app_developer;
--      create role harsha_dev  login password 'CHANGE-ME' in role app_developer;
--      alter role ingestion_writer login password 'CHANGE-ME';
--
--    Their connection string (Supabase pooler — username is
--    "<role name>.<project ref>"):
--      postgresql://karthik_dev.<project-ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
--
--    To remove someone later:   drop role karthik_dev;
--
--  AFTER LIKHITH ADDS NEW TABLES
--    Re-run section 17 of 01_create_tables.sql, then section 2 of this file.
-- =====================================================================
