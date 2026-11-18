/**
 * What the "Closing soon" home-screen widget shows: the saved opportunities that close soonest.
 * Pure (no RN/Expo imports) so scripts/deadlines-widget.test.mjs can run it in plain Node.
 * Days are counted from last_date when the widget is drawn — the API's days_left goes stale in a cache.
 */
import type { SavedItem } from '@applyfields/types';

export interface Deadline {
  slug: string;
  title: string;
  lastDate: string; // YYYY-MM-DD
}

export interface DeadlineRow extends Deadline {
  days: number;
  label: string;
  urgent: boolean;
}

const DAY_MS = 86_400_000;
const URGENT_DAYS = 3;

/** Saved opportunities that have a last date, soonest first. Services and colleges have none. */
export function fromSaved(items: SavedItem[]): Deadline[] {
  const out: Deadline[] = [];
  for (const i of items) {
    if (i.item_type !== 'opportunity' || !i.card?.last_date) continue;
    out.push({ slug: i.slug, title: i.card.title, lastDate: i.card.last_date });
  }
  // YYYY-MM-DD sorts correctly as text.
  return out.sort((a, b) => a.lastDate.localeCompare(b.lastDate));
}

export function pickDeadlines(list: Deadline[], today: string, limit = 3): DeadlineRow[] {
  const t = Date.parse(today);
  return list
    .filter((x) => x.lastDate >= today)
    .slice(0, limit)
    .map((x) => {
      const days = Math.round((Date.parse(x.lastDate) - t) / DAY_MS);
      return { ...x, days, label: dayLabel(days), urgent: days <= URGENT_DAYS };
    });
}

export function dayLabel(days: number): string {
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `Closes in ${days} days`;
}

/** The phone's local date, not UTC: at 00:30 IST the UTC date is still yesterday. */
export function todayLocal(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
