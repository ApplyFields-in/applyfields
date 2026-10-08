import type { EligibilityStatus } from '@applyfields/types';
import { describe, expect, it } from 'vitest';
import {
  ageOn,
  checkEligibility,
  type EligibilityProfile,
  type EligibilityRules,
} from './check-eligibility.js';

const TODAY = '2026-10-08';

const NONE: EligibilityRules = {
  age_min: null,
  age_max: null,
  age_as_on_date: null,
  age_relaxations: [],
  qualification_level: null,
  qualification_streams: [],
  min_percentage: null,
  final_year_allowed: null,
  gender: 'any',
  domicile_states: [],
  categories_allowed: [],
  income_max: null,
  other_conditions: [],
};
const rules = (r: Partial<EligibilityRules>): EligibilityRules => ({ ...NONE, ...r });

const STATE_RELAX = [
  { category: 'OBC' as const, years: 5 },
  { category: 'SC' as const, years: 5 },
  { category: 'ST' as const, years: 5 },
  { category: 'PWBD' as const, years: 10 },
];

/* The 5 test jobs (same rules as the ones entered in admin). */
const JOBS = {
  appsc_group2: rules({
    age_min: 18,
    age_max: 30,
    age_as_on_date: '2026-07-01',
    age_relaxations: STATE_RELAX,
    qualification_level: 'graduate',
    domicile_states: ['AP'],
  }),
  ssc_cgl: rules({
    age_min: 18,
    age_max: 32,
    age_as_on_date: '2026-08-01',
    age_relaxations: [
      { category: 'OBC', years: 3 },
      { category: 'SC', years: 5 },
      { category: 'ST', years: 5 },
      { category: 'PWBD', years: 10 },
      { category: 'EXS', years: 3 },
    ],
    qualification_level: 'graduate',
  }),
  nsp: rules({
    qualification_level: '12th',
    categories_allowed: ['SC', 'ST', 'OBC'],
    income_max: 250_000,
  }),
  neet: rules({
    age_min: 17,
    age_max: 25,
    age_as_on_date: '2026-12-31',
    qualification_level: '12th',
    qualification_streams: ['PCB'],
    final_year_allowed: true,
  }),
  ap_police_si: rules({
    age_min: 22,
    age_max: 28,
    age_as_on_date: '2026-07-01',
    age_relaxations: STATE_RELAX,
    qualification_level: 'graduate',
    domicile_states: ['AP'],
  }),
};

const edu = (
  level: EligibilityProfile['education'][number]['level'],
  degree: string | null,
  stream: string | null = null,
  extra: Partial<EligibilityProfile['education'][number]> = {},
): EligibilityProfile['education'][number] => ({
  level,
  degree,
  stream,
  status: 'completed',
  score: null,
  score_type: null,
  ...extra,
});

/** GEN male, 24, B.Tech, AP, ₹5L */
const A: EligibilityProfile = {
  date_of_birth: '2002-03-15',
  gender: 'male',
  category: 'GEN',
  is_pwbd: false,
  is_ex_serviceman: false,
  domicile_state_code: 'AP',
  annual_family_income: 500_000,
  education: [edu('12th', 'Intermediate', 'MPC'), edu('graduate', 'B.Tech', 'Computer Science')],
};
/** OBC female, 28, 12th pass, TS, ₹2L */
const B: EligibilityProfile = {
  date_of_birth: '1998-01-10',
  gender: 'female',
  category: 'OBC',
  is_pwbd: false,
  is_ex_serviceman: false,
  domicile_state_code: 'TS',
  annual_family_income: 200_000,
  education: [edu('12th', 'Intermediate', 'MPC')],
};
/** SC male, 35, PG, AP, ₹1.5L */
const C: EligibilityProfile = {
  date_of_birth: '1991-05-20',
  gender: 'male',
  category: 'SC',
  is_pwbd: false,
  is_ex_serviceman: false,
  domicile_state_code: 'AP',
  annual_family_income: 150_000,
  education: [edu('12th', 'Intermediate', 'MPC'), edu('graduate', 'B.Sc', 'Physics'), edu('post_graduate', 'M.Sc', 'Physics')],
};

