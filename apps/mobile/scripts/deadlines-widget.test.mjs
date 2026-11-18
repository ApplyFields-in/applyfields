// The "Closing soon" widget rules, in plain Node (24+ strips the TypeScript types).
// Run: pnpm --filter @applyfields/mobile test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dayLabel, fromSaved, pickDeadlines, todayLocal } from '../src/widgets/deadlines.ts';

const opp = (slug, last_date, title = slug) => ({
  item_type: 'opportunity',
  slug,
  saved_at: '',
  reminder_enabled: true,
  card: { slug, title, last_date },
});
const d = (slug, lastDate) => ({ slug, title: slug, lastDate });

test('fromSaved keeps opportunities with a date, sorted', () => {
  const out = fromSaved([
    opp('b', '2026-12-05'),
    { item_type: 'service', slug: 's', saved_at: '', reminder_enabled: false, service: { name: 'PAN' } },
    opp('a', '2026-11-20'),
  ]);
  assert.deepEqual(out.map((x) => x.slug), ['a', 'b']);
  assert.deepEqual(out[0], { slug: 'a', title: 'a', lastDate: '2026-11-20' });
});

test('skips items without card or date', () => {
  assert.deepEqual(
    fromSaved([opp('x', null), { item_type: 'opportunity', slug: 'y', saved_at: '', reminder_enabled: true, card: null }]),
    [],
  );
});

test('past dates excluded, today kept', () => {
  const rows = pickDeadlines([d('old', '2026-11-17'), d('now', '2026-11-18')], '2026-11-18');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].slug, 'now');
  assert.equal(rows[0].days, 0);
  assert.equal(rows[0].label, 'Closes today');
});

test('labels', () => {
  assert.equal(dayLabel(0), 'Closes today');
  assert.equal(dayLabel(1), 'Closes tomorrow');
  assert.equal(dayLabel(12), 'Closes in 12 days');
});

test('urgent at 3 days, not at 4', () => {
  const rows = pickDeadlines([d('a', '2026-11-21'), d('b', '2026-11-22')], '2026-11-18');
  assert.deepEqual(rows.map((r) => r.urgent), [true, false]);
});

test('limit 3', () => {
  const list = ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-25', '2026-12-01'].map((x, i) => d(`s${i}`, x));
  const rows = pickDeadlines(list, '2026-11-18');
  assert.deepEqual(rows.map((r) => r.slug), ['s0', 's1', 's2']);
});

test('days across month end', () => {
  assert.equal(pickDeadlines([d('a', '2026-12-01')], '2026-11-30')[0].days, 1);
});

test('todayLocal uses local date', () => {
  assert.equal(todayLocal(new Date(2026, 0, 5, 0, 30)), '2026-01-05');
});
