// Run: node --experimental-strip-types src/lib/notification-route.check.ts
import assert from 'node:assert/strict';

import { notificationRoute } from './notification-route.ts';

const id = '123e4567-e89b-12d3-a456-426614174000';
assert.deepEqual(notificationRoute(`https://applyfields.vercel.app/messages?booking=${id}`), {
  pathname: '/chat/[id]',
  params: { id },
});
assert.deepEqual(notificationRoute(`https://service.applyfields.com/bookings/${id}`), {
  pathname: '/booking/[id]',
  params: { id },
});
assert.equal(notificationRoute('https://applyfields.vercel.app/dashboard'), null, 'approval notices open Alerts');
assert.equal(notificationRoute('https://applyfields.vercel.app/messages'), null);
assert.equal(notificationRoute(null), null);

console.log('notification-route: ok');
