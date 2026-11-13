/**
 * The launcher icon follows the mascot: sleeping, thinking, a bell for a deadline…
 *
 * Native side: expo-awesome-app-icon. iOS uses Apple's alternate-icon API, which
 * always shows a system alert and only works while the app is on screen, so
 * automatic changes there are opt-in and at most once a day. Android swaps
 * launcher aliases; every change is deferred until the app is in the background
 * so the launcher never closes the running app. Neither exists in Expo Go or on
 * the web: there every call is a no-op and the settings card hides itself.
 *
 * When it changes: Android evaluates when the app goes to the background and from
 * a periodic background task (that is the only way "sleeping" can ever appear);
 * iOS evaluates when the app comes back to the foreground.
 */
import type { ApplicationTrackerItem, NotificationItem, NotificationList } from '@applyfields/types';
import { requireOptionalNativeModule } from 'expo';
import * as BackgroundTask from 'expo-background-task';
import { File, Paths } from 'expo-file-system';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { api, getToken } from '@/lib/api';

import { canAutoChange, initialMascotState, pickIcon, recordEvent } from './MascotActivityTracker';
import {
  ACHIEVEMENT_STATUSES,
  IMPORTANT_NOTIFICATION_TYPES,
  MASCOT_CONFIG as CFG,
} from './MascotConfig';
import { MASCOT_ICONS, type MascotEvent, type MascotIcon, type MascotState } from './MascotEventTypes';

type IconApi = typeof import('expo-awesome-app-icon');

// The package calls requireNativeModule on import, which throws where it isn't built in.
const native: IconApi | null = requireOptionalNativeModule('AwesomeAppIcon')
  ? (require('expo-awesome-app-icon') as IconApi)
  : null;

const TASK = 'applyfields-mascot-icon';
const MIN_INTERVAL = CFG.minChangeIntervalMs[Platform.OS === 'ios' ? 'ios' : 'android'];

// ---------- persisted state (same JSON-in-document-dir approach as lib/offline.ts) ----------

const file = new File(Paths.document, 'mascot-icon.json');

function load(): MascotState {
  try {
    if (!file.exists) return initialMascotState();
    const saved = JSON.parse(file.textSync()) as Partial<MascotState>;
    return saved.version === 1 ? { ...initialMascotState(), ...saved } : initialMascotState();
  } catch {
    return initialMascotState(); // unreadable file: start over rather than crash on launch
  }
}

let state = load();
const listeners = new Set<() => void>();

function save(next: MascotState): void {
  if (next === state) return;
  state = next;
  try {
    file.writeSync(JSON.stringify(next));
  } catch {
    // Disk full or similar: keep going in memory; the next write retries.
  }
  for (const l of listeners) l();
}

// First launch starts the logo period (CFG.logoForMs) before the mascot appears.
if (state.installedAt === null) save({ ...state, installedAt: Date.now() });

// ---------- the native icon ----------

export function isMascotIconSupported(): boolean {
  try {
    return !!native?.supportsAlternateIcons();
  } catch {
    return false;
  }
}

/** 'logo' (the primary icon) plus every alternate this build actually registered. */
export function getAvailableIcons(): MascotIcon[] {
  if (!isMascotIconSupported()) return ['logo'];
  const registered = new Set(native!.getAvailableIcons());
  return MASCOT_ICONS.filter((icon) => icon === 'logo' || registered.has(icon));
}

/** What the user will see on the home screen, including an Android change queued for background. */
export function getCurrentIcon(): MascotIcon {
  if (!isMascotIconSupported()) return 'logo';
  try {
    const selected = native!.getAppIconState().selected;
    return MASCOT_ICONS.find((icon) => icon !== 'logo' && icon === selected) ?? 'logo';
  } catch {
    return 'logo';
  }
}

/** Manual or automatic change. Resolves false when it did not happen. */
export async function setMascotIcon(icon: MascotIcon): Promise<boolean> {
  if (!isMascotIconSupported()) {
    return handleIconChangeFailure(new Error('Alternate app icons are not available in this build.'));
  }
  if (!getAvailableIcons().includes(icon)) {
    return handleIconChangeFailure(new Error(`The "${icon}" icon is not registered in this build.`));
  }
  if (icon === getCurrentIcon()) return true;
  // iOS rejects the change unless the app is on screen; try again on the next foreground.
  if (Platform.OS === 'ios' && AppState.currentState !== 'active') return false;
  try {
    await native!.setAppIcon(icon === 'logo' ? null : icon, { deferUntilBackground: true });
  } catch (err) {
    return handleIconChangeFailure(err);
  }
  save({ ...state, lastChangeAt: Date.now(), failures: 0, lastFailureAt: null });
  return true;
}

