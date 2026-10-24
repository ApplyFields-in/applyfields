import { describe, expect, it, vi } from 'vitest';
import {
  createSlotOverrideSchema,
  dayScheduleSchema,
  holidayOverrideSchema,
  updatePartnerScheduleSchema,
} from '@applyfields/types';
import {
  formatSlotTimeRange,
  getPeriod,
  minutesToTime,
  partnerDirectoryQuerySchema,
  partnerRegisterSchema,
  partnerServiceInputSchema,
  PartnersService,
  partnerUpdateSchema,
  partnerVerifySchema,
  timeToMinutes,
} from './partners.service.js';

describe('Partner Schemas Validation', () => {
  describe('partnerDirectoryQuerySchema', () => {
    it('applies default limit and offset', () => {
      const parsed = partnerDirectoryQuerySchema.parse({});
      expect(parsed.limit).toBe(20);
      expect(parsed.offset).toBe(0);
    });

    it('parses valid directory filters', () => {
      const parsed = partnerDirectoryQuerySchema.parse({
        q: 'meeseva',
        state: 'tg',
        district: 'Hyderabad',
        pincode: '500060',
        type: 'meeseva',
        service: 'Aadhaar',
        limit: '15',
        offset: '30',
      });
      expect(parsed.q).toBe('meeseva');
      expect(parsed.state).toBe('tg');
      expect(parsed.district).toBe('Hyderabad');
      expect(parsed.pincode).toBe('500060');
      expect(parsed.type).toBe('meeseva');
      expect(parsed.service).toBe('Aadhaar');
      expect(parsed.limit).toBe(15);
      expect(parsed.offset).toBe(30);
    });
  });

  describe('partnerRegisterSchema', () => {
    const validRegistration = {
      business_name: 'Sri Sai MeeSeva Center',
      type: 'meeseva',
      owner_name: 'Ravi Kumar',
      phone: '9848012345',
      whatsapp: '9848012345',
      email: 'srisai@meeseva.in',
      address: 'Shop 4, Main Road, Dilsukhnagar',
      state_code: 'tg',
      district: 'Hyderabad',
      city: 'Hyderabad',
      pincode: '500060',
      service_areas: ['500060', '500036'],
      working_hours: { mon: ['09:00', '20:00'] },
      description:
        'Authorized MeeSeva & Online Citizen Application Facilitation Center',
    };

    it('validates a complete partner registration and normalizes state_code', () => {
      const parsed = partnerRegisterSchema.parse(validRegistration);
      expect(parsed.business_name).toBe('Sri Sai MeeSeva Center');
      expect(parsed.state_code).toBe('TG');
      expect(parsed.pincode).toBe('500060');
      expect(parsed.type).toBe('meeseva');
    });

    it('rejects invalid mobile number', () => {
      expect(
        partnerRegisterSchema.safeParse({
          ...validRegistration,
          phone: '12345',
        }).success,
      ).toBe(false);
    });

    it('rejects invalid pincode', () => {
      expect(
        partnerRegisterSchema.safeParse({
          ...validRegistration,
          pincode: '012345', // Starts with 0
        }).success,
      ).toBe(false);
    });

    it('rejects invalid partner type', () => {
      expect(
        partnerRegisterSchema.safeParse({
          ...validRegistration,
          type: 'unsupported_vendor',
        }).success,
      ).toBe(false);
    });
  });

  describe('partnerServiceInputSchema', () => {
    it('validates service rate card item', () => {
      const parsed = partnerServiceInputSchema.parse({
        name: 'PAN Card New Application',
        charge_paise: 5000,
        charge_text: '₹50 standard convenience fee',
        estimated_time_text: '15-20 mins',
        is_active: true,
      });
      expect(parsed.name).toBe('PAN Card New Application');
      expect(parsed.charge_paise).toBe(5000);
      expect(parsed.is_active).toBe(true);
    });

    it('rejects negative charge', () => {
      expect(
        partnerServiceInputSchema.safeParse({
          name: 'Free Service',
          charge_paise: -100,
        }).success,
      ).toBe(false);
    });
  });

  describe('partnerVerifySchema', () => {
    it('validates admin verification payload', () => {
      const parsed = partnerVerifySchema.parse({
        verification_status: 'verified',
        is_listed: true,
        reviewer_note:
          'Verified with official Meeseva center certificate ID 4819.',
      });
      expect(parsed.verification_status).toBe('verified');
      expect(parsed.is_listed).toBe(true);
    });
  });
});

