import type { EligibilityStatus, OpportunityType, SearchResultType, UpdateKind } from '@applyfields/types';
import { Award, BookOpen, Briefcase, Building, CircleCheck, CircleDashed, CircleHelp, CircleX, Compass, GraduationCap, Landmark, School } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@applyfields/ui';

export const TYPE_META: Record<
  OpportunityType,
  { label: string; plural: string; base: string; icon: ReactNode; tone: 'celadon' | 'tea' | 'teal' | 'sea' }
> = {
  govt_job: { label: 'Government job', plural: 'government jobs', base: '/jobs', icon: <Briefcase />, tone: 'teal' },
  exam: { label: 'Exam', plural: 'exams', base: '/exams', icon: <GraduationCap />, tone: 'sea' },
  scholarship: { label: 'Scholarship', plural: 'scholarships', base: '/scholarships', icon: <Award />, tone: 'celadon' },
  admission: { label: 'Admission', plural: 'admissions', base: '/admissions', icon: <School />, tone: 'tea' },
};

/** Every kind of search result: opportunity types, services, careers, courses, colleges, roadmaps. */
export const RESULT_META: Record<SearchResultType, (typeof TYPE_META)[OpportunityType]> = {
  ...TYPE_META,
  service: { label: 'Government service', plural: 'services', base: '/services', icon: <Landmark />, tone: 'tea' },
  career: { label: 'Career option', plural: 'careers', base: '/career', icon: <Compass />, tone: 'celadon' },
  course: { label: 'Course / Degree', plural: 'courses', base: '/career/courses', icon: <BookOpen />, tone: 'teal' },
  institution: { label: 'College / University', plural: 'colleges', base: '/career/colleges', icon: <Building />, tone: 'sea' },
  roadmap: { label: 'Career Roadmap', plural: 'roadmaps', base: '/career/roadmaps', icon: <Compass />, tone: 'celadon' },
};

/** Marks where the search words start a word: ('SSC Combined…', 'ssc c') → <mark>SSC</mark> <mark>C</mark>ombined… */
export function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu); // same words the API searches for
  if (!words) return text;
  const parts = text.split(new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(${words.join('|')})`, 'giu'));
  return parts.map((p, i) => (i % 2 ? <mark key={i} className="rounded bg-celadon/70 px-0.5 text-teal">{p}</mark> : p));
}

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
  vacancy_revision: 'Vacancy revision',
  syllabus_change: 'Syllabus change',
  postponement: 'Postponed',
  other: 'Update',
};

/** '2026-10-31' → '31 Oct 2026' */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysLeftLabel(days: number | null): string {
  if (days === null) return 'Dates not announced';
  if (days < 0) return days === -1 ? 'Ended yesterday' : `Ended ${-days} days ago`;
  if (days === 0) return 'Closes today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** Deadline traffic light: red = ended, yellow = 5 days or less left, green = more time left. */
export function deadlineLight(days: number | null): { dot: string; label: string } {
  if (days === null) return { dot: 'bg-slate-300', label: 'Dates not announced' };
  if (days < 0) return { dot: 'bg-red-500', label: 'Ended' };
  if (days <= 5) return { dot: 'bg-amber-400', label: 'Ending soon (5 days or less)' };
  return { dot: 'bg-emerald-500', label: 'Open' };
}

export function DeadlineDot({ days }: { days: number | null }) {
  const light = deadlineLight(days);
  return (
    <span
      role="img"
      aria-label={light.label}
      title={light.label}
      className={`inline-block size-2.5 shrink-0 rounded-full ring-2 ring-white ${light.dot}`}
    />
  );
}

/** The light plus the words ("4 days left"), so colour is never the only signal. */
export function DeadlineBadge({ days, className }: { days: number | null; className?: string }) {
  return (
    <Badge tone={urgencyTone(days)} className={className}>
      <DeadlineDot days={days} /> {daysLeftLabel(days)}
    </Badge>
  );
}

/** Key for the three lights, shown above lists. */
export function DeadlineLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-teal/80">
      <span className="inline-flex items-center gap-1.5"><DeadlineDot days={30} /> Open</span>
      <span className="inline-flex items-center gap-1.5"><DeadlineDot days={3} /> Ending in 5 days or less</span>
      <span className="inline-flex items-center gap-1.5"><DeadlineDot days={-1} /> Ended</span>
    </p>
  );
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

export const PAY_MATRIX_7TH_CPC: Record<number, number> = {
  1: 18000,
  2: 19900,
  3: 21700,
  4: 25500,
  5: 29200,
  6: 35400,
  7: 44900,
  8: 47600,
  9: 53100,
  10: 56100,
  11: 67700,
  12: 78800,
  13: 123100,
  14: 144200,
};

export function estimateSalary(payLevel: string | number | null | undefined): {
  basic: number;
  min: number;
  max: number;
  formatted: string;
} | null {
  if (payLevel === null || payLevel === undefined) return null;
  const match = String(payLevel).match(/\d+/);
  if (!match) return null;
  const level = parseInt(match[0], 10);
  const basic = PAY_MATRIX_7TH_CPC[level];
  if (!basic) return null;

  // Approx in-hand: Z-city ~1.47x to X-city ~1.64x (after DA + HRA + TA minus NPS)
  const min = Math.round((basic * 1.47) / 500) * 500;
  const max = Math.round((basic * 1.64) / 500) * 500;

  return {
    basic,
    min,
    max,
    formatted: `~₹${min.toLocaleString('en-IN')}–₹${max.toLocaleString('en-IN')}/month`,
  };
}

