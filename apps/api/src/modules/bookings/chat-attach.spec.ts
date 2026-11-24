import { describe, expect, it, vi } from 'vitest';
import { sendChatMessageSchema } from '../messages/messages.service.js';
import { BookingsService } from './bookings.service.js';

const BOOKING = '123e4567-e89b-12d3-a456-426614174000';
const DOC = '223e4567-e89b-12d3-a456-426614174000';

/** Citizen attaches a locker document in the booking chat: shared through document_shares, never a raw link. */
describe('chat attachments', () => {
  it('a client cannot set share_id through the normal send route', () => {
    const parsed = sendChatMessageSchema.parse({
      message: 'see this',
      sender_type: 'citizen',
      sender_name: 'Ravi',
      attachments: [{ name: 'x.pdf', share_id: 'someone-elses-share' }],
    });
    expect(parsed.attachments?.[0]).not.toHaveProperty('share_id');
  });

  it('adds the document to the booking shares (keeping existing ones) and posts a message pointing at it', async () => {
    const prisma: any = {
      document_shares: {
        findMany: vi.fn(async () => [{ document_id: 'already-shared' }]),
        findFirst: vi.fn(async () => ({
          id: 'share-9',
          user_documents: { title: 'Aadhaar card', file_name: 'a.pdf', mime_type: 'application/pdf', size_bytes: 204800, document_type_code: 'aadhaar' },
        })),
      },
      user_profiles: { findUnique: vi.fn(async () => ({ full_name: 'Ravi Kumar' })) },
    };
    const sendMessage = vi.fn(async (_b: string, _u: string, input: any) => ({ id: 'm-1', ...input }));
    const svc = new BookingsService(prisma, undefined, undefined, undefined, undefined, { sendMessage } as any);
    const share = vi.spyOn(svc, 'shareDocuments').mockResolvedValue({} as any);

    await svc.attachToChat('citizen-1', BOOKING, DOC);

    expect(share).toHaveBeenCalledWith('citizen-1', BOOKING, ['already-shared', DOC]);
    const [bookingId, userId, input] = sendMessage.mock.calls[0];
    expect([bookingId, userId]).toEqual([BOOKING, 'citizen-1']);
    expect(input).toMatchObject({
      message: 'Shared a document: Aadhaar card',
      sender_type: 'citizen',
      sender_name: 'Ravi Kumar',
      attachments: [{ name: 'Aadhaar card', share_id: 'share-9', kind: 'pdf', file_size: '200 KB' }],
    });
  });

  it('stops when sharing is refused (not your booking, or already completed)', async () => {
    const prisma: any = { document_shares: { findMany: vi.fn(async () => []) } };
    const sendMessage = vi.fn();
    const svc = new BookingsService(prisma, undefined, undefined, undefined, undefined, { sendMessage } as any);
    vi.spyOn(svc, 'shareDocuments').mockRejectedValue(new Error('Booking not found.'));
    await expect(svc.attachToChat('stranger', BOOKING, DOC)).rejects.toThrow('Booking not found.');
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
