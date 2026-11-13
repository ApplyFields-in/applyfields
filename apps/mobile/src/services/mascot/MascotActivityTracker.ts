/**
 * The mascot's rules, with no I/O: fold events into state, then pick the face.
 * IconManager owns storage and the native icon; this file only decides.
 * Checked by scripts/mascot-rules.test.mjs, so keep imports type-only.
 */
import type { MascotConfig } from './MascotConfig';
import type { MascotEvent, MascotIcon, MascotState } from './MascotEventTypes';

export function initialMascotState(): MascotState {
  return {
    version: 1,
    autoEnabled: null,
    installedAt: null,
    lastSessionAt: null,
    research: [],
    notificationAt: null,
    achievementAt: null,
    seen: [],
    lastChangeAt: null,
    failures: 0,
    lastFailureAt: null,
  };
}

/** Returns the same object when nothing changed, so callers can skip the write. */
export function recordEvent(s: MascotState, e: MascotEvent, now: number, cfg: MascotConfig): MascotState {
  switch (e.type) {
    case 'session_completed': {
      const at = e.at ?? now;
      return at > (s.lastSessionAt ?? 0) ? { ...s, lastSessionAt: at } : s;
    }
    case 'research': {
      const at = e.at ?? now;
      const last = s.research.at(-1);
      if (last !== undefined && at - last < cfg.researchDedupeMs) return s;
      return { ...s, research: [...s.research, at].slice(-cfg.maxResearch) };
    }
    case 'important_notification':
      return e.at === s.notificationAt ? s : { ...s, notificationAt: e.at };
    case 'achievement': {
      if (s.seen.includes(e.key)) return s;
      const at = e.at ?? now;
      return {
        ...s,
        seen: [...s.seen, e.key].slice(-cfg.maxSeen),
        // An old row (applied months ago) is remembered but never shown: it is past the TTL.
        achievementAt: Math.max(s.achievementAt ?? 0, at),
      };
    }
  }
}

/**
 * The logo for the first hours after install, then by priority:
 * notification > achievement > sleeping > thinking > active > default.
 */
export function pickIcon(s: MascotState, now: number, cfg: MascotConfig): MascotIcon {
  const within = (at: number | null, ms: number) => at !== null && now - at < ms;

  if (within(s.installedAt, cfg.logoForMs)) return 'logo';
  if (within(s.notificationAt, cfg.notificationTtlMs)) return 'notification';
  if (within(s.achievementAt, cfg.achievementTtlMs)) return 'achievement';
  if (s.lastSessionAt !== null && now - s.lastSessionAt >= cfg.sleepingAfterMs) return 'sleeping';
  if (s.research.filter((t) => now - t < cfg.thinkingWindowMs).length >= cfg.thinkingMinEvents) {
    return 'thinking';
  }
  if (within(s.lastSessionAt, cfg.activeWindowMs)) return 'active';
  return 'default';
}

/** Whether an automatic switch from `current` to `target` is allowed right now. */
export function canAutoChange(
  s: MascotState,
  current: MascotIcon,
  target: MascotIcon,
  now: number,
  minIntervalMs: number,
  cfg: MascotConfig,
): boolean {
  if (target === current) return false;
  const urgent = cfg.urgentIcons.includes(target);
  if (!urgent && s.lastChangeAt !== null && now - s.lastChangeAt < minIntervalMs) return false;
  if (s.failures > 0 && s.lastFailureAt !== null && now - s.lastFailureAt < cfg.failureRetryMs) {
    return false;
  }
  return true;
}
