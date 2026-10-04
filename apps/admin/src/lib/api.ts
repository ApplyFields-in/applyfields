/**
 * The ONLY place the website talks to the backend (apps/api, NestJS).
 * Rule: the website never calls Supabase or the scraper directly — only this API.
 */

export const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
  /\/$/,
  '',
);

/** GET a JSON endpoint. Returns null if the API is down or answers with an error. */
export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
