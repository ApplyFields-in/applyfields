-- Why: four more sites on the generic scraper, and two sources that cannot be scraped switched off.
-- Configs were checked against the live pages on 2026-11-20.
-- RUN AFTER the ingestion deploy that has `doc_path_contains` / `detail_path_contains`
-- (older code rejects these keys and the run fails with 409).
-- Needs 2026-11-19_likhith_scrape_sources_generic_config.sql first. Safe to run more than once.
-- Prod (obvcvcgwzjzsujdczxyj) already has the list_url/config/is_active values below (2026-11-20);
-- running it there only adds the notes.

-- SBI moved from sbi.co.in to sbi.bank.in. Only the English detailed advertisements ("…_Advt_Eng.pdf").
update scrape_sources set
  list_url = 'https://sbi.bank.in/web/careers/current-openings',
  config = '{"path_contains": "advt", "skip_words": ["hindi"], "category": "banking", "limit": 10}'::jsonb,
  notes = 'Generic scraper. Link texts are poor ("English (959 KB)"): fix titles in review.',
  updated_at = now()
where key = 'sbi';

-- TSPSC is now TGPSC; the old host no longer resolves. PDFs are served from /preview/<id> (no .pdf).
update scrape_sources set
  name = 'Telangana Public Service Commission (TGPSC)',
  list_url = 'https://websitenew.tgpsc.gov.in/notifications',
  config = '{"doc_path_contains": "/preview/", "title_words": ["recruitment"],
             "skip_words": ["result", "answer key", "hall ticket", "certificate verification",
                            "provisional", "selection list", "web note", "webnote"],
             "category": "state_govt", "limit": 10}'::jsonb,
  notes = 'Generic scraper. Recruitment notifications only; web notes and results are skipped.',
  updated_at = now()
where key = 'tspsc';

-- DRDO lists one page per vacancy; the advertisement PDF sits on that page.
update scrape_sources set
  list_url = 'https://drdo.gov.in/drdo/en/offerings/vacancies',
  config = '{"detail_path_contains": "/offerings/vacancies/", "path_contains": "/vacancy/",
             "category": "defence", "limit": 10}'::jsonb,
  notes = 'Generic scraper with detail pages. Titles come from each vacancy page.',
  updated_at = now()
where key = 'drdo';

-- LIC: careers page → recruitment page → notification documents (served without .pdf).
update scrape_sources set
  config = '{"detail_path_contains": "recruitment", "doc_path_contains": "/documents/d/",
             "path_contains": "notification",
             "skip_words": ["shortlisted", "result", "selected", "marks", "cut-off"],
             "category": "psu", "limit": 5}'::jsonb,
  notes = 'Generic scraper with detail pages. English and Hindi notifications both come through.',
  updated_at = now()
where key = 'lic';

update scrape_sources set
  is_active = false,
  notes = 'OFF: upsc.gov.in answers 403 Access Denied to any identified bot. Add UPSC notices manually.',
  updated_at = now()
where key = 'upsc';

update scrape_sources set
  is_active = false,
  notes = 'OFF: rrbcdg.gov.in TLS certificate does not match its hostname. Add RRB notices manually.',
  updated_at = now()
where key = 'rrb';
