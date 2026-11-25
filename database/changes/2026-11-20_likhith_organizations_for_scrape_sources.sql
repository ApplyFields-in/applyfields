-- Why: five scrape sources had no organization, so every run stopped with
-- "Source '<key>' has no organization mapping" (409) and no drafts were made.
-- Names and websites are the bodies' own official ones (same hosts the scrapers read).
-- Safe to run more than once.

insert into organizations (slug, name, short_name, level, website)
values
  ('sbi',   'State Bank of India',                          'SBI',   'central', 'https://sbi.bank.in'),
  ('drdo',  'Defence Research and Development Organisation', 'DRDO',  'central', 'https://drdo.gov.in'),
  ('lic',   'Life Insurance Corporation of India',          'LIC',   'central', 'https://licindia.in'),
  ('npcil', 'Nuclear Power Corporation of India Limited',   'NPCIL', 'central', 'https://npcil.nic.in'),
  ('cdsco', 'Central Drugs Standard Control Organisation',  'CDSCO', 'central', 'https://cdsco.gov.in')
on conflict (slug) do nothing;

update scrape_sources s
set organization_id = o.id, updated_at = now()
from organizations o
where o.slug = s.key
  and s.key in ('sbi', 'drdo', 'lic', 'npcil', 'cdsco')
  and s.organization_id is null;