export function resetMascotIcon(): Promise<boolean> {
  return setMascotIcon('logo');
}

/** Counts the failure so automatic changes back off (CFG.failureRetryMs). Always false. */
export function handleIconChangeFailure(err: unknown): false {
  console.warn('[mascot-icon]', err instanceof Error ? err.message : err);
  save({ ...state, failures: state.failures + 1, lastFailureAt: Date.now() });
  return false;
}

// ---------- automatic switching ----------

export function isAutoEnabled(): boolean {
  return state.autoEnabled ?? Platform.OS === 'android';
}

export function setAutoEnabled(on: boolean): void {
  save({ ...state, autoEnabled: on });
  void syncBackgroundTask();
}

export function recordMascotEvent(event: MascotEvent): void {
  save(recordEvent(state, event, Date.now(), CFG));
}

/** Apply the face the rules pick, if automatic changes are on and the rate limit allows it. */
export async function evaluateUserActivity(now = Date.now()): Promise<MascotIcon | null> {
  if (!isAutoEnabled() || !isMascotIconSupported()) return null;
  const target = pickIcon(state, now, CFG);
  if (!canAutoChange(state, getCurrentIcon(), target, now, MIN_INTERVAL, CFG)) return null;
  return (await setMascotIcon(target)) ? target : null;
}

// ---------- signals from the existing API ----------

/** Fed by the same GET /notifications the tab badge and Alerts screen already make. */
export function noteNotifications(items: NotificationItem[]): void {
  let newest: number | null = null;
  for (const n of items) {
    if (!n.read && IMPORTANT_NOTIFICATION_TYPES.has(n.type)) {
      newest = Math.max(newest ?? 0, Date.parse(n.created_at));
    }
  }
  recordMascotEvent({ type: 'important_notification', at: newest });
}

/** Applications the user marked applied/selected/completed on the tracker. */
async function syncAchievements(): Promise<void> {
  const res = await api.get<ApplicationTrackerItem[]>('/applications');
  for (const a of res.data ?? []) {
    if (ACHIEVEMENT_STATUSES.has(a.status)) {
      recordMascotEvent({
        type: 'achievement',
        key: `application:${a.id}:${a.status}`,
        at: Date.parse(a.updated_at),
      });
    }
  }
}

// ---------- Android background task ----------

// Defined at load (index.ts imports this file first) because a headless run never renders a screen.
if (Platform.OS === 'android' && native) {
  TaskManager.defineTask(TASK, async () => {
    try {
      if (await getToken()) {
        const res = await api.get<NotificationList>('/notifications');
        if (res.data) noteNotifications(res.data.items);
        await syncAchievements();
      }
      await evaluateUserActivity();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function syncBackgroundTask(): Promise<void> {
  if (Platform.OS !== 'android' || !native) return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(TASK);
    if (isAutoEnabled() && !registered) {
      await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: CFG.backgroundIntervalMinutes });
    } else if (!isAutoEnabled() && registered) {
      await BackgroundTask.unregisterTaskAsync(TASK);
    }
  } catch (err) {
    console.warn('[mascot-icon] background task', err);
  }
}

// ---------- app lifecycle ----------

let foregroundSince = Date.now();
let lastSync = 0;

/**
 * Mount once, in the tabs layout. `refreshAlerts` is lib/unread's refreshUnread, reused
 * on resume so no second /notifications poller exists (and unread.ts can import this file).
 */
export function useMascotIcon(
  signedIn: boolean,
  refreshAlerts: (signedIn: boolean) => Promise<void>,
): void {
  useEffect(() => {
    void syncBackgroundTask();
  }, []);

  useEffect(() => {
    if (signedIn) void syncAchievements();
  }, [signedIn]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const now = Date.now();
      if (next === 'active') {
        foregroundSince = now;
        if (signedIn && now - lastSync >= CFG.remoteSyncMs) {
          lastSync = now;
          void refreshAlerts(signedIn);
          void syncAchievements();
        }
        if (Platform.OS === 'ios') void evaluateUserActivity();
      } else if (next === 'background') {
        if (now - foregroundSince >= CFG.minSessionMs) recordMascotEvent({ type: 'session_completed' });
        // Android: queued now, applied by native code once the app is fully backgrounded.
        if (Platform.OS === 'android') void evaluateUserActivity();
      }
    });
    return () => sub.remove();
  }, [signedIn, refreshAlerts]);
}

/** For the settings card: re-renders when the mascot state changes. */
export function useMascotSettings(): { autoEnabled: boolean; current: MascotIcon } {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
  return { autoEnabled: isAutoEnabled(), current: getCurrentIcon() };
}
