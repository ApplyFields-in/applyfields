import { describe, expect, it, vi } from 'vitest';
import { BookingsService } from './bookings.service.js';

const BOOKING = '11111111-1111-1111-1111-111111111111';

function setup(openTicket: unknown = null) {
  const created: { data?: any } = {};
  const prisma: any = {
    service_requests: {
      findUnique: vi.fn().mockResolvedValue({ id: BOOKING, user_id: 'citizen-1' }),
    },
    support_tickets: {
      findFirst: vi.fn().mockResolvedValue(openTicket),
      create: vi.fn().mockImplementation(({ data }) => {
        created.data = data;
        return Promise.resolve({ id: 't1', status: 'open', created_at: new Date(), resolved_at: null, ...data });
      }),
    },
  };
  return { service: new BookingsService(prisma), prisma, created };
}

describe('booking disputes', () => {
  it('stores a complaint against the booking and reads it back', async () => {
    const { service, created } = setup();
    const d = await service.createDispute('citizen-1', BOOKING, {
      reason: 'Overcharged',
      details: 'Charged ₹50 more than the rate card.',
      claim_paise: 5000,
    });
    expect(created.data).toMatchObject({ category: 'booking_dispute', subject: `booking:${BOOKING}`, user_id: 'citizen-1' });
    expect(d).toMatchObject({ booking_id: BOOKING, reason: 'Overcharged', claim_paise: 5000, status: 'open' });
  });

  it("refuses someone else's booking and a second open complaint", async () => {
    await expect(
      setup().service.createDispute('someone-else', BOOKING, { reason: 'x', details: 'long enough text' }),
    ).rejects.toThrow('not found');
    await expect(
      setup({ id: 'old' }).service.createDispute('citizen-1', BOOKING, { reason: 'x', details: 'long enough text' }),
    ).rejects.toThrow('already have an open complaint');
  });
});
