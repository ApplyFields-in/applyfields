import type {
  BookingDetail,
  BookingListResponse,
  PartnerDetail,
  PartnerDocumentSummary,
  PartnerRegistrationInput,
  PartnerServiceDetail,
  PartnerServiceInput,
  PartnerUpdateInput,
  UpdateBookingStatusInput,
} from '@applyfields/types';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000/api/v1';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
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
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  try {
    let res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(20000),
        });
      }
    }

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
    let res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(30000),
    });

    if (res.status === 401 && typeof window !== 'undefined' && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: AbortSignal.timeout(30000),
        });
      }
    }

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

export async function apiPatch<T, B = unknown>(path: string, body?: B): Promise<ApiResponse<T>> {
  try {
    let res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(25000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: AbortSignal.timeout(25000),
        });
      }
    }

    if (!res.ok) {
      let errText = `Update failed (${res.status})`;
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

export async function apiPut<T, B = unknown>(path: string, body?: B): Promise<ApiResponse<T>> {
  try {
    let res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(25000),
    });

    if (res.status === 401 && typeof window !== 'undefined') {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: AbortSignal.timeout(25000),
        });
      }
    }

    if (!res.ok) {
      let errText = `Update failed (${res.status})`;
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

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      let errText = `Delete failed (${res.status})`;
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
      error: err instanceof Error ? err.message : 'Network error',
      status: 0,
    };
  }
}

// ============================================================================
// PARTNER SERVICE DOMAIN HELPERS
// ============================================================================

export async function getMyPartner(): Promise<ApiResponse<PartnerDetail>> {
  return apiGet<PartnerDetail>('/partners/me');
}

export async function registerPartner(input: PartnerRegistrationInput): Promise<ApiResponse<PartnerDetail>> {
  return apiPost<PartnerDetail, PartnerRegistrationInput>('/partners/register', input);
}

export async function updatePartner(input: PartnerUpdateInput): Promise<ApiResponse<PartnerDetail>> {
  return apiPatch<PartnerDetail, PartnerUpdateInput>('/partners/me', input);
}

export async function uploadPartnerDoc(payload: {
  document_kind: string;
  storage_path: string;
}): Promise<ApiResponse<PartnerDocumentSummary>> {
  return apiPost<PartnerDocumentSummary>('/partners/me/documents', payload);
}

export async function listPartnerServices(): Promise<ApiResponse<PartnerServiceDetail[]>> {
  return apiGet<PartnerServiceDetail[]>('/partners/me/services');
}

export async function createPartnerService(input: PartnerServiceInput): Promise<ApiResponse<PartnerServiceDetail>> {
  return apiPost<PartnerServiceDetail, PartnerServiceInput>('/partners/me/services', input);
}

export async function updatePartnerService(
  id: string,
  input: Partial<PartnerServiceInput>,
): Promise<ApiResponse<PartnerServiceDetail>> {
  return apiPatch<PartnerServiceDetail, Partial<PartnerServiceInput>>(`/partners/me/services/${id}`, input);
}

export async function deletePartnerService(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return apiDelete<{ success: boolean }>(`/partners/me/services/${id}`);
}

export async function listPartnerBookings(status?: string): Promise<ApiResponse<BookingListResponse>> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiGet<BookingListResponse>(`/bookings/partner/inbox${query}`);
}

export async function updatePartnerBookingStatus(
  bookingId: string,
  input: UpdateBookingStatusInput,
): Promise<ApiResponse<BookingDetail>> {
  return apiPatch<BookingDetail, UpdateBookingStatusInput>(`/bookings/partner/${bookingId}`, input);
}

