# database/changes — every structure change, one file each

The database started from `01_create_tables.sql`. Every change after that (a new column, a renamed
column, a new enum value…) gets **one small SQL file here**, so the prod database can be updated
exactly the same way as dev.

## File name

`YYYY-MM-DD_<your-name>_<what>.sql` — for example:

```
2026-10-07_karthik_add_profile_nickname.sql
2026-10-09_harsha_add_scraped_documents_page_count.sql
```

## File content

```sql
-- Why: profile page shows a nickname (issue #42)
alter table user_profiles add column nickname text;
```

## Rules

1. Run it on **DEV** with your own login first, then commit it in your PR together with the
   refreshed `apps/api/prisma/schema.prisma` (`pnpm prisma db pull`).
2. Never edit a file that is already merged — make a new one.
3. **Likhith** applies merged files to **PROD**, oldest first.
4. New tables, indexes or anything that deletes data: ask Likhith (developer logins can't do these).