describe('PartnersService Logic', () => {
  it('lists verified and listed directory partners', async () => {
    const mockPrisma: any = {
      partners: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'partner-uuid-1',
            slug: 'sri-sai-meeseva',
            type: 'meeseva',
            business_name: 'Sri Sai MeeSeva',
            description: 'Center',
            logo_url: null,
            owner_name: 'Ravi',
            phone: '9848012345',
            whatsapp: '9848012345',
            email: 'ravi@test.com',
            address: 'Shop 1',
            state_code: 'TG',
            district: 'Hyderabad',
            city: 'Hyderabad',
            pincode: '500060',
            latitude: null,
            longitude: null,
            service_areas: ['500060'],
            working_hours: {},
            is_available: true,
            verification_status: 'verified',
            is_listed: true,
            rating_avg: 4.8,
            rating_count: 120,
            partner_services: [
              {
                id: 'srv-1',
                partner_id: 'partner-uuid-1',
                service_id: null,
                name: 'PAN Card',
                description: null,
                charge_paise: 5000,
                charge_text: '₹50',
                estimated_time_text: '20m',
                is_active: true,
              },
            ],
          },
        ]),
      },
    };

    const service = new PartnersService(mockPrisma);
    const result = await service.listDirectory({ state: 'TG' });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('sri-sai-meeseva');
    expect(result.items[0].rating_avg).toBe(4.8);
    expect(result.items[0].services).toHaveLength(1);
  });

  it('rejects getBySlug when partner is not verified or unlisted', async () => {
    const mockPrisma: any = {
      partners: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'unverified-uuid',
          slug: 'pending-center',
          is_listed: false,
          verification_status: 'pending',
        }),
      },
    };

    const service = new PartnersService(mockPrisma);
    await expect(service.getBySlug('pending-center')).rejects.toThrow(
      'Partner center "pending-center" not found or not active',
    );
  });
});

