import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Optional,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import type {
  ChatMessageItem,
  AdminBookingDispute,
  BookingDispute,
  BookingDisputeStatus,
  CreateBookingDisputeInput,
  ResolveBookingDisputeInput,
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
import { VaultService } from '../../common/vault.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { MessagesService } from '../messages/messages.service.js';
import type { request_status } from '../../generated/prisma/enums.js';
import {
  START_CODE_MAX_WRONG,
  START_CODE_WINDOW_MS,
  WRONG_START_CODE_NOTE,
  startCode,
  startCodeMatches,
} from './start-code.js';

/** The citizen's start code rides only on their own copy, and only until the work has started. */
const NOT_STARTED = new Set(['new', 'accepted']);
const withStartCode = <T extends { id: string; status: string }>(b: T) =>
  ({ ...b, start_code: NOT_STARTED.has(b.status) ? startCode(b.id) : null });

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
  status: z.enum(['new', 'accepted', 'rejected', 'in_progress', 'needs_fix', 'completed', 'cancelled']),
  start_code: z.string().trim().regex(/^\d{4}$/, 'The start code is 4 digits').optional(),
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

export const createDisputeSchema = z.object({
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().min(10, 'Please describe what happened (at least 10 characters).').max(2000),
  claim_paise: z.number().int().min(0).max(10_000_000).optional(),
});

export const resolveDisputeSchema = z.object({
  status: z.enum(['in_review', 'resolved', 'rejected']),
  note: z.string().trim().min(3, 'Add a short note for the citizen.').max(2000),
});

/** Disputes live in support_tickets: category = this, subject = `booking:<id>`, internal_notes[0] = the claim. */
const DISPUTE_CATEGORY = 'booking_dispute';
type DisputeNote = { reason?: string; claim_paise?: number | null; status?: string; note?: string; by?: string | null; at?: string };

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
      email: true,
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
  // Expiry is checked in mapToDetail (a `new Date()` here would freeze at module load).
  document_shares: {
    where: { revoked_at: null, user_documents: { deleted_at: null } },
    orderBy: { created_at: 'asc' as const },
    select: {
      id: true,
      expires_at: true,
      user_documents: {
        select: { document_type_code: true, title: true, file_name: true, mime_type: true, size_bytes: true },
      },
    },
  },
} as const;

export const walkInSchema = z.object({
  citizen_name: z.string().trim().min(2).max(100),
  contact_phone: z
    .string()
    .trim()
    .regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian mobile number')
    .optional(),
  /** From the centre's own rate card; or leave out and type service_name. */
  partner_service_id: z.string().uuid().optional(),
  service_name: z.string().trim().min(2).max(120),
  /** What the counter actually collected (govt fee + service charge), in paise. */
  amount_paise: z.number().int().min(0).max(10_000_000),
  payment_mode: z.enum(['cash', 'upi']),
});
export type WalkInInput = z.infer<typeof walkInSchema>;

export const attachToChatSchema = z.object({ document_id: z.string().uuid() });

export const shareDocumentsSchema = z.object({
  document_ids: z.array(z.string().uuid()).max(15),
});