const check = (p: EligibilityProfile, r: EligibilityRules, today = TODAY) =>
  checkEligibility(p, [{ post: null, rules: r }], today);
const rule = (p: EligibilityProfile, r: EligibilityRules, name: string) =>
  check(p, r).rules.find((x) => x.rule === name);

describe('3 profiles × 5 jobs', () => {
  const expected: [string, EligibilityProfile, keyof typeof JOBS, EligibilityStatus][] = [
    ['A', A, 'appsc_group2', 'eligible'],
    ['A', A, 'ssc_cgl', 'eligible'],
    ['A', A, 'nsp', 'not_eligible'], // GEN + income above limit
    ['A', A, 'neet', 'manual_check'], // MPC/CSE, not PCB — free-text stream, so we don't say "no"
    ['A', A, 'ap_police_si', 'eligible'],
    ['B', B, 'appsc_group2', 'not_eligible'], // 12th only, TS domicile
    ['B', B, 'ssc_cgl', 'not_eligible'], // 12th only
    ['B', B, 'nsp', 'eligible'],
    ['B', B, 'neet', 'not_eligible'], // 28 > 25
    ['B', B, 'ap_police_si', 'not_eligible'],
    ['C', C, 'appsc_group2', 'eligible'], // 35 = 30 + SC 5, exactly on the limit
    ['C', C, 'ssc_cgl', 'eligible'], // 35 ≤ 32 + SC 5
    ['C', C, 'nsp', 'eligible'],
    ['C', C, 'neet', 'not_eligible'],
    ['C', C, 'ap_police_si', 'not_eligible'], // 35 > 28 + 5
  ];
  it.each(expected)('profile %s · %s → %s', (_, p, job, status) => {
    expect(check(p, JOBS[job]).status).toBe(status);
  });

  it('gives a reason for every rule it checks', () => {
    const r = check(B, JOBS.appsc_group2);
    expect(r.rules.map((x) => [x.rule, x.status])).toEqual([
      ['age', 'pass'],
      ['qualification', 'fail'],
      ['domicile', 'fail'],
    ]);
    expect(r.rules[0].reason).toBe('Age 28 on 1 Jul 2026 — limit 18–35 (30 + OBC 5)');
    expect(r.rules[1].reason).toBe('Your highest is Intermediate — needs Graduate');
    expect(r.rules[2].reason).toBe('Only for domicile of AP — yours is TS');
  });

  it('explains passes too', () => {
    expect(rule(A, JOBS.appsc_group2, 'qualification')?.reason).toBe('B.Tech ≥ Graduate');
    expect(rule(B, JOBS.nsp, 'income')?.reason).toBe('₹2,00,000 ≤ ₹2,50,000');
  });
});

describe('age', () => {
  const r = rules({ age_min: 18, age_max: 30, age_as_on_date: '2026-07-01' });
  const born = (dob: string): EligibilityProfile => ({ ...A, date_of_birth: dob });

  it('is exactly on the upper limit → pass (turns 31 the next day)', () => {
    expect(check(born('1995-07-02'), r).status).toBe('eligible');
  });
  it('is one day over the upper limit → fail (31st birthday on the cut-off)', () => {
    expect(check(born('1995-07-01'), r).status).toBe('not_eligible');
  });
  it('turns 18 on the cut-off → pass; one day later → fail', () => {
    expect(check(born('2008-07-01'), r).status).toBe('eligible');
    expect(check(born('2008-07-02'), r).status).toBe('not_eligible');
  });
  it('uses age_as_on_date, not today', () => {
    // 31 today, but 30 on 1 Jul 2026
    expect(ageOn('1995-08-01', TODAY)).toBe(31);
    expect(check(born('1995-08-01'), r).status).toBe('eligible');
  });
  it('falls back to today when there is no cut-off date', () => {
    expect(check(born('1995-08-01'), { ...r, age_as_on_date: null }).status).toBe('not_eligible');
  });
  it('handles a 29 Feb birthday', () => {
    expect(ageOn('2004-02-29', '2022-02-28')).toBe(17);
    expect(ageOn('2004-02-29', '2022-03-01')).toBe(18);
  });
});

