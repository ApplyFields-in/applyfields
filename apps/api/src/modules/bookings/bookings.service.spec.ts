import { describe, expect, it, vi } from 'vitest';
import {
  BookingsService,
  createBookingSchema,
  createReviewSchema,
  decodeSlip,
  markFiledSchema,
  updateBookingStatusSchema,
} from './bookings.service.js';

describe('Bookings Schemas Validation', () => {
  describe('createBookingSchema', () => {
    it('validates a valid booking request', () => {
      const parsed = createBookingSchema.parse({
        partner_id: '123e4567-e89b-12d3-a456-426614174000',
        user_note: 'Need help submitting TSPSC Group 1 form.',
        contact_phone: '9848012345',
      });
      expect(parsed.partner_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(parsed.user_note).toBe('Need help submitting TSPSC Group 1 form.');
    });

    it('rejects invalid uuid', () => {
      expect(
        createBookingSchema.safeParse({
          partner_id: 'invalid-uuid',
        }).success,
      ).toBe(false);
    });

    it('rejects invalid phone format', () => {
      expect(
        createBookingSchema.safeParse({
          partner_id: '123e4567-e89b-12d3-a456-426614174000',
          contact_phone: '1234',
        }).success,
      ).toBe(false);
    });
  });

  describe('updateBookingStatusSchema', () => {
    it('validates valid status transition and pricing quote', () => {
      const parsed = updateBookingStatusSchema.parse({
        status: 'accepted',
        quoted_paise: 5000,
        partner_note: 'Please bring Aadhaar and 10th marks memo.',
      });
      expect(parsed.status).toBe('accepted');
      expect(parsed.quoted_paise).toBe(5000);
    });

    it('rejects invalid status', () => {
      expect(
        updateBookingStatusSchema.safeParse({
          status: 'unknown_status',
        }).success,
      ).toBe(false);
    });

    it('rejects negative quoted amount', () => {
      expect(
        updateBookingStatusSchema.safeParse({
          status: 'accepted',
          quoted_paise: -50,
        }).success,
      ).toBe(false);
    });
  });

  describe('createReviewSchema', () => {
    it('accepts valid 1-5 rating', () => {
      const parsed = createReviewSchema.parse({
        rating: 5,
        comment: 'Very helpful and quick form submission.',
      });
      expect(parsed.rating).toBe(5);
    });

    it('rejects rating outside 1-5', () => {
      expect(createReviewSchema.safeParse({ rating: 0 }).success).toBe(false);
      expect(createReviewSchema.safeParse({ rating: 6 }).success).toBe(false);
    });
  });
});

describe('BookingsService Logic', () => {
  it('creates booking with initial event in transaction', async () => {
    const mockPartner = { id: 'partner-1', business_name: 'Sri Sai MeeSeva' };
    const mockCreatedBooking = {
      id: 'booking-1',
      user_id: 'user-1',
      partner_id: 'partner-1',
      status: 'new',
      partners: mockPartner,
      partner_services: null,
      service_request_events: [
        {
          id: 'ev-1',
          request_id: 'booking-1',
          from_status: null,
          to_status: 'new',
          note: 'Assistance request submitted by citizen.',
          created_at: new Date(),
        },
      ],
      partner_reviews: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockPrisma: any = {
      partners: {
        findUnique: vi.fn().mockResolvedValue(mockPartner),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        const tx = {
          service_requests: {
            create: vi.fn().mockResolvedValue(mockCreatedBooking),
          },
          service_request_events: {
            create: vi.fn().mockResolvedValue({ id: 'ev-1' }),
          },
        };
        return callback(tx);
      }),
    };

    const service = new BookingsService(mockPrisma);
    const result = await service.createBooking('user-1', {
      partner_id: '123e4567-e89b-12d3-a456-426614174000',
      user_note: 'Please help',
    });

    expect(result.id).toBe('booking-1');
    expect(result.status).toBe('new');
    expect(result.events).toHaveLength(1);
    expect(result.partner_business_name).toBe('Sri Sai MeeSeva');
  });

  it('rejects cancellation when booking is already completed', async () => {
    const mockPrisma: any = {
      service_requests: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'booking-1',
          user_id: 'user-1',
          status: 'completed',
        }),
      },
    };

    const service = new BookingsService(mockPrisma);
    await expect(service.cancelUserBooking('user-1', 'booking-1', 'Changed mind')).rejects.toThrow(
      'Cannot cancel booking in status "completed"',
    );
  });

  it('rejects review if booking is not completed', async () => {
    const mockPrisma: any = {
      service_requests: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'booking-1',
          user_id: 'user-1',
          status: 'in_progress',
        }),
      },
    };

    const service = new BookingsService(mockPrisma);
    await expect(
      service.reviewBooking('user-1', 'booking-1', { rating: 5 }),
    ).rejects.toThrow('You can only review completed assistance requests.');
  });
});

