import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BookingDetail,
  BookingListResponse,
  BookingRequestEvent,
  BookingRequestStatus,
  BookingReview,
  CreateBookingInput,
  CreateReviewInput,
  UpdateBookingStatusInput,
} from '@applyfields/types';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';
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

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // CITIZEN BOOKINGS
  // =========================================================================

  async createBooking(userId: string, input: CreateBookingInput): Promise<BookingDetail> {
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
        include: {
          partners: true,
          partner_services: true,
          service_request_events: true,
          partner_reviews: true,
        },
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
      include: {
        partners: true,
        partner_services: true,
        service_request_events: {
          orderBy: { created_at: 'asc' },
        },
        partner_reviews: true,
      },
    });

    return {
      total: rows.length,
      items: rows.map((r) => this.mapToDetail(r)),
    };
  }

  async getUserBooking(userId: string, bookingId: string): Promise<BookingDetail> {
    const req = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      include: {
        partners: true,
        partner_services: true,
        service_request_events: {
          orderBy: { created_at: 'asc' },
        },
        partner_reviews: true,
      },
    });

    if (!req || req.user_id !== userId) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
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
        include: {
          partners: true,
          partner_services: true,
          service_request_events: { orderBy: { created_at: 'asc' } },
          partner_reviews: true,
        },
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
      include: {
        partners: true,
        partner_services: true,
        service_request_events: { orderBy: { created_at: 'asc' } },
        partner_reviews: true,
      },
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
        include: {
          partners: true,
          partner_services: true,
          service_request_events: { orderBy: { created_at: 'asc' } },
          partner_reviews: true,
        },
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
        include: {
          partners: true,
          partner_services: true,
          service_request_events: { orderBy: { created_at: 'asc' } },
          partner_reviews: true,
        },
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
