/**
 * "Setup finished or skipped" memory for this browser. The value is the user id, so on a shared
 * browser (family phone, CSC / cyber-café PC) one account's answer never counts for the next.
 * ONBOARDED_KEY is also the window event fired when it gets set.
 */
export const ONBOARDED_KEY = 'applyfields-onboarded';

export function currentUserId(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem('currentUser') ?? 'null') as { id?: string } | null;
    return u?.id ?? null;
  } catch {
    return null;
  }
}

/** True when the signed-in user (not just anyone on this browser) finished or skipped setup. */
export function isOnboarded(): boolean {
  const id = currentUserId();
  try {
    return !!id && localStorage.getItem(ONBOARDED_KEY) === id;
  } catch {
    return false;
  }
}

export function markOnboarded(): void {
  const id = currentUserId();
  try {
    if (id) localStorage.setItem(ONBOARDED_KEY, id);
  } catch {
    // storage blocked: Home asks the API instead
  }
  window.dispatchEvent(new Event(ONBOARDED_KEY));
}

/** Same-site path for ?next= (rejects //host, /\host, tabs and absolute URLs); '/' otherwise. */
export function safeNext(raw: string | null): string {
  if (!raw) return '/';
  try {
    const u = new URL(raw, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search + u.hash : '/';
  } catch {
    return '/';
  }
}
