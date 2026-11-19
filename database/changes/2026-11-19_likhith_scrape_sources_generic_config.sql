-- Why: one generic scraper (apps/ingestion/app/scrapers/generic.py) handles simple sites that list
-- notice PDFs as plain links. Its settings live in this column, so a new simple site is one row here
-- instead of a new Python file. Sources with their own scraper file (ssc, upsc, isro …) ignore it.
-- RUN THIS BEFORE deploying the ingestion service: it now selects `config` for every run.
-- Safe to run more than once.

alter table scrape_sources add column if not exists config jsonb;

comment on column scrape_sources.config is
  'Generic scraper settings (sources without their own scraper file). All keys optional: '
  '{"hosts": ["…"], "path_contains": "/uploads/", "title_words": ["notification"], "category": "state_govt"}. '
  'NULL = the source needs its own file in app/scrapers/.';
