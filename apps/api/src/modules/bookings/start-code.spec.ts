import { describe, expect, it, vi } from 'vitest';
import { BookingsService } from './bookings.service.js';
import { START_CODE_MAX_WRONG, startCode, startCodeMatches } from './start-code.js';

const ID = '123e4567-e89b-12d3-a456-426614174000';
const PARTNER = 'p-1';

/** Partner desk changing a citizen's booking: the start code gates "start", and "complete" needs a start. */
describe('booking start code', () => {
  it('is 4 digits, stable per booking, different across bookings', () => {
    expect(startCode(ID)).toMatch(/^\d{4}$/);
    expect(startCode(ID)).toBe(startCode(ID));
    const others = new Set(Array.from({ length: 50 }, (_, i) => startCode(`${ID.slice(0, -2)}${String(i).padStart(2, '0')}`)));
    expect(others.size).toBeGreaterThan(40);
    expect(startCodeMatches(ID, startCode(ID))).toBe(true);
    expect(startCodeMatches(ID, '12345')).toBe(false);
  });

  function setup(status: string, userId: string | null = 'citizen-1', wrongSoFar = 0) {
    const events: any[] = [];
    const prisma: any = {
      partner_members: { findFirst: vi.fn(async () => ({ partner_id: PARTNER })) },
      service_requests: {
        findUnique: vi.fn(async () => ({ id: ID, partner_id: PARTNER, user_id: userId, status })),
        update: vi.fn(async (a: any) => ({ id: ID, partner_id: PARTNER, user_id: userId, ...a.data })),
      },
      service_request_events: {
        count: vi.fn(async () => wrongSoFar + events.filter((e) => e.note === 'Wrong start code entered').length),
        create: vi.fn(async (a: any) => events.push(a.data)),
      },
    };
    prisma.$transaction = (fn: any) => fn(prisma);
    const svc = new BookingsService(prisma);
    vi.spyOn(svc as any, 'mapToDetail').mockImplementation((r: any) => r);
    return { svc, prisma, events };
  }

  it('starts with the right code', async () => {
    const { svc, prisma } = setup('accepted');
    await svc.updatePartnerBooking('desk', ID, { status: 'in_progress', start_code: startCode(ID) });
    expect(prisma.service_requests.update).toHaveBeenCalled();
  });

  it('refuses a missing or wrong code, and logs the wrong one', async () => {
    const { svc, prisma, events } = setup('accepted');
    await expect(svc.updatePartnerBooking('desk', ID, { status: 'in_progress' })).rejects.toThrow('4-digit start code');
    const wrong = startCode(ID) === '0000' ? '1111' : '0000';
    await expect(svc.updatePartnerBooking('desk', ID, { status: 'in_progress', start_code: wrong })).rejects.toThrow('not right');
    expect(events).toHaveLength(1);
    expect(prisma.service_requests.update).not.toHaveBeenCalled();
  });

  it('locks after too many wrong codes, even for the right one', async () => {
    const { svc } = setup('accepted', 'citizen-1', START_CODE_MAX_WRONG);
    await expect(
      svc.updatePartnerBooking('desk', ID, { status: 'in_progress', start_code: startCode(ID) }),
    ).rejects.toThrow('Too many wrong start codes');
  });

  it('cannot complete a booking that never started', async () => {
    const { svc, prisma } = setup('accepted');
    await expect(svc.updatePartnerBooking('desk', ID, { status: 'completed' })).rejects.toThrow('Start the booking first');
    expect(prisma.service_requests.update).not.toHaveBeenCalled();
  });

  it('walk-ins (no citizen account) need no code', async () => {
    const { svc, prisma } = setup('accepted', null);
    await svc.updatePartnerBooking('desk', ID, { status: 'completed' });
    expect(prisma.service_requests.update).toHaveBeenCalled();
  });

  it('shows the code only to the citizen who booked, and only before the start', async () => {
    const make = (status: string) => {
      const prisma: any = {
        service_requests: { findUnique: vi.fn(async () => ({ id: ID, partner_id: PARTNER, user_id: 'citizen-1', status })) },
        partner_members: { findFirst: vi.fn(async () => ({ partner_id: PARTNER })) },
      };
      const svc = new BookingsService(prisma);
      vi.spyOn(svc as any, 'mapToDetail').mockImplementation((r: any) => ({ id: r.id, status: r.status }));
      vi.spyOn(svc as any, 'isPartnerMember').mockResolvedValue(true);
      return svc;
    };
    expect((await make('accepted').getUserBooking('citizen-1', ID)).start_code).toBe(startCode(ID));
    expect((await make('accepted').getUserBooking('partner-desk', ID)).start_code).toBeUndefined();
    expect((await make('accepted').getUserBooking(null, ID)).start_code).toBeUndefined();
    expect((await make('in_progress').getUserBooking('citizen-1', ID)).start_code).toBeNull();
  });
});
