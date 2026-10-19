export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000/api/v1';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      let errText = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) {
          errText = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {}
      return { data: null, error: errText, status: res.status };
    }

    const data = (await res.json()) as T;
    return { data, error: null, status: res.status };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network error connecting to API',
      status: 0,
    };
  }
}

export async function apiPost<T, B = unknown>(path: string, body?: B): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      let errText = `Request failed (${res.status})`;
      try {
        const json = await res.json();
        if (json?.message) {
          errText = Array.isArray(json.message) ? json.message.join(', ') : json.message;
        }
      } catch {}
      return { data: null, error: errText, status: res.status };
    }

    const data = (await res.json()) as T;
    return { data, error: null, status: res.status };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Network connection failed',
      status: 0,
    };
  }
}
