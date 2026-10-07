/**
 * The ONLY place the website talks to the backend (apps/api, NestJS).
 * Rule: the website never calls Supabase or the scraper directly — only this API.
 */

export const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1'
).replace(/\/$/, '');

export interface ApiFetchResult<T> {
  data: T | null;
  status: number;
  ok: boolean;
  error?: string;
}

/**
 * Fetch helper that forwards the user's auth cookie/token to the API.
 * Uses cookies() from next/headers when running on the server, or credentials: 'include' in browser.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiFetchResult<T>> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (typeof window === 'undefined') {
    // Server-side (Server Components, Route Handlers, Server Actions)
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const allCookies = cookieStore.toString();
      const token = cookieStore.get('accessToken')?.value;

      if (allCookies) {
        headers['cookie'] = allCookies;
      }
      if (token && !headers['authorization']) {
        headers['authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Cookies not available outside request scope
    }
  } else {
    // Client-side browser
    try {
      const token = localStorage.getItem('accessToken');
      if (token && !headers['authorization']) {
        headers['authorization'] = `Bearer ${token}`;
      }
    } catch {}
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials ?? 'include',
      cache: options.cache ?? 'no-store',
      signal: options.signal ?? AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[admin apiFetch] Status ${res.status} for ${path}`);
      let errorText = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message) {
          errorText = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {}
      return { data: null, status: res.status, ok: false, error: errorText };
    }

    const data = (await res.json()) as T;
    return { data, status: res.status, ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`[admin apiFetch] Error fetching ${url}:`, msg);
    return { data: null, status: 0, ok: false, error: msg };
  }
}

/** GET a JSON endpoint with full status info (status, ok, data, error) */
export async function apiGetWithStatus<T>(path: string): Promise<ApiFetchResult<T>> {
  return apiFetch<T>(path, { method: 'GET' });
}

/** GET a JSON endpoint. Returns null if the API is down or answers with an error. */
export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await apiGetWithStatus<T>(path);
  return res.data;
}

/** POST to a JSON endpoint. */
export async function apiPost<T>(path: string, body?: unknown): Promise<ApiFetchResult<T>> {
  return apiFetch<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
