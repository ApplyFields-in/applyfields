import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminPartnerItem,
  AdminPartnerListResponse,
  AdminPartnerVerifyInput,
  AvailableSlotsResponse,
  CreateSlotOverrideInput,
  DaySchedule,
  HolidayOverride,
  PartnerDetail,
  PartnerDirectoryQuery,
  PartnerDirectoryResponse,
  PartnerDocumentSummary,
  PartnerRegistrationInput,
  PartnerScheduleMatrix,
  PartnerServiceDetail,
  PartnerServiceInput,
  PartnerSummary,
  PartnerType,
  PartnerUpdateInput,
  PartnerVerificationStatus,
  TimeSlot,
  UpdatePartnerScheduleInput,
} from '@applyfields/types';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  partner_type,
  verification_status,
} from '../../generated/prisma/enums.js';

export const partnerDirectoryQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: z.string().trim().optional(),
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  service: z.string().trim().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const partnerRegisterSchema = z.object({
  business_name: z.string().trim().min(2).max(150),
  type: z.enum([
    'meeseva',
    'csc',
    'xerox_printing',
    'browsing_centre',
    'typing_centre',
    'passport_studio',
    'application_assistance',
    'consultant',
    'college',
    'training_institution',
    'other',
  ]),
  owner_name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  address: z.string().trim().min(3).max(300),
  state_code: z.string().trim().length(2).toUpperCase(),
  district: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  service_areas: z.array(z.string().trim()).optional().default([]),
  working_hours: z
    .record(z.string(), z.array(z.string()))
    .optional()
    .default({}),
  description: z.string().trim().max(1000).optional(),
});

export const partnerUpdateSchema = z.object({
  business_name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  owner_name: z.string().trim().min(2).max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91)?[6-9]\d{9}$/)
    .optional(),
  whatsapp: z.string().trim().optional(),
  address: z.string().trim().min(3).max(300).optional(),
  state_code: z.string().trim().length(2).toUpperCase().optional(),
  district: z.string().trim().min(2).max(100).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/)
    .optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  working_hours: z.record(z.string(), z.array(z.string())).optional(),
  is_available: z.boolean().optional(),
});

export const partnerServiceInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  charge_paise: z.number().int().min(0).optional(),
  charge_text: z.string().trim().max(100).optional(),
  estimated_time_text: z.string().trim().max(100).optional(),
  is_active: z.boolean().optional().default(true),
  service_id: z.string().uuid().optional(),
});

export const partnerVerifySchema = z.object({
  verification_status: z.enum(['pending', 'verified', 'rejected']),
  is_listed: z.boolean(),
  reviewer_note: z.string().trim().max(500).optional(),
});

export const dayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  dayName: z.string().optional(),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm (e.g. 09:00)'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm (e.g. 20:00)'),
  hasBreak: z.boolean().default(false),
  breakStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm').nullish(),
  breakEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm').nullish(),
});

export const holidayOverrideSchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  reason: z.string().trim().max(250).nullish(),
  isClosed: z.boolean().default(true),
});

export const updatePartnerScheduleSchema = z.object({
  schedule: z.array(dayScheduleSchema),
  slotDuration: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).default(30),
  maxConcurrent: z.number().int().min(1).max(10).default(2),
  isEmergencyPaused: z.boolean().optional(),
  holidayOverrides: z.array(holidayOverrideSchema).optional(),
});

