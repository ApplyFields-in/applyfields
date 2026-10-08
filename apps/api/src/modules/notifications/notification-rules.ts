import type {
  MutableNotificationType,
  NotificationType,
  OpportunityType,
  UpdateKind,
} from '@applyfields/types';

export const DEFAULT_REMINDER_DAYS = [7, 3, 1];
export const MAX_REMINDER_DAYS = 30;

export const MUTABLE_TYPES: MutableNotificationType[] = [
  'closing_reminder',
  'admit_card',
  'answer_key',
  'result',
  'correction_window',
  'date_change',
  'saved_item_changed',
];

/**
 * Which "N days before" reminder is due, or null if none yet / the date has passed.
 * Smallest N that is still ≥ days left, so saving a job due in 3 days fires the 3-day reminder
 * once (not the 7-day one too), and a missed tick catches up instead of skipping.
 */
export function reminderBucket(daysLeft: number, days: number[]): number | null {
  if (daysLeft < 0) return null;
  const due = days.filter((n) => n >= daysLeft);
  return due.length ? Math.min(...due) : null;
}

export function reminderKey(itemId: string, event: string, date: string, bucket: number): string {
  return `reminder:${itemId}:${event}:${date}:${bucket}`;
}

export function updateKey(updateId: string): string {
  return `update:${updateId}`;
}

const UPDATE_TYPE: Record<UpdateKind, NotificationType> = {
  admit_card: 'admit_card',
  answer_key: 'answer_key',
  result: 'result',
  correction_window: 'correction_window',
  date_change: 'date_change',
  extension: 'date_change',
  counselling: 'saved_item_changed',
  other: 'saved_item_changed',
};

export const notificationTypeForUpdate = (kind: UpdateKind): NotificationType => UPDATE_TYPE[kind];

/** Muted types are dropped entirely (no in-app, no email). Account and system messages can't be muted. */
export function wantsType(mutedTypes: string[], type: NotificationType): boolean {
  return !(MUTABLE_TYPES as string[]).includes(type) || !mutedTypes.includes(type);
}

/**
 * Email only to a verified address, when the user hasn't switched email off or withdrawn the
 * email_updates consent. Reminders and updates are for items the user saved, so they don't need an
 * opt-in, but an explicit opt-out always wins.
 */
export function emailAllowed(u: {
  email: string | null;
  emailVerified: boolean;
  emailEnabled: boolean;
  emailConsentWithdrawn: boolean;
}): boolean {
  return Boolean(u.email) && u.emailVerified && u.emailEnabled && !u.emailConsentWithdrawn;
}

const WEB_BASE: Record<OpportunityType, string> = {
  govt_job: '/jobs',
  exam: '/exams',
  scholarship: '/scholarships',
  admission: '/admissions',
};

export const opportunityPath = (type: OpportunityType, slug: string) => `${WEB_BASE[type]}/${slug}`;
