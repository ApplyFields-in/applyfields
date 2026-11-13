export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'http://localhost:4000/api/v1';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let refreshing: Promise<boolean> | null = null;

/** One silent POST /auth/refresh (httpOnly refresh cookie) when the access token has expired. */
function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      const json = res.ok ? await res.json().catch(() => null) : null;
      if (json?.accessToken) localStorage.setItem('accessToken', json.accessToken);
      return Boolean(json?.accessToken);
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** fetch + one retry after a silent refresh on 401. `init` is a function so the retry sends the new token. */
async function send(url: string, init: () => RequestInit): Promise<Response> {
  const res = await fetch(url, init());
  if (res.status !== 401 || typeof window === 'undefined' || url.includes('/auth/')) return res;
  return (await refreshSession()) ? fetch(url, init()) : res;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await send(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, () => ({
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...getAuthHeader(),
      },
      signal: AbortSignal.timeout(20000),}));

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
    const res = await send(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, () => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(30000),}));

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

export const apiPatch = <T, B = unknown>(path: string, body?: B) => apiWrite<T, B>('PATCH', path, body);
export const apiPut = <T, B = unknown>(path: string, body?: B) => apiWrite<T, B>('PUT', path, body);

async function apiWrite<T, B = unknown>(method: 'PATCH' | 'PUT', path: string, body?: B): Promise<ApiResponse<T>> {
  try {
    const res = await send(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, () => ({
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: AbortSignal.timeout(30000),}));

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

// ============================================================================
// CITIZEN SERVICES & BOOKINGS API HELPERS
// ============================================================================

import type {
  BookingDetail,
  BookingDispute,
  CreateBookingDisputeInput,
  BookingListResponse,
  ChatMessageItem,
  CreateBookingInput,
  MarkFiledInput,
  PartnerDirectoryResponse,
  PartnerDetail,
  SendChatMessageInput,
  UserDocumentListResponse,
} from '@applyfields/types';

export async function listDirectoryPartners(
  query?: Record<string, string>,
): Promise<ApiResponse<PartnerDirectoryResponse>> {
  const q = query ? `?${new URLSearchParams(query).toString()}` : '';
  return apiGet<PartnerDirectoryResponse>(`/partners/directory${q}`);
}

export async function getPartnerBySlug(slug: string): Promise<ApiResponse<PartnerDetail>> {
  return apiGet<PartnerDetail>(`/partners/${encodeURIComponent(slug)}`);
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<ApiResponse<BookingDetail>> {
  return apiPost<BookingDetail, CreateBookingInput>('/bookings', input);
}

export async function getBookingById(
  id: string,
): Promise<ApiResponse<BookingDetail>> {
  return apiGet<BookingDetail>(`/bookings/${encodeURIComponent(id)}`);
}

/** Citizen: the locker documents the centre may open for this booking (replaces the set). */
export async function shareBookingDocuments(id: string, documentIds: string[]): Promise<ApiResponse<BookingDetail>> {
  return apiPut<BookingDetail>(`/bookings/${encodeURIComponent(id)}/documents`, { document_ids: documentIds });
}

/** 10-minute link to a document the citizen shared for this booking (centre or the citizen; logged). */
export async function getSharedDocumentUrl(bookingId: string, shareId: string): Promise<ApiResponse<{ url: string }>> {
  return apiGet<{ url: string }>(`/bookings/${encodeURIComponent(bookingId)}/documents/${encodeURIComponent(shareId)}`);
}

/** The signed-in citizen's Document Locker (GET /documents). */
export async function listMyDocuments(): Promise<ApiResponse<UserDocumentListResponse>> {
  return apiGet<UserDocumentListResponse>('/documents');
}

export async function getMyBookings(): Promise<ApiResponse<BookingListResponse>> {
  return apiGet<BookingListResponse>('/bookings/my');
}

/** Short-lived download link for the acknowledgment slip (citizen or partner centre only). */
export async function getBookingSlipUrl(id: string): Promise<ApiResponse<{ url: string }>> {
  return apiGet<{ url: string }>(`/bookings/${encodeURIComponent(id)}/slip`);
}

/** Operator desk: requests for the signed-in partner centre. */
export async function getPartnerInbox(): Promise<ApiResponse<BookingListResponse>> {
  return apiGet<BookingListResponse>('/bookings/partner/inbox');
}

/** Operator desk: save the official application number + slip, complete the request, notify the citizen. */
export async function markBookingFiled(
  id: string,
  input: MarkFiledInput,
): Promise<ApiResponse<BookingDetail>> {
  return apiPost<BookingDetail, MarkFiledInput>(`/bookings/partner/${encodeURIComponent(id)}/filed`, input);
}

export async function cancelBooking(
  id: string,
  reason?: string,
): Promise<ApiResponse<BookingDetail>> {
  return apiPost<BookingDetail, { reason?: string }>(
    `/bookings/${encodeURIComponent(id)}/cancel`,
    { reason },
  );
}

/** Raise a complaint about your own booking (goes to the ApplyFields disputes desk). */
export async function fileBookingDispute(
  id: string,
  input: CreateBookingDisputeInput,
): Promise<ApiResponse<BookingDispute>> {
  return apiPost<BookingDispute, CreateBookingDisputeInput>(`/bookings/${encodeURIComponent(id)}/dispute`, input);
}

export async function getBookingMessages(
  bookingId: string,
): Promise<ApiResponse<ChatMessageItem[]>> {
  return apiGet<ChatMessageItem[]>(`/bookings/${encodeURIComponent(bookingId)}/messages`);
}

export async function sendBookingMessage(
  bookingId: string,
  input: SendChatMessageInput,
): Promise<ApiResponse<ChatMessageItem>> {
  return apiPost<ChatMessageItem, SendChatMessageInput>(
    `/bookings/${encodeURIComponent(bookingId)}/messages`,
    input,
  );
}

export async function markBookingMessagesRead(
  bookingId: string,
  reader_type: 'citizen' | 'partner' = 'citizen',
): Promise<ApiResponse<{ count: number }>> {
  return apiPatch<{ count: number }, { reader_type: 'citizen' | 'partner' }>(
    `/bookings/${encodeURIComponent(bookingId)}/messages/read`,
    { reader_type },
  );
}

