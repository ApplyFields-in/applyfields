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

const REFRESH_KEY = 'applyfields.partner.refreshToken';
const TOKEN_KEY = 'applyfields.partner.accessToken';

let memoryToken: string | null = null;
let refreshing: Promise<boolean | null> | null = null;

export async function getToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  memoryToken = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
  return memoryToken;
}

/** Is any session saved on this phone? No → the app can show sign-in without a network round trip. */
export async function hasStoredSession(): Promise<boolean> {
  if (await getToken()) return true;
  return Boolean(await SecureStore.getItemAsync(REFRESH_KEY).catch(() => null));
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => undefined);
  else {
    // Sign-out: drop both tokens.
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined);
  }
}

/**
 * Save a new session. The refresh token is kept in SecureStore (not the native cookie jar, which
 * Android doesn't reliably persist), so the app stays signed in across restarts until sign-out
 * or uninstall. The API slides the session on every refresh.
 */
export async function saveSession(session: { accessToken?: string; refreshToken?: string }): Promise<void> {
  if (session.accessToken) await setToken(session.accessToken);
  if (session.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken).catch(() => undefined);
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

/**
 * POST /auth/refresh with the stored refresh token. true = new session, false = the server
 * rejected it (signed out elsewhere / expired), null = offline: keep the user signed in.
 */
async function refreshSession(): Promise<boolean | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY).catch(() => null);
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client': 'app' },
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
      if (!res.ok) return res.status === 401 ? false : null;
      const json = (await res.json().catch(() => null)) as { accessToken?: string; refreshToken?: string } | null;
      if (!json?.accessToken) return null;
      await saveSession(json);
      return true;
    } catch {
      return null;
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
    // x-client: app → the API returns the refresh token in the body (see auth.controller forApp).
    const headers: Record<string, string> = { Accept: 'application/json', 'x-client': 'app' };
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
      const refreshed = await refreshSession();
      if (refreshed) res = await send(await getToken());
      else if (refreshed === false) await setToken(null); // offline (null) keeps the session
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
