import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import 'dotenv/config';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

/**
 * Broad endpoint verification across every controller group in @applyfields/api:
 * - Public GET routes return 200 with expected JSON shapes
 * - Protected user/partner/admin endpoints enforce AuthGuard / RolesGuard (401 when unauthenticated)
 * - Public POST validation & chatbot/analytics endpoints respond without 5xx errors
 */
describe('All API Endpoints Verification (e2e)', { timeout: 60_000 }, () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it('GET / and GET /health return OK', async () => {
    await request(app.getHttpServer()).get('/').expect(200);
    const health = await request(app.getHttpServer()).get('/health').expect(200);
    expect(health.body).toHaveProperty('status', 'ok');
  });

  it('GET /home returns curated homepage sections', async () => {
    const res = await request(app.getHttpServer()).get('/home').expect(200);
    expect(res.body).toBeTypeOf('object');
  });

  it('GET /opportunities, /opportunities/trending, and /updates return 200', async () => {
    const list = await request(app.getHttpServer()).get('/opportunities').expect(200);
    expect(Array.isArray(list.body.items)).toBe(true);

    const trending = await request(app.getHttpServer()).get('/opportunities/trending').expect(200);
    expect(Array.isArray(trending.body.items)).toBe(true);

    const updates = await request(app.getHttpServer()).get('/updates').expect(200);
    expect(Array.isArray(updates.body.items)).toBe(true);

    if (list.body.items.length > 0) {
      const slug = list.body.items[0].slug as string;
      await request(app.getHttpServer()).get(`/opportunities/${slug}`).expect(200);
      await request(app.getHttpServer()).get(`/opportunities/${slug}/similar`).expect(200);
      await request(app.getHttpServer()).get(`/opportunities/${slug}/eligibility`).expect(200);
    }
  });

  it('GET /services, /partners/directory, /community/threads, /search, /chatbot/quota return 200', async () => {
    const services = await request(app.getHttpServer()).get('/services').expect(200);
    expect(services.body).toBeTypeOf('object');

    const partners = await request(app.getHttpServer()).get('/partners/directory').expect(200);
    expect(partners.body).toBeTypeOf('object');

    const threads = await request(app.getHttpServer()).get('/community/threads').expect(200);
    expect(threads.body).toBeTypeOf('object');

    await request(app.getHttpServer()).get('/search?q=ssc').expect(200);
    await request(app.getHttpServer()).get('/search/suggest?q=ssc').expect(200);
    await request(app.getHttpServer()).get('/search/typesense/health').expect(200);

    const quota = await request(app.getHttpServer()).get('/chatbot/quota').expect(200);
    expect(quota.body).toHaveProperty('daily_limit');

    await request(app.getHttpServer()).get('/notifications/push-public-key').expect(200);
  });

  it('POST /analytics/events and /chatbot/query respond cleanly', async () => {
    await request(app.getHttpServer())
      .post('/analytics/events')
      .send({ event_name: 'endpoint_smoke_test', session_id: 'e2e-session' })
      .expect(200);

    const chat = await request(app.getHttpServer())
      .post('/chatbot/query')
      .send({ query: 'Which exams are closing soon?', page_type: 'general' })
      .expect(200);
    expect(chat.body).toHaveProperty('answer');
  });

  it('Auth validation rejects invalid credentials/OTPs cleanly without 500', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'nonexistent-e2e@example.com', password: 'WrongPassword123!' });
    expect([400, 401]).toContain(loginRes.status);

    const verifyRes = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ target: 'nonexistent-e2e@example.com', purpose: 'verify_email', code: '000000' });
    expect([400, 401]).toContain(verifyRes.status);

    const resetRes = await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ target: 'nonexistent-e2e@example.com', code: '000000', newPassword: 'NewPassword123!' });
    expect([400, 401, 404]).toContain(resetRes.status);
  });

  it('Protected user, partner, and admin routes enforce 401 when unauthenticated', async () => {
    const protectedGets = [
      '/me',
      '/saved',
      '/applications',
      '/documents',
      '/bookings/my',
      '/bookings/partner/inbox',
      '/partners/me',
      '/partners/me/earnings',
      '/partners/me/services',
      '/partners/me/schedule',
      '/partners/me/conversations',
      '/notifications',
      '/notifications/preferences',
      '/digilocker/status',
      '/career/profile/me',
      '/career/guidance/history',
      '/career/colleges/my-enquiries',
      '/admin/me',
      '/admin/summary',
      '/admin/users',
      '/admin/bookings',
      '/admin/partners',
      '/admin/services',
      '/admin/opportunities',
      '/admin/updates',
      '/admin/reports',
      '/admin/analytics/funnel',
    ];

    for (const route of protectedGets) {
      await request(app.getHttpServer()).get(route).expect(401);
    }
  });
});
