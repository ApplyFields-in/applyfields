import { describe, expect, it, vi } from 'vitest';
import {
  partnerDirectoryQuerySchema,
  partnerRegisterSchema,
  partnerServiceInputSchema,
  PartnersService,
  partnerUpdateSchema,
  partnerVerifySchema,
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
      description: 'Authorized MeeSeva & Online Citizen Application Facilitation Center',
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
        reviewer_note: 'Verified with official Meeseva center certificate ID 4819.',
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
