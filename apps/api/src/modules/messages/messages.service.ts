import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ChatMessageItem,
  ChatSenderType,
  ConversationListResponse,
  PartnerConversationThread,
  SendChatMessageInput,
} from '@applyfields/types';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';

export const sendChatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  sender_type: z.enum(['citizen', 'partner', 'system']),
  sender_name: z.string().trim().min(1).max(100),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().optional(),
        file_type: z.string().optional(),
        file_size: z.string().optional(),
        kind: z.enum(['pdf', 'image', 'doc']).optional(),
      }),
    )
    .optional(),
});

export const markReadSchema = z.object({
  reader_type: z.enum(['citizen', 'partner']),
});

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // MESSAGE STREAM (CITIZEN & PARTNER)
  // =========================================================================

  /**
   * Asserts that the caller is authorized to view or send messages on this booking:
   * 1. Citizen who owns the booking (booking.user_id === userId)
   * 2. Partner operator / staff of the booking's assigned partner center
   * 3. System admin / staff
   * 4. Guest applicant holding the unique appointment pass token
   */
  async assertBookingAccess(
    bookingId: string,
    userId?: string | null,
    token?: string | null,
  ): Promise<{ id: string; partner_id: string; user_id: string | null; token?: string }> {
    const booking = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      select: { id: true, partner_id: true, user_id: true, token: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking "${bookingId}" not found`);
    }

    // 1. Citizen owner
    if (userId && booking.user_id && booking.user_id === userId) {
      return booking;
    }

    // 2. Partner operator / member
    if (userId) {
      const isPartnerStaff = await this.prisma.partner_members.findFirst({
        where: { user_id: userId, partner_id: booking.partner_id, is_active: true },
      });
      if (isPartnerStaff) return booking;

      // 3. System admin / staff
      const isStaff = await this.prisma.user_roles.findFirst({
        where: { user_id: userId, role: { in: ['admin', 'super_admin', 'support'] } },
      });
      if (isStaff) return booking;
    }

    // 4. Token-based access (appointment pass for guest check-in)
    if (token && booking.token && token === booking.token) {
      return booking;
    }

    throw new ForbiddenException('You are not authorized to access messages for this booking');
  }

  async getMessages(
    bookingId: string,
    userId?: string | null,
    token?: string | null,
  ): Promise<ChatMessageItem[]> {
    await this.assertBookingAccess(bookingId, userId, token);
    const rows = await this.prisma.booking_messages.findMany({
      where: { request_id: bookingId },
      orderBy: { created_at: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      request_id: r.request_id,
      sender_user_id: r.sender_user_id,
      sender_type: r.sender_type as ChatSenderType,
      sender_name: r.sender_name,
      message: r.message,
      attachments: (r.attachments as any) ?? [],
      is_read: r.is_read,
      read_at: r.read_at ? r.read_at.toISOString() : null,
      created_at: r.created_at.toISOString(),
    }));
  }

  async sendMessage(
    bookingId: string,
    senderUserId: string | null,
    input: SendChatMessageInput,
    token?: string | null,
  ): Promise<ChatMessageItem> {
    const booking = await this.assertBookingAccess(bookingId, senderUserId, token);

    // Determine sender_type securely from authenticated identity (prevents spoofing)
    let senderType: ChatSenderType = 'citizen';
    if (senderUserId) {
      const isPartnerStaff = await this.prisma.partner_members.findFirst({
        where: { user_id: senderUserId, partner_id: booking.partner_id, is_active: true },
      });
      if (isPartnerStaff) {
        senderType = 'partner';
      }
    }

    const created = await this.prisma.booking_messages.create({
      data: {
        request_id: bookingId,
        sender_user_id: senderUserId,
        sender_type: senderType,
        sender_name: input.sender_name,
        message: input.message,
        attachments: (input.attachments as any) ?? [],
        is_read: false,
      },
    });

    return {
      id: created.id,
      request_id: created.request_id,
      sender_user_id: created.sender_user_id,
      sender_type: created.sender_type as ChatSenderType,
      sender_name: created.sender_name,
      message: created.message,
      attachments: (created.attachments as any) ?? [],
      is_read: created.is_read,
      read_at: created.read_at ? created.read_at.toISOString() : null,
      created_at: created.created_at.toISOString(),
    };
  }

  async markAsRead(
    bookingId: string,
    readerType: 'citizen' | 'partner',
    userId?: string | null,
    token?: string | null,
  ): Promise<{ count: number }> {
    await this.assertBookingAccess(bookingId, userId, token);
    const targetSenderType = readerType === 'partner' ? 'citizen' : 'partner';
    const updateRes = await this.prisma.booking_messages.updateMany({
      where: {
        request_id: bookingId,
        sender_type: targetSenderType,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return { count: updateRes.count };
  }

  // =========================================================================
  // PARTNER CONVERSATION THREADS INBOX
  // =========================================================================

  async getPartnerConversations(userId: string): Promise<ConversationListResponse> {
    const membership = await this.prisma.partner_members.findFirst({
      where: { user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('No partner center account linked to this user.');
    }

    const requests = await this.prisma.service_requests.findMany({
      where: { partner_id: membership.partner_id },
      orderBy: { created_at: 'desc' },
      take: 60,
      include: {
        partner_services: { select: { name: true } },
        gov_services: { select: { name: true } },
        // The name lives on user_profiles; users has no full_name column (selecting it threw a 500).
        users: { select: { phone: true, user_profiles: { select: { full_name: true } } } },
      },
    });

    const threads: PartnerConversationThread[] = await Promise.all(
      requests.map(async (req) => {
        const [latestMsg, unreadCount] = await Promise.all([
          this.prisma.booking_messages.findFirst({
            where: { request_id: req.id },
            orderBy: { created_at: 'desc' },
          }),
          this.prisma.booking_messages.count({
            where: {
              request_id: req.id,
              sender_type: 'citizen',
              is_read: false,
            },
          }),
        ]);

        const token = `AF-${req.id.slice(0, 4).toUpperCase()}`;
        const slotDate = req.appointment_at
          ? req.appointment_at.toISOString().slice(0, 10)
          : null;
        const slotTime = req.appointment_at
          ? req.appointment_at.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;

        return {
          booking_id: req.id,
          token,
          citizen_name: req.users?.user_profiles?.full_name || 'Citizen Applicant',
          // Empty when unknown — a made-up number would look real on the partner desk.
          citizen_phone: req.users?.phone || '',
          service_title:
            req.partner_services?.name ||
            req.gov_services?.name ||
            'Government Assistance Filing',
          status: req.status,
          slot_date: slotDate,
          slot_time: slotTime,
          unread_count: unreadCount,
          last_message:
            latestMsg?.message ||
            req.user_note ||
            'Appointment slot confirmed. Chat desk ready.',
          last_timestamp: latestMsg
            ? latestMsg.created_at.toISOString()
            : req.created_at.toISOString(),
        };
      }),
    );

    threads.sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1;
      if (b.unread_count > 0 && a.unread_count === 0) return 1;
      return new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime();
    });

    return {
      total: threads.length,
      threads,
    };
  }
}
