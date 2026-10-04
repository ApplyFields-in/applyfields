# database/ — the Supabase schema

**Owner:** Likhith

| File | What it does | Run |
|---|---|---|
| [`01_create_tables.sql`](01_create_tables.sql) | Creates all **66 tables**, 49 enums, indexes, triggers, turns **RLS on** for every table and locks Supabase's public API keys | Once per project (dev, then prod) |
| [`02_team_roles.sql`](02_team_roles.sql) | Team logins: developers can change **rows and columns** but can't create or drop tables; the scraper can only create **drafts** | Once, after 01 |
| [`changes/`](changes/) | Every structure change after day 1, one small SQL file each | Dev: by whoever made it · Prod: by Likhith |

Both files were tested on Postgres the way Supabase runs them (67 automated checks, including a
project where Supabase/PostGIS already added its own table to `public`).

## How to run

1. Supabase → **DEV** project → **SQL Editor** → **New query**
2. Paste `01_create_tables.sql` → **Run** (one transaction: all or nothing)
3. Paste `02_team_roles.sql` → **Run**, then create the logins (section 6 at the bottom of that file)
4. Check:
   ```sql
   select count(*) from pg_tables where schemaname = 'public';                       -- 66
   select tablename from pg_tables where schemaname = 'public' and not rowsecurity;  -- no rows
   select evtname from pg_event_trigger where evtname like 'guard%';                 -- 2 rows
   ```
   If the last query returns 0 rows, the "no drop" guards are not active on your project —
   developers could then drop tables/columns, so rely on the PR rule and tell Likhith.
5. When dev is tested, repeat on the **PROD** project — but on prod create **no** developer logins.

## Who can do what

| Login / key | Rows | Columns (add, rename, change type) | New tables / indexes | Drop tables, columns | Who |
|---|---|---|---|---|---|
| `postgres` password | ✅ | ✅ | ✅ | ✅ | **Likhith only** (+ production servers) |
| `karthik_dev`, `harsha_dev` (`app_developer`) | ✅ | ✅ | ❌ | ❌ | Developers, **dev project only** |
| `ingestion_writer` | drafts only | ❌ | ❌ | ❌ | The Python scraper |
| anon / publishable key | ❌ | ❌ | ❌ | ❌ | Nobody needs it (the website calls NestJS) |
| service_role / secret key | ❌ tables · ✅ Storage files | ❌ | ❌ | ❌ | API + ingestion `.env` (file uploads) |
| Supabase dashboard member | ✅ | ✅ | ✅ | ✅ | Be careful — see below |

**Dashboard access bypasses everything above.** Keep **prod in a separate Supabase organisation that only
Likhith belongs to**, and give teammates their database login instead of dashboard access.

## How we change the structure (everyone)

1. Write the change as SQL, e.g. `alter table user_profiles add column nickname text;`
2. Run it on **DEV** with your own login (DBeaver, TablePlus, psql or VS Code).
3. Save the same SQL in `database/changes/` (see [`changes/README.md`](changes/README.md)).
4. Refresh Prisma so the code knows the new column: `cd apps/api && pnpm prisma db pull && pnpm prisma generate`.
5. Open one PR with the change file + updated `schema.prisma`. Likhith reviews and applies it to **PROD**.

New tables, indexes and anything that drops data: ask Likhith.

> Use Prisma only for `db pull` and `generate`. **Never** run `prisma migrate` or `prisma db push` —
> they would fight with the SQL files and can wipe the dev database.

## First-time Prisma setup (Likhith, once)

```bash
cd apps/api
pnpm add -D prisma && pnpm add @prisma/client
pnpm prisma init          # then set DATABASE_URL / DIRECT_URL (see apps/api/.env.example)
pnpm prisma db pull       # reads the 66 tables → Prisma models
pnpm prisma generate
```

## After Likhith adds new tables

Re-run (both safe to repeat):
1. Section **17** of `01_create_tables.sql` — RLS on + lock the API keys
2. Section **2** of `02_team_roles.sql` — hand the new tables to the team

## Supabase notes

- Optional extra lock: **Project Settings → Data API** → remove `public` from the exposed schemas (we never use the Data API).
- Create Storage buckets: `notification-pdfs` (private), `user-documents` (private), `public-assets` (public).
