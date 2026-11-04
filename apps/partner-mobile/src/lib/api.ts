/**
 * The one HTTP client the partner app uses to talk to @applyfields/api.
 *
 * Same contract as apps/mobile/src/lib/api.ts: bearer access token on every
 * call, one silent /auth/refresh retry on 401 (React Native keeps the httpOnly
 * refresh cookie in its native cookie store). The access token lives in
 * SecureStore under its own key, so the citizen and partner apps never share a session.
 * ponytail: copied from apps/mobile; lift into a shared package if a third Expo app appears.
 */
import * as SecureStore from 'expo-secure-store';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(
  /\/$/,
  '',
);

const TOKEN_KEY = 'applyfields.partner.accessToken';

let memoryToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

export async function getToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  memoryToken = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
  return memoryToken;
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => undefined);
  else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

function message(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return 'The server took too long to answer. Check your connection and try again.';
    }
    if (err.message.toLowerCase().includes('network request failed')) {
      return 'No connection to ApplyFields. Check your internet and try again.';
    }
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

async function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) return false;
      const json = (await res.json().catch(() => null)) as { accessToken?: string } | null;
      if (!json?.accessToken) return false;
      await setToken(json.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  timeoutMs = 25000,
): Promise<ApiResponse<T>> {
  const send = async (token: string | null) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  };

  try {
    let res = await send(await getToken());

    if (res.status === 401 && !path.startsWith('/auth/')) {
      if (await refreshSession()) res = await send(await getToken());
      else await setToken(null);
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const raw = (json as { message?: string | string[] } | null)?.message;
      return {
        data: null,
        error: Array.isArray(raw) ? raw.join(', ') : raw || 'Request failed',
        status: res.status,
      };
    }
    return { data: json as T, error: null, status: res.status };
  } catch (err) {
    return { data: null, error: message(err), status: 0 };
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
};
