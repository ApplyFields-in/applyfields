import type { EligibilityStatus, OpportunityType } from '@applyfields/types';

import { C } from '../theme';

const DATE = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** 'YYYY-MM-DD' or ISO → '14 Mar 2026'. Empty string for null. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : DATE.format(d);
}

/** Human deadline label plus the colour it should be shown in. */
export function deadline(daysLeft: number | null | undefined): {
  label: string;
  color: string;
} {
  if (daysLeft === null || daysLeft === undefined) return { label: 'No last date', color: C.muted };
  if (daysLeft < 0) return { label: 'Closed', color: C.bad };
  if (daysLeft === 0) return { label: 'Last day today', color: C.bad };
  if (daysLeft === 1) return { label: '1 day left', color: C.bad };
  if (daysLeft <= 7) return { label: `${daysLeft} days left`, color: C.warn };
  return { label: `${daysLeft} days left`, color: C.good };
}

export const ELIGIBILITY: Record<EligibilityStatus, { label: string; color: string }> = {
  eligible: { label: 'Eligible', color: C.good },
  likely_eligible: { label: 'Likely eligible', color: C.good },
  not_eligible: { label: 'Not eligible', color: C.bad },
  manual_check: { label: 'Check the rules', color: C.warn },
};

export const TYPE_LABEL: Record<OpportunityType, string> = {
  govt_job: 'Government job',
  exam: 'Exam',
  scholarship: 'Scholarship',
  admission: 'Admission',
};

/** ₹45,000 */
export function rupees(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return `₹${amount.toLocaleString('en-IN')}`;
}