describe('category relaxation', () => {
  const r = rules({
    age_max: 30,
    age_as_on_date: '2026-07-01',
    age_relaxations: [
      { category: 'OBC', years: 3 },
      { category: 'SC', years: 5 },
      { category: 'PWBD', years: 10 },
      { category: 'EXS', years: 3 },
      { gender: 'female', years: 5 },
    ],
  });
  const aged = (age: number, p: Partial<EligibilityProfile>): EligibilityProfile => ({
    ...A,
    date_of_birth: `${2026 - age - 1}-07-02`, // exactly `age` on 1 Jul 2026, turning age+1 next day
    ...p,
  });

  it('GEN gets none', () => {
    expect(check(aged(31, {}), r).status).toBe('not_eligible');
  });
  it('OBC +3: 33 passes, 34 fails', () => {
    expect(check(aged(33, { category: 'OBC' }), r).status).toBe('eligible');
    expect(rule(aged(33, { category: 'OBC' }), r, 'age')?.reason).toContain('(30 + OBC 3)');
    expect(check(aged(34, { category: 'OBC' }), r).status).toBe('not_eligible');
  });
  it('PwBD adds on top of category: OBC + PWBD = 13', () => {
    const p = aged(43, { category: 'OBC', is_pwbd: true });
    expect(check(p, r).status).toBe('eligible');
    expect(rule(p, r, 'age')?.reason).toContain('(30 + OBC 3 + PWBD 10)');
    expect(check(aged(44, { category: 'OBC', is_pwbd: true }), r).status).toBe('not_eligible');
  });
  it('ex-serviceman +3', () => {
    expect(check(aged(33, { is_ex_serviceman: true }), r).status).toBe('eligible');
  });
  it('takes the bigger of category and gender relaxations, not both', () => {
    // SC female: max(SC 5, female 5) = 5
    expect(check(aged(35, { category: 'SC', gender: 'female' }), r).status).toBe('eligible');
    expect(check(aged(36, { category: 'SC', gender: 'female' }), r).status).not.toBe('eligible');
  });
  it('a free-text condition relaxation → manual check, not a hard fail', () => {
    const withWidow = { ...r, age_relaxations: [...r.age_relaxations, { condition: 'widow / divorced woman', years: 5 }] };
    // female limit is 35; at 36 the widow relaxation might apply — we can't know from a profile
    expect(check(aged(36, { gender: 'female' }), withWidow).status).toBe('manual_check');
    expect(check(aged(41, { gender: 'female' }), withWidow).status).toBe('not_eligible');
  });
});

describe('qualification, stream, final year, marks', () => {
  it('exactly matching level → pass', () => {
    const p = { ...B, education: [edu('graduate', 'B.A.')] };
    expect(rule(p, rules({ qualification_level: 'graduate' }), 'qualification')?.status).toBe('pass');
  });
  it('higher level counts (PhD ≥ Graduate), lower does not (Diploma < Graduate)', () => {
    expect(check({ ...B, education: [edu('phd', 'Ph.D')] }, rules({ qualification_level: 'graduate' })).status).toBe('eligible');
    expect(check({ ...B, education: [edu('diploma', 'Diploma')] }, rules({ qualification_level: 'graduate' })).status).toBe(
      'not_eligible',
    );
  });
  it('streams: synonyms and no false matches', () => {
    const eng = rules({ qualification_level: 'graduate', qualification_streams: ['Engineering'] });
    expect(check({ ...A, education: [edu('graduate', 'B.E.', 'Civil')] }, eng).status).toBe('eligible');
    expect(check({ ...A, education: [edu('graduate', 'B.Ed', null)] }, eng).status).toBe('manual_check');
    const pcb = rules({ qualification_level: '12th', qualification_streams: ['PCB'] });
    expect(check({ ...A, education: [edu('12th', 'Intermediate', 'BiPC')] }, pcb).status).toBe('eligible');
    const any = rules({ qualification_level: 'graduate', qualification_streams: ['Any graduate'] });
    expect(check(A, any).status).toBe('eligible');
  });
  it('stream not in profile → missing', () => {
    const p = { ...A, education: [edu('12th', null, null)] };
    expect(rule(p, JOBS.neet, 'stream')?.status).toBe('missing');
  });
  it('final-year students: allowed / not allowed / not stated', () => {
    const p = { ...B, education: [edu('12th', 'Intermediate', 'MPC'), edu('graduate', 'B.Com', null, { status: 'pursuing' })] };
    const r = rules({ qualification_level: 'graduate' });
    expect(check(p, { ...r, final_year_allowed: true }).status).toBe('eligible');
    expect(check(p, { ...r, final_year_allowed: false }).status).toBe('not_eligible');
    expect(check(p, r).status).toBe('manual_check');
  });
  it('minimum percentage', () => {
    const r = rules({ qualification_level: 'graduate', min_percentage: 60 });
    const at = (score: number, score_type: 'percentage' | 'cgpa') => ({
      ...A,
      education: [edu('graduate', 'B.Tech', null, { score, score_type })],
    });
    expect(check(at(60, 'percentage'), r).status).toBe('eligible');
    expect(check(at(59.99, 'percentage'), r).status).toBe('not_eligible');
    expect(check(at(8.1, 'cgpa'), r).status).toBe('manual_check');
    expect(rule(A, r, 'min_percentage')?.status).toBe('missing');
  });
});

