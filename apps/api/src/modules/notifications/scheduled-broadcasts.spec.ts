import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

/** Festival greetings scheduled for later: sent once when due, never twice, failures recorded. */
describe('runScheduledBroadcasts', () => {
  function setup(claimable: Record<string, boolean>) {
    const input = (title: string) => ({ title, body: null, link: null, audience: { kind: 'staff' } });
    const prisma: any = {
      scheduled_broadcasts: {
        findMany: vi.fn(async () => [
          { id: 'a', input: input('Happy Sankranti'), created_by: 'admin' },
          { id: 'b', input: input('Taken by another worker'), created_by: 'admin' },
          { id: 'c', input: input('Breaks'), created_by: 'admin' },
        ]),
        updateMany: vi.fn(async (a: any) => ({ count: claimable[a.where.id] ? 1 : 0 })),
        update: vi.fn(async () => ({})),
      },
    };
    const svc = new NotificationsService(prisma, {} as any, {} as any);
    const broadcast = vi
      .spyOn(svc, 'broadcast')
      .mockImplementation(async (i: any) => {
        if (i.title === 'Breaks') throw new Error('No user with this email');
        return { notified: 7, push_sent: 3, scheduled_for: null };
      });
    return { svc, prisma, broadcast };
  }

  it('sends claimed rows with the row id as broadcast id, skips rows already claimed, records failures', async () => {
    const { svc, prisma, broadcast } = setup({ a: true, b: false, c: true });
    expect(await svc.runScheduledBroadcasts()).toBe(1);

    expect(broadcast).toHaveBeenCalledTimes(2);
    expect(broadcast.mock.calls[0][2]).toBe('a'); // dedupe keys use the row id → a re-run can't double-notify
    const updates = prisma.scheduled_broadcasts.update.mock.calls.map((c: any) => [c[0].where.id, c[0].data.status]);
    expect(updates).toEqual([
      ['a', 'sent'],
      ['c', 'failed'],
    ]);
    expect(prisma.scheduled_broadcasts.update.mock.calls[0][0].data.notified).toBe(7);
  });
});
