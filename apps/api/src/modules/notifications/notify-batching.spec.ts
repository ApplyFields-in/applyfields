import { afterEach, describe, expect, it, vi } from 'vitest';
import { NOTIFY_CHUNK, NotificationsService, type NotifyItem } from './notifications.service.js';

/** 1 lakh users must go out in batches, not one database round trip and one HTTP call per user. */
describe('notifyMany batching', () => {
  afterEach(() => vi.unstubAllGlobals());

  function setup(userCount: number) {
    const ids = Array.from({ length: userCount }, (_, i) => `u${i}`);
    const created: any[] = [];
    const prisma: any = {
      users: { findMany: vi.fn(async (a: any) => a.where.id.in.map((id: string) => ({ id }))) },
      notification_preferences: { findMany: vi.fn(async () => [{ user_id: 'u1', push_enabled: false, muted_types: [] }]) },
      notifications: {
        createManyAndReturn: vi.fn(async (a: any) => {
          const rows = a.data.map((d: any, i: number) => ({ id: `n-${created.length + i}`, ...d }));
          created.push(...rows);
          return rows;
        }),
      },
      push_subscriptions: {
        findMany: vi.fn(async (a: any) =>
          a.where.user_id.in.map((id: string) => ({ id: `s-${id}`, user_id: id, endpoint: `ExponentPushToken[${id}]`, p256dh: 'android', auth: 'expo' })),
        ),
        deleteMany: vi.fn(async () => ({ count: 0 })),
      },
      notification_deliveries: { createMany: vi.fn(async (a: any) => ({ count: a.data.length })) },
    };
    const sse = { sendToUser: vi.fn() };
    const svc = new NotificationsService(prisma, {} as any, sse as any);
    const items: NotifyItem[] = ids.map((id) => ({
      userId: id,
      key: `k:${id}`,
      n: { type: 'system', title: `Hi ${id}`, body: null, link: '/' },
    }));
    // Expo answers one ok ticket per message in the request.
    const fetchMock = vi.fn(async (_url: string, init: any) => {
      const n = JSON.parse(init.body).length;
      return new Response(JSON.stringify({ data: Array.from({ length: n }, () => ({ status: 'ok' })) }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    return { svc, prisma, sse, items, fetchMock };
  }

  it('creates notifications in chunks and pushes to phones 100 per request', async () => {
    const { svc, prisma, sse, items, fetchMock } = setup(2500);
    expect(await svc.notifyMany(items)).toBe(2500);
    await svc.flushPush();

    expect(prisma.notifications.createManyAndReturn).toHaveBeenCalledTimes(Math.ceil(2500 / NOTIFY_CHUNK));
    expect(sse.sendToUser).toHaveBeenCalledTimes(2500);
    // u1 switched push off → 2499 phones, 100 per Expo request.
    expect(fetchMock).toHaveBeenCalledTimes(Math.ceil(2499 / 100));
    const delivered = prisma.notification_deliveries.createMany.mock.calls.reduce((s: number, c: any) => s + c[0].data.length, 0);
    expect(delivered).toBe(2499);
  });

  it('keeps each user’s own title through to the push message', async () => {
    const { svc, items, fetchMock } = setup(3);
    await svc.notifyMany(items);
    await svc.flushPush();
    const sent = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(sent.map((m: any) => [m.to, m.title])).toEqual([
      ['ExponentPushToken[u0]', 'Hi u0'],
      ['ExponentPushToken[u2]', 'Hi u2'],
    ]);
  });

  it('in-app only (push: false) writes the inbox rows but sends no push', async () => {
    const { svc, sse, items, fetchMock } = setup(3);
    expect(await svc.notifyMany(items.map((i) => ({ ...i, n: { ...i.n, push: false } })))).toBe(3);
    await svc.flushPush();
    expect(sse.sendToUser).toHaveBeenCalledTimes(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('with Redis on, adds one push job per chunk and sends nothing in-process', async () => {
    const { svc, items, fetchMock } = setup(2500);
    const add = vi.fn(async () => ({}));
    (svc as any).redisQueue = { add };
    await svc.notifyMany(items);
    await svc.flushPush();
    expect(add).toHaveBeenCalledTimes(Math.ceil(2500 / NOTIFY_CHUNK));
    expect(add.mock.calls.reduce((n: number, c: any) => n + c[1].rows.length, 0)).toBe(2499); // u1 has push off
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to in-process push when Redis is unreachable', async () => {
    const { svc, items, fetchMock } = setup(3);
    (svc as any).redisQueue = { add: vi.fn(async () => { throw new Error('ECONNREFUSED'); }) };
    await svc.notifyMany(items);
    await svc.flushPush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('skips a daily message for users who switched it off, by its switch, not its type', async () => {
    const { svc, prisma, items } = setup(3);
    prisma.notification_preferences.findMany = vi.fn(async () => [
      { user_id: 'u0', push_enabled: true, muted_types: ['daily_morning'] },
      { user_id: 'u2', push_enabled: true, muted_types: ['system'] }, // 'system' can't be muted
    ]);
    const morning = items.map((i) => ({ ...i, n: { ...i.n, mute_key: 'daily_morning' as const } }));
    expect(await svc.notifyMany(morning)).toBe(2);
    expect(prisma.notifications.createManyAndReturn.mock.calls[0][0].data.map((d: any) => d.user_id)).toEqual(['u1', 'u2']);
    await svc.flushPush();
  });
});
