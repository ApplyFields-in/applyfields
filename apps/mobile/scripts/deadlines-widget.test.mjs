// The "Closing soon" widget rules, in plain Node (24+ strips the TypeScript types).
// Run: pnpm --filter @applyfields/mobile test
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { dayLabel, fromSaved, parseCache, pickDeadlines, settleWidget, todayLocal } from '../src/widgets/deadlines.ts';

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

// settleWidget runs after the /saved fetch; signedIn is the token check made AFTER it, so a
// sign-out during the fetch never writes or draws the previous account's list.
const T = '2026-11-18';
test('signed out after fetch: signed-out state, cache cleared, fetched list ignored', () => {
  assert.deepEqual(settleWidget(false, [d('a', '2026-11-20')], [d('b', '2026-11-21')], T), {
    state: { kind: 'signed_out' },
    cache: 'clear',
  });
});

test('fetched list is drawn and written', () => {
  const r = settleWidget(true, [d('a', '2026-11-20')], [d('b', '2026-11-21')], T);
  assert.equal(r.cache, 'write');
  assert.deepEqual(r.state.rows.map((x) => x.slug), ['a']);
});

test('fetch failed: cached rows drawn, cache kept', () => {
  const r = settleWidget(true, null, [d('b', '2026-11-21')], T);
  assert.equal(r.cache, 'keep');
  assert.deepEqual(r.state.rows.map((x) => x.slug), ['b']);
});

test('fetch failed and no cache: error state', () => {
  assert.deepEqual(settleWidget(true, null, null, T), { state: { kind: 'error' }, cache: 'keep' });
});

test('parseCache accepts only a list of deadlines', () => {
  assert.equal(parseCache('{'), null);
  assert.equal(parseCache('{"slug":"a"}'), null);
  assert.equal(parseCache('[{"slug":1,"title":"t","lastDate":"2026-11-20"}]'), null);
  assert.deepEqual(parseCache('[{"slug":"a","title":"t","lastDate":"2026-11-20"}]'), [
    { slug: 'a', title: 't', lastDate: '2026-11-20' },
  ]);
});

// The widget library calls components as plain functions, outside a React render, so React
// Compiler memo hooks (`_c` from react/compiler-runtime) throw there. app.json turns the compiler on.
test('widget layout is not touched by the React Compiler', () => {
  const app = createRequire(new URL('../package.json', import.meta.url));
  const preset = createRequire(createRequire(app.resolve('expo/package.json')).resolve('babel-preset-expo'));
  const file = fileURLToPath(new URL('../src/widgets/DeadlinesWidget.tsx', import.meta.url));
  const { code } = preset('@babel/core').transformFileSync(file, {
    babelrc: false,
    configFile: false,
    plugins: [
      preset.resolve('babel-plugin-react-compiler'),
      [preset.resolve('@babel/plugin-syntax-typescript'), { isTSX: true }],
    ],
  });
  assert.doesNotMatch(code, /compiler-runtime/);
});
