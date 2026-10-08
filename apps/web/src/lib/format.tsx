import type { EligibilityStatus, OpportunityType, UpdateKind } from '@applyfields/types';
import { Award, Briefcase, CircleCheck, CircleDashed, CircleHelp, CircleX, GraduationCap, School } from 'lucide-react';
import type { ReactNode } from 'react';

export const TYPE_META: Record<
  OpportunityType,
  { label: string; plural: string; base: string; icon: ReactNode; tone: 'celadon' | 'tea' | 'teal' | 'sea' }
> = {
  govt_job: { label: 'Government job', plural: 'government jobs', base: '/jobs', icon: <Briefcase />, tone: 'teal' },
  exam: { label: 'Exam', plural: 'exams', base: '/exams', icon: <GraduationCap />, tone: 'sea' },
  scholarship: { label: 'Scholarship', plural: 'scholarships', base: '/scholarships', icon: <Award />, tone: 'celadon' },
  admission: { label: 'Admission', plural: 'admissions', base: '/admissions', icon: <School />, tone: 'tea' },
};

export const ELIGIBILITY_META: Record<
  EligibilityStatus,
  { label: string; icon: ReactNode; tone: 'teal' | 'celadon' | 'tea' | 'outline' }
> = {
  eligible: { label: 'Eligible', icon: <CircleCheck />, tone: 'teal' },
  likely_eligible: { label: 'Likely eligible', icon: <CircleDashed />, tone: 'celadon' },
  not_eligible: { label: 'Not eligible', icon: <CircleX />, tone: 'outline' },
  manual_check: { label: 'Check notification', icon: <CircleHelp />, tone: 'tea' },
};

export const UPDATE_LABEL: Record<UpdateKind, string> = {
  admit_card: 'Admit card',
  answer_key: 'Answer key',
  result: 'Result',
  correction_window: 'Correction window',
  date_change: 'Date change',
  extension: 'Extended',
  counselling: 'Counselling',
  other: 'Update',
};

/** '2026-10-31' → '31 Oct 2026' */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysLeftLabel(days: number | null): string {
  if (days === null) return 'Dates not announced';
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function urgencyTone(days: number | null): 'teal' | 'celadon' | 'tea' {
  if (days !== null && days <= 3) return 'teal';
  if (days !== null && days <= 7) return 'celadon';
  return 'tea';
}
