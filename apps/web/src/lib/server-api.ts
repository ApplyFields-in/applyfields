import type { SavedItemType, SavedList } from '@applyfields/types';
import { cookies } from 'next/headers';
import { API_URL } from './api';

/**
 * Server components only: GET as the logged-in user by forwarding the login cookie.
 * A stale token falls back to the anonymous response instead of an error page.
 */
export async function apiGetAsUser<T>(path: string): Promise<T | null> {
  const token = (await cookies()).get('accessToken')?.value;
  const get = (auth?: string) =>
    fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
      signal: AbortSignal.timeout(6000),
    });
  try {
    let res = await get(token);
    if (res.status === 401 && token) res = await get();
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Server components only: has the logged-in user saved this item? False when logged out. */
export async function isSaved(itemType: SavedItemType, slug: string): Promise<boolean> {
  if (!(await cookies()).has('accessToken')) return false;
  const list = await apiGetAsUser<SavedList>('/saved');
  return Boolean(list?.items.some((i) => i.item_type === itemType && i.slug === slug));
}