describe('Session 18: Schedule & Slot Reservation Engine', () => {
  describe('Schedule & Override Schemas Validation', () => {
    it('validates a valid day schedule configuration', () => {
      const parsed = dayScheduleSchema.parse({
        dayOfWeek: 1,
        dayName: 'Monday',
        isOpen: true,
        openTime: '09:00',
        closeTime: '20:00',
        hasBreak: true,
        breakStart: '13:00',
        breakEnd: '14:00',
      });
      expect(parsed.dayOfWeek).toBe(1);
      expect(parsed.openTime).toBe('09:00');
    });

    it('validates schedule update payload with overrides and concurrency limits', () => {
      const parsed = updatePartnerScheduleSchema.parse({
        schedule: [
          {
            dayOfWeek: 1,
            isOpen: true,
            openTime: '09:00',
            closeTime: '18:00',
            hasBreak: false,
          },
        ],
        slotDuration: 30,
        maxConcurrent: 4,
        isEmergencyPaused: false,
        holidayOverrides: [
          {
            date: '2026-11-01',
            reason: 'State Holiday',
            isClosed: true,
          },
        ],
      });
      expect(parsed.slotDuration).toBe(30);
      expect(parsed.maxConcurrent).toBe(4);
      expect(parsed.holidayOverrides?.[0].reason).toBe('State Holiday');
    });

    it('rejects invalid slot duration', () => {
      expect(
        updatePartnerScheduleSchema.safeParse({
          schedule: [],
          slotDuration: 25, // Only 15, 30, 45, 60 allowed
          maxConcurrent: 2,
        }).success,
      ).toBe(false);
    });

    it('rejects invalid max concurrent bookings', () => {
      expect(
        updatePartnerScheduleSchema.safeParse({
          schedule: [],
          slotDuration: 30,
          maxConcurrent: 15, // Max 10 allowed
        }).success,
      ).toBe(false);
    });

    it('validates single holiday override input', () => {
      const parsed = createSlotOverrideSchema.parse({
        date: '2026-12-25',
        reason: 'Christmas Holiday',
        isClosed: true,
      });
      expect(parsed.date).toBe('2026-12-25');
      expect(parsed.isClosed).toBe(true);
    });
  });

  describe('Slot Time Helpers', () => {
    it('correctly converts time strings to minutes and back', () => {
      expect(timeToMinutes('09:30')).toBe(570);
      expect(minutesToTime(570)).toBe('09:30');
      expect(timeToMinutes('14:15')).toBe(855);
      expect(minutesToTime(855)).toBe('14:15');
    });

    it('formats 12-hour slot time range with AM/PM', () => {
      expect(formatSlotTimeRange('09:00', '09:30')).toBe('09:00 AM – 09:30 AM');
      expect(formatSlotTimeRange('12:00', '12:30')).toBe('12:00 PM – 12:30 PM');
      expect(formatSlotTimeRange('13:30', '14:00')).toBe('01:30 PM – 02:00 PM');
    });

    it('categorizes slots into morning, afternoon, and evening periods', () => {
      expect(getPeriod(timeToMinutes('09:00'))).toBe('morning');
      expect(getPeriod(timeToMinutes('11:30'))).toBe('morning');
      expect(getPeriod(timeToMinutes('12:00'))).toBe('afternoon');
      expect(getPeriod(timeToMinutes('15:30'))).toBe('afternoon');
      expect(getPeriod(timeToMinutes('16:00'))).toBe('evening');
      expect(getPeriod(timeToMinutes('19:30'))).toBe('evening');
    });
  });

  describe('Slot Generation, Breaks & Capacity Reservation', () => {
    const partnerId = '00000000-0000-0000-0000-000000000001';
    const testDate = '2026-10-26'; // Monday (dayOfWeek = 1)

    it('slices operating hours into discrete slots and excludes lunch break', async () => {
      const mockPrisma: any = {
        partners: {
          findUnique: vi.fn().mockResolvedValue({
            id: partnerId,
            slug: 'fast-meeseva',
            is_available: true,
            working_hours: {},
          }),
        },
        partner_slot_overrides: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        partner_schedules: {
          findUnique: vi.fn().mockResolvedValue({
            partner_id: partnerId,
            day_of_week: 1,
            open_time: '09:00',
            close_time: '12:00',
            has_break: true,
            break_start: '10:00',
            break_end: '11:00',
            slot_duration_minutes: 30,
            max_concurrent_bookings: 3,
            is_active: true,
          }),
        },
        service_requests: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };

      const service = new PartnersService(mockPrisma);
      const res = await service.getAvailableSlots(partnerId, testDate);

      expect(res.isClosed).toBe(false);
      expect(res.dayOfWeek).toBe(1);
      // From 09:00 to 12:00 (3 hours = 6 x 30m slots) minus 10:00-11:00 (2 slots) = 4 slots:
      // 09:00-09:30, 09:30-10:00, 11:00-11:30, 11:30-12:00
      expect(res.slots).toHaveLength(4);
      expect(res.slots[0].startTime).toBe('09:00');
      expect(res.slots[0].endTime).toBe('09:30');
      expect(res.slots[1].startTime).toBe('09:30');
      expect(res.slots[1].endTime).toBe('10:00');
      expect(res.slots[2].startTime).toBe('11:00');
      expect(res.slots[2].endTime).toBe('11:30');
      expect(res.slots[3].startTime).toBe('11:30');
      expect(res.slots[3].endTime).toBe('12:00');

      // Check capacity
      expect(res.slots[0].totalCapacity).toBe(3);
      expect(res.slots[0].remainingCapacity).toBe(3);
      expect(res.slots[0].isAvailable).toBe(true);
    });

    it('deducts capacity from active bookings and marks full slots as unavailable', async () => {
      const mockPrisma: any = {
        partners: {
          findUnique: vi.fn().mockResolvedValue({
            id: partnerId,
            slug: 'fast-meeseva',
            is_available: true,
            working_hours: {},
          }),
        },
        partner_slot_overrides: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        partner_schedules: {
          findUnique: vi.fn().mockResolvedValue({
            partner_id: partnerId,
            day_of_week: 1,
            open_time: '09:00',
            close_time: '10:00',
            has_break: false,
            break_start: null,
            break_end: null,
            slot_duration_minutes: 30,
            max_concurrent_bookings: 2,
            is_active: true,
          }),
        },
        service_requests: {
          findMany: vi.fn().mockResolvedValue([
            // 2 active bookings for 09:00 slot (at capacity)
            { id: 'b1', appointment_at: new Date('2026-10-26T09:00:00.000Z') },
            { id: 'b2', appointment_at: new Date('2026-10-26T09:15:00.000Z') },
            // 1 active booking for 09:30 slot (1 spot left)
            { id: 'b3', appointment_at: new Date('2026-10-26T09:30:00.000Z') },
          ]),
        },
      };

      const service = new PartnersService(mockPrisma);
      const res = await service.getAvailableSlots(partnerId, testDate);

      expect(res.slots).toHaveLength(2); // 09:00 and 09:30
      // 09:00 slot: full
      expect(res.slots[0].startTime).toBe('09:00');
      expect(res.slots[0].remainingCapacity).toBe(0);
      expect(res.slots[0].isAvailable).toBe(false);

      // 09:30 slot: 1 left
      expect(res.slots[1].startTime).toBe('09:30');
      expect(res.slots[1].remainingCapacity).toBe(1);
      expect(res.slots[1].isAvailable).toBe(true);
      expect(res.availableSlotsCount).toBe(1);
    });

    it('returns empty slots and isClosed=true when date is an override blackout / holiday', async () => {
      const mockPrisma: any = {
        partners: {
          findUnique: vi.fn().mockResolvedValue({
            id: partnerId,
            slug: 'fast-meeseva',
            is_available: true,
            working_hours: {},
          }),
        },
        partner_slot_overrides: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'override-1',
            partner_id: partnerId,
            override_date: new Date('2026-10-26T00:00:00.000Z'),
            is_closed: true,
            reason: 'Diwali Holiday Closure',
          }),
        },
      };

      const service = new PartnersService(mockPrisma);
      const res = await service.getAvailableSlots(partnerId, testDate);

      expect(res.isClosed).toBe(true);
      expect(res.closedReason).toBe('Diwali Holiday Closure');
      expect(res.slots).toHaveLength(0);
      expect(res.totalSlots).toBe(0);
      expect(res.availableSlotsCount).toBe(0);
    });

    it('returns isClosed=true when center is emergency paused', async () => {
      const mockPrisma: any = {
        partners: {
          findUnique: vi.fn().mockResolvedValue({
            id: partnerId,
            slug: 'fast-meeseva',
            is_available: false, // Emergency pause active
            working_hours: {},
          }),
        },
      };

      const service = new PartnersService(mockPrisma);
      const res = await service.getAvailableSlots(partnerId, testDate);

      expect(res.isClosed).toBe(true);
      expect(res.closedReason).toContain('emergency paused');
      expect(res.slots).toHaveLength(0);
    });

    it('returns isClosed=true when day is marked inactive in partner schedule', async () => {
      const mockPrisma: any = {
        partners: {
          findUnique: vi.fn().mockResolvedValue({
            id: partnerId,
            slug: 'fast-meeseva',
            is_available: true,
            working_hours: {},
          }),
        },
        partner_slot_overrides: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        partner_schedules: {
          findUnique: vi.fn().mockResolvedValue({
            partner_id: partnerId,
            day_of_week: 1,
            open_time: '09:00',
            close_time: '18:00',
            is_active: false, // Closed on this day
          }),
        },
      };

      const service = new PartnersService(mockPrisma);
      const res = await service.getAvailableSlots(partnerId, testDate);

      expect(res.isClosed).toBe(true);
      expect(res.closedReason).toContain('closed on this day');
      expect(res.slots).toHaveLength(0);
    });
  });
});