describe('Mark filed (official app number + acknowledgment slip)', () => {
  const pdf = Buffer.from('%PDF-1.7 test').toString('base64');
  const input = {
    official_app_number: 'MVA-2026-98741',
    slip_base64: `data:application/pdf;base64,${pdf}`,
    slip_mime_type: 'application/pdf' as const,
  };

  function setup(member: boolean, status = 'in_progress') {
    const update = vi.fn().mockImplementation(async ({ data }) => ({
      id: 'booking-1', user_id: 'citizen-1', partner_id: 'p-1', status: data.status,
      completed_at: data.completed_at, official_app_number: data.official_app_number,
      acknowledgment_slip_url: data.acknowledgment_slip_url, service_request_events: [], partner_reviews: null,
      created_at: new Date(), updated_at: new Date(),
    }));
    const prisma: any = {
      service_requests: {
        findUnique: vi.fn().mockResolvedValue({ id: 'booking-1', user_id: 'citizen-1', partner_id: 'p-1', status }),
      },
      partner_members: { findFirst: vi.fn().mockResolvedValue(member ? { user_id: 'op-1' } : null) },
      $transaction: vi.fn().mockImplementation(async (fn) =>
        fn({ service_requests: { update }, service_request_events: { create: vi.fn() } }),
      ),
    };
    const storage: any = { documentsBucket: 'documents', upload: vi.fn().mockImplementation(async (_b, p) => p) };
    const notifications: any = { notify: vi.fn().mockResolvedValue(1) };
    return { service: new BookingsService(prisma, storage, notifications), storage, notifications, update };
  }

  it('stores the slip, completes the request and notifies the citizen', async () => {
    const { service, storage, notifications } = setup(true);
    const res = await service.markFiled('op-1', 'booking-1', input);
    expect(res.status).toBe('completed');
    expect(res.official_app_number).toBe('MVA-2026-98741');
    expect(res.has_acknowledgment_slip).toBe(true);
    expect(storage.upload.mock.calls[0][1]).toMatch(/^acknowledgments\/booking-1\/\d+\.pdf$/);
    expect(notifications.notify).toHaveBeenCalledWith(
      ['citizen-1'],
      expect.objectContaining({ type: 'request_update', link: expect.stringMatching(/^https?:\/\/.+\/bookings\/booking-1$/) }),
      expect.any(Function),
    );
  });

  it('refuses operators from another centre', async () => {
    const { service, storage } = setup(false);
    await expect(service.markFiled('op-2', 'booking-1', input)).rejects.toThrow('not found or unauthorized');
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('refuses an already completed request', async () => {
    const { service } = setup(true, 'completed');
    await expect(service.markFiled('op-1', 'booking-1', input)).rejects.toThrow('already completed');
  });

  it('rejects a file whose bytes are not the declared type', () => {
    expect(() => decodeSlip(Buffer.from('<html>').toString('base64'), 'application/pdf')).toThrow('does not match');
  });

  it('validates the application number format', () => {
    expect(markFiledSchema.safeParse({ ...input, official_app_number: 'MVA-2026-98741' }).success).toBe(true);
    expect(markFiledSchema.safeParse({ ...input, official_app_number: '<script>' }).success).toBe(false);
  });
});
