import { describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

/** Staff alerts reach the given roles plus admins, as an unmutable `system` notification linking to the admin site. */
describe('notifyStaff', () => {
  it('targets the roles + admins (deduped) and links to the admin website', async () => {
    const findMany = vi.fn(async () => [{ user_id: 'support-1' }, { user_id: 'admin-1' }, { user_id: 'admin-1' }]);
    const svc = new NotificationsService({ user_roles: { findMany } } as any, {} as any, {} as any);
    const notify = vi.spyOn(svc, 'notify').mockResolvedValue(2);
    process.env.ADMIN_URL = 'https://admin.example.in/';

    expect(await svc.notifyStaff(['support'], { title: 'T', body: 'B', path: '/disputes' }, 'k1')).toBe(2);

    const where = (findMany.mock.calls[0] as any)[0].where;
    expect(where.role.in.sort()).toEqual(['admin', 'super_admin', 'support']);
    expect(where.users_user_roles_user_idTousers).toEqual({ status: 'active' });
    const [users, payload, key] = notify.mock.calls[0];
    expect(users).toEqual(['support-1', 'admin-1']);
    expect(payload).toEqual({ type: 'system', title: 'T', body: 'B', link: 'https://admin.example.in/disputes' });
    expect((key as (u: string) => string)('support-1')).toBe('k1');
    delete process.env.ADMIN_URL;
  });

  it('sends nothing when there are no staff', async () => {
    const svc = new NotificationsService({ user_roles: { findMany: async () => [] } } as any, {} as any, {} as any);
    const notify = vi.spyOn(svc, 'notify');
    expect(await svc.notifyStaff(['reviewer'], { title: 'T', body: 'B', path: '/review' }, 'k')).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });
});
