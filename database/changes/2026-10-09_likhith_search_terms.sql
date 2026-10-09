-- Why: Query Autocomplete & Related Searches (PostgreSQL + Typesense support)
-- Provides instant (<5ms) prefix and typo-tolerant query suggestions, popular searches,
-- and related-searches discovery.

create table if not exists search_terms (
  id             uuid primary key default gen_random_uuid(),
  term           text not null unique,               -- normalized lower-case phrase for search
  display_term   text not null,                      -- capitalized display label e.g. "SSC CGL"
  category       text not null default 'general',    -- 'exam', 'job', 'scholarship', 'admission', 'service', 'organization'
  search_count   int not null default 1,
  related_terms  text[] not null default '{}',       -- curated / associated search terms
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_search_terms_trgm on search_terms using gin (term gin_trgm_ops);
create index if not exists idx_search_terms_prefix on search_terms (term text_pattern_ops);
create index if not exists idx_search_terms_count on search_terms (search_count desc);
create index if not exists idx_search_terms_category on search_terms (category);

comment on table search_terms is 'Search query suggestions, popular terms, and related search phrases.';

-- Upserts a search query term, incrementing search_count if it already exists
create or replace function record_search_term(p_term text, p_display text default null, p_category text default 'general')
returns void language plpgsql security definer set search_path = '' as $$
declare
  norm_term text := lower(trim(p_term));
  disp_term text := coalesce(nullif(trim(p_display), ''), trim(p_term));
begin
  if length(norm_term) < 2 then
    return;
  end if;

  insert into public.search_terms (term, display_term, category, search_count)
  values (norm_term, disp_term, coalesce(p_category, 'general'), 1)
  on conflict (term) do update
    set search_count = public.search_terms.search_count + 1,
        updated_at = now();
end;
$$;

revoke execute on function record_search_term(text, text, text) from public, anon;
grant execute on function record_search_term(text, text, text) to authenticated, service_role;

-- Automatically harvests published titles into search_terms
create or replace function harvest_search_term() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    if new.title is not null and length(trim(new.title)) >= 2 then
      insert into public.search_terms (term, display_term, category)
      values (lower(trim(new.title)), trim(new.title), new.item_type::text)
      on conflict (term) do nothing;
    end if;
    if new.subtitle is not null and length(trim(new.subtitle)) >= 2 then
      insert into public.search_terms (term, display_term, category)
      values (lower(trim(new.subtitle)), trim(new.subtitle), 'organization')
      on conflict (term) do nothing;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_harvest_search_terms on search_index;
create trigger trg_harvest_search_terms
  after insert or update on search_index
  for each row execute function harvest_search_term();

-- Seed popular search queries with curated related terms
insert into search_terms (term, display_term, category, search_count, related_terms)
values
  ('ssc cgl', 'SSC CGL', 'exam', 120, array['SSC CHSL', 'UPSC CSE', 'RRB NTPC', 'IBPS PO']),
  ('ssc chsl', 'SSC CHSL', 'exam', 95, array['SSC CGL', 'SSC MTS', 'RRB Group D', 'Post Office GDS']),
  ('ssc gd', 'SSC GD Constable', 'job', 85, array['Telangana Police', 'AP Police', 'RPF Constable', 'CRPF Recruitment']),
  ('ssc mts', 'SSC MTS', 'job', 70, array['SSC CHSL', 'Railway Group D', 'Post Office GDS']),
  ('upsc cse', 'UPSC Civil Services', 'exam', 110, array['State PSC', 'SSC CGL', 'UPSC NDA', 'UPSC CDS']),
  ('upsc nda', 'UPSC NDA', 'exam', 60, array['UPSC CDS', 'AFCAT', 'Indian Army Agniveer', 'Indian Navy']),
  ('rrb ntpc', 'RRB NTPC', 'exam', 90, array['Railway Group D', 'RRB ALP', 'SSC CGL', 'RRB JE']),
  ('railway group d', 'Railway Group D', 'job', 80, array['RRB NTPC', 'SSC MTS', 'Post Office GDS']),
  ('ibps po', 'IBPS PO', 'exam', 75, array['SBI PO', 'IBPS Clerk', 'RBI Grade B', 'SBI Clerk']),
  ('sbi po', 'SBI PO', 'exam', 70, array['IBPS PO', 'SBI Clerk', 'RBI Grade B', 'NABARD Grade A']),
  ('neet ug', 'NEET UG', 'admission', 105, array['JEE Main', 'NEET PG', 'AIIMS Nursing', 'ICAR AIEEA']),
  ('jee main', 'JEE Main', 'admission', 100, array['JEE Advanced', 'BITSAT', 'NEET UG', 'VITEEE']),
  ('gate 2026', 'GATE 2026', 'exam', 65, array['PSU Recruitment', 'IIT M.Tech', 'BARC Exam', 'ISRO Recruitment']),
  ('scholarship', 'Scholarships', 'scholarship', 85, array['NSP Scholarship', 'Post Matric Scholarship', 'Pre Matric Scholarship', 'Merit Scholarship']),
  ('nsp scholarship', 'NSP Scholarship', 'scholarship', 75, array['Post Matric Scholarship', 'Pre Matric Scholarship', 'National Fellowship']),
  ('pan card', 'PAN Card Service', 'service', 95, array['Aadhaar Card', 'Voter ID Card', 'Income Certificate', 'Ration Card']),
  ('aadhaar card', 'Aadhaar Card Update', 'service', 90, array['PAN Card', 'Voter ID Card', 'Ration Card']),
  ('income certificate', 'Income Certificate', 'service', 60, array['Caste Certificate', 'Residence Certificate', 'EWS Certificate']),
  ('caste certificate', 'Caste Certificate', 'service', 60, array['Income Certificate', 'EWS Certificate', 'Non Creamy Layer Certificate']),
  ('telangana police', 'Telangana Police', 'job', 75, array['AP Police', 'SSC GD', 'TSPSC Group 1', 'TSPSC Group 2']),
  ('tspsc group 1', 'TSPSC Group 1', 'exam', 70, array['TSPSC Group 2', 'APPSC Group 1', 'UPSC CSE']),
  ('appsc group 1', 'APPSC Group 1', 'exam', 65, array['APPSC Group 2', 'TSPSC Group 1', 'UPSC CSE'])
on conflict (term) do update
  set display_term = excluded.display_term,
      category = excluded.category,
      search_count = excluded.search_count,
      related_terms = excluded.related_terms;

-- Backfill from current search_index
insert into search_terms (term, display_term, category)
select lower(trim(title)), trim(title), item_type::text
from search_index
where length(trim(title)) >= 2
on conflict (term) do nothing;
