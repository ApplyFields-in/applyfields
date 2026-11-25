import type { OpportunityCard } from '@applyfields/types';
import { rankByPreferences, rankingState } from './recommend.js';

let n = 0;
function card(over: Partial<OpportunityCard>): OpportunityCard {
  n += 1;
  return {
    slug: `c${n}`,
    type: 'govt_job',
    title: `Listing ${n}`,
    organization: 'Some Board',
    location: 'All India',
    qualification: 'Graduate',
    vacancies: null,
    last_date: null,
    days_left: 30,
    tags: [],
    category: 'other',
    state_codes: ['ALL'],
    ...over,
  };
}
const slugs = (cards: OpportunityCard[]) => cards.map((c) => c.slug);
const ALL = { location_scope: 'all' as const };

describe('rankByPreferences', () => {
  it('puts a matching category first', () => {
    const bank = card({ category: 'banking' });
    const rail = card({ category: 'railways' });
    expect(slugs(rankByPreferences([bank, rail], { interests: ['railways'], ...ALL }, null))).toEqual([rail.slug, bank.slug]);
  });

  it.each([
    ['ssc', { tags: ['SSC', 'Central govt'] }],
    ['upsc', { tags: ['UPSC'] }],
    ['teaching', { title: 'AP TET 2026 notification' }],
    ['teaching', { title: 'Junior Lecturer recruitment' }],
    ['scholarships', { type: 'scholarship' }],
    ['admissions', { type: 'admission' }],
    ['entrance', { type: 'exam', category: 'entrance' }],
    ['jobs_after_graduation', { type: 'govt_job' }],
    ['state_psc', { category: 'state_govt' }],
    ['state_psc', { category: 'state' }],
    ['defence', { category: 'defence' }],
    ['police', { category: 'police' }],
    ['psu', { category: 'psu' }],
  ] as const)('%s matches %o', (interest, over) => {
    const plain = card({ type: 'exam', category: 'other', title: 'Unrelated exam' });
    const hit = card(over as Partial<OpportunityCard>);
    expect(rankByPreferences([plain, hit], { interests: [interest], ...ALL }, null)[0].slug).toBe(hit.slug);
  });

  it('scope "state" keeps own-state listings only (not central, not other states)', () => {
    const ap = card({ state_codes: ['AP'] });
    const ts = card({ state_codes: ['TS'] });
    const central = card({ state_codes: ['ALL'] });
    expect(slugs(rankByPreferences([ap, ts, central], { interests: [], location_scope: 'state' }, 'AP'))).toEqual([ap.slug]);
  });

  it('scope "state_central" keeps own state + central, drops other states', () => {
    const ts = card({ state_codes: ['TS'] });
    const central = card({ state_codes: ['ALL'] });
    const ap = card({ state_codes: ['AP', 'TS'] });
    expect(slugs(rankByPreferences([ts, central, ap], { interests: [], location_scope: 'state_central' }, 'AP')).sort()).toEqual(
      [central.slug, ap.slug].sort(),
    );
  });

  it('scope "all" keeps everything', () => {
    const cards = [card({ state_codes: ['TS'] }), card({ state_codes: ['ALL'] })];
    expect(rankByPreferences(cards, { interests: [], location_scope: 'all' }, 'AP')).toHaveLength(2);
  });

  it('no saved state: nothing is dropped and no state bonus is given', () => {
    const ts = card({ state_codes: ['TS'], days_left: 5 });
    const ap = card({ state_codes: ['AP'], days_left: 9 });
    expect(slugs(rankByPreferences([ap, ts], { interests: [], location_scope: 'state' }, null))).toEqual([ts.slug, ap.slug]);
  });

  it('own-state listing beats an equal central one under state_central (+2)', () => {
    const central = card({ state_codes: ['ALL'], days_left: 3 });
    const ap = card({ state_codes: ['AP'], days_left: 25 });
    expect(rankByPreferences([central, ap], { interests: [], location_scope: 'state_central' }, 'AP')[0].slug).toBe(ap.slug);
  });

  it('closing within 14 days gets +1; ties go to the nearest deadline, unknown deadlines last', () => {
    const later = card({ days_left: 20 });
    const soon = card({ days_left: 10 });
    const unknown = card({ days_left: null });
    const sooner = card({ days_left: 2 });
    expect(slugs(rankByPreferences([later, unknown, soon, sooner], { interests: [], ...ALL }, null))).toEqual([
      sooner.slug,
      soon.slug,
      later.slug,
      unknown.slug,
    ]);
  });

  it('interest match (+3) outranks closing soon (+1)', () => {
    const soon = card({ days_left: 1 });
    const rail = card({ category: 'railways', days_left: 40 });
    expect(rankByPreferences([soon, rail], { interests: ['railways'], ...ALL }, null)[0].slug).toBe(rail.slug);
  });

  it('returns at most 6', () => {
    const many = Array.from({ length: 10 }, () => card({}));
    expect(rankByPreferences(many, { interests: [], ...ALL }, null)).toHaveLength(6);
  });

  it('null scope behaves like "all"', () => {
    const cards = [card({ state_codes: ['TS'] }), card({ state_codes: ['AP'] })];
    expect(rankByPreferences(cards, { interests: [], location_scope: null }, 'AP')).toHaveLength(2);
  });
});

describe('rankingState', () => {
  it('uses the state picked in setup (state_code) over the domicile state', () => {
    expect(rankingState({ state_code: 'TS', domicile_state_code: 'AP' })).toBe('TS');
  });
  it('falls back to the domicile state, then null', () => {
    expect(rankingState({ state_code: null, domicile_state_code: 'AP' })).toBe('AP');
    expect(rankingState(null)).toBeNull();
  });
});

it('a listing with empty state_codes counts as central (same as its "All India" label)', () => {
  const blank = card({ state_codes: [] });
  expect(rankByPreferences([blank], { interests: [], location_scope: 'state_central' }, 'AP')).toHaveLength(1);
});
