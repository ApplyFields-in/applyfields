// Run: pnpm --filter @applyfields/admin-mobile check
import assert from 'node:assert/strict';

import { LOCK_AFTER_MS, departmentsForRoles, loginId, shouldLock } from './staff.ts';

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
