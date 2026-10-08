import type { OpportunityType, UpdateKind } from '@applyfields/types';
import { Award, Briefcase, GraduationCap, School } from 'lucide-react';
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

export const DATE_KIND_LABEL: Record<string, string> = {
  notification_date: 'Notification released',
  application_start: 'Application starts',
  application_end: 'Last date to apply',
  fee_last_date: 'Fee payment deadline',
  correction_window: 'Correction window',
  admit_card: 'Admit card release',
  exam_date: 'Examination date',
  answer_key: 'Answer key release',
  result: 'Result declaration',
  interview: 'Interview date',
  counselling: 'Counselling begins',
  other: 'Important date',
};

export const STATE_NAMES: Record<string, string> = {
  AP: 'Andhra Pradesh',
  TS: 'Telangana',
  KA: 'Karnataka',
  TN: 'Tamil Nadu',
  MH: 'Maharashtra',
  KL: 'Kerala',
  DL: 'Delhi',
  UP: 'Uttar Pradesh',
  WB: 'West Bengal',
  GJ: 'Gujarat',
  RJ: 'Rajasthan',
  MP: 'Madhya Pradesh',
  BR: 'Bihar',
  PB: 'Punjab',
  HR: 'Haryana',
  OD: 'Odisha',
  AS: 'Assam',
  JH: 'Jharkhand',
  ALL: 'All India',
};

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return `₹${amount.toLocaleString('en-IN')}`;
}
