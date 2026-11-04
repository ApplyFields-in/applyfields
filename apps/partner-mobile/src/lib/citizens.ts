/**
 * Who made each booking. The booking inbox has no citizen fields, but
 * GET /partners/me/conversations carries name + phone per booking (latest 60).
 */
import type { ConversationListResponse } from '@applyfields/types';

import { useApi } from './use-api';

export interface Citizen {
  name: string | null;
  phone: string | null;
  token: string;
}

// The API fills these in when it has nothing; showing them would look like real data.
const PLACEHOLDER_NAME = 'Citizen Applicant';
const PLACEHOLDER_PHONE = '+91 98480 00000';

/** The same short reference the website and chat show (AF-1A2B). */
export function bookingToken(id: string): string {
  return `AF-${id.slice(0, 4).toUpperCase()}`;
}

export function citizenIndex(data: ConversationListResponse | null): Map<string, Citizen> {
  const map = new Map<string, Citizen>();
  for (const t of data?.threads ?? []) {
    map.set(t.booking_id, {
      name: t.citizen_name && t.citizen_name !== PLACEHOLDER_NAME ? t.citizen_name : null,
      phone: t.citizen_phone && t.citizen_phone !== PLACEHOLDER_PHONE ? t.citizen_phone : null,
      token: t.token,
    });
  }
  return map;
}

export function useCitizens(): Map<string, Citizen> {
  const { data } = useApi<ConversationListResponse>('/partners/me/conversations');
  return citizenIndex(data);
}

/** wa.me wants digits only, with the country code. */
export function whatsappUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
