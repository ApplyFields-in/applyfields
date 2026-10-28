import type {
  AgeRelaxation,
  EligibilityResult,
  EligibilityRuleResult,
  EligibilityStatus,
  ReviewEligibility,
  UserEducation,
  UserProfile,
} from '@applyfields/types';

/* Pure: no DB, no clock. Same input → same answer, so every rule is unit-testable. */

export type EligibilityRules = Omit<ReviewEligibility, 'id' | 'post_id' | 'official_text'>;

export type EligibilityProfile = Pick<
  UserProfile,
  | 'date_of_birth'
  | 'gender'
  | 'category'
  | 'is_pwbd'
  | 'is_ex_serviceman'
  | 'domicile_state_code'
  | 'annual_family_income'
> & {
  education: Pick<UserEducation, 'level' | 'degree' | 'stream' | 'status' | 'score' | 'score_type'>[];
};

export interface RuleSet {
  /** null = the rules for the whole notification */
  post: string | null;
  rules: EligibilityRules;
}

// ponytail: linear ladder as agreed (ITI/Diploma above 12th); notifications that accept "12th or equivalent" need manual care
const LEVELS = ['10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd'] as const;
const LEVEL_LABEL: Record<string, string> = {
  '10th': '10th',
  '12th': '12th',
  iti: 'ITI',
  diploma: 'Diploma',
  graduate: 'Graduate',
  post_graduate: 'Post-graduate',
  phd: 'PhD',
};
const rank = (level: string | null | undefined) => (level ? LEVELS.indexOf(level as (typeof LEVELS)[number]) : -1);

/** Free-text streams from notifications → words a degree/stream may contain. */
const STREAM_ALIASES: Record<string, string[]> = {
  engineering: ['engineering', 'btech', 'be', 'mtech', 'beng'],
  pcb: ['pcb', 'bipc', 'biology', 'bio'],
  mpc: ['mpc', 'maths', 'mathematics'],
  science: ['science', 'bsc', 'msc', 'mpc', 'bipc', 'pcb'],
  commerce: ['commerce', 'bcom', 'mcom', 'cec', 'mec'],
  arts: ['arts', 'ba', 'ma', 'hec'],
  law: ['law', 'llb', 'llm'],
};

const ORDER: EligibilityStatus[] = ['eligible', 'likely_eligible', 'manual_check', 'not_eligible'];

