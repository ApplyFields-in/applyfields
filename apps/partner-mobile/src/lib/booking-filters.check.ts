// Run: node --experimental-strip-types src/lib/booking-filters.check.ts
import assert from 'node:assert/strict';

import { matchesFilter, matchesSearch } from './booking-filters.ts';

const now = new Date(2026, 10, 4, 10, 0); // 4 Nov 2026, 10:00 local
const at = (d: number, h = 11) => new Date(2026, 10, d, h, 0).toISOString();

assert.ok(matchesFilter({ status: 'accepted', appointment_at: at(4) }, 'today', now));
assert.ok(matchesFilter({ status: 'new', appointment_at: at(4, 23) }, 'today', now), 'late tonight is still today');
assert.ok(!matchesFilter({ status: 'completed', appointment_at: at(4) }, 'today', now), 'finished jobs leave Today');
assert.ok(matchesFilter({ status: 'accepted', appointment_at: at(5) }, 'upcoming', now));
assert.ok(!matchesFilter({ status: 'accepted', appointment_at: at(3) }, 'upcoming', now), 'past slots are not upcoming');
assert.ok(!matchesFilter({ status: 'new', appointment_at: null }, 'upcoming', now), 'walk-ins have no date');
assert.ok(matchesFilter({ status: 'new', appointment_at: null }, 'active', now));
assert.ok(matchesFilter({ status: 'rejected', appointment_at: null }, 'closed', now));

assert.ok(matchesSearch('', ['anything']));
assert.ok(matchesSearch('ramesh', ['K. Sai Ramesh']));
assert.ok(matchesSearch('98480 22', ['+91 98480 22338']), 'phone matches across spaces');
assert.ok(matchesSearch('af-1a2b', ['AF-1A2B']));
assert.ok(!matchesSearch('pan', [null, 'Caste certificate']));
console.log('booking-filters: ok');
