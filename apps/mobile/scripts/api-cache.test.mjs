// Which responses may live on the phone. Run: pnpm --filter @applyfields/mobile test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cacheable, cacheFileName } from '../src/lib/cacheable.ts';

test('public lists and detail pages are kept for offline opens', () => {
  for (const p of ['/opportunities', '/opportunities?type=job&deadline=closing_soon', '/opportunities/ssc-cgl-2026', '/services', '/career', '/career?category=it', '/career/colleges?limit=50']) {
    assert.ok(cacheable(p), p);
  }
});

test('personal data, searches and "eligible for me" never touch the disk', () => {
  for (const p of ['/opportunities/ssc-cgl-2026/eligibility', '/opportunities?eligible=true', '/opportunities?q=police', '/services?q=pan', '/notifications', '/saved', '/me/education', '/documents', '/saved/opportunity/x/open-reminder']) {
    assert.ok(!cacheable(p), p);
  }
});

test('file names are stable, short and safe', () => {
  const a = cacheFileName('te|/opportunities?type=job');
  assert.equal(a, cacheFileName('te|/opportunities?type=job'));
  assert.notEqual(a, cacheFileName('en|/opportunities?type=job'), 'each language has its own copy');
  assert.match(a, /^[a-z0-9]+\.json$/);
});
