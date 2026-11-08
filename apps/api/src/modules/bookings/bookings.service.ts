import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  BookingDetail,
  BookingListResponse,
  BookingRequestEvent,
  BookingRequestStatus,
  BookingReview,
  CreateBookingInput,
  CreateReviewInput,
  MarkFiledInput,
  UpdateBookingStatusInput,
} from '@applyfields/types';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../../common/storage.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { request_status } from '../../generated/prisma/enums.js';

export const createBookingSchema = z.object({
  partner_id: z.string().uuid(),
  partner_service_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  opportunity_id: z.string().uuid().optional(),
  appointment_at: z.string().datetime().optional(),
  user_note: z.string().trim().max(500).optional(),
  contact_phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian mobile number').optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['new', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled']),
  partner_note: z.string().trim().max(500).optional(),
  cancelled_reason: z.string().trim().max(500).optional(),
  quoted_paise: z.number().int().min(0).optional(),
  final_paise: z.number().int().min(0).optional(),
});

const MAX_SLIP_BYTES = 5 * 1024 * 1024; // 5 MB
/** Accepted slip types → extension + magic bytes (never trust the declared MIME alone). */
const SLIP_TYPES = {
  'application/pdf': { ext: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'image/jpeg': { ext: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { ext: 'png', magic: [0x89, 0x50, 0x4e, 0x47] },
} as const;

export const markFiledSchema = z.object({
  official_app_number: z
    .string()
    .trim()
    .min(4, 'Official application number is too short')
    .max(60)
    .regex(/^[A-Za-z0-9][A-Za-z0-9\-/. ]*$/, 'Use letters, digits, - / . only (e.g. MVA-2026-98741)'),
  slip_base64: z.string().min(1, 'Upload the acknowledgment slip'),
  slip_mime_type: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  partner_note: z.string().trim().max(500).optional(),
});

/** Decode a base64 / data-URL slip and check its size and real file type. */
export function decodeSlip(base64: string, mime: keyof typeof SLIP_TYPES): Buffer {
  const buf = Buffer.from(base64.includes(';base64,') ? base64.split(';base64,')[1] : base64, 'base64');
  if (buf.length === 0) throw new BadRequestException('The acknowledgment slip is empty.');
  if (buf.length > MAX_SLIP_BYTES) throw new BadRequestException('The acknowledgment slip must be 5 MB or smaller.');
  if (!SLIP_TYPES[mime].magic.every((b, i) => buf[i] === b)) {
    throw new BadRequestException('The file content does not match a PDF, JPG or PNG.');
  }
  return buf;
}

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

/** Lean selection projection for service request queries to eliminate heavy JSON/blob payload overhead. */
export const LEAN_BOOKING_INCLUDE = {
  partners: {
    select: {
      business_name: true,
      slug: true,
      phone: true,
      address: true,
      city: true,
      district: true,
    },
  },
  partner_services: {
    select: {
      name: true,
    },
  },
  service_request_events: {
    orderBy: { created_at: 'asc' as const },
    select: {
      id: true,
      request_id: true,
      from_status: true,
      to_status: true,
      note: true,
      actor_user_id: true,
      created_at: true,
    },
  },
  partner_reviews: {
    select: {
      id: true,
      partner_id: true,
      user_id: true,
      request_id: true,
      rating: true,
      comment: true,
      created_at: true,
    },
  },
} as const;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage?: StorageService,
    private readonly notifications?: NotificationsService,
  ) {}

  // =========================================================================
  // CITIZEN BOOKINGS
  // =========================================================================

  async createBooking(userId: string | null, input: CreateBookingInput): Promise<BookingDetail> {
    const partner = await this.prisma.partners.findUnique({
      where: { id: input.partner_id },
    });

    if (!partner) {
      throw new NotFoundException(`Partner center with ID "${input.partner_id}" not found`);
    }

    let initialQuotedPaise: number | null = null;
    if (input.partner_service_id) {
      const partnerService = await this.prisma.partner_services.findUnique({
        where: { id: input.partner_service_id },
      });
      if (partnerService && partnerService.charge_paise) {
        initialQuotedPaise = partnerService.charge_paise;
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const req = await tx.service_requests.create({
        data: {
          user_id: userId,
          partner_id: input.partner_id,
          partner_service_id: input.partner_service_id ?? null,
          service_id: input.service_id ?? null,
          opportunity_id: input.opportunity_id ?? null,
          status: 'new',
          appointment_at: input.appointment_at ? new Date(input.appointment_at) : null,
          user_note: input.user_note ?? null,
          quoted_paise: initialQuotedPaise,
        },
        include: LEAN_BOOKING_INCLUDE,
      });

      await tx.service_request_events.create({
        data: {
          request_id: req.id,
          from_status: null,
          to_status: 'new',
          note: 'Assistance request submitted by citizen.',
          actor_user_id: userId,
        },
      });

      return req;
    });

    return this.mapToDetail(created);
  }

  async listUserBookings(userId: string): Promise<BookingListResponse> {
    const rows = await this.prisma.service_requests.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: LEAN_BOOKING_INCLUDE,
    });

    return {
      total: rows.length,
      items: rows.map((r) => this.mapToDetail(r)),
    };
  }

  async getUserBooking(userId: string | null, bookingId: string): Promise<BookingDetail> {
    const req = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      include: LEAN_BOOKING_INCLUDE,
    });

    if (!req) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
    }

    if (
      req.user_id &&
      userId &&
      req.user_id !== userId &&
      !(await this.isPartnerMember(userId, req.partner_id))
    ) {
      throw new ForbiddenException(`You are not authorized to view this booking`);
    }

    return this.mapToDetail(req);
  }

  async cancelUserBooking(
    userId: string,
    bookingId: string,
    reason?: string,
  ): Promise<BookingDetail> {
    const existing = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
    });

    if (!existing || existing.user_id !== userId) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
    }

    if (existing.status !== 'new' && existing.status !== 'accepted') {
      throw new BadRequestException(
        `Cannot cancel booking in status "${existing.status}". Contact the partner center directly.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.service_requests.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          cancelled_reason: reason ?? 'Cancelled by citizen',
        },
        include: LEAN_BOOKING_INCLUDE,
      });

      await tx.service_request_events.create({
        data: {
          request_id: bookingId,
          from_status: existing.status,
          to_status: 'cancelled',
          note: reason ?? 'Cancelled by citizen request',
          actor_user_id: userId,
        },
      });

      return row;
    });

    return this.mapToDetail(updated);
  }

  async reviewBooking(
    userId: string,
    bookingId: string,
    input: CreateReviewInput,
  ): Promise<BookingReview> {
    const existing = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      include: { partner_reviews: true },
    });

    if (!existing || existing.user_id !== userId) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
    }

    if (existing.status !== 'completed') {
      throw new BadRequestException('You can only review completed assistance requests.');
    }

    if (existing.partner_reviews) {
      throw new BadRequestException('A review has already been submitted for this booking.');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.partner_reviews.create({
        data: {
          partner_id: existing.partner_id,
          user_id: userId,
          request_id: bookingId,
          rating: input.rating,
          comment: input.comment ?? null,
          is_visible: true,
        },
      });

      // Recalculate partner aggregate rating
      const allReviews = await tx.partner_reviews.findMany({
        where: { partner_id: existing.partner_id, is_visible: true },
        select: { rating: true },
      });

      const count = allReviews.length;
      const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;

      await tx.partners.update({
        where: { id: existing.partner_id },
        data: {
          rating_avg: avg,
          rating_count: count,
        },
      });

      return created;
    });

    return {
      id: review.id,
      partner_id: review.partner_id,
      user_id: review.user_id,
      request_id: review.request_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at.toISOString(),
    };
  }

  // =========================================================================
  // PARTNER INBOX & WORKFLOW
  // =========================================================================

  async listPartnerBookings(userId: string, filterStatus?: string): Promise<BookingListResponse> {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('No partner center account linked to this user.');
    }

    const where: any = { partner_id: membership.partner_id };
    if (filterStatus) {
      where.status = filterStatus as request_status;
    }

    const rows = await this.prisma.service_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: LEAN_BOOKING_INCLUDE,
    });

    return {
      total: rows.length,
      items: rows.map((r) => this.mapToDetail(r)),
    };
  }

  async updatePartnerBooking(
    userId: string,
    bookingId: string,
    input: UpdateBookingStatusInput,
  ): Promise<BookingDetail> {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('No partner center account linked to this user.');
    }

    const existing = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
    });

    if (!existing || existing.partner_id !== membership.partner_id) {
      throw new NotFoundException(`Booking "${bookingId}" not found or unauthorized`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.service_requests.update({
        where: { id: bookingId },
        data: {
          status: input.status as request_status,
          ...(input.partner_note !== undefined && { partner_note: input.partner_note }),
          ...(input.cancelled_reason !== undefined && { cancelled_reason: input.cancelled_reason }),
          ...(input.quoted_paise !== undefined && { quoted_paise: input.quoted_paise }),
          ...(input.final_paise !== undefined && { final_paise: input.final_paise }),
          ...(input.status === 'completed' && { completed_at: new Date() }),
        },
        include: LEAN_BOOKING_INCLUDE,
      });

      await tx.service_request_events.create({
        data: {
          request_id: bookingId,
          from_status: existing.status,
          to_status: input.status as request_status,
          note: input.partner_note ?? `Status transitioned to ${input.status} by partner desk.`,
          actor_user_id: userId,
        },
      });

      return row;
    });

    return this.mapToDetail(updated);
  }

  /**
   * Operator filed the application on the official portal: store the official application number and
   * the acknowledgment slip (private Supabase Storage), complete the request, notify the citizen.
   */
  async markFiled(userId: string, bookingId: string, input: MarkFiledInput): Promise<BookingDetail> {
    const existing = await this.prisma.service_requests.findUnique({ where: { id: bookingId } });
    if (!existing || !(await this.isPartnerMember(userId, existing.partner_id))) {
      throw new NotFoundException(`Booking "${bookingId}" not found or unauthorized`);
    }
    if (['completed', 'cancelled', 'rejected'].includes(existing.status)) {
      throw new BadRequestException(`This request is already ${existing.status}.`);
    }

    const slip = decodeSlip(input.slip_base64, input.slip_mime_type);
    const path = `acknowledgments/${bookingId}/${Date.now()}.${SLIP_TYPES[input.slip_mime_type].ext}`;
    const stored = this.storage
      ? await this.storage.upload(this.storage.documentsBucket, path, slip, input.slip_mime_type)
      : null;
    if (!stored) {
      throw new ServiceUnavailableException('Could not store the acknowledgment slip. Please try again.');
    }

    const appNo = input.official_app_number;
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.service_requests.update({
        where: { id: bookingId },
        data: {
          status: 'completed',
          completed_at: new Date(),
          official_app_number: appNo,
          acknowledgment_slip_url: stored,
          ...(input.partner_note !== undefined && { partner_note: input.partner_note }),
        },
        include: LEAN_BOOKING_INCLUDE,
      });
      await tx.service_request_events.create({
        data: {
          request_id: bookingId,
          from_status: existing.status,
          to_status: 'completed',
          note: `Filed on the official portal. Application No. ${appNo}. Acknowledgment slip uploaded.`,
          actor_user_id: userId,
        },
      });
      return row;
    });

    // The filing is saved; a failed notification must not undo it.
    if (existing.user_id && this.notifications) {
      await this.notifications
        .notify(
          [existing.user_id],
          {
            type: 'request_update',
            title: 'Your application has been filed',
            body: `Official Application No. ${appNo}. Your acknowledgment slip is ready to download.`,
            // The booking page lives on the services app, not the main web app.
            link: `${(process.env.SERVICE_URL ?? 'https://service.applyfields.in').replace(/\/$/, '')}/bookings/${bookingId}`,
          },
          () => `request_filed:${bookingId}`,
        )
        .catch((err: Error) => this.logger.warn(`Filing notification failed for ${bookingId}: ${err.message}`));
    }

    return this.mapToDetail(updated);
  }

  /** Short-lived download link for the acknowledgment slip: only the citizen or the partner centre. */
  async slipUrl(userId: string, bookingId: string): Promise<{ url: string }> {
    const req = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      select: { user_id: true, partner_id: true, acknowledgment_slip_url: true, official_app_number: true },
    });
    const allowed = req && (req.user_id === userId || (await this.isPartnerMember(userId, req.partner_id)));
    if (!req || !allowed || !req.acknowledgment_slip_url) {
      throw new NotFoundException('No acknowledgment slip for this booking.');
    }
    const ext = req.acknowledgment_slip_url.split('.').pop();
    const url = this.storage
      ? await this.storage.signedUrl(
          this.storage.documentsBucket,
          req.acknowledgment_slip_url,
          600,
          `acknowledgment-${req.official_app_number ?? bookingId}.${ext}`,
        )
      : null;
    if (!url) throw new ServiceUnavailableException('The slip is not available right now. Please try again.');
    return { url };
  }

  private async isPartnerMember(userId: string, partnerId: string): Promise<boolean> {
    const m = await this.prisma.partner_members.findFirst({
      where: { user_id: userId, partner_id: partnerId },
      select: { user_id: true },
    });
    return Boolean(m);
  }

  // =========================================================================
  // ADMIN NETWORK OVERSIGHT (StaffGuard)
  // =========================================================================

  async adminListBookings(query: {
    partnerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.partnerId) where.partner_id = query.partnerId;
    if (query.status) where.status = query.status as request_status;

    const [total, rows] = await Promise.all([
      this.prisma.service_requests.count({ where }),
      this.prisma.service_requests.findMany({
        where,
        take: limit,
        skip,
        orderBy: { created_at: 'desc' },
        include: LEAN_BOOKING_INCLUDE,
      }),
    ]);

    return {
      total,
      items: rows.map((r) => this.mapToDetail(r)),
    };
  }

  // =========================================================================
  // HELPER MAPPER
  // =========================================================================

  private mapToDetail(r: any): BookingDetail {
    return {
      id: r.id,
      user_id: r.user_id,
      partner_id: r.partner_id,
      partner_business_name: r.partners?.business_name ?? 'Unknown Partner',
      partner_slug: r.partners?.slug ?? '',
      partner_phone: r.partners?.phone ?? null,
      partner_address: r.partners?.address
        ? `${r.partners.address}, ${r.partners.city || r.partners.district || ''}`
        : null,
      partner_service_id: r.partner_service_id,
      service_name: r.partner_services?.name ?? null,
      service_id: r.service_id,
      opportunity_id: r.opportunity_id,
      status: r.status as BookingRequestStatus,
      appointment_at: r.appointment_at ? r.appointment_at.toISOString() : null,
      user_note: r.user_note,
      partner_note: r.partner_note,
      quoted_paise: r.quoted_paise,
      final_paise: r.final_paise,
      cancelled_reason: r.cancelled_reason,
      completed_at: r.completed_at ? r.completed_at.toISOString() : null,
      official_app_number: r.official_app_number ?? null,
      has_acknowledgment_slip: Boolean(r.acknowledgment_slip_url),
      created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
      updated_at: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString(),
      events: (r.service_request_events || []).map((e: any) => ({
        id: e.id,
        request_id: e.request_id,
        from_status: e.from_status as BookingRequestStatus | null,
        to_status: e.to_status as BookingRequestStatus,
        note: e.note,
        actor_user_id: e.actor_user_id,
        created_at: e.created_at ? e.created_at.toISOString() : new Date().toISOString(),
      })),
      review: r.partner_reviews
        ? {
            id: r.partner_reviews.id,
            partner_id: r.partner_reviews.partner_id,
            user_id: r.partner_reviews.user_id,
            request_id: r.partner_reviews.request_id,
            rating: r.partner_reviews.rating,
            comment: r.partner_reviews.comment,
            created_at: r.partner_reviews.created_at
              ? r.partner_reviews.created_at.toISOString()
              : new Date().toISOString(),
          }
        : null,
    };
  }
}
