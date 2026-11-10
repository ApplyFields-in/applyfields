import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

/** "Remind me when applications open" (Plus): sent once the job opens, only to users still on Plus. */
describe('runOpenReminders', () => {
  const today = new Date('2026-11-10T00:00:00Z');

  function setup(openJobs: any[]) {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const prisma: any = {
      reminders: {
        findMany: vi.fn(async () => [
          { user_id: 'plus-user', item_id: 'job-1' },
          { user_id: 'lapsed-user', item_id: 'job-1' },
          { user_id: 'plus-user', item_id: 'job-2' }, // job-2 not open yet → untouched
        ]),
        updateMany,
      },
      opportunities: { findMany: vi.fn(async () => openJobs) },
      subscriptions: { findMany: vi.fn(async () => [{ user_id: 'plus-user' }]) },
    };
    const svc = new NotificationsService(prisma, {} as any, {} as any);
    const notify = vi.spyOn(svc, 'notify').mockResolvedValue(1);
    return { svc, notify, updateMany };
  }

  it('notifies Plus users, marks sent, cancels lapsed users', async () => {
    const job = { id: 'job-1', slug: 'ssc-cgl', type: 'govt_job', title: 'SSC CGL', application_start: today, application_end: new Date('2026-12-01') };
    const { svc, notify, updateMany } = setup([job]);
    expect(await svc.runOpenReminders(today)).toBe(1);

    expect(notify).toHaveBeenCalledTimes(1);
    const [users, payload, key] = notify.mock.calls[0];
    expect(users).toEqual(['plus-user']);
    expect(payload).toMatchObject({ title: 'Applications are open: SSC CGL', link: '/jobs/ssc-cgl', item_id: 'job-1' });
    expect((key as (u: string) => string)('plus-user')).toBe('open_reminder:job-1');

    const calls = updateMany.mock.calls.map((c: any) => [c[0].where.user_id.in, c[0].data.status]);
    expect(calls).toEqual([
      [['plus-user'], 'sent'],
      [['lapsed-user'], 'cancelled'],
    ]);
  });

  it('does nothing while no job has opened', async () => {
    const { svc, notify, updateMany } = setup([]);
    expect(await svc.runOpenReminders(today)).toBe(0);
    expect(notify).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
});
