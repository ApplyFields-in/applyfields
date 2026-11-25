// Website links → app routes. Run: pnpm --filter @applyfields/mobile test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { redirectSystemPath } from '../src/lib/deep-link.ts';

const go = (path) => redirectSystemPath({ path, initial: true });

test('job, exam, scholarship and admission links open the opportunity screen', () => {
  assert.equal(go('https://applyfields.com/jobs/ssc-cgl-2026'), '/opportunity/ssc-cgl-2026');
  assert.equal(go('https://applyfields.com/exams/neet-ug?utm_source=whatsapp'), '/opportunity/neet-ug');
  assert.equal(go('https://applyfields.com/scholarships/nsp'), '/opportunity/nsp');
  assert.equal(go('applyfields://admissions/iit-jam'), '/opportunity/iit-jam');
});

test('college and service links', () => {
  assert.equal(go('https://applyfields.com/career/colleges/jntu-kakinada'), '/college/jntu-kakinada');
  assert.equal(go('https://applyfields.com/services/passport'), '/service/passport');
});

test('other website pages open home; app paths pass through', () => {
  assert.equal(go('https://applyfields.com/about'), '/');
  assert.equal(go('https://applyfields.com'), '/');
  assert.equal(go('/opportunity/x'), '/opportunity/x');
  assert.equal(go('exp://192.168.1.5:8081/--/opportunity/x'), 'exp://192.168.1.5:8081/--/opportunity/x');
});

test('notifications open the right screen', async () => {
  const { notificationRoute } = await import('../src/lib/deep-link.ts');
  const id = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(notificationRoute(`https://service.applyfields.com/bookings/${id}?chat=1`), `/chat/${id}`);
  assert.equal(notificationRoute(`https://service.applyfields.com/bookings/${id}`), '/bookings');
  assert.equal(notificationRoute('https://service.applyfields.com/my-bookings'), '/bookings');
  assert.equal(notificationRoute('/jobs/ssc-cgl-2026'), '/opportunity/ssc-cgl-2026');
  assert.equal(notificationRoute('/services/passport'), '/service/passport');
  assert.equal(notificationRoute('/notifications'), null);
  assert.equal(notificationRoute(null), null);
});
