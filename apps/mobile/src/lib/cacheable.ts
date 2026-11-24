/**
 * Which API responses may be kept on the phone for a cold open with no signal.
 * Public browse lists and detail pages only: never the user's own data
 * (saved, alerts, documents, eligibility verdicts), and never free-text
 * searches or the "eligible for me" filter, which would grow without bound
 * or carry personal results.
 */
const PUBLIC = /^\/(opportunities|services|career|institutions)(\/[^/?]+)?(\?|$)/;
const PERSONAL_QUERY = /[?&](q|eligible)=/;

export function cacheable(path: string): boolean {
  return PUBLIC.test(path) && !PERSONAL_QUERY.test(path);
}

/** Short, filesystem-safe name for a cache key (djb2 hash; collisions only cost a refetch). */
export function cacheFileName(key: string): string {
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}.json`;
}
