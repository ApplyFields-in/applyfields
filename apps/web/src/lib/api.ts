/**
 * Browser-side API client for the Next.js web application.
 * Points to the NestJS API at NEXT_PUBLIC_API_URL or defaults to localhost:4000/api/v1.
 * Sends and receives cookies for session authentication.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'TimeoutError' || err.message.toLowerCase().includes('timed out')) {
      return 'The backend server is waking up. Please wait a few seconds and try again.';
    }
    if (err.message.toLowerCase().includes('failed to fetch')) {
      return 'Could not connect to the backend API server. Please ensure the backend is running on port 4000 (run "pnpm dev" or "pnpm dev:api").';
    }
    return err.message;
  }
  return 'Could not connect to the API server';
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/** Attempt to refresh access token using the httpOnly refreshToken cookie or existing token */
async function attemptTokenRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const storedToken = getStoredToken();
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.accessToken) {
          localStorage.setItem('accessToken', json.accessToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** GET a JSON endpoint. Supports browser & HTTP caching policies. */
export async function apiGet<T>(
  path: string,
  _token?: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const token = _token || getStoredToken();
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let res = await fetch(`${API_URL}${path}`, {
      cache: options?.cache ?? 'default',
      ...options,
      headers,
      credentials: 'include',
      signal: options?.signal ?? AbortSignal.timeout(20000),
    });

    // If unauthorized, try silent refresh once via httpOnly cookie
    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const refreshedToken = getStoredToken();
        const retryHeaders: Record<string, string> = {
          ...((options?.headers as Record<string, string>) || {}),
          ...(refreshedToken ? { Authorization: `Bearer ${refreshedToken}` } : {}),
        };
        res = await fetch(`${API_URL}${path}`, {
          cache: options?.cache ?? 'default',
          ...options,
          headers: retryHeaders,
          credentials: 'include',
          signal: options?.signal ?? AbortSignal.timeout(20000),
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
    const token = _token || getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const timeoutMs = path.includes('/resume') ? 60000 : 35000;
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
        const refreshedToken = getStoredToken();
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(refreshedToken ? { Authorization: `Bearer ${refreshedToken}` } : {}),
        };
        res = await fetch(`${API_URL}${path}`, {
          method: 'POST',
          headers: retryHeaders,
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

    // Save token if returned in auth response
    if (json?.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', json.accessToken);
    }
    if (path.includes('/auth/logout') && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
    }

    return { data: json as T, error: null, status: res.status };
  } catch (err: unknown) {
    return { data: null, error: formatErrorMessage(err), status: 500 };
  }
}

/** PUT a JSON endpoint with automatic silent refresh on 401. */
export async function apiPut<T, B = unknown>(path: string, body?: B, _token?: string): Promise<ApiResponse<T>> {
  try {
    const token = _token || getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(25000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const refreshedToken = getStoredToken();
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(refreshedToken ? { Authorization: `Bearer ${refreshedToken}` } : {}),
        };
        res = await fetch(`${API_URL}${path}`, {
          method: 'PUT',
          headers: retryHeaders,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: AbortSignal.timeout(25000),
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
    return { data: null, error: formatErrorMessage(err), status: 500 };
  }
}

/** PATCH a JSON endpoint with automatic silent refresh on 401. */
export async function apiPatch<T, B = unknown>(path: string, body?: B, _token?: string): Promise<ApiResponse<T>> {
  try {
    const token = _token || getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(25000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const refreshedToken = getStoredToken();
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(refreshedToken ? { Authorization: `Bearer ${refreshedToken}` } : {}),
        };
        res = await fetch(`${API_URL}${path}`, {
          method: 'PATCH',
          headers: retryHeaders,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: AbortSignal.timeout(25000),
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
    return { data: null, error: formatErrorMessage(err), status: 500 };
  }
}

/** DELETE a resource from a JSON endpoint with automatic silent refresh on 401. */
export async function apiDelete<T>(path: string, _token?: string): Promise<ApiResponse<T>> {
  try {
    const token = _token || getStoredToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(20000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        const refreshedToken = getStoredToken();
        const retryHeaders: Record<string, string> = {
          ...(refreshedToken ? { Authorization: `Bearer ${refreshedToken}` } : {}),
        };
        res = await fetch(`${API_URL}${path}`, {
          method: 'DELETE',
          headers: retryHeaders,
          credentials: 'include',
          signal: AbortSignal.timeout(20000),
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
    return { data: null, error: formatErrorMessage(err), status: 500 };
  }
}
