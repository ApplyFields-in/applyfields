/**
 * The ONLY place the website talks to the backend (apps/api, NestJS).
 * Rule: the website never calls Supabase or the scraper directly — only this API.
 */

export const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
  /\/$/,
  '',
);

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts silent token renewal via /auth/refresh using httpOnly cookies.
 * Prevents multiple simultaneous refresh calls with a single shared promise.
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        window.dispatchEvent(new Event('auth-changed'));
        return false;
      }

      window.dispatchEvent(new Event('auth-changed'));
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** GET a JSON endpoint. Automatically attempts refresh if access token expired. */
export async function apiGet<T>(path: string, _token?: string): Promise<T | null> {
  try {
    let res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      credentials: 'include',
      signal: AbortSignal.timeout(6000),
    });

    // If unauthorized, try silent refresh once via httpOnly cookie
    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path}`, {
          cache: 'no-store',
          credentials: 'include',
          signal: AbortSignal.timeout(6000),
        });
      }
    }

    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/** POST a JSON endpoint with automatic silent refresh on 401. */
export async function apiPost<T, B = unknown>(path: string, body?: B, _token?: string): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const timeoutMs = path.includes('/resume') ? 45000 : 15000;
    let res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !path.includes('/auth/login') &&
      !path.includes('/auth/refresh')
    ) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path}`, {
          method: 'POST',
          headers,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: AbortSignal.timeout(timeoutMs),
        });
      }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.message || (Array.isArray(json?.message) ? json.message.join(', ') : 'Request failed');
      return { data: null, error: msg, status: res.status };
    }
    return { data: json as T, error: null, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not connect to the API server';
    return { data: null, error: message, status: 500 };
  }
}

/** PUT a JSON endpoint with automatic silent refresh on 401. */
export async function apiPut<T, B = unknown>(path: string, body?: B, _token?: string): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path}`, {
          method: 'PUT',
          headers,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: AbortSignal.timeout(8000),
        });
      }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.message || (Array.isArray(json?.message) ? json.message.join(', ') : 'Request failed');
      return { data: null, error: msg, status: res.status };
    }
    return { data: json as T, error: null, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not connect to the API server';
    return { data: null, error: message, status: 500 };
  }
}

/** DELETE a resource from a JSON endpoint with automatic silent refresh on 401. */
export async function apiDelete<T>(path: string, _token?: string): Promise<ApiResponse<T>> {
  try {
    let res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path}`, {
          method: 'DELETE',
          credentials: 'include',
          signal: AbortSignal.timeout(8000),
        });
      }
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json?.message || (Array.isArray(json?.message) ? json.message.join(', ') : 'Request failed');
      return { data: null, error: msg, status: res.status };
    }
    return { data: json as T, error: null, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not connect to the API server';
    return { data: null, error: message, status: 500 };
  }
}
