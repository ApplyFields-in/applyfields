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
