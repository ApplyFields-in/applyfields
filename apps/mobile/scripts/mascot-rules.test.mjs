// The mascot icon rules, in plain Node (24+ strips the TypeScript types).
// Run: pnpm --filter @applyfields/mobile test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MASCOT_CONFIG as cfg } from '../src/services/mascot/MascotConfig.ts';
import {
  canAutoChange,
  initialMascotState,
  pickIcon,
  recordEvent,
} from '../src/services/mascot/MascotActivityTracker.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 10, 1);
const apply = (events, at = T0) =>
  events.reduce((s, e) => recordEvent(s, e, at, cfg), initialMascotState());

test('fresh install shows default', () => {
  assert.equal(pickIcon(initialMascotState(), T0, cfg), 'default');
});

test('a completed session: active for 3 days, then default, then sleeping at 7 days', () => {
  const s = apply([{ type: 'session_completed' }]);
  assert.equal(pickIcon(s, T0 + DAY, cfg), 'active');
  assert.equal(pickIcon(s, T0 + 4 * DAY, cfg), 'default');
  assert.equal(pickIcon(s, T0 + 7 * DAY, cfg), 'sleeping');
});

test('research bursts are deduped; three spaced searches mean thinking', () => {
  const burst = apply([{ type: 'research' }, { type: 'research' }, { type: 'research' }]);
  assert.equal(burst.research.length, 1);
  const spaced = apply([
    { type: 'research', at: T0 },
    { type: 'research', at: T0 + 2 * 60_000 },
    { type: 'research', at: T0 + 4 * 60_000 },
    { type: 'session_completed', at: T0 + 5 * 60_000 },
  ]);
  assert.equal(pickIcon(spaced, T0 + HOUR, cfg), 'thinking');
  assert.equal(pickIcon(spaced, T0 + 2 * DAY, cfg), 'active'); // research window over
});

test('priority: notification > achievement > sleeping > thinking > active', () => {
  let s = apply([
    { type: 'session_completed', at: T0 },
    { type: 'research', at: T0 },
    { type: 'research', at: T0 + 2 * 60_000 },
    { type: 'research', at: T0 + 4 * 60_000 },
    { type: 'achievement', key: 'application:1:applied', at: T0 },
    { type: 'important_notification', at: T0 },
  ]);
  assert.equal(pickIcon(s, T0 + HOUR, cfg), 'notification');
  s = recordEvent(s, { type: 'important_notification', at: null }, T0, cfg); // all read
  assert.equal(pickIcon(s, T0 + HOUR, cfg), 'achievement');
});

test('notification and achievement expire on their own', () => {
  const s = apply([
    { type: 'important_notification', at: T0 },
    { type: 'achievement', key: 'k', at: T0 },
  ]);
  assert.equal(pickIcon(s, T0 + 2 * DAY + 1, cfg), 'achievement');
  assert.equal(pickIcon(s, T0 + 3 * DAY + 1, cfg), 'default');
});

test('achievements are deduped by key and old ones never show', () => {
  const s = apply([{ type: 'achievement', key: 'a', at: T0 - 60 * DAY }]);
  assert.equal(pickIcon(s, T0, cfg), 'default');
  const again = recordEvent(s, { type: 'achievement', key: 'a', at: T0 }, T0, cfg);
  assert.equal(again, s); // same object: nothing to write
});

test('rate limit, same-icon and failure backoff block automatic changes', () => {
  const s = initialMascotState();
  const iv = cfg.minChangeIntervalMs.android;
  assert.equal(canAutoChange(s, 'default', 'active', T0, iv, cfg), true);
  assert.equal(canAutoChange(s, 'active', 'active', T0, iv, cfg), false);
  const changed = { ...s, lastChangeAt: T0 };
  assert.equal(canAutoChange(changed, 'active', 'thinking', T0 + iv - 1, iv, cfg), false);
  assert.equal(canAutoChange(changed, 'active', 'thinking', T0 + iv, iv, cfg), true);
  const failed = { ...s, failures: 1, lastFailureAt: T0 };
  assert.equal(canAutoChange(failed, 'default', 'active', T0 + HOUR, iv, cfg), false);
  assert.equal(canAutoChange(failed, 'default', 'active', T0 + DAY, iv, cfg), true);
});

test('logo for the first 6 hours after install, then the mascot', () => {
  const s = { ...initialMascotState(), installedAt: T0 };
  assert.equal(pickIcon(s, T0 + HOUR, cfg), 'logo');
  const busy = recordEvent(s, { type: 'important_notification', at: T0 }, T0, cfg);
  assert.equal(pickIcon(busy, T0 + HOUR, cfg), 'logo'); // the logo period wins over every mood
  assert.equal(pickIcon(s, T0 + 6 * HOUR, cfg), 'default');
  assert.equal(pickIcon(busy, T0 + 6 * HOUR, cfg), 'notification');
});

test('notification and achievement skip the gap; other moods wait 1 hour on Android', () => {
  const iv = cfg.minChangeIntervalMs.android;
  assert.equal(iv, HOUR);
  const changed = { ...initialMascotState(), lastChangeAt: T0 };
  assert.equal(canAutoChange(changed, 'active', 'notification', T0 + 1000, iv, cfg), true);
  assert.equal(canAutoChange(changed, 'notification', 'achievement', T0 + 1000, iv, cfg), true);
  assert.equal(canAutoChange(changed, 'active', 'sleeping', T0 + 1000, iv, cfg), false);
  const failed = { ...changed, failures: 1, lastFailureAt: T0 };
  assert.equal(canAutoChange(failed, 'active', 'notification', T0 + 1000, iv, cfg), false); // backoff still applies
});
