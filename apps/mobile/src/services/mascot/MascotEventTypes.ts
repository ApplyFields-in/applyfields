/**
 * The mascot launcher icon: which faces exist, what the app tells it, and what
 * it remembers between launches. Type-only imports elsewhere keep the rules in
 * MascotActivityTracker runnable in plain Node (scripts/mascot-rules.test.mjs).
 */

/**
 * 'logo' is the primary app icon (the brand mark, shown right after install);
 * the six mascot faces are alternates registered in app.json.
 */
export const MASCOT_ICONS = [
  'logo',
  'default',
  'sleeping',
  'active',
  'notification',
  'thinking',
  'achievement',
] as const;

export type MascotIcon = (typeof MASCOT_ICONS)[number];

/** Something meaningful the user did or received. `at` is epoch ms and defaults to now. */
export type MascotEvent =
  /** the app was in the foreground for at least MASCOT_CONFIG.minSessionMs */
  | { type: 'session_completed'; at?: number }
  /** a search, a college or programme opened, the "eligible only" filter */
  | { type: 'research'; at?: number }
  /** created_at of the newest unread important alert, or null once they are all read */
  | { type: 'important_notification'; at: number | null }
  /** `key` dedupes it, e.g. 'application:<id>:applied' */
  | { type: 'achievement'; key: string; at?: number };

/** Persisted to the app's document directory as JSON. */
export interface MascotState {
  version: 1;
  /** the user's choice; null = never chosen (Android treats it as on, iOS as off until consent) */
  autoEnabled: boolean | null;
  /** first launch of this install; the logo stays until MASCOT_CONFIG.logoForMs has passed */
  installedAt: number | null;
  lastSessionAt: number | null;
  /** recent research timestamps, oldest first, capped */
  research: number[];
  notificationAt: number | null;
  achievementAt: number | null;
  /** achievement keys already counted, newest last, capped */
  seen: string[];
  /** last successful icon change, automatic or manual */
  lastChangeAt: number | null;
  failures: number;
  lastFailureAt: number | null;
}
