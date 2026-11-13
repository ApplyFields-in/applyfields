// Run: pnpm --filter @applyfields/admin-mobile check
import assert from 'node:assert/strict';

import {
  ESCALATION_ROLES,
  GUIDE_VERIFY_ROLES,
  LOCK_AFTER_MS,
  alertRoute,
  canUse,
  departmentsForRoles,
  guideNeedsCheck,
  kycRows,
  loginId,
  shouldLock,
  tabsForRoles,
} from './staff.ts';

assert.deepEqual(departmentsForRoles(['super_admin']), ['apply', 'career', 'partners', 'services']);
assert.deepEqual(departmentsForRoles(['admin', 'support']), ['apply', 'career', 'partners', 'services']);
assert.deepEqual(departmentsForRoles(['support']), ['partners', 'services']);
assert.deepEqual(departmentsForRoles(['reviewer']), ['apply', 'career']);
assert.deepEqual(departmentsForRoles(['content_editor', 'support']), ['apply', 'career', 'partners', 'services']);
assert.deepEqual(departmentsForRoles([]), []);
assert.deepEqual(departmentsForRoles(['citizen']), []);

assert.equal(shouldLock(null, 1e12), false);
assert.equal(shouldLock(1000, 1000 + LOCK_AFTER_MS - 1), false);
assert.equal(shouldLock(1000, 1000 + LOCK_AFTER_MS), true);

assert.equal(loginId('  Staff@ApplyFields.COM '), 'staff@applyfields.com');
assert.equal(loginId(' 98765 43210 '), '98765 43210');

console.log('admin-mobile staff rules: ok');

// ---------- tabs = API @Roles ----------

assert.deepEqual(tabsForRoles(['super_admin']), ['pulse', 'kyc', 'queue', 'broadcast', 'account']);
assert.deepEqual(tabsForRoles(['admin']), ['pulse', 'kyc', 'queue', 'broadcast', 'account']);
assert.deepEqual(tabsForRoles(['reviewer']), ['pulse', 'queue', 'account']);
assert.deepEqual(tabsForRoles(['content_editor']), ['pulse', 'queue', 'account']);
assert.deepEqual(tabsForRoles(['support']), ['pulse', 'kyc', 'account']);
assert.deepEqual(tabsForRoles([]), []);
assert.equal(canUse(['admin'], ['super_admin']), false);
assert.equal(canUse(['super_admin'], ['super_admin']), true);
assert.equal(canUse(['reviewer'], ['admin']), false);

// ---------- KYC readiness ----------
const specs = [
  { kind: 'trade_license', label: 'Trade licence' },
  { kind: 'owner_id', label: 'Owner ID' },
  { kind: 'gst_certificate', label: 'GST', optional: true },
];
const doc = (id: string, kind: string, status: 'pending' | 'verified' | 'rejected', at: string) => ({
  id,
  document_kind: kind,
  status,
  created_at: at,
});
let k = kycRows(specs, []);
assert.equal(k.ready, false);
assert.deepEqual(k.rows.map((r) => r.state), ['missing', 'missing', 'missing']);
k = kycRows(specs, [doc('a', 'trade_license', 'verified', '2026-11-01'), doc('b', 'owner_id', 'verified', '2026-11-01')]);
assert.equal(k.ready, true, 'optional GST missing does not block');
// A newer re-upload replaces the old verified one and must be checked again.
k = kycRows(specs, [
  doc('a', 'trade_license', 'verified', '2026-11-01'),
  doc('c', 'trade_license', 'pending', '2026-11-03'),
  doc('b', 'owner_id', 'verified', '2026-11-01'),
]);
assert.equal(k.ready, false);
assert.equal(k.rows[0].doc?.id, 'c');
assert.deepEqual(k.blocking.map((r) => r.spec.kind), ['trade_license']);

console.log('admin-mobile tabs + KYC rules: ok');

// ---------- staff push links → screens ----------
const P = '3f9c2a10-1b2c-4d5e-8f90-0123456789ab';
assert.equal(alertRoute('https://applyfields-admin.vercel.app/disputes'), '/escalations');
assert.equal(alertRoute('https://admin.applyfields.com/review?x=1'), '/queue');
assert.equal(alertRoute(`https://applyfields-admin.vercel.app/partners/${P}`), `/kyc/${P}`);
assert.equal(alertRoute('https://applyfields-admin.vercel.app/partners/map'), null);
assert.equal(alertRoute('/somewhere-else'), null);
assert.equal(alertRoute(null), null);

// ---------- guide freshness ----------
const NOW = Date.UTC(2026, 10, 10);
assert.equal(guideNeedsCheck(null, NOW), true);
assert.equal(guideNeedsCheck(new Date(NOW - 10 * 86_400_000).toISOString(), NOW), false);
assert.equal(guideNeedsCheck(new Date(NOW - 91 * 86_400_000).toISOString(), NOW), true);
assert.equal(guideNeedsCheck('garbage', NOW), true);

// ---------- who sees what ----------
assert.equal(canUse(['support'], ESCALATION_ROLES), true);
assert.equal(canUse(['reviewer'], ESCALATION_ROLES), false);
assert.equal(canUse(['support'], GUIDE_VERIFY_ROLES), false);
assert.equal(canUse(['admin'], GUIDE_VERIFY_ROLES), true);

console.log('admin-mobile alerts + guides rules: ok');
