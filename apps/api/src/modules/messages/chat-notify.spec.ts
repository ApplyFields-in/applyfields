import { describe, expect, it, vi } from 'vitest';
import { CHAT_NOTIFY_WINDOW_MS, MessagesService } from './messages.service.js';

const BOOKING = { id: 'b-1', partner_id: 'p-1', user_id: 'citizen-1' };

/** New chat message → the other side gets one in-app + push notification, at most once per window. */
describe('chat notifications', () => {
  function setup() {
    const prisma: any = {
      partner_members: {
        findMany: vi.fn(async () => [{ user_id: 'owner-1' }, { user_id: 'desk-2' }]),
      },
    };
    const notify = vi.fn(async (ids: string[], _n: any, _key: (uid: string) => string | null) => ids.length);
    const svc = new MessagesService(prisma, { notify } as any);
    return { svc, notify };
  }
  const keys = (notify: any, call = 0) =>
    notify.mock.calls[call][0].map((uid: string) => notify.mock.calls[call][2](uid));

  it('centre writes → only the citizen, linked to their booking chat', async () => {
    const { svc, notify } = setup();
    await svc.notifyNewMessage(BOOKING, 'partner', 'desk-2', 'Sai MeeSeva', 'Please bring 2 photos');
    expect(notify).toHaveBeenCalledTimes(1);
    const [ids, n] = notify.mock.calls[0];
    expect(ids).toEqual(['citizen-1']);
    expect(n.title).toBe('New message from Sai MeeSeva');
    expect(n.link).toMatch(/\/bookings\/b-1\?chat=1$/);
  });

  it('citizen writes → every centre member, linked to the partner inbox', async () => {
    const { svc, notify } = setup();
    await svc.notifyNewMessage(BOOKING, 'citizen', 'citizen-1', 'Ravi', 'My start code is 4821');
    expect(notify).toHaveBeenCalledTimes(1);
    const [ids, n] = notify.mock.calls[0];
    expect(ids).toEqual(['owner-1', 'desk-2']);
    expect(n.link).toMatch(/\/messages\?booking=b-1$/);
  });

  it('support writes → both sides', async () => {
    const { svc, notify } = setup();
    await svc.notifyNewMessage(BOOKING, 'system', 'staff-9', 'ApplyFields Support', 'We are looking into it');
    expect(notify.mock.calls.map((c) => c[0])).toEqual([['citizen-1'], ['owner-1', 'desk-2']]);
  });

  it('one notification per person per booking per window; long messages are trimmed', async () => {
    const { svc, notify } = setup();
    const t0 = 5 * CHAT_NOTIFY_WINDOW_MS;
    await svc.notifyNewMessage(BOOKING, 'partner', null, 'Centre', 'x'.repeat(300), t0);
    await svc.notifyNewMessage(BOOKING, 'partner', null, 'Centre', 'again', t0 + 60_000);
    await svc.notifyNewMessage(BOOKING, 'partner', null, 'Centre', 'later', t0 + CHAT_NOTIFY_WINDOW_MS);
    expect(keys(notify, 0)).toEqual(keys(notify, 1)); // same window → same dedupe key → no second row
    expect(keys(notify, 2)).not.toEqual(keys(notify, 0));
    expect(notify.mock.calls[0][1].body.length).toBe(138);
  });

  it('no citizen account (walk-in) → nobody on the citizen side', async () => {
    const { svc, notify } = setup();
    await svc.notifyNewMessage({ ...BOOKING, user_id: null }, 'partner', 'desk-2', 'Centre', 'hi');
    expect(notify).not.toHaveBeenCalled();
  });
});
