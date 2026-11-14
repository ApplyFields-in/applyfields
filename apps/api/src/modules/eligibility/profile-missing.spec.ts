import { describe, expect, it } from 'vitest';
import { EligibilityService } from './eligibility.service.js';

const empty = {
  date_of_birth: null,
  gender: null,
  category: null,
  is_pwbd: false,
  is_ex_serviceman: false,
  domicile_state_code: null,
  annual_family_income: null,
  education: [],
} as any;

describe('EligibilityService.missing', () => {
  it('lists every empty field the rules read', () => {
    expect(EligibilityService.missing(empty)).toEqual([
      'date_of_birth',
      'education',
      'gender',
      'category',
      'domicile_state_code',
    ]);
  });

  it('can be ready yet still missing state and category', () => {
    const p = { ...empty, date_of_birth: '2000-01-01', gender: 'female', education: [{ level: 'graduate' }] };
    expect(EligibilityService.ready(p)).toBe(true);
    expect(EligibilityService.missing(p)).toEqual(['category', 'domicile_state_code']);
  });
});
