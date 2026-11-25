import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { checkEligibility, type EligibilityRules } from './check-eligibility.js';
import { EligibilityService } from './eligibility.service.js';

/* The Eligibility Check form sends what the visitor typed; it must be checked by the real rules. */
const SSC_CGL: EligibilityRules = {
  age_min: 18,
  age_max: 32,
  age_as_on_date: '2026-08-01',
  age_relaxations: [{ category: 'OBC', years: 3 }],
  qualification_level: 'graduate',
  qualification_streams: [],
  min_percentage: null,
  final_year_allowed: null,
  gender: 'any',
  domicile_states: [],
  categories_allowed: [],
  income_max: null,
  other_conditions: [],
};
const check = (social: string) =>
  checkEligibility(
    EligibilityService.fromCriteria({ dob: '1990-06-01', social, edu: 'graduate' })!,
    [{ post: null, rules: SSC_CGL }],
    '2026-11-20',
  ).status;

describe('EligibilityService.fromCriteria', () => {
  it('no criteria → null (guests without input get no badges)', () => {
    expect(EligibilityService.fromCriteria({})).toBeNull();
  });

  it('age 36 on the cut-off: fails a 32 limit even with OBC +3 years', () => {
    expect(check('GEN')).toBe('not_eligible');
    expect(check('OBC')).toBe('not_eligible');
  });

  it('age 33 passes only with the OBC relaxation', () => {
    const at = (social: string) =>
      checkEligibility(
        EligibilityService.fromCriteria({ dob: '1993-06-01', social, edu: 'graduate' })!,
        [{ post: null, rules: SSC_CGL }],
        '2026-11-20',
      ).status;
    expect(at('GEN')).toBe('not_eligible');
    expect(at('OBC')).not.toBe('not_eligible');
  });

  it('rejects bad values instead of guessing', () => {
    expect(() => EligibilityService.fromCriteria({ dob: '01/01/2000' })).toThrow(BadRequestException);
    expect(() => EligibilityService.fromCriteria({ social: 'GENERAL' })).toThrow(BadRequestException);
    expect(() => EligibilityService.fromCriteria({ edu: 'bachelors' })).toThrow(BadRequestException);
    expect(() => EligibilityService.fromCriteria({ domicile: 'Andhra' })).toThrow(BadRequestException);
  });
});
