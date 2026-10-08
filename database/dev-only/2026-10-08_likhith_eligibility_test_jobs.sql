-- DEV ONLY — never run on prod. (Not in database/changes/, which is applied to prod.)
-- Session 07: five published TEST opportunities with eligibility rules, for the manual
-- checks of checkEligibility() with the 3 test profiles. Same rules as the unit-test jobs in
-- apps/api/src/modules/eligibility/check-eligibility.spec.ts. Titles say TEST; the only link is
-- the organisation's own website (from the starter data) — no invented notification links.
--
-- Run:     psql "$DATABASE_URL" -f database/dev-only/2026-10-08_likhith_eligibility_test_jobs.sql
-- Remove:  delete from opportunities where slug like 'test-elig-%';   -- eligibility rows cascade

begin;

with o as (
  insert into opportunities
    (slug, type, category, title, organization_id, summary, state_codes, application_end,
     official_page_url, official_website, status, published_at, last_verified_at)
  select v.slug, v.type::opportunity_type, v.category::opportunity_category, v.title, org.id,
         'TEST data for eligibility checks — not a real notification.',
         v.states, v.ends::date, org.website, org.website, 'published', now(), now()
  from (values
    ('test-elig-appsc-group-2', 'govt_job',    'state_govt',   'TEST · APPSC Group-2 Services',        'appsc',     array['AP'],  '2026-10-20'),
    ('test-elig-ssc-cgl',       'govt_job',    'central_govt', 'TEST · SSC Combined Graduate Level',   'ssc',       array['ALL'], '2026-10-25'),
    ('test-elig-nsp',           'scholarship', 'central',      'TEST · NSP Post-Matric Scholarship',   'nsp',       array['ALL'], '2026-10-31'),
    ('test-elig-neet-2027',     'exam',        'entrance',     'TEST · NEET (UG) 2027',                'nta',       array['ALL'], '2026-11-05'),
    ('test-elig-ap-police-si',  'govt_job',    'police',       'TEST · AP Police Sub-Inspector',       'ap-police', array['AP'],  '2026-11-15')
  ) as v(slug, type, category, title, org_slug, states, ends)
  join organizations org on org.slug = v.org_slug
  on conflict (slug) do nothing
  returning id, slug
)
insert into opportunity_eligibility
  (opportunity_id, age_min, age_max, age_as_on_date, age_relaxations, qualification_level,
   qualification_streams, final_year_allowed, domicile_states, categories_allowed, income_max)
select o.id, e.age_min, e.age_max, e.as_on::date, e.relax::jsonb, e.level,
       e.streams, e.final_year, e.domicile, e.cats, e.income
from o
join (values
  ('test-elig-appsc-group-2', 18,         30,         '2026-07-01',
     '[{"category":"OBC","years":5},{"category":"SC","years":5},{"category":"ST","years":5},{"category":"PWBD","years":10}]',
     'graduate', array[]::text[], null::boolean, array['AP'], array[]::text[], null::integer),
  ('test-elig-ssc-cgl',       18,         32,         '2026-08-01',
     '[{"category":"OBC","years":3},{"category":"SC","years":5},{"category":"ST","years":5},{"category":"PWBD","years":10},{"category":"EXS","years":3}]',
     'graduate', array[]::text[], null,           array[]::text[], array[]::text[], null),
  ('test-elig-nsp',           null::smallint, null::smallint, null,
     '[]',
     '12th',     array[]::text[], null,           array[]::text[], array['SC','ST','OBC'], 250000),
  ('test-elig-neet-2027',     17,         25,         '2026-12-31',
     '[]',
     '12th',     array['PCB'],    true,           array[]::text[], array[]::text[], null),
  ('test-elig-ap-police-si',  22,         28,         '2026-07-01',
     '[{"category":"OBC","years":5},{"category":"SC","years":5},{"category":"ST","years":5},{"category":"PWBD","years":10}]',
     'graduate', array[]::text[], null,           array['AP'], array[]::text[], null)
) as e(slug, age_min, age_max, as_on, relax, level, streams, final_year, domicile, cats, income)
  on e.slug = o.slug;

commit;
