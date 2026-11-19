-- Why: first sites for the generic scraper (app/scrapers/generic.py) — no Python file per site.
-- Configs were checked against the live pages on 2026-11-19.
-- RUN AFTER the ingestion deploy that has `skip_words` / `limit` (older code rejects these keys).
-- Needs 2026-11-19_likhith_scrape_sources_generic_config.sql first. Safe to run more than once.

insert into scrape_sources (key, name, organization_id, list_url, kind, is_active, interval_hours, config, notes)
select v.key, v.name, o.id, v.list_url, 'html', v.is_active, 6, v.config::jsonb, v.notes
from (values
  ('ap-police', 'AP State Level Police Recruitment Board', 'ap-police', 'https://slprb.ap.gov.in/', true,
   '{"title_words": ["notification", "recruitment"],
     "skip_words": ["key", "result", "cut off", "cutoff", "selection list", "hall ticket", "marks"],
     "limit": 25, "category": "police"}',
   'Generic scraper. Home page lists notifications, amendments and press notes.'),
  ('ibps', 'Institute of Banking Personnel Selection', 'ibps', 'https://www.ibps.in/', true,
   '{"path_contains": "notification", "limit": 25, "category": "banking"}',
   'Generic scraper. Detailed notifications are linked from the home page. Site TLS is flaky at times.'),
  ('tnpsc', 'Tamil Nadu Public Service Commission', 'tnpsc', 'https://www.tnpsc.gov.in/English/notification.aspx', false,
   '{"path_contains": "/document/english/", "limit": 25, "category": "state_govt"}',
   'Generic scraper. OFF: newest notice on this page was Nov 2024 — confirm the current list page, then turn on.')
) as v(key, name, org_slug, list_url, is_active, config, notes)
join organizations o on o.slug = v.org_slug
on conflict (key) do update
  set list_url = excluded.list_url, config = excluded.config, notes = excluded.notes, updated_at = now();
