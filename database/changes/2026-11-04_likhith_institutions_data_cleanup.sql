-- Why: college data users see is messy (Session 26 handoff):
--   * names with broken casing/spacing: "Polytechnic,balrampur", "R.c.patel", "Maninagar(east)", "Government Of"
--   * city/district placeholder "Data not given"
--   * 83% of rows have no state_code, so state filters miss most colleges
--   * the same state under two codes (TS/TG, OR/OD, UK/UT), and pre-2014 data puts Telangana colleges under AP
-- Data only, no structure change. Safe to re-run (every step is idempotent).
-- Undo: update institutions i set name = b.name, city = b.city, district = b.district, state_code = b.state_code
--       from institutions_backup_20261104 b where b.id = i.id;
-- Drop the backup table once the cleaned data has been checked.

begin;

create table if not exists institutions_backup_20261104 as
  select id, name, city, district, state_code from institutions;

-- 1. One code per state (majority already used in institutions + organizations).
update institutions set state_code = 'TS' where state_code = 'TG';
update institutions set state_code = 'OR' where state_code = 'OD';
update institutions set state_code = 'UK' where state_code = 'UT';

-- 2. Placeholders are not data.
update institutions set city = null
  where lower(btrim(city)) in ('data not given', 'not given', 'n/a', 'na', '-', 'null', 'unknown', 'nil', '');
update institutions set district = null
  where lower(btrim(district)) in ('data not given', 'not given', 'n/a', 'na', '-', 'null', 'unknown', 'nil', '');

-- 3. Names: spacing, "," typos, capital after punctuation, lowercase connector words. Acronyms already
--    lowercased by an earlier pass (e.g. "(cgit)") only get a capital first letter; they can't be recovered.
create or replace function pg_temp.clean_institution_name(s text) returns text language plpgsql as $$
declare
  m text[];
  w text;
begin
  s := btrim(regexp_replace(s, '\s+', ' ', 'g'));
  s := regexp_replace(s, ',s(\s|$)', '''s\1', 'g');        -- "Society,s Gangamai" -> "Society's Gangamai"
  s := regexp_replace(s, '\s*,\s*', ', ', 'g');            -- exactly one space after a comma
  s := regexp_replace(s, '[,\s]+$', '');                   -- no trailing comma
  s := regexp_replace(s, '([A-Za-z])\(', '\1 (', 'g');     -- "Technology(diploma)" -> "Technology (diploma)"
  loop                                                     -- "R.c.patel" -> "R.C.Patel", ", balrampur" -> ", Balrampur"
    m := regexp_match(s, '([.(/&,-] ?)([a-z])');
    exit when m is null;
    s := regexp_replace(s, '([.(/&,-] ?)[a-z]', m[1] || upper(m[2]));
  end loop;
  foreach w in array array['Of', 'And', 'For', 'The', 'In', 'At', 'On', 'To', 'With'] loop
    s := regexp_replace(s, '([A-Za-z]) ' || w || ' ', '\1 ' || lower(w) || ' ', 'g');
  end loop;
  return upper(left(s, 1)) || substr(s, 2);
end $$;

update institutions set name = pg_temp.clean_institution_name(name)
  where name is distinct from pg_temp.clean_institution_name(name);

-- 4a. Telangana districts are Telangana, whatever older data said (AP before 2014, one stray PB).
update institutions set state_code = 'TS'
where lower(btrim(district)) in (
  'adilabad', 'bhadradri kothagudem', 'hanamkonda', 'hyderabad', 'jagtial', 'jangaon',
  'jayashankar bhupalpally', 'jogulamba gadwal', 'kamareddy', 'karimnagar', 'khammam',
  'kumuram bheem asifabad', 'mahabubabad', 'mahabubnagar', 'mahbubnagar', 'mancherial', 'medak',
  'medchal', 'medchal-malkajgiri', 'medchal malkajgiri', 'mulugu', 'nagarkurnool', 'nalgonda',
  'narayanpet', 'nirmal', 'nizamabad', 'peddapalli', 'rajanna sircilla', 'rangareddy', 'ranga reddy',
  'sangareddy', 'siddipet', 'suryapet', 'vikarabad', 'wanaparthy', 'warangal', 'yadadri bhuvanagiri'
) and state_code is distinct from 'TS';

-- 4b. Missing state from the address, only when it names exactly one state.
--     Roads and banks named after states ("Delhi Road", "Punjab National Bank") are removed first.
with st(code, nm) as (values
  ('AP', 'ANDHRA PRADESH'), ('AR', 'ARUNACHAL PRADESH'), ('AS', 'ASSAM'), ('BR', 'BIHAR'),
  ('CG', 'CHHATTISGARH'), ('CG', 'CHATTISGARH'), ('GA', 'GOA'), ('GJ', 'GUJARAT'), ('HR', 'HARYANA'),
  ('HP', 'HIMACHAL PRADESH'), ('JH', 'JHARKHAND'), ('KA', 'KARNATAKA'), ('KL', 'KERALA'),
  ('MP', 'MADHYA PRADESH'), ('MH', 'MAHARASHTRA'), ('MN', 'MANIPUR'), ('ML', 'MEGHALAYA'),
  ('MZ', 'MIZORAM'), ('NL', 'NAGALAND'), ('OR', 'ODISHA'), ('OR', 'ORISSA'), ('PB', 'PUNJAB'),
  ('RJ', 'RAJASTHAN'), ('SK', 'SIKKIM'), ('TN', 'TAMIL NADU'), ('TN', 'TAMILNADU'), ('TS', 'TELANGANA'),
  ('TR', 'TRIPURA'), ('UP', 'UTTAR PRADESH'), ('UK', 'UTTARAKHAND'), ('UK', 'UTTARANCHAL'),
  ('WB', 'WEST BENGAL'), ('DL', 'DELHI'), ('JK', 'JAMMU'), ('JK', 'KASHMIR'), ('LA', 'LADAKH'),
  ('CH', 'CHANDIGARH'), ('PY', 'PUDUCHERRY'), ('PY', 'PONDICHERRY'), ('AN', 'ANDAMAN'),
  ('LD', 'LAKSHADWEEP')
),
addr as (
  select id, regexp_replace(upper(address),
    'PUNJAB NATIONAL BANK|PUNJAB (AND|&) SIND BANK|BANK OF MAHARASHTRA|STATE BANK OF [A-Z]+|\m[A-Z]+ (ROAD|HIGHWAY|MARG|BYPASS)\M',
    ' ', 'g') as a
  from institutions where state_code is null and address is not null
),
hit as (
  select addr.id, min(st.code) as code
  from addr join st on addr.a ~ ('\m' || st.nm || '\M')
  group by addr.id having count(distinct st.code) = 1
)
update institutions i set state_code = hit.code from hit where hit.id = i.id;

-- 4c. Still missing: copy the state from other rows of the same district, only when they all agree.
with d as (
  select lower(btrim(district)) as dist, min(state_code) as code
  from institutions where state_code is not null and district is not null
  group by 1 having count(distinct state_code) = 1
)
update institutions i set state_code = d.code
from d where i.state_code is null and lower(btrim(i.district)) = d.dist;

-- Report (shows in the SQL editor).
select count(*) as total,
       count(*) filter (where i.state_code is null) as still_no_state,
       count(*) filter (where i.city is null) as no_city,
       count(*) filter (where i.name <> b.name) as names_changed,
       count(*) filter (where i.state_code is distinct from b.state_code) as states_changed
from institutions i join institutions_backup_20261104 b using (id);

commit;