/** Completed years on a date. Both YYYY-MM-DD. */
export function ageOn(dob: string, on: string): number {
  const [by, bm, bd] = dob.split('-').map(Number);
  const [y, m, d] = on.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

const day = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const norm = (s: string) => s.toLowerCase().replace(/\./g, '');

function streamMatches(required: string, userText: string): boolean {
  const key = norm(required).replace(/[^a-z0-9]/g, '');
  const tokens = new Set(norm(userText).split(/[^a-z0-9]+/).filter(Boolean));
  const joined = [...tokens].join('');
  return (STREAM_ALIASES[key] ?? [key]).some((a) => tokens.has(a) || (a.length >= 4 && joined.includes(a)));
}

/** Years of relaxation this person gets. Conditional ones (free text) can't be verified from a profile. */
function relaxation(p: EligibilityProfile, list: AgeRelaxation[]) {
  let cat = 0;
  let catLabel = '';
  const parts: string[] = [];
  let extra = 0;
  let conditional = 0;
  for (const r of list) {
    if (r.condition) {
      conditional = Math.max(conditional, r.years);
      continue;
    }
    if (r.gender && r.gender !== 'any' && r.gender !== p.gender) continue;
    if (r.category === 'PWBD' || r.category === 'EXS') {
      if ((r.category === 'PWBD' && p.is_pwbd) || (r.category === 'EXS' && p.is_ex_serviceman)) {
        extra += r.years;
        parts.push(`${r.category} ${r.years}`);
      }
    } else if ((r.category ? r.category === p.category : r.gender) && r.years > cat) {
      cat = r.years;
      catLabel = [r.category, r.gender].filter(Boolean).join(' ');
    }
  }
  if (cat) parts.unshift(`${catLabel} ${cat}`);
  return { years: cat + extra, parts, conditional };
}

function checkRules(p: EligibilityProfile, r: EligibilityRules, today: string): EligibilityRuleResult[] {
  const out: EligibilityRuleResult[] = [];
  const add = (rule: EligibilityRuleResult['rule'], status: EligibilityRuleResult['status'], reason: string) =>
    out.push({ rule, status, reason });

  // age — on the notification's cut-off date, not today
  if (r.age_min != null || r.age_max != null) {
    if (!p.date_of_birth) add('age', 'missing', 'Add your date of birth to check the age limit');
    else {
      const on = r.age_as_on_date ?? today;
      const age = ageOn(p.date_of_birth, on);
      const relax = relaxation(p, r.age_relaxations);
      const max = r.age_max != null ? r.age_max + relax.years : null;
      const how = relax.years ? ` (${r.age_max} + ${relax.parts.join(' + ')})` : '';
      const limit =
        r.age_min != null && max != null ? `${r.age_min}–${max}` : max != null ? `up to ${max}` : `${r.age_min}+`;
      const head = `Age ${age} on ${day(on)}`;
      if (r.age_min != null && age < r.age_min) add('age', 'fail', `${head} — minimum is ${r.age_min}`);
      else if (max != null && age > max) {
        if (age <= max + relax.conditional)
          add('age', 'manual', `${head} — above ${max}, but a special-condition relaxation may apply`);
        else add('age', 'fail', `${head} — above the limit of ${max}${how}`);
      } else add('age', 'pass', `${head} — limit ${limit}${how}`);
    }
  }

  // qualification → stream → final year → minimum marks
  const need = rank(r.qualification_level);
  const checksEducation = need >= 0 || r.qualification_streams.length > 0 || r.min_percentage != null;
  let qualifying: EligibilityProfile['education'] = [];
  if (checksEducation && p.education.length === 0) {
    add('qualification', 'missing', 'Add your education to check the qualification');
  } else if (checksEducation) {
    const atLevel = p.education.filter((e) => rank(e.level) >= need);
    const done = atLevel.filter((e) => e.status === 'completed');
    const studying = atLevel.filter((e) => e.status === 'pursuing');
    const label = (e: EligibilityProfile['education'][number]) => e.degree || LEVEL_LABEL[e.level];
    if (done.length) {
      qualifying = done;
      if (need >= 0) {
        const best = done.reduce((a, b) => (rank(b.level) > rank(a.level) ? b : a));
        add('qualification', 'pass', `${label(best)} ≥ ${LEVEL_LABEL[r.qualification_level!]}`);
      }
    } else if (studying.length) {
      const what = label(studying[0]);
      if (r.final_year_allowed === true) {
        qualifying = studying;
        add('final_year', 'pass', `You're pursuing ${what} — final-year students can apply`);
      } else if (r.final_year_allowed === false)
        add('final_year', 'fail', `${LEVEL_LABEL[r.qualification_level!] ?? 'The qualification'} must be completed — you're still pursuing ${what}`);
      else {
        qualifying = studying;
        add('final_year', 'manual', `You're still pursuing ${what} — check if final-year students can apply`);
      }
    } else {
      const top = p.education.reduce((a, b) => (rank(b.level) > rank(a.level) ? b : a));
      add('qualification', 'fail', `Your highest is ${label(top)} — needs ${LEVEL_LABEL[r.qualification_level!]}`);
    }

    if (r.qualification_streams.length && qualifying.length) {
      const required = r.qualification_streams;
      const texts = qualifying.map((e) => [e.degree, e.stream].filter(Boolean).join(' ')).filter(Boolean);
      if (required.some((s) => /\bany\b/i.test(s))) add('stream', 'pass', `Any stream accepted`);
      else if (!texts.length) add('stream', 'missing', `Add your degree/stream — needs ${required.join(', ')}`);
      else {
        const hit = texts.find((t) => required.some((s) => streamMatches(s, t)));
        if (hit) add('stream', 'pass', `${hit} matches ${required.join(' / ')}`);
        else add('stream', 'manual', `Needs ${required.join(' / ')} — check if ${texts[0]} is accepted`);
      }
    }

    if (r.min_percentage != null && qualifying.length) {
      const scored = qualifying.filter((e) => e.score != null);
      const pct = scored.filter((e) => e.score_type === 'percentage');
      if (!scored.length) add('min_percentage', 'missing', `Add your marks — minimum ${r.min_percentage}% needed`);
      else if (pct.some((e) => e.score! >= r.min_percentage!))
        add('min_percentage', 'pass', `${Math.max(...pct.map((e) => e.score!))}% ≥ ${r.min_percentage}%`);
      else if (pct.length) add('min_percentage', 'fail', `${Math.max(...pct.map((e) => e.score!))}% — minimum is ${r.min_percentage}%`);
      else add('min_percentage', 'manual', `Needs ${r.min_percentage}% — CGPA conversion differs, check the notification`);
    }
  }

  if (r.gender !== 'any') {
    if (!p.gender || p.gender === 'prefer_not_to_say') add('gender', 'missing', `Only for ${r.gender} candidates — add your gender`);
    else if (p.gender === r.gender) add('gender', 'pass', `Open to ${r.gender} candidates`);
    else add('gender', 'fail', `Only for ${r.gender} candidates`);
  }

  const states = r.domicile_states.filter((s) => s !== 'ALL');
  if (states.length) {
    if (!p.domicile_state_code) add('domicile', 'missing', `Only for domicile of ${states.join(', ')} — add your domicile state`);
    else if (states.includes(p.domicile_state_code)) add('domicile', 'pass', `Domicile ${p.domicile_state_code}`);
    else add('domicile', 'fail', `Only for domicile of ${states.join(', ')} — yours is ${p.domicile_state_code}`);
  }

  if (r.categories_allowed.length) {
    const allowed = r.categories_allowed;
    if (!p.category) add('category', 'missing', `Only for ${allowed.join(', ')} — add your category`);
    else if (
      allowed.includes(p.category) ||
      (p.is_pwbd && allowed.includes('PWBD')) ||
      (p.is_ex_serviceman && allowed.includes('EXS'))
    )
      add('category', 'pass', `${p.category} is allowed`);
    else add('category', 'fail', `Only for ${allowed.join(', ')} — you're ${p.category}`);
  }

  if (r.income_max != null) {
    const inc = p.annual_family_income;
    if (inc == null) add('income', 'missing', `Family income limit ${rupees(r.income_max)} — add your income`);
    else if (inc <= r.income_max) add('income', 'pass', `${rupees(inc)} ≤ ${rupees(r.income_max)}`);
    else add('income', 'fail', `${rupees(inc)} is above the limit of ${rupees(r.income_max)}`);
  }

  if (r.other_conditions.length) add('other', 'manual', `Also required: ${r.other_conditions.join('; ')}`);
  return out;
}

function overall(rules: EligibilityRuleResult[]): EligibilityStatus {
  const core = rules.filter((r) => r.rule !== 'other');
  if (core.some((r) => r.status === 'fail')) return 'not_eligible';
  if (core.some((r) => r.status === 'manual')) return 'manual_check';
  // conditions we can't check from a profile never make it a firm "eligible"
  if (core.some((r) => r.status === 'missing') || rules.length > core.length) return 'likely_eligible';
  return 'eligible';
}

/**
 * Computes a 0–100 match score based on verifiable rules.
 * Score = (rules with status 'pass') / (total scorable rules) * 100.
 * Excludes 'other' (free-text conditions) and the placeholder 'rules' rule.
 * Returns null when there are no scorable rules.
 */
function matchScore(rules: EligibilityRuleResult[]): number | null {
  const scorable = rules.filter((r) => r.rule !== 'other' && r.rule !== 'rules');
  if (scorable.length === 0) return null;
  const passed = scorable.filter((r) => r.status === 'pass').length;
  return Math.round((passed / scorable.length) * 100);
}

/**
 * Checks a profile against an opportunity's rule sets (the whole notification, plus posts with their own rules)
 * and returns the best match. `today` is YYYY-MM-DD in India time.
 */
export function checkEligibility(profile: EligibilityProfile, sets: RuleSet[], today: string): EligibilityResult {
  if (sets.length === 0)
    return {
      status: 'manual_check',
      rules: [{ rule: 'rules', status: 'manual', reason: 'Eligibility not added yet — check the official notification' }],
      post: null,
      match_score: null,
    };
  return sets
    .map((s) => {
      const rules = checkRules(profile, s.rules, today);
      return { status: overall(rules), rules, post: s.post, match_score: matchScore(rules) };
    })
    .reduce((best, x) => (ORDER.indexOf(x.status) < ORDER.indexOf(best.status) ? x : best));
}
