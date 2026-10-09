import { describe, expect, it } from 'vitest';
import { renderEmail } from './email.js';
import {
  DEFAULT_REMINDER_DAYS,
  emailAllowed,
  notificationTypeForUpdate,
  reminderBucket,
  reminderKey,
  updateKey,
  wantsType,
} from './notification-rules.js';
import { isDaytimeIst } from './notifications.scheduler.js';

/** What the database's unique (user_id, dedupe_key) does: a second insert with the same key is skipped. */
function simulate(daysLeftOnEachTick: number[], days = DEFAULT_REMINDER_DAYS, ticksPerDay = 1) {
  const sent = new Set<string>();
  const log: number[] = [];
  for (const left of daysLeftOnEachTick) {
    for (let t = 0; t < ticksPerDay; t++) {
      const bucket = reminderBucket(left, days);
      if (bucket === null) continue;
      const key = reminderKey('job-1', 'last_date', '2026-10-11', bucket);
      if (!sent.has(key)) {
        sent.add(key);
        log.push(left);
      }
    }
  }
  return log;
}

describe('reminderBucket', () => {
  it('picks the smallest "days before" that is still ≥ days left', () => {
    expect(reminderBucket(7, [7, 3, 1])).toBe(7);
    expect(reminderBucket(5, [7, 3, 1])).toBe(7);
    expect(reminderBucket(3, [7, 3, 1])).toBe(3);
    expect(reminderBucket(2, [7, 3, 1])).toBe(3);
    expect(reminderBucket(1, [7, 3, 1])).toBe(1);
    expect(reminderBucket(0, [7, 3, 1])).toBe(1);
  });

  it('is null when it is too early or the date has passed', () => {
    expect(reminderBucket(8, [7, 3, 1])).toBeNull();
    expect(reminderBucket(-1, [7, 3, 1])).toBeNull();
    expect(reminderBucket(3, [])).toBeNull();
  });

  it('works with unsorted user settings', () => {
    expect(reminderBucket(2, [1, 7, 3])).toBe(3);
  });
});

describe('scheduling + dedupe', () => {
  it('a job due in 3 days, saved today → exactly one reminder today, even with 56 ticks', () => {
    expect(simulate([3], DEFAULT_REMINDER_DAYS, 56)).toEqual([3]);
  });

  it('day by day from 10 days out → one reminder at 7, 3 and 1 days left', () => {
    expect(simulate([10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, -1], DEFAULT_REMINDER_DAYS, 4)).toEqual([7, 3, 1]);
  });

  it('a missed day catches up instead of skipping the reminder', () => {
    expect(simulate([8, 6, 2], DEFAULT_REMINDER_DAYS)).toEqual([6, 2]);
  });

  it('a changed date gets fresh reminders (the date is in the key)', () => {
    expect(reminderKey('j', 'last_date', '2026-10-11', 3)).not.toBe(reminderKey('j', 'last_date', '2026-10-15', 3));
    expect(reminderKey('j', 'last_date', '2026-10-11', 3)).not.toBe(reminderKey('j', 'exam_date', '2026-10-11', 3));
  });

  it('an update has one key, so unpublish + publish again notifies nobody twice', () => {
    expect(updateKey('u1')).toBe(updateKey('u1'));
  });
});

describe('isDaytimeIst', () => {
  it('08:00–20:59 India time only', () => {
    expect(isDaytimeIst(new Date('2026-10-08T02:29:00Z'))).toBe(false); // 07:59 IST
    expect(isDaytimeIst(new Date('2026-10-08T02:30:00Z'))).toBe(true); // 08:00 IST
    expect(isDaytimeIst(new Date('2026-10-08T15:29:00Z'))).toBe(true); // 20:59 IST
    expect(isDaytimeIst(new Date('2026-10-08T15:30:00Z'))).toBe(false); // 21:00 IST
  });
});

describe('who gets what', () => {
  const base = { email: 'a@b.in', emailVerified: true, emailEnabled: true, emailConsentWithdrawn: false };

  it('email only to a verified address, not switched off, consent not withdrawn', () => {
    expect(emailAllowed(base)).toBe(true);
    expect(emailAllowed({ ...base, email: null })).toBe(false);
    expect(emailAllowed({ ...base, emailVerified: false })).toBe(false);
    expect(emailAllowed({ ...base, emailEnabled: false })).toBe(false);
    expect(emailAllowed({ ...base, emailConsentWithdrawn: true })).toBe(false);
  });

  it('muted types are dropped; system messages can never be muted', () => {
    expect(wantsType(['result'], 'result')).toBe(false);
    expect(wantsType(['result'], 'admit_card')).toBe(true);
    expect(wantsType(['system'], 'system')).toBe(true);
  });

  it('maps every update kind to a notification type', () => {
    expect(notificationTypeForUpdate('admit_card')).toBe('admit_card');
    expect(notificationTypeForUpdate('extension')).toBe('date_change');
    expect(notificationTypeForUpdate('other')).toBe('saved_item_changed');
  });
});

describe('renderEmail', () => {
  it('escapes HTML from titles and keeps the unsubscribe link', () => {
    const e = renderEmail({
      title: 'Result <script>alert(1)</script>',
      body: 'A & B',
      url: 'https://applyfields.in/jobs/x',
      unsubscribeUrl: 'https://api/unsub?token=t',
      preferencesUrl: 'https://applyfields.in/notifications',
    });
    expect(e.html).not.toContain('<script>');
    expect(e.html).toContain('&lt;script&gt;');
    expect(e.html).toContain('A &amp; B');
    expect(e.html).toContain('https://api/unsub?token=t');
    expect(e.text).toContain('Unsubscribe: https://api/unsub?token=t');
  });
});
