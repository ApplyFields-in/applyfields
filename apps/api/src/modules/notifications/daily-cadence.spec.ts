import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

/** The 2 PM "Deadline Alert" only goes out when a published opportunity really closes this week. */
describe('runDailyCadence afternoon', () => {
  function setup(closing: any | null) {
    const prisma: any = {
      users: {
        findMany: vi.fn(async () => [
          { id: 'u1', user_profiles: { full_name: 'Likhith Kumar' } },
          { id: 'u2', user_profiles: null },
        ]),
      },
      opportunities: {
        // The closing-this-week query is the one filtered on application_end.
        findFirst: vi.fn(async (args: any) => (args.where.application_end ? closing : null)),
      },
      careers: { findFirst: vi.fn(async () => null) },
    };
    const svc = new NotificationsService(prisma, {} as any, {} as any);
    const notify = vi.spyOn(svc, 'notifyMany').mockImplementation(async (items) => items.length);
    return { svc, notify };
  }

  it('sends nothing when nothing closes this week', async () => {
    const { svc, notify } = setup(null);
    expect(await svc.runDailyCadence('afternoon')).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it('names the real closing opportunity and its date', async () => {
    const job = { id: 'job-1', slug: 'ssc-cgl', type: 'govt_job', title: 'SSC CGL', application_end: new Date('2026-11-21') };
    const { svc, notify } = setup(job);
    expect(await svc.runDailyCadence('afternoon')).toBe(2);
    // One batched call for everyone; each user gets their own name.
    expect(notify).toHaveBeenCalledTimes(1);
    const [items] = notify.mock.calls[0];
    expect(items.map((i) => i.userId)).toEqual(['u1', 'u2']);
    expect(items[1].n.title).toBe('Deadline Alert, Friend ⏳');
    expect(items[0].key).toMatch(/^daily_cadence:afternoon:\d{4}-\d{2}-\d{2}:u1$/);
    expect(items[0].n).toMatchObject({
      type: 'closing_reminder',
      title: 'Deadline Alert, Likhith ⏳',
      body: "SSC CGL closes on 2026-11-21! Don't miss your chance to apply.",
      link: '/jobs/ssc-cgl',
      item_id: 'job-1',
    });
  });
});
