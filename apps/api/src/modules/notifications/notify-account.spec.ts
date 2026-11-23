import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';
import { senderFor } from './email.js';

describe('notifyAccount (partner decisions)', () => {
  const setup = (created: number) => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma: any = {
      notifications: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'n1', user_id: 'owner' },
          { id: 'n2', user_id: 'staff-muted-email' },
        ]),
      },
      notification_preferences: { findMany: vi.fn().mockResolvedValue([{ user_id: 'staff-muted-email' }]) },
      notification_deliveries: { createMany },
    };
    const svc = new NotificationsService(prisma, {} as any, {} as any);
    vi.spyOn(svc, 'notify').mockResolvedValue(created);
    const kick = vi.spyOn(svc, 'kick').mockImplementation(() => {});
    return { svc, prisma, createMany, kick };
  };
  const n = { type: 'system' as const, title: 'Approved', body: null, link: null };

  it('queues one email per verified address, skipping people who turned email off', async () => {
    const { svc, prisma, createMany, kick } = setup(2);
    await svc.notifyAccount(['owner', 'staff-muted-email'], n, 'partner_status:p1:verified:1');
    // Only verified emails are even considered.
    expect(prisma.notifications.findMany.mock.calls[0][0].where.users).toEqual({
      email: { not: null },
      email_verified_at: { not: null },
    });
    expect(createMany).toHaveBeenCalledWith({ data: [{ notification_id: 'n1', channel: 'email' }] });
    expect(kick).toHaveBeenCalled();
  });

  it('sends nothing again when the decision was already announced', async () => {
    const { svc, createMany } = setup(0);
    await svc.notifyAccount(['owner'], n, 'partner_status:p1:verified:1');
    expect(createMany).not.toHaveBeenCalled();
  });

  it('partner decision emails come from the Partners sender', () => {
    expect(senderFor('system', 'partner_status:p1:verified:1')).toBe('partners');
  });
});
