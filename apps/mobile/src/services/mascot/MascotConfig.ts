/** Every timing and threshold the mascot icon uses. Change behaviour here, not in the rules. */
import type { ApplicationTrackerStatus, NotificationType } from '@applyfields/types';

import type { MascotIcon } from './MascotEventTypes';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const MASCOT_CONFIG = {
  /** after install the launcher shows the ApplyFields logo this long, then the mascot takes over */
  logoForMs: 6 * HOUR,
  /** no completed session for this long → sleeping */
  sleepingAfterMs: 7 * DAY,
  /** a completed session within this window → active */
  activeWindowMs: 3 * DAY,
  /** thinkingMinEvents research events inside this window → thinking */
  thinkingWindowMs: DAY,
  thinkingMinEvents: 3,
  /** research events closer together than this count once (typing, scrolling results) */
  researchDedupeMs: MINUTE,
  /** an unread important alert stops showing the bell after this long */
  notificationTtlMs: 2 * DAY,
  /** how long the achievement face stays after the milestone */
  achievementTtlMs: 3 * DAY,
  /** shorter foreground visits don't count as a session */
  minSessionMs: 30_000,
  /**
   * minimum gap between automatic changes. iOS is longer: every change shows a system alert.
   * urgentIcons skip it.
   */
  minChangeIntervalMs: { android: HOUR, ios: DAY },
  /** faces that switch at the next chance, ignoring minChangeIntervalMs */
  urgentIcons: ['notification', 'achievement'] as readonly MascotIcon[],
  /** after a failed change, automatic changes pause this long */
  failureRetryMs: DAY,
  /** on resume, re-read alerts and the application tracker at most this often */
  remoteSyncMs: HOUR,
  /** Android background check (WorkManager); the OS may run it later than this */
  backgroundIntervalMinutes: 60,
  maxResearch: 20,
  maxSeen: 200,
} as const;

export type MascotConfig = typeof MASCOT_CONFIG;

/** Alerts that mean "act on something": deadlines, admit cards, changed dates, results. */
export const IMPORTANT_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set<NotificationType>([
  'closing_reminder',
  'admit_card',
  'date_change',
  'correction_window',
  'result',
  'saved_item_changed',
  'document_expiry',
]);

/** Application-tracker statuses that earn the achievement face. */
export const ACHIEVEMENT_STATUSES: ReadonlySet<ApplicationTrackerStatus> = new Set<ApplicationTrackerStatus>([
  'applied',
  'selected',
  'completed',
]);
