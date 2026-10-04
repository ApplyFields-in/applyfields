# 002 — How the database structure changes

**Date:** 2026-10-03 · **Status:** Accepted · **Decided by:** Likhith

## Decision

- The schema starts from `database/01_create_tables.sql` (66 tables).
- Every later change is a small SQL file in `database/changes/`, reviewed in a PR.
- Developers (Karthik, Harsha) may change **rows and columns** on the **dev** project with their own
  login (`app_developer`). They cannot create or drop tables, add indexes, or change permissions.
- Only Likhith creates tables and applies changes to **prod**.
- Prisma is used for `db pull` + `generate` only — not `migrate` or `db push`.

## Why

- Developers move faster when they can add a column themselves.
- One SQL file per change keeps dev and prod identical and reviewable.
- Postgres has no "alter but don't drop" permission, so `02_team_roles.sql` gives developers table
  ownership plus guards that block drops, new tables and permission changes.

## Rules that come with it

1. Never share the `postgres` password; everyone uses their own login.
2. No developer logins on the prod project.
3. After new tables are added, re-run section 17 of `01` and section 2 of `02`.
