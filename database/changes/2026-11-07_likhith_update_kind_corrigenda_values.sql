-- Why: the corrigenda engine (a740be6) added three update kinds to schema.prisma and @applyfields/types
-- (vacancy_revision, syllabus_change, postponement) but the database enum never got them. Saving an update
-- of those kinds fails on the DB. Also: a `prisma db pull` (188c719) then dropped them from the schema.
-- Additive and safe to re-run. ALTER TYPE ... ADD VALUE cannot run inside a transaction block on old
-- Postgres; run this file as-is (no BEGIN/COMMIT).
alter type update_kind add value if not exists 'vacancy_revision' before 'other';
alter type update_kind add value if not exists 'syllabus_change'  before 'other';
alter type update_kind add value if not exists 'postponement'     before 'other';
