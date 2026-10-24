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

export async function apiPatch<T, B = unknown>(path: string, body?: B): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: 'PATCH',
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

// ============================================================================
// CITIZEN SERVICES & BOOKINGS API HELPERS
// ============================================================================

import type {
  BookingDetail,
  BookingListResponse,
  ChatMessageItem,
  CreateBookingInput,
  PartnerDirectoryResponse,
  PartnerDetail,
  SendChatMessageInput,
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

export async function getMyBookings(): Promise<ApiResponse<BookingListResponse>> {
  return apiGet<BookingListResponse>('/bookings/my');
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

