import type { DaySchedule } from '@applyfields/types';

export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** First problem in the week, in words, or null. */
export function scheduleProblem(days: DaySchedule[]): string | null {
  for (const d of days) {
    if (!d.isOpen) continue;
    const name = d.dayName ?? `Day ${d.dayOfWeek}`;
    if (!HHMM.test(d.openTime) || !HHMM.test(d.closeTime)) return `${name}: times are HH:MM, like 09:00.`;
    if (d.openTime >= d.closeTime) return `${name}: closing time must be after opening time.`;
    if (d.hasBreak) {
      if (!d.breakStart || !d.breakEnd || !HHMM.test(d.breakStart) || !HHMM.test(d.breakEnd))
        return `${name}: enter the break start and end.`;
      if (d.breakStart <= d.openTime || d.breakEnd >= d.closeTime || d.breakStart >= d.breakEnd)
        return `${name}: the break must sit inside opening hours.`;
    }
  }
  return null;
}

/** Monday's hours (open/close/break) onto Tuesday–Friday, like the website's button. */
export function copyMondayToWeekdays(days: DaySchedule[]): DaySchedule[] {
  const mon = days.find((d) => d.dayOfWeek === 1);
  if (!mon) return days;
  const { isOpen, openTime, closeTime, hasBreak, breakStart, breakEnd } = mon;
  return days.map((d) =>
    d.dayOfWeek >= 2 && d.dayOfWeek <= 5 ? { ...d, isOpen, openTime, closeTime, hasBreak, breakStart, breakEnd } : d,
  );
}