describe('gender, domicile, category, income', () => {
  it('gender rule', () => {
    const r = rules({ gender: 'female' });
    expect(check(B, r).status).toBe('eligible');
    expect(check(A, r).status).toBe('not_eligible');
    expect(check({ ...A, gender: 'prefer_not_to_say' }, r).status).toBe('likely_eligible');
  });
  it('domicile ALL means no restriction', () => {
    expect(check(B, rules({ domicile_states: ['ALL'] })).rules).toEqual([]);
  });
  it('PwBD-only scheme accepts a PwBD candidate of any category', () => {
    expect(check({ ...A, is_pwbd: true }, rules({ categories_allowed: ['PWBD'] })).status).toBe('eligible');
  });
  it('income exactly on the limit passes', () => {
    expect(check({ ...B, annual_family_income: 250_000 }, JOBS.nsp).status).toBe('eligible');
    expect(check({ ...B, annual_family_income: 250_001 }, JOBS.nsp).status).toBe('not_eligible');
  });
});

describe('missing info and overall status', () => {
  const empty: EligibilityProfile = {
    date_of_birth: null,
    gender: null,
    category: null,
    is_pwbd: false,
    is_ex_serviceman: false,
    domicile_state_code: null,
    annual_family_income: null,
    education: [],
  };

  it('an empty profile is "likely eligible" with every gap listed', () => {
    const r = check(empty, JOBS.nsp);
    expect(r.status).toBe('likely_eligible');
    expect(r.rules.map((x) => [x.rule, x.status])).toEqual([
      ['qualification', 'missing'],
      ['category', 'missing'],
      ['income', 'missing'],
    ]);
  });
  it('a fail beats missing info', () => {
    expect(check({ ...empty, domicile_state_code: 'TS' }, JOBS.ap_police_si).status).toBe('not_eligible');
  });
  it('no rules entered → manual check', () => {
    const r = checkEligibility(A, [], TODAY);
    expect(r.status).toBe('manual_check');
    expect(r.rules[0].rule).toBe('rules');
  });
  it('extra conditions keep it at "likely eligible"', () => {
    const r = check(A, { ...JOBS.ssc_cgl, other_conditions: ['Must hold a valid driving licence'] });
    expect(r.status).toBe('likely_eligible');
    expect(r.rules.at(-1)).toMatchObject({ rule: 'other', status: 'manual' });
  });
  it('picks the best post when posts have their own rules', () => {
    const r = checkEligibility(
      C,
      [
        { post: null, rules: rules({ age_max: 27, age_as_on_date: '2026-08-01' }) },
        { post: 'Assistant Audit Officer', rules: rules({ age_max: 30, age_as_on_date: '2026-08-01', age_relaxations: [{ category: 'SC', years: 5 }] }) },
      ],
      TODAY,
    );
    expect(r).toMatchObject({ status: 'eligible', post: 'Assistant Audit Officer' });
  });
});
