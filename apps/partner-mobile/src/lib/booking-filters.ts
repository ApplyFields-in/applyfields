import type { BookingDetail, BookingRequestStatus } from '@applyfields/types';

export type BookingFilter =
  | 'active'
  | 'today'
  | 'upcoming'
  | 'new'
  | 'in_progress'
  | 'completed'
  | 'closed'
  | 'all';

export const BOOKING_FILTERS: { value: BookingFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'Accepted & in progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Rejected / cancelled' },
  { value: 'all', label: 'All' },
];

const OPEN = new Set<BookingRequestStatus>(['new', 'accepted', 'in_progress']);

/** Local calendar day as YYYY-MM-DD — "today" means the centre's day, not UTC's. */
function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Slim = Pick<BookingDetail, 'status' | 'appointment_at'>;

export function matchesFilter(b: Slim, filter: BookingFilter, now = new Date()): boolean {
  const open = OPEN.has(b.status);
  const day = b.appointment_at ? localDay(new Date(b.appointment_at)) : null;
  const today = localDay(now);
  switch (filter) {
    case 'active':
      return open;
    case 'today':
      return open && day === today;
    case 'upcoming':
      return open && day !== null && day > today;
    case 'new':
      return b.status === 'new';
    case 'in_progress':
      return b.status === 'accepted' || b.status === 'in_progress';
    case 'completed':
      return b.status === 'completed';
    case 'closed':
      return b.status === 'rejected' || b.status === 'cancelled';
    case 'all':
      return true;
  }
}

/** Case-insensitive match on any of the given fields; digits-only match for phone numbers. */
export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const qDigits = q.replace(/\D/g, '');
  return fields.some((f) => {
    if (!f) return false;
    if (f.toLowerCase().includes(q)) return true;
    return qDigits.length >= 3 && f.replace(/\D/g, '').includes(qDigits);
  });
}
