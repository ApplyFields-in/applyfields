import type { BookingRequestStatus, InstitutionEnquiryStatus, PartnerType } from '@applyfields/types';

import { C } from '../theme';

export function rupees(paise: number | null | undefined): string {
  if (paise == null) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** +919000000103 → +91 90000 00103 (Indian mobiles); anything else is shown as given. */
export function phone(p: string | null | undefined): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  const ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 10 ? d : null;
  return ten ? `+91 ${ten.slice(0, 5)} ${ten.slice(5)}` : p;
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return dateTime(iso);
}

export const BOOKING_STATUS: Record<BookingRequestStatus, { label: string; color: string }> = {
  new: { label: 'New request', color: C.blue },
  accepted: { label: 'Accepted', color: C.navy },
  in_progress: { label: 'In progress', color: C.warn },
  completed: { label: 'Completed', color: C.good },
  rejected: { label: 'Rejected', color: C.bad },
  cancelled: { label: 'Cancelled', color: C.muted },
};

/** What the partner desk can do next from each status (the web bookings desk offers the same moves). */
export const NEXT_ACTIONS: Record<
  BookingRequestStatus,
  { to: BookingRequestStatus; label: string; variant: 'primary' | 'secondary' | 'danger' }[]
> = {
  new: [
    { to: 'accepted', label: 'Accept', variant: 'primary' },
    { to: 'rejected', label: 'Reject', variant: 'danger' },
  ],
  accepted: [
    { to: 'in_progress', label: 'Start work', variant: 'primary' },
    { to: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  in_progress: [{ to: 'completed', label: 'Mark completed', variant: 'primary' }],
  completed: [],
  rejected: [],
  cancelled: [],
};

export const ENQUIRY_STATUS: Record<InstitutionEnquiryStatus, { label: string; color: string }> = {
  new: { label: 'New', color: C.blue },
  responded: { label: 'Responded', color: C.good },
  closed: { label: 'Closed', color: C.muted },
};

/** Centre types a partner can register as from the app (institutions use their own form). */
export const CENTRE_TYPES: { value: PartnerType; label: string }[] = [
  { value: 'meeseva', label: 'MeeSeva centre' },
  { value: 'csc', label: 'CSC / Digital Seva' },
  { value: 'xerox_printing', label: 'Xerox & printing' },
  { value: 'browsing_centre', label: 'Browsing centre' },
  { value: 'typing_centre', label: 'Typing centre' },
  { value: 'passport_studio', label: 'Passport photo studio' },
  { value: 'application_assistance', label: 'Application assistance' },
  { value: 'consultant', label: 'Consultant' },
];

export function typeLabel(type: PartnerType): string {
  if (type === 'college') return 'College';
  if (type === 'university') return 'University';
  if (type === 'training_institute') return 'Training institution';
  return CENTRE_TYPES.find((t) => t.value === type)?.label ?? 'Partner';
}

/** Same rules as partnerRegisterSchema in apps/api, checked before we send. */
export const PHONE_RE = /^(\+91)?[6-9]\d{9}$/;
export const PIN_RE = /^[1-9][0-9]{5}$/;