export const createSlotOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  isClosed: z.boolean().default(false),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm').nullish(),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm').nullish(),
  reason: z.string().trim().max(250).nullish(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  {
    dayOfWeek: 0,
    dayName: 'Sunday',
    isOpen: false,
    openTime: '10:00',
    closeTime: '14:00',
    hasBreak: false,
    breakStart: '12:00',
    breakEnd: '13:00',
  },
  {
    dayOfWeek: 1,
    dayName: 'Monday',
    isOpen: true,
    openTime: '09:00',
    closeTime: '20:00',
    hasBreak: true,
    breakStart: '13:00',
    breakEnd: '14:00',
  },
  {
    dayOfWeek: 2,
    dayName: 'Tuesday',
    isOpen: true,
    openTime: '09:00',
    closeTime: '20:00',
    hasBreak: true,
    breakStart: '13:00',
    breakEnd: '14:00',
  },
  {
    dayOfWeek: 3,
    dayName: 'Wednesday',
    isOpen: true,
    openTime: '09:00',
    closeTime: '20:00',
    hasBreak: true,
    breakStart: '13:00',
    breakEnd: '14:00',
  },
  {
    dayOfWeek: 4,
    dayName: 'Thursday',
    isOpen: true,
    openTime: '09:00',
    closeTime: '20:00',
    hasBreak: true,
    breakStart: '13:00',
    breakEnd: '14:00',
  },
  {
    dayOfWeek: 5,
    dayName: 'Friday',
    isOpen: true,
    openTime: '09:00',
    closeTime: '20:00',
    hasBreak: true,
    breakStart: '13:00',
    breakEnd: '14:00',
  },
  {
    dayOfWeek: 6,
    dayName: 'Saturday',
    isOpen: true,
    openTime: '09:30',
    closeTime: '18:00',
    hasBreak: true,
    breakStart: '13:00',
    breakEnd: '14:00',
  },
];

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${mStr} ${ampm}`;
}

export function formatSlotTimeRange(start: string, end: string): string {
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}

export function getPeriod(
  startMinutes: number,
): 'morning' | 'afternoon' | 'evening' {
  if (startMinutes < 12 * 60) return 'morning';
  if (startMinutes < 16 * 60) return 'afternoon';
  return 'evening';
}

export function matchesSlot(
  appointmentAt: Date,
  dateStr: string,
  slotStart: string,
  slotEnd: string,
): boolean {
  const startMin = timeToMinutes(slotStart);
  const endMin = timeToMinutes(slotEnd);

  // UTC comparison
  const utcIso = appointmentAt.toISOString();
  const utcDate = utcIso.slice(0, 10);
  const utcMin =
    appointmentAt.getUTCHours() * 60 + appointmentAt.getUTCMinutes();
  if (utcDate === dateStr && utcMin >= startMin && utcMin < endMin) {
    return true;
  }

  // IST (UTC+05:30) comparison
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDateObj = new Date(appointmentAt.getTime() + istOffsetMs);
  const istIso = istDateObj.toISOString();
  const istDate = istIso.slice(0, 10);
  const istMin = istDateObj.getUTCHours() * 60 + istDateObj.getUTCMinutes();
  if (istDate === dateStr && istMin >= startMin && istMin < endMin) {
    return true;
  }

  return false;
}

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // PUBLIC DIRECTORY & SEARCH
  // =========================================================================

  async listDirectory(
    query: PartnerDirectoryQuery,
  ): Promise<PartnerDirectoryResponse> {
    const where: any = {
      is_listed: true,
      verification_status: 'verified',
    };

    if (query.type) {
      where.type = query.type as partner_type;
    }
    if (query.state) {
      where.state_code = query.state.toUpperCase();
    }
    if (query.district) {
      where.district = { contains: query.district, mode: 'insensitive' };
    }
    if (query.pincode) {
      where.pincode = query.pincode.trim();
    }
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { business_name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { pincode: { contains: q } },
        {
          partner_services: {
            some: {
              name: { contains: q, mode: 'insensitive' },
              is_active: true,
            },
          },
        },
      ];
    }
    if (query.service) {
      where.partner_services = {
        some: {
          name: { contains: query.service.trim(), mode: 'insensitive' },
          is_active: true,
        },
      };
    }

    const [total, rows] = await Promise.all([
      this.prisma.partners.count({ where }),
      this.prisma.partners.findMany({
        where,
        take: query.limit ?? 20,
        skip: query.offset ?? 0,
        orderBy: [{ rating_avg: 'desc' }, { created_at: 'desc' }],
        include: {
          partner_services: {
            where: { is_active: true },
            take: 6,
          },
        },
      }),
    ]);

    const items: PartnerSummary[] = rows.map((p) => this.mapToSummary(p));

    return { total, items };
  }

  async getBySlug(slug: string): Promise<PartnerDetail> {
    const partner = await this.prisma.partners.findUnique({
      where: { slug },
      include: {
        partner_services: {
          where: { is_active: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (
      !partner ||
      !partner.is_listed ||
      partner.verification_status !== 'verified'
    ) {
      throw new NotFoundException(
        `Partner center "${slug}" not found or not active`,
      );
    }

    return this.mapToDetail(partner);
  }

  // =========================================================================
  // ONBOARDING & PARTNER SELF-SERVICE
  // =========================================================================

  async register(
    userId: string | null,
    input: PartnerRegistrationInput,
  ): Promise<PartnerDetail> {
    const baseSlug = slugify(input.business_name) || 'partner';
    let slug = baseSlug;
    let counter = 1;

    // Check slug collision
    while (await this.prisma.partners.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${input.pincode ? input.pincode.slice(-4) : counter}`;
      counter++;
    }

    const partner = await this.prisma.$transaction(async (tx) => {
      const created = await tx.partners.create({
        data: {
          slug,
          type: input.type as partner_type,
          business_name: input.business_name,
          owner_name: input.owner_name,
          phone: input.phone,
          whatsapp: input.whatsapp || input.phone,
          email: input.email,
          address: input.address,
          state_code: input.state_code.toUpperCase(),
          district: input.district,
          city: input.city,
          pincode: input.pincode,
          latitude:
            input.latitude !== undefined && input.latitude !== null
              ? input.latitude
              : null,
          longitude:
            input.longitude !== undefined && input.longitude !== null
              ? input.longitude
              : null,
          service_areas: input.service_areas ?? [],
          working_hours: input.working_hours ?? {},
          description: input.description,
          verification_status: 'pending',
          is_listed: false,
          is_available: true,
        },
      });

      if (userId) {
        await tx.partner_members.create({
          data: {
            partner_id: created.id,
            user_id: userId,
            role: 'owner',
          },
        });
      }

      return created;
    });

    return this.mapToDetail({ ...partner, partner_services: [] });
  }

  async getPartnerForUser(userId: string): Promise<PartnerDetail> {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
      include: {
        partners: {
          include: {
            partner_services: {
              orderBy: { created_at: 'desc' },
            },
            partner_documents: {
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
    });

    if (!membership || !membership.partners) {
      throw new NotFoundException(
        'No partner center profile found linked to this account.',
      );
    }

    return this.mapToDetail(membership.partners);
  }

  async updateProfile(
    userId: string,
    input: PartnerUpdateInput,
  ): Promise<PartnerDetail> {
    const membership = await this.requirePartnerOwner(userId);

    const updated = await this.prisma.partners.update({
      where: { id: membership.partner_id },
      data: {
        ...(input.business_name && { business_name: input.business_name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.owner_name && { owner_name: input.owner_name }),
        ...(input.phone && { phone: input.phone }),
        ...(input.whatsapp && { whatsapp: input.whatsapp }),
        ...(input.address && { address: input.address }),
        ...(input.state_code && { state_code: input.state_code.toUpperCase() }),
        ...(input.district && { district: input.district }),
        ...(input.city && { city: input.city }),
        ...(input.pincode && { pincode: input.pincode }),
        ...(input.latitude !== undefined && { latitude: input.latitude }),
        ...(input.longitude !== undefined && { longitude: input.longitude }),
        ...(input.working_hours && { working_hours: input.working_hours }),
        ...(input.is_available !== undefined && {
          is_available: input.is_available,
        }),
      },
      include: {
        partner_services: true,
        partner_documents: true,
      },
    });

    return this.mapToDetail(updated);
  }

  async listServices(userId: string): Promise<PartnerServiceDetail[]> {
    const membership = await this.requirePartnerOwner(userId);

    const services = await this.prisma.partner_services.findMany({
      where: { partner_id: membership.partner_id },
      orderBy: { created_at: 'desc' },
    });

    return services.map((s) => ({
      id: s.id,
      partner_id: s.partner_id,
      service_id: s.service_id,
      name: s.name,
      description: s.description,
      charge_paise: s.charge_paise,
      charge_text: s.charge_text,
      estimated_time_text: s.estimated_time_text,
      is_active: s.is_active,
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
    }));
  }

  async addService(
    userId: string,
    input: PartnerServiceInput,
  ): Promise<PartnerServiceDetail> {
    const membership = await this.requirePartnerOwner(userId);

    const created = await this.prisma.partner_services.create({
      data: {
        partner_id: membership.partner_id,
        name: input.name,
        description: input.description,
        charge_paise: input.charge_paise,
        charge_text: input.charge_text,
        estimated_time_text: input.estimated_time_text,
        is_active: input.is_active ?? true,
        service_id: input.service_id,
      },
    });

    return {
      id: created.id,
      partner_id: created.partner_id,
      service_id: created.service_id,
      name: created.name,
      description: created.description,
      charge_paise: created.charge_paise,
      charge_text: created.charge_text,
      estimated_time_text: created.estimated_time_text,
      is_active: created.is_active,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    };
  }

  async updateService(
    userId: string,
    serviceId: string,
    input: Partial<PartnerServiceInput>,
  ): Promise<PartnerServiceDetail> {
    const membership = await this.requirePartnerOwner(userId);

    const existing = await this.prisma.partner_services.findUnique({
      where: { id: serviceId },
    });

    if (!existing || existing.partner_id !== membership.partner_id) {
      throw new NotFoundException('Service not found or unauthorized');
    }

    const updated = await this.prisma.partner_services.update({
      where: { id: serviceId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.charge_paise !== undefined && {
          charge_paise: input.charge_paise,
        }),
        ...(input.charge_text !== undefined && {
          charge_text: input.charge_text,
        }),
        ...(input.estimated_time_text !== undefined && {
          estimated_time_text: input.estimated_time_text,
        }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
      },
    });

    return {
      id: updated.id,
      partner_id: updated.partner_id,
      service_id: updated.service_id,
      name: updated.name,
      description: updated.description,
      charge_paise: updated.charge_paise,
      charge_text: updated.charge_text,
      estimated_time_text: updated.estimated_time_text,
      is_active: updated.is_active,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  async deleteService(
    userId: string,
    serviceId: string,
  ): Promise<{ success: boolean }> {
    const membership = await this.requirePartnerOwner(userId);

    const existing = await this.prisma.partner_services.findUnique({
      where: { id: serviceId },
    });

    if (!existing || existing.partner_id !== membership.partner_id) {
      throw new NotFoundException('Service not found or unauthorized');
    }

    await this.prisma.partner_services.delete({
      where: { id: serviceId },
    });

    return { success: true };
  }

  async uploadDocument(
    userId: string,
    doc: { document_kind: string; storage_path: string },
  ): Promise<PartnerDocumentSummary> {
    const membership = await this.requirePartnerOwner(userId);

    const created = await this.prisma.partner_documents.create({
      data: {
        partner_id: membership.partner_id,
        document_kind: doc.document_kind,
        storage_path: doc.storage_path,
        status: 'pending',
      },
    });

    return {
      id: created.id,
      partner_id: created.partner_id,
      document_kind: created.document_kind,
      storage_path: created.storage_path,
      status: created.status as PartnerVerificationStatus,
      reviewer_note: created.reviewer_note,
      reviewed_at: created.reviewed_at
        ? created.reviewed_at.toISOString()
        : null,
      created_at: created.created_at.toISOString(),
    };
  }

  // =========================================================================
  // SCHEDULE & SLOT RESERVATION ENGINE (Session 18)
  // =========================================================================

  async getScheduleForUser(userId: string): Promise<PartnerScheduleMatrix> {
    const membership = await this.requirePartnerOwner(userId);
    return this.getScheduleForPartner(membership.partner_id);
  }

  async getScheduleForPartner(
    partnerId: string,
  ): Promise<PartnerScheduleMatrix> {
    const partner = await this.prisma.partners.findUnique({
      where: { id: partnerId },
    });
    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    const [dbSchedules, dbOverrides] = await Promise.all([
      this.prisma.partner_schedules.findMany({
        where: { partner_id: partnerId },
        orderBy: { day_of_week: 'asc' },
      }),
      this.prisma.partner_slot_overrides.findMany({
        where: { partner_id: partnerId },
        orderBy: { override_date: 'asc' },
      }),
    ]);

    const slotDuration = dbSchedules[0]?.slot_duration_minutes ?? 30;
    const maxConcurrent = dbSchedules[0]?.max_concurrent_bookings ?? 2;

    const scheduleMap = new Map<number, (typeof dbSchedules)[0]>();
    for (const s of dbSchedules) {
      scheduleMap.set(s.day_of_week, s);
    }

    const workingHours =
      (partner.working_hours as Record<string, string[]>) || {};

    const schedule: DaySchedule[] = [];
    for (let day = 0; day <= 6; day++) {
      const dayName = DAY_NAMES[day] ?? `Day ${day}`;
      const existing = scheduleMap.get(day);
      if (existing) {
        schedule.push({
          dayOfWeek: existing.day_of_week,
          dayName,
          isOpen: existing.is_active,
          openTime: existing.open_time,
          closeTime: existing.close_time,
          hasBreak: existing.has_break,
          breakStart: existing.break_start,
          breakEnd: existing.break_end,
        });
      } else {
        const defaultDay = DEFAULT_SCHEDULE.find((d) => d.dayOfWeek === day);
        const whTimes = workingHours[dayName.toLowerCase()];
        if (whTimes && whTimes.length >= 2) {
          schedule.push({
            dayOfWeek: day,
            dayName,
            isOpen: true,
            openTime: whTimes[0] ?? '09:00',
            closeTime: whTimes[1] ?? '20:00',
            hasBreak: defaultDay?.hasBreak ?? true,
            breakStart: defaultDay?.breakStart ?? '13:00',
            breakEnd: defaultDay?.breakEnd ?? '14:00',
          });
        } else if (defaultDay) {
          schedule.push({ ...defaultDay, dayName });
        } else {
          schedule.push({
            dayOfWeek: day,
            dayName,
            isOpen: day !== 0,
            openTime: '09:00',
            closeTime: '20:00',
            hasBreak: true,
            breakStart: '13:00',
            breakEnd: '14:00',
          });
        }
      }
    }

    const holidayOverrides: HolidayOverride[] = dbOverrides.map((o) => ({
      id: o.id,
      date:
        o.override_date instanceof Date
          ? o.override_date.toISOString().slice(0, 10)
          : String(o.override_date).slice(0, 10),
      isClosed: o.is_closed,
      reason: o.reason,
    }));

    return {
      partnerId,
      schedule,
      slotDuration,
      maxConcurrent,
      isEmergencyPaused: !partner.is_available,
      holidayOverrides,
      updatedAt: partner.updated_at.toISOString(),
    };
  }

  async updateSchedule(
    userId: string,
    input: UpdatePartnerScheduleInput,
  ): Promise<PartnerScheduleMatrix> {
    const membership = await this.requirePartnerOwner(userId);
    const partnerId = membership.partner_id;

    // Update partner availability (emergency pause) and sync working_hours JSON
    const workingHours: Record<string, string[]> = {};
    for (const day of input.schedule) {
      if (day.isOpen) {
        const dayName = DAY_NAMES[day.dayOfWeek] || `day_${day.dayOfWeek}`;
        workingHours[dayName.toLowerCase()] = [day.openTime, day.closeTime];
      }
    }

    await this.prisma.partners.update({
      where: { id: partnerId },
      data: {
        ...(input.isEmergencyPaused !== undefined && {
          is_available: !input.isEmergencyPaused,
        }),
        working_hours: workingHours,
      },
    });

    // Upsert day schedules
    for (const day of input.schedule) {
      await this.prisma.partner_schedules.upsert({
        where: {
          partner_id_day_of_week: {
            partner_id: partnerId,
            day_of_week: day.dayOfWeek,
          },
        },
        create: {
          partner_id: partnerId,
          day_of_week: day.dayOfWeek,
          open_time: day.openTime,
          close_time: day.closeTime,
          has_break: day.hasBreak ?? false,
          break_start: day.breakStart ?? null,
          break_end: day.breakEnd ?? null,
          slot_duration_minutes: input.slotDuration,
          max_concurrent_bookings: input.maxConcurrent,
          is_active: day.isOpen,
        },
        update: {
          open_time: day.openTime,
          close_time: day.closeTime,
          has_break: day.hasBreak ?? false,
          break_start: day.breakStart ?? null,
          break_end: day.breakEnd ?? null,
          slot_duration_minutes: input.slotDuration,
          max_concurrent_bookings: input.maxConcurrent,
          is_active: day.isOpen,
          updated_at: new Date(),
        },
      });
    }

    // Upsert holiday overrides if provided
    if (input.holidayOverrides && input.holidayOverrides.length > 0) {
      for (const hol of input.holidayOverrides) {
        const overrideDate = new Date(`${hol.date}T00:00:00.000Z`);
        await this.prisma.partner_slot_overrides.upsert({
          where: {
            partner_id_override_date: {
              partner_id: partnerId,
              override_date: overrideDate,
            },
          },
          create: {
            partner_id: partnerId,
            override_date: overrideDate,
            is_closed: hol.isClosed ?? true,
            reason: hol.reason ?? null,
          },
          update: {
            is_closed: hol.isClosed ?? true,
            reason: hol.reason ?? null,
          },
        });
      }
    }

    return this.getScheduleForPartner(partnerId);
  }

  async addOverride(
    userId: string,
    input: CreateSlotOverrideInput,
  ): Promise<HolidayOverride> {
    const membership = await this.requirePartnerOwner(userId);
    const partnerId = membership.partner_id;
    const overrideDate = new Date(`${input.date}T00:00:00.000Z`);

    const record = await this.prisma.partner_slot_overrides.upsert({
      where: {
        partner_id_override_date: {
          partner_id: partnerId,
          override_date: overrideDate,
        },
      },
      create: {
        partner_id: partnerId,
        override_date: overrideDate,
        is_closed: input.isClosed ?? true,
        reason: input.reason ?? null,
      },
      update: {
        is_closed: input.isClosed ?? true,
        reason: input.reason ?? null,
      },
    });

    return {
      id: record.id,
      date: input.date,
      isClosed: record.is_closed,
      reason: record.reason,
    };
  }

  async removeOverride(
    userId: string,
    overrideId: string,
  ): Promise<{ success: boolean }> {
    const membership = await this.requirePartnerOwner(userId);
    const partnerId = membership.partner_id;

    const existing = await this.prisma.partner_slot_overrides.findUnique({
      where: { id: overrideId },
    });

    if (!existing || existing.partner_id !== partnerId) {
      throw new NotFoundException('Override not found or unauthorized');
    }

    await this.prisma.partner_slot_overrides.delete({
      where: { id: overrideId },
    });

    return { success: true };
  }

  async getAvailableSlots(
    partnerIdOrSlug: string,
    dateStr: string,
  ): Promise<AvailableSlotsResponse> {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException(
        'A valid date query parameter in YYYY-MM-DD format is required',
      );
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        partnerIdOrSlug,
      );
    const partner = isUuid
      ? await this.prisma.partners.findUnique({
          where: { id: partnerIdOrSlug },
        })
      : await this.prisma.partners.findUnique({
          where: { slug: partnerIdOrSlug },
        });

    if (!partner) {
      throw new NotFoundException('Partner center not found');
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

    // 1. Emergency Pause check
    if (!partner.is_available) {
      return {
        partnerId: partner.id,
        date: dateStr,
        dayOfWeek,
        isClosed: true,
        closedReason: 'Center is temporarily closed / emergency paused today',
        totalSlots: 0,
        availableSlotsCount: 0,
        slots: [],
      };
    }

    // 2. Blackout dates check in partner_slot_overrides
    const overrideDate = new Date(`${dateStr}T00:00:00.000Z`);
    const override = await this.prisma.partner_slot_overrides.findUnique({
      where: {
        partner_id_override_date: {
          partner_id: partner.id,
          override_date: overrideDate,
        },
      },
    });

    if (override && override.is_closed) {
      return {
        partnerId: partner.id,
        date: dateStr,
        dayOfWeek,
        isClosed: true,
        closedReason:
          override.reason || 'Closed for holiday or scheduled event',
        totalSlots: 0,
        availableSlotsCount: 0,
        slots: [],
      };
    }

    // 3. Operating hours check in partner_schedules
    const daySchedule = await this.prisma.partner_schedules.findUnique({
      where: {
        partner_id_day_of_week: {
          partner_id: partner.id,
          day_of_week: dayOfWeek,
        },
      },
    });

    let openTime = '09:00';
    let closeTime = '20:00';
    let hasBreak = true;
    let breakStart: string | null = '13:00';
    let breakEnd: string | null = '14:00';
    let slotDuration = 30;
    let maxConcurrent = 2;

    if (daySchedule) {
      if (!daySchedule.is_active) {
        return {
          partnerId: partner.id,
          date: dateStr,
          dayOfWeek,
          isClosed: true,
          closedReason: 'Center is closed on this day of the week',
          totalSlots: 0,
          availableSlotsCount: 0,
          slots: [],
        };
      }
      openTime = daySchedule.open_time;
      closeTime = daySchedule.close_time;
      hasBreak = daySchedule.has_break;
      breakStart = daySchedule.break_start;
      breakEnd = daySchedule.break_end;
      slotDuration = daySchedule.slot_duration_minutes || 30;
      maxConcurrent = daySchedule.max_concurrent_bookings || 2;
    } else {
      // Fallback: check partner.working_hours JSON or default schedule
      const dayName = DAY_NAMES[dayOfWeek] ?? '';
      const wh = (partner.working_hours as Record<string, string[]>) || {};
      const whTimes = wh[dayName.toLowerCase()];
      if (whTimes && whTimes.length >= 2) {
        openTime = whTimes[0];
        closeTime = whTimes[1];
      } else if (dayOfWeek === 0) {
        return {
          partnerId: partner.id,
          date: dateStr,
          dayOfWeek,
          isClosed: true,
          closedReason: 'Center is closed on Sundays',
          totalSlots: 0,
          availableSlotsCount: 0,
          slots: [],
        };
      }
    }

    // 4. Generate discrete slots
    const slots: TimeSlot[] = [];
    const startMin = timeToMinutes(openTime);
    const endMin = timeToMinutes(closeTime);
    const bStartMin = hasBreak && breakStart ? timeToMinutes(breakStart) : null;
    const bEndMin = hasBreak && breakEnd ? timeToMinutes(breakEnd) : null;

    let curMin = startMin;
    while (curMin + slotDuration <= endMin) {
      const slotStartMin = curMin;
      const slotEndMin = curMin + slotDuration;
      curMin += slotDuration;

      // Exclude lunch break times
      if (bStartMin !== null && bEndMin !== null) {
        if (slotStartMin < bEndMin && slotEndMin > bStartMin) {
          continue;
        }
      }

      const startTimeStr = minutesToTime(slotStartMin);
      const endTimeStr = minutesToTime(slotEndMin);
      const period = getPeriod(slotStartMin);
      const timeLabel = formatSlotTimeRange(startTimeStr, endTimeStr);
      const slotId = `slot-${dateStr}-${startTimeStr.replace(':', '')}`;

      slots.push({
        id: slotId,
        time: timeLabel,
        startTime: startTimeStr,
        endTime: endTimeStr,
        period,
        remainingCapacity: maxConcurrent,
        totalCapacity: maxConcurrent,
        isAvailable: true,
      });
    }

    // 5. Query active bookings for capacity deduction
    const activeBookings = await this.prisma.service_requests.findMany({
      where: {
        partner_id: partner.id,
        status: {
          notIn: ['cancelled', 'rejected'],
        },
        appointment_at: {
          gte: new Date(Date.UTC(year, month - 1, day - 1, 0, 0, 0)),
          lte: new Date(Date.UTC(year, month - 1, day + 1, 23, 59, 59)),
        },
      },
      select: {
        id: true,
        appointment_at: true,
      },
    });

    for (const slot of slots) {
      const bookedCount = activeBookings.filter(
        (b) =>
          b.appointment_at &&
          matchesSlot(b.appointment_at, dateStr, slot.startTime, slot.endTime),
      ).length;
      slot.remainingCapacity = Math.max(0, slot.totalCapacity - bookedCount);
      slot.isAvailable = slot.remainingCapacity > 0;
    }

    return {
      partnerId: partner.id,
      date: dateStr,
      dayOfWeek,
      isClosed: false,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.isAvailable).length,
      slots,
    };
  }

  // =========================================================================
  // ADMIN WORKFLOWS & VERIFICATION (StaffGuard)
  // =========================================================================

  async adminListPartners(query: {
    status?: string;
    type?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminPartnerListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.verification_status = query.status as verification_status;
    }
    if (query.type) {
      where.type = query.type as partner_type;
    }
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { business_name: { contains: q, mode: 'insensitive' } },
        { owner_name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.partners.count({ where }),
      this.prisma.partners.findMany({
        where,
        take: limit,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          partner_members: {
            take: 1,
            include: {
              users: { select: { id: true, email: true } },
            },
          },
          partner_services: { where: { is_active: true } },
          _count: {
            select: { partner_documents: true },
          },
        },
      }),
    ]);

    const items: AdminPartnerItem[] = rows.map((p) => {
      const summary = this.mapToSummary(p);
      const ownerMember = p.partner_members?.[0];
      return {
        ...summary,
        owner_user_id: ownerMember?.users?.id ?? null,
        owner_user_email: ownerMember?.users?.email ?? null,
        documents_count: p._count?.partner_documents ?? 0,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
      };
    });

    return { total, items };
  }

  async adminVerifyPartner(
    partnerId: string,
    reviewerId: string,
    input: AdminPartnerVerifyInput,
  ): Promise<PartnerDetail> {
    const existing = await this.prisma.partners.findUnique({
      where: { id: partnerId },
    });
    if (!existing) {
      throw new NotFoundException(`Partner with ID "${partnerId}" not found`);
    }

    const updated = await this.prisma.partners.update({
      where: { id: partnerId },
      data: {
        verification_status: input.verification_status as verification_status,
        is_listed: input.is_listed,
        verified_by: reviewerId,
        verified_at: new Date(),
      },
      include: {
        partner_services: true,
        partner_documents: true,
      },
    });

    return this.mapToDetail(updated);
  }

  async adminGetPartner(partnerId: string): Promise<PartnerDetail> {
    const existing = await this.prisma.partners.findUnique({
      where: { id: partnerId },
      include: {
        partner_services: true,
        partner_documents: true,
      },
    });
    if (!existing) {
      throw new NotFoundException(`Partner with ID "${partnerId}" not found`);
    }
    return this.mapToDetail(existing);
  }

  async adminVerifyDocument(
    docId: string,
    reviewerId: string,
    status: 'verified' | 'rejected',
    reviewer_note?: string,
  ): Promise<PartnerDocumentSummary> {
    const existing = await this.prisma.partner_documents.findUnique({
      where: { id: docId },
    });
    if (!existing) {
      throw new NotFoundException(`Document with ID "${docId}" not found`);
    }

    const updated = await this.prisma.partner_documents.update({
      where: { id: docId },
      data: {
        status: status as verification_status,
        reviewer_note: reviewer_note ?? null,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
      },
    });

    return {
      id: updated.id,
      partner_id: updated.partner_id,
      document_kind: updated.document_kind,
      storage_path: updated.storage_path,
      status: updated.status as PartnerVerificationStatus,
      reviewer_note: updated.reviewer_note,
      reviewed_at: updated.reviewed_at
        ? updated.reviewed_at.toISOString()
        : null,
      created_at: updated.created_at.toISOString(),
    };
  }

  // =========================================================================
  // HELPERS & MAPPERS
  // =========================================================================

  private async requirePartnerOwner(userId: string) {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You do not have a partner account registered.',
      );
    }
    return membership;
  }

  private mapToSummary(p: any): PartnerSummary {
    return {
      id: p.id,
      slug: p.slug,
      type: p.type as PartnerType,
      business_name: p.business_name,
      description: p.description,
      logo_url: p.logo_url,
      owner_name: p.owner_name,
      phone: p.phone,
      whatsapp: p.whatsapp,
      email: p.email,
      address: p.address,
      state_code: p.state_code,
      district: p.district,
      city: p.city,
      pincode: p.pincode,
      latitude: p.latitude ? Number(p.latitude) : null,
      longitude: p.longitude ? Number(p.longitude) : null,
      service_areas: p.service_areas || [],
      working_hours: (p.working_hours as Record<string, string[]>) || {},
      is_available: p.is_available,
      verification_status: p.verification_status as PartnerVerificationStatus,
      is_listed: p.is_listed,
      rating_avg: p.rating_avg ? Number(p.rating_avg) : 0,
      rating_count: p.rating_count || 0,
      services: (p.partner_services || []).map((s: any) => ({
        id: s.id,
        partner_id: s.partner_id,
        service_id: s.service_id,
        name: s.name,
        description: s.description,
        charge_paise: s.charge_paise,
        charge_text: s.charge_text,
        estimated_time_text: s.estimated_time_text,
        is_active: s.is_active,
      })),
    };
  }

  private mapToDetail(p: any): PartnerDetail {
    const summary = this.mapToSummary(p);
    return {
      ...summary,
      institution_id: p.institution_id || null,
      verified_at: p.verified_at ? p.verified_at.toISOString() : null,
      created_at: p.created_at
        ? p.created_at.toISOString()
        : new Date().toISOString(),
      updated_at: p.updated_at
        ? p.updated_at.toISOString()
        : new Date().toISOString(),
      services: (p.partner_services || []).map((s: any) => ({
        id: s.id,
        partner_id: s.partner_id,
        service_id: s.service_id,
        name: s.name,
        description: s.description,
        charge_paise: s.charge_paise,
        charge_text: s.charge_text,
        estimated_time_text: s.estimated_time_text,
        is_active: s.is_active,
        created_at: s.created_at
          ? s.created_at.toISOString()
          : new Date().toISOString(),
        updated_at: s.updated_at
          ? s.updated_at.toISOString()
          : new Date().toISOString(),
      })),
      documents: (p.partner_documents || []).map((d: any) => ({
        id: d.id,
        partner_id: d.partner_id,
        document_kind: d.document_kind,
        storage_path: d.storage_path,
        status: d.status as PartnerVerificationStatus,
        reviewer_note: d.reviewer_note,
        reviewed_at: d.reviewed_at ? d.reviewed_at.toISOString() : null,
        created_at: d.created_at
          ? d.created_at.toISOString()
          : new Date().toISOString(),
      })),
    };
  }
}
