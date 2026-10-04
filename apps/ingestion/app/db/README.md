# db — save drafts to Supabase

- Insert/update rows with `status = 'draft'` only.
- Use the tables in `database/01_create_tables.sql`. Never create or alter tables from Python code (the `ingestion_writer` login can't anyway).
- Same `source.url` + same `content_hash` = already saved → skip.
- Same `source.url` + new `content_hash` = the notice changed → save as a new draft version for review.
