import { describe, expect, it, vi } from 'vitest';
import { MessagesService } from './messages.service.js';

describe('MessagesService', () => {
  const mockBooking = {
    id: 'bk-uuid-1',
    partner_id: 'partner-uuid-1',
    user_id: 'user-uuid-1',
  };

  const mockMessageRow = {
    id: 'msg-uuid-1',
    request_id: 'bk-uuid-1',
    sender_user_id: 'user-uuid-1',
    sender_type: 'citizen',
    sender_name: 'K. Sai Ramesh',
    message: 'Can I come 15 minutes before my slot?',
    attachments: [],
    is_read: false,
    read_at: null,
    created_at: new Date('2026-10-21T10:00:00Z'),
  };

  const mockPrisma = {
    service_requests: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 'bk-uuid-1') return Promise.resolve(mockBooking);
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'bk-uuid-1',
          partner_id: 'partner-uuid-1',
          status: 'new',
          appointment_at: new Date('2026-10-21T10:30:00Z'),
          user_note: 'Need urgent filing',
          created_at: new Date('2026-10-21T09:00:00Z'),
          partner_services: { name: 'SSC CGL Form Filing' },
          gov_services: null,
          users: { full_name: 'K. Sai Ramesh', phone: '+91 98480 22338' },
        },
      ]),
    },
    booking_messages: {
      findMany: vi.fn().mockResolvedValue([mockMessageRow]),
      findFirst: vi.fn().mockResolvedValue(mockMessageRow),
      create: vi.fn().mockResolvedValue(mockMessageRow),
      count: vi.fn().mockResolvedValue(1),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    partner_members: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where.user_id === 'partner-user-1') {
          return Promise.resolve({
            id: 'mem-1',
            partner_id: 'partner-uuid-1',
            user_id: 'partner-user-1',
          });
        }
        return Promise.resolve(null);
      }),
    },
  } as any;

  const service = new MessagesService(mockPrisma);

  it('fetches messages for a given booking', async () => {
    const messages = await service.getMessages('bk-uuid-1');
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toBe('Can I come 15 minutes before my slot?');
    expect(messages[0].sender_type).toBe('citizen');
  });

  it('sends a new message if booking exists', async () => {
    const sent = await service.sendMessage('bk-uuid-1', 'user-uuid-1', {
      message: 'Can I come 15 minutes before my slot?',
      sender_type: 'citizen',
      sender_name: 'K. Sai Ramesh',
    });

    expect(sent.id).toBe('msg-uuid-1');
    expect(mockPrisma.booking_messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          request_id: 'bk-uuid-1',
          message: 'Can I come 15 minutes before my slot?',
          sender_type: 'citizen',
        }),
      }),
    );
  });

  it('marks messages as read by recipient type', async () => {
    const res = await service.markAsRead('bk-uuid-1', 'partner');
    expect(res.count).toBe(1);
    expect(mockPrisma.booking_messages.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          request_id: 'bk-uuid-1',
          sender_type: 'citizen',
          is_read: false,
        }),
      }),
    );
  });

  it('fetches partner conversation threads with unread counts', async () => {
    const res = await service.getPartnerConversations('partner-user-1');
    expect(res.total).toBe(1);
    expect(res.threads[0].token).toBe('AF-BK-U');
    expect(res.threads[0].citizen_name).toBe('K. Sai Ramesh');
    expect(res.threads[0].unread_count).toBe(1);
  });
});
