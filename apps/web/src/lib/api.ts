/**
 * The ONLY place the website talks to the backend (apps/api, NestJS).
 * Rule: the website never calls Supabase or the scraper directly — only this API.
 */

export const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
  /\/$/,
  '',
);

function resolveAuthToken(token?: string): string | undefined {
  if (token) return token;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken') ?? undefined;
  }
  return undefined;
}

/** GET a JSON endpoint. Returns null if the API is down or answers with an error. */
export async function apiGet<T>(path: string, token?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {};
    const authToken = resolveAuthToken(token);
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(6000),
    });
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

/** POST a JSON endpoint with cookies included for refresh token sessions. */
export async function apiPost<T, B = unknown>(path: string, body?: B, token?: string): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authToken = resolveAuthToken(token);
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });

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

/** PUT a JSON endpoint to update resources. */
export async function apiPut<T, B = unknown>(path: string, body?: B, token?: string): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const authToken = resolveAuthToken(token);
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });

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

/** DELETE a resource from a JSON endpoint. */
export async function apiDelete<T>(path: string, token?: string): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {};
    const authToken = resolveAuthToken(token);
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });

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
