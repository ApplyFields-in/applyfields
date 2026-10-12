import { describe, expect, it, vi } from 'vitest';
import {
  createInstitutionEnquirySchema,
  InstitutionsService,
  respondInstitutionEnquirySchema,
  updateInstitutionProfileSchema,
} from './institutions.service.js';

describe('Institution & Admission Enquiry Schemas Validation', () => {
  describe('createInstitutionEnquirySchema', () => {
    it('validates a complete student admission inquiry', () => {
      const input = {
        name: 'Rahul Sharma',
        phone: '9848012345',
        email: 'rahul.sharma@example.com',
        course_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        message: 'I want to inquire about admission eligibility, cutoff rank, and fee waivers.',
      };
      const parsed = createInstitutionEnquirySchema.parse(input);
      expect(parsed.name).toBe('Rahul Sharma');
      expect(parsed.phone).toBe('9848012345');
      expect(parsed.email).toBe('rahul.sharma@example.com');
      expect(parsed.course_id).toBe('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
    });

    it('accepts inquiry without optional email and course_id', () => {
      const input = {
        name: 'Ananya Verma',
        phone: '+919876543210',
        message: 'Is lateral entry open for diploma holders this academic year?',
      };
      const parsed = createInstitutionEnquirySchema.parse(input);
      expect(parsed.name).toBe('Ananya Verma');
      expect(parsed.phone).toBe('+919876543210');
      expect(parsed.email).toBeUndefined();
    });

    it('accepts empty string for optional email and course_id', () => {
      const input = {
        name: 'Vijay Kumar',
        phone: '7893012345',
        email: '',
        course_id: '',
        message: 'Please provide hostel fee structure.',
      };
      const parsed = createInstitutionEnquirySchema.parse(input);
      expect(parsed.name).toBe('Vijay Kumar');
      expect(parsed.email).toBe('');
      expect(parsed.course_id).toBe('');
    });

    it('rejects invalid Indian mobile number', () => {
      expect(() =>
        createInstitutionEnquirySchema.parse({
          name: 'Vijay Kumar',
          phone: '12345',
          message: 'Hello college admission desk',
        }),
      ).toThrow();
    });

    it('rejects message shorter than 5 characters', () => {
      expect(() =>
        createInstitutionEnquirySchema.parse({
          name: 'Vijay Kumar',
          phone: '9848012345',
          message: 'Hi',
        }),
      ).toThrow();
    });
  });

  describe('respondInstitutionEnquirySchema', () => {
    it('validates response with status responded', () => {
      const input = {
        status: 'responded',
        response: 'Admissions are open via TS EAMCET counseling. Cutoff for CSE is rank 4500.',
      };
      const parsed = respondInstitutionEnquirySchema.parse(input);
      expect(parsed.status).toBe('responded');
      expect(parsed.response).toContain('TS EAMCET');
    });

    it('validates closing an inquiry', () => {
      const input = {
        status: 'closed',
        response: 'Seat intake completed for academic session 2026.',
      };
      const parsed = respondInstitutionEnquirySchema.parse(input);
      expect(parsed.status).toBe('closed');
    });

    it('rejects unknown status', () => {
      expect(() =>
        respondInstitutionEnquirySchema.parse({
          status: 'pending_approval',
          response: 'Wait please',
        }),
      ).toThrow();
    });
  });

  describe('updateInstitutionProfileSchema', () => {
    it('validates updates to institution profile', () => {
      const input = {
        name: 'Chaitanya Bharathi Institute of Technology',
        short_name: 'CBIT',
        website: 'https://cbit.ac.in',
        contact_email: 'admissions@cbit.ac.in',
        contact_phone: '9848011223',
        fees_text: '₹1,40,000 / year (Convenor Quota)',
        description: 'Premier Autonomous Engineering Institution affiliated to Osmania University.',
      };
      const parsed = updateInstitutionProfileSchema.parse(input);
      expect(parsed.short_name).toBe('CBIT');
      expect(parsed.fees_text).toContain('Convenor Quota');
    });
  });
});

describe('InstitutionsService Integration Logic', () => {
  it('creates an admission enquiry and persists status new', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockImplementation((queryParts: any) => {
        const queryStr = (
          queryParts?.text ||
          queryParts?.sql ||
          (queryParts?.strings ? queryParts.strings.join('') : '') ||
          (Array.isArray(queryParts) ? queryParts.join('') : String(queryParts))
        ).toLowerCase();
        if (queryStr.includes('from institutions') && queryStr.includes('slug')) {
          return Promise.resolve([{ id: 'inst-1', name: 'IIT Hyderabad', slug: 'iit-hyderabad' }]);
        }
        if (queryStr.includes('from courses')) {
          return Promise.resolve([{ id: 'course-1', name: 'B.Tech Computer Science' }]);
        }
        if (queryStr.includes('into institution_enquiries')) {
          return Promise.resolve([
            {
              id: 'enquiry-1',
              institution_id: 'inst-1',
              user_id: 'user-1',
              course_id: 'course-1',
              name: 'Arun Patel',
              phone: '9848012345',
              email: 'arun@example.com',
              message: 'What is the cutoff rank?',
              status: 'new',
              response: null,
              responded_at: null,
              created_at: new Date('2026-10-12T10:00:00Z'),
              updated_at: new Date('2026-10-12T10:00:00Z'),
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      $executeRaw: vi.fn().mockResolvedValue(1),
    };

    const service = new InstitutionsService(mockPrisma as any);
    const result = await service.createEnquiry('iit-hyderabad', 'user-1', {
      name: 'Arun Patel',
      phone: '9848012345',
      email: 'arun@example.com',
      course_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      message: 'What is the cutoff rank?',
    });

    expect(result.id).toBe('enquiry-1');
    expect(result.institution_name).toBe('IIT Hyderabad');
    expect(result.status).toBe('new');
    expect(result.name).toBe('Arun Patel');
  });

  it('lists citizen enquiries with institution and course names', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: 'enquiry-1',
          institution_id: 'inst-1',
          institution_name: 'IIT Hyderabad',
          institution_slug: 'iit-hyderabad',
          user_id: 'user-1',
          course_id: 'course-1',
          course_name: 'B.Tech Computer Science',
          name: 'Arun Patel',
          phone: '9848012345',
          email: 'arun@example.com',
          message: 'What is the cutoff rank?',
          status: 'responded',
          response: 'Cutoff is rank 650 via JEE Advanced.',
          responded_at: new Date('2026-10-12T12:00:00Z'),
          created_at: new Date('2026-10-12T10:00:00Z'),
          updated_at: new Date('2026-10-12T12:00:00Z'),
        },
      ]),
    };

    const service = new InstitutionsService(mockPrisma as any);
    const result = await service.listUserEnquiries('user-1');
    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('responded');
    expect(result.items[0].response).toContain('Cutoff is rank 650');
  });
});