/** Shares last until a week after the appointment (or a week from now for walk-ins / past dates). */
export const SHARE_GRACE_MS = 7 * 86_400_000;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage?: StorageService,
    private readonly notifications?: NotificationsService,
    @Optional() private readonly payments?: PaymentsService,
    @Optional() private readonly vault: VaultService = new VaultService(),
    @Optional() private readonly messages?: MessagesService,
  ) {}

  // =========================================================================
  // CITIZEN BOOKINGS
  // =========================================================================

  async createBooking(userId: string | null, input: CreateBookingInput): Promise<BookingDetail> {
    const partner = await this.prisma.partners.findUnique({
      where: { id: input.partner_id },
    });

    // Only centres staff approved and listed take bookings (same rule as the public directory).
    if (!partner || partner.verification_status !== 'verified' || !partner.is_listed) {
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

    // The citizen's own complaints, attached to their bookings.
    const tickets = rows.length
      ? await this.prisma.support_tickets.findMany({
          where: { user_id: userId, category: DISPUTE_CATEGORY },
          orderBy: { created_at: 'desc' },
        })
      : [];
    const disputesByBooking = new Map<string, BookingDispute[]>();
    for (const t of tickets) {
      const d = this.toDispute(t);
      disputesByBooking.set(d.booking_id, [...(disputesByBooking.get(d.booking_id) ?? []), d]);
    }

    return {
      total: rows.length,
      items: rows.map((r) => ({ ...withStartCode(this.mapToDetail(r)), disputes: disputesByBooking.get(r.id) ?? [] })),
    };
  }

  /** Citizen raises a complaint about their own booking; staff handle it on the admin Disputes desk. */
  async createDispute(userId: string, bookingId: string, input: CreateBookingDisputeInput): Promise<BookingDispute> {
    const booking = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      select: { id: true, user_id: true },
    });
    if (!booking || booking.user_id !== userId) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
    }
    const already = await this.prisma.support_tickets.findFirst({
      where: { user_id: userId, category: DISPUTE_CATEGORY, subject: `booking:${bookingId}`, status: { in: ['open', 'in_review'] } },
      select: { id: true },
    });
    if (already) {
      throw new BadRequestException('You already have an open complaint for this booking. We will reply there.');
    }
    const first: DisputeNote = { reason: input.reason, claim_paise: input.claim_paise ?? null };
    const row = await this.prisma.support_tickets.create({
      data: {
        user_id: userId,
        category: DISPUTE_CATEGORY,
        subject: `booking:${bookingId}`,
        message: input.details,
        internal_notes: [first],
      },
    });
    // Saved either way; the staff alert must not undo or fail the complaint.
    void this.notifications
      ?.notifyStaff(
        ['support'],
        {
          title: 'New booking complaint',
          body: `${input.reason} · booking AF-${bookingId.slice(0, 8).toUpperCase()}`,
          path: '/disputes',
        },
        `staff_dispute:${row.id}`,
      )
      .catch((err: Error) => this.logger.warn(`Staff alert failed for dispute ${row.id}: ${err.message}`));
    return this.toDispute(row);
  }

  async adminListDisputes(status?: string): Promise<{ total: number; items: AdminBookingDispute[] }> {
    const statuses: BookingDisputeStatus[] = ['open', 'in_review', 'resolved', 'rejected', 'closed'];
    const where = {
      category: DISPUTE_CATEGORY,
      ...(status && statuses.includes(status as BookingDisputeStatus) ? { status: status as BookingDisputeStatus } : {}),
    };
    const tickets = await this.prisma.support_tickets.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 200,
      include: {
        users_support_tickets_user_idTousers: {
          select: { email: true, phone: true, user_profiles: { select: { full_name: true } } },
        },
      },
    });
    const disputes = tickets.map((t) => this.toDispute(t));
    const bookings = await this.prisma.service_requests.findMany({
      where: { id: { in: [...new Set(disputes.map((d) => d.booking_id))] } },
      select: {
        id: true,
        final_paise: true,
        quoted_paise: true,
        partners: { select: { business_name: true } },
        partner_services: { select: { name: true } },
      },
    });
    const byId = new Map(bookings.map((b) => [b.id, b]));
    return {
      total: disputes.length,
      items: disputes.map((d, i) => {
        const user = tickets[i].users_support_tickets_user_idTousers;
        const b = byId.get(d.booking_id);
        return {
          ...d,
          citizen_name: user?.user_profiles?.full_name ?? null,
          citizen_phone: user?.phone ?? null,
          citizen_email: user?.email ?? null,
          partner_business_name: b?.partners?.business_name ?? null,
          service_name: b?.partner_services?.name ?? null,
          booking_amount_paise: b?.final_paise ?? b?.quoted_paise ?? null,
        };
      }),
    };
  }

  /** Staff decision. Money is not moved here (no payments yet): a refund is recorded and paid by hand. */
  async adminResolveDispute(actorId: string | null, id: string, input: ResolveBookingDisputeInput): Promise<BookingDispute> {
    const ticket = await this.prisma.support_tickets.findFirst({ where: { id, category: DISPUTE_CATEGORY } });
    if (!ticket) throw new NotFoundException('Dispute not found');
    const notes = Array.isArray(ticket.internal_notes) ? (ticket.internal_notes as DisputeNote[]) : [];
    const done = input.status !== 'in_review';
    const updated = await this.prisma.support_tickets.update({
      where: { id },
      data: {
        status: input.status,
        assigned_to: actorId,
        resolved_at: done ? new Date() : null,
        updated_at: new Date(),
        internal_notes: [...notes, { status: input.status, note: input.note, by: actorId, at: new Date().toISOString() }],
      },
    });
    const dispute = this.toDispute(updated);
    if (ticket.user_id && this.notifications) {
      await this.notifications
        .notify(
          [ticket.user_id],
          {
            type: 'request_update',
            title: done ? `Your complaint was ${input.status}` : 'Your complaint is being reviewed',
            body: input.note,
            link: `${(process.env.SERVICE_URL ?? 'https://service.applyfields.com').replace(/\/$/, '')}/my-bookings`,
          },
          () => `dispute:${id}:${input.status}:${notes.length}`,
        )
        .catch((err: Error) => this.logger.warn(`Dispute notify failed: ${err.message}`));
    }
    return dispute;
  }

  private toDispute(t: {
    id: string;
    subject: string;
    message: string;
    status: string;
    internal_notes: unknown;
    created_at: Date;
    resolved_at: Date | null;
  }): BookingDispute {
    const notes = Array.isArray(t.internal_notes) ? (t.internal_notes as DisputeNote[]) : [];
    const claim = notes[0] ?? {};
    const lastDecision = [...notes].reverse().find((n) => n.note);
    return {
      id: t.id,
      booking_id: t.subject.replace(/^booking:/, ''),
      reason: claim.reason ?? 'Complaint',
      details: t.message,
      claim_paise: claim.claim_paise ?? null,
      status: t.status as BookingDisputeStatus,
      resolution_note: lastDecision?.note ?? null,
      created_at: t.created_at.toISOString(),
      resolved_at: t.resolved_at ? t.resolved_at.toISOString() : null,
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

    const detail = this.mapToDetail(req);
    return req.user_id && req.user_id === userId ? withStartCode(detail) : detail;
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

    await this.payments?.refundBooking(bookingId, reason ?? 'Cancelled by citizen');
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

  /**
   * Counter walk-in: the centre registers a citizen who came in person. Saved as an in-progress booking
   * with the amount already collected (quoted = final), so it shows in Bookings and, once completed,
   * in Earnings. No citizen account is linked (user_id null), so no citizen notifications.
   */
  async createWalkIn(userId: string, input: WalkInInput): Promise<BookingDetail> {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
      include: { partners: { select: { verification_status: true } } },
    });
    if (!membership) throw new ForbiddenException('No partner center account linked to this user.');
    if (membership.partners.verification_status !== 'verified') {
      throw new ForbiddenException('The counter opens once ApplyFields approves your centre.');
    }

    let serviceName = input.service_name;
    if (input.partner_service_id) {
      const svc = await this.prisma.partner_services.findFirst({
        where: { id: input.partner_service_id, partner_id: membership.partner_id },
        select: { name: true },
      });
      if (!svc) throw new BadRequestException('That service is not on your rate card.');
      serviceName = svc.name;
    }
    const mode = input.payment_mode === 'upi' ? 'UPI' : 'Cash';
    // Same "Applicant: …; Contact: …" format the booking desks already read.
    const note = [
      `Applicant: ${input.citizen_name}`,
      input.contact_phone ? `Contact: ${input.contact_phone}` : null,
      `Service: ${serviceName}`,
      `Walk-in at counter, paid ${mode}`,
    ]
      .filter(Boolean)
      .join('; ');

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.service_requests.create({
        data: {
          partner_id: membership.partner_id,
          user_id: null,
          partner_service_id: input.partner_service_id ?? null,
          status: 'in_progress',
          appointment_at: new Date(),
          user_note: note,
          quoted_paise: input.amount_paise,
          final_paise: input.amount_paise,
        },
        include: LEAN_BOOKING_INCLUDE,
      });
      await tx.service_request_events.create({
        data: {
          request_id: row.id,
          from_status: null,
          to_status: 'in_progress',
          note: `Walk-in registered at the counter (${mode}, ₹${(input.amount_paise / 100).toFixed(2)}).`,
          actor_user_id: userId,
        },
      });
      return row;
    });
    return this.mapToDetail(created);
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

    // Sent back to fix: only a started job, and it returns to in_progress (no start code) when fixed.
    if (input.status === 'needs_fix' && existing.status !== 'in_progress' && existing.status !== 'needs_fix') {
      throw new BadRequestException('Only a job in progress can be sent back to fix.');
    }
    const reopening = existing.status === 'needs_fix' && input.status === 'in_progress';

    // Citizen bookings (walk-ins have no citizen account) start only with the citizen's code,
    // and can only be completed after they started.
    if (existing.user_id && existing.status !== input.status && !reopening) {
      if (input.status === 'in_progress') {
        if (!NOT_STARTED.has(existing.status)) {
          throw new BadRequestException(`This booking is already ${existing.status}.`);
        }
        await this.checkStartCode(existing.id, existing.status as request_status, input.start_code, userId);
      } else if (input.status === 'completed' && existing.status === 'needs_fix') {
        throw new BadRequestException('This job was sent back to fix. Reopen it once the documents are fixed.');
      } else if (input.status === 'completed' && existing.status !== 'in_progress') {
        throw new BadRequestException(
          'Start the booking first: ask the citizen for the 4-digit start code shown in their app.',
        );
      }
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

    if (input.status === 'rejected' || input.status === 'cancelled') {
      await this.payments?.refundBooking(bookingId, input.cancelled_reason ?? `Booking ${input.status} by the centre`);
    }
    return this.mapToDetail(updated);
  }

  /**
   * Start code check: 429 after START_CODE_MAX_WRONG wrong codes in the window (stops guessing all
   * 10,000), 400 on a wrong or missing code. Wrong tries are logged as booking events.
   */
  private async checkStartCode(bookingId: string, status: request_status, code: string | undefined, userId: string) {
    const wrong = await this.prisma.service_request_events.count({
      where: {
        request_id: bookingId,
        note: WRONG_START_CODE_NOTE,
        created_at: { gte: new Date(Date.now() - START_CODE_WINDOW_MS) },
      },
    });
    if (wrong >= START_CODE_MAX_WRONG) {
      throw new HttpException(
        'Too many wrong start codes. Wait 15 minutes, or ask the citizen to open the booking in their app and read the code again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (!code) {
      throw new BadRequestException('Enter the 4-digit start code from the citizen’s app to start this booking.');
    }
    if (!startCodeMatches(bookingId, code)) {
      await this.prisma.service_request_events.create({
        data: { request_id: bookingId, from_status: status, to_status: status, note: WRONG_START_CODE_NOTE, actor_user_id: userId },
      });
      throw new BadRequestException('That start code is not right. Ask the citizen to read it from their booking.');
    }
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
    if (existing.user_id && existing.status !== 'in_progress') {
      throw new BadRequestException(
        'Start the booking first: in Bookings, enter the citizen’s 4-digit start code, then file it here.',
      );
    }

    const slip = decodeSlip(input.slip_base64, input.slip_mime_type);
    const { data: encryptedSlip, encryptedKey } = this.vault.encrypt(slip);
    const path = `acknowledgments/${bookingId}/${Date.now()}.${SLIP_TYPES[input.slip_mime_type].ext}`;
    const stored = this.storage
      ? await this.storage.upload(this.storage.documentsBucket, path, encryptedSlip, input.slip_mime_type)
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
          acknowledgment_slip_encrypted_key: new Uint8Array(encryptedKey),
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
            link: `${(process.env.SERVICE_URL ?? 'https://service.applyfields.com').replace(/\/$/, '')}/bookings/${bookingId}`,
          },
          () => `request_filed:${bookingId}`,
        )
        .catch((err: Error) => this.logger.warn(`Filing notification failed for ${bookingId}: ${err.message}`));
    }

    return this.mapToDetail(updated);
  }

  /** Acknowledgment slip file stream: only the citizen or authorized partner centre member. */
  async getSlipFile(userId: string, bookingId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const req = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      select: {
        user_id: true,
        partner_id: true,
        acknowledgment_slip_url: true,
        acknowledgment_slip_encrypted_key: true,
        official_app_number: true,
      },
    });
    if (!req || !req.acknowledgment_slip_url) {
      throw new NotFoundException('No acknowledgment slip for this booking.');
    }
    const allowed = req.user_id === userId || (await this.isPartnerMember(userId, req.partner_id));
    if (!allowed) {
      throw new ForbiddenException('Not authorized to access this slip.');
    }
    const path = req.acknowledgment_slip_url;
    let rawBytes: Buffer | null = null;
    if (existsSync(path)) {
      rawBytes = readFileSync(path);
    } else if (this.storage) {
      rawBytes = await this.storage.download(this.storage.documentsBucket, path);
    }
    if (!rawBytes) {
      throw new NotFoundException('Slip file not found.');
    }
    const encryptedKey = req.acknowledgment_slip_encrypted_key
      ? Buffer.from(req.acknowledgment_slip_encrypted_key)
      : null;
    const buffer = this.vault.decrypt(rawBytes, encryptedKey);
    const ext = path.replace(/\.enc$/i, '').split('.').pop() || 'pdf';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/pdf';
    return {
      buffer,
      fileName: `acknowledgment-${req.official_app_number ?? bookingId}.${ext}`,
      mimeType,
    };
  }

  /** Short-lived download link for the acknowledgment slip: only the citizen or the partner centre. */
  async slipUrl(userId: string, bookingId: string): Promise<{ url: string }> {
    const req = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      select: { user_id: true, partner_id: true, acknowledgment_slip_url: true, official_app_number: true },
    });
    if (!req || !req.acknowledgment_slip_url) {
      throw new NotFoundException('No acknowledgment slip for this booking.');
    }
    const allowed = req.user_id === userId || (await this.isPartnerMember(userId, req.partner_id));
    if (!allowed) {
      throw new ForbiddenException('Not authorized to access this slip.');
    }
    const baseUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    return {
      url: `${baseUrl}/api/v1/bookings/${bookingId}/slip/file`,
    };
  }

  /**
   * Citizen picks which locker documents the centre may open for this booking. Replaces the set:
   * ids left out are revoked, new ones get a share that ends a week after the appointment.
   */
  async shareDocuments(userId: string, bookingId: string, documentIds: string[]): Promise<BookingDetail> {
    const booking = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      select: { user_id: true, partner_id: true, appointment_at: true, status: true },
    });
    if (!booking || booking.user_id !== userId) throw new NotFoundException('Booking not found.');
    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      throw new BadRequestException(`This booking is already ${booking.status}.`);
    }
    const ids = [...new Set(documentIds)];
    const owned = await this.prisma.user_documents.findMany({
      where: { id: { in: ids }, user_id: userId, deleted_at: null },
      select: { id: true },
    });
    if (owned.length !== ids.length) throw new BadRequestException('Some documents are not in your locker.');

    const now = new Date();
    const expires = new Date(Math.max(booking.appointment_at?.getTime() ?? 0, now.getTime()) + SHARE_GRACE_MS);
    const active = await this.prisma.document_shares.findMany({
      where: { service_request_id: bookingId, revoked_at: null, expires_at: { gt: now } },
      select: { id: true, document_id: true },
    });
    const keep = new Set(ids);
    const have = new Set(active.map((s) => s.document_id));
    const revoke = active.filter((s) => !keep.has(s.document_id));
    const add = ids.filter((id) => !have.has(id));

    await this.prisma.$transaction(async (tx) => {
      if (revoke.length) {
        await tx.document_shares.updateMany({ where: { id: { in: revoke.map((s) => s.id) } }, data: { revoked_at: now } });
      }
      for (const document_id of add) {
        const share = await tx.document_shares.create({
          data: { document_id, owner_user_id: userId, partner_id: booking.partner_id, service_request_id: bookingId, expires_at: expires },
          select: { id: true },
        });
        await tx.document_access_logs.create({
          data: { document_id, share_id: share.id, actor_user_id: userId, partner_id: booking.partner_id, action: 'share' },
        });
      }
      for (const s of revoke) {
        await tx.document_access_logs.create({
          data: { document_id: s.document_id, share_id: s.id, actor_user_id: userId, partner_id: booking.partner_id, action: 'revoke' },
        });
      }
    });
    return this.getUserBooking(userId, bookingId);
  }

  /**
   * Citizen attaches a locker document in the booking chat: it is added to this booking's shares
   * (same rules, logging and expiry as shareDocuments) and a chat message points at the share.
   * Files never travel as raw links; the centre opens them through the share.
   */
  async attachToChat(userId: string, bookingId: string, documentId: string): Promise<ChatMessageItem> {
    if (!this.messages) throw new ServiceUnavailableException('Chat is not available right now.');
    const now = new Date();
    const active = await this.prisma.document_shares.findMany({
      where: { service_request_id: bookingId, revoked_at: null, expires_at: { gt: now } },
      select: { document_id: true },
    });
    // Ownership, booking state and the locker check all happen in shareDocuments.
    await this.shareDocuments(userId, bookingId, [...active.map((s) => s.document_id), documentId]);

    const share = await this.prisma.document_shares.findFirst({
      where: { service_request_id: bookingId, document_id: documentId, revoked_at: null, expires_at: { gt: now } },
      select: {
        id: true,
        user_documents: { select: { title: true, file_name: true, mime_type: true, size_bytes: true, document_type_code: true } },
      },
    });
    if (!share) throw new ServiceUnavailableException('Could not share the document. Please try again.');
    const doc = share.user_documents;
    const name = doc.title || doc.file_name || doc.document_type_code.replace(/_/g, ' ');
    const profile = await this.prisma.user_profiles.findUnique({ where: { user_id: userId }, select: { full_name: true } });

    return this.messages.sendMessage(bookingId, userId, {
      message: `Shared a document: ${name}`,
      sender_type: 'citizen',
      sender_name: profile?.full_name?.trim() || 'Citizen',
      attachments: [
        {
          name,
          share_id: share.id,
          file_type: doc.mime_type ?? undefined,
          file_size: doc.size_bytes ? `${Math.max(1, Math.round(doc.size_bytes / 1024))} KB` : undefined,
          kind: doc.mime_type === 'application/pdf' ? 'pdf' : doc.mime_type?.startsWith('image/') ? 'image' : 'doc',
        },
      ],
    });
  }

  /** Stream decrypted shared document: citizen owner or authorized centre partner. */
  async getDecryptedSharedDocument(
    userId: string,
    bookingId: string,
    shareId: string,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const share = await this.prisma.document_shares.findFirst({
      where: { id: shareId, service_request_id: bookingId, revoked_at: null, expires_at: { gt: new Date() } },
      select: {
        id: true,
        owner_user_id: true,
        partner_id: true,
        document_id: true,
        user_documents: {
          select: {
            id: true,
            storage_path: true,
            file_name: true,
            mime_type: true,
            deleted_at: true,
            encrypted_key: true,
          },
        },
      },
    });

    if (!share || share.user_documents.deleted_at) {
      throw new NotFoundException('This document is not shared with you.');
    }

    const isOwner = share.owner_user_id === userId;
    const isCentre = Boolean(share.partner_id && (await this.isPartnerMember(userId, share.partner_id)));
    if (!isOwner && !isCentre) {
      throw new ForbiddenException('This document is not shared with you.');
    }

    const storagePath = share.user_documents.storage_path;
    let rawBytes: Buffer | null = null;
    if (existsSync(storagePath)) {
      rawBytes = readFileSync(storagePath);
    } else if (this.storage) {
      rawBytes = await this.storage.download(this.storage.documentsBucket, storagePath);
    }

    if (!rawBytes) {
      throw new NotFoundException('The document is not available right now.');
    }

    const decrypted = this.vault
      ? this.vault.decrypt(
          rawBytes,
          share.user_documents.encrypted_key ? Buffer.from(share.user_documents.encrypted_key) : null,
        )
      : rawBytes;

    if (isCentre) {
      await this.prisma.document_access_logs
        .create({
          data: {
            document_id: share.document_id,
            share_id: share.id,
            actor_user_id: userId,
            partner_id: share.partner_id,
            action: 'view',
          },
        })
        .catch(() => null);
    }

    return {
      buffer: decrypted,
      fileName: share.user_documents.file_name || 'shared-document.pdf',
      mimeType: share.user_documents.mime_type || 'application/pdf',
    };
  }

  /** Stream link to one shared document: the citizen who shared it or a member of that centre. Logged. */
  async sharedDocumentUrl(userId: string, bookingId: string, shareId: string): Promise<{ url: string }> {
    const share = await this.prisma.document_shares.findFirst({
      where: { id: shareId, service_request_id: bookingId, revoked_at: null, expires_at: { gt: new Date() } },
      select: {
        id: true,
        owner_user_id: true,
        partner_id: true,
        document_id: true,
        user_documents: { select: { storage_path: true, deleted_at: true } },
      },
    });
    if (!share || share.user_documents.deleted_at) {
      throw new NotFoundException('This document is not shared with you.');
    }
    const isOwner = share.owner_user_id === userId;
    const isCentre = Boolean(share.partner_id && (await this.isPartnerMember(userId, share.partner_id)));
    if (!isOwner && !isCentre) {
      throw new ForbiddenException('This document is not shared with you.');
    }
    const baseUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    return {
      url: `${baseUrl}/api/v1/bookings/${bookingId}/documents/${shareId}/file`,
    };
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
      partner_email: r.partners?.email ?? null,

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
      shared_documents: (r.document_shares || [])
        .filter((s: any) => s.expires_at > new Date())
        .map((s: any) => ({
          share_id: s.id,
          document_type_code: s.user_documents.document_type_code,
          title: s.user_documents.title,
          file_name: s.user_documents.file_name,
          mime_type: s.user_documents.mime_type,
          size_bytes: s.user_documents.size_bytes,
          expires_at: s.expires_at.toISOString(),
        })),
    };
  }
}
