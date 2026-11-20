import { describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { VaultService } from '../../common/vault.service.js';

describe('BookingsService - Vault Document Shares & 403 Security Check', () => {
  const vaultService = new VaultService();

  it('throws ForbiddenException (403) when a centre without a valid share attempts to access a document', async () => {
    const citizenId = '22222222-2222-2222-2222-222222222222';
    const unauthorizedCentreUserId = '33333333-3333-3333-3333-333333333333';
    const bookingId = '44444444-4444-4444-4444-444444444444';
    const shareId = '55555555-5555-5555-5555-555555555555';

    const mockPrisma = {
      document_shares: {
        findFirst: async () => ({
          id: shareId,
          owner_user_id: citizenId,
          partner_id: '66666666-6666-6666-6666-666666666666',
          document_id: '77777777-7777-7777-7777-777777777777',
          user_documents: {
            id: '77777777-7777-7777-7777-777777777777',
            storage_path: 'documents/path/test.pdf',
            file_name: 'test.pdf',
            mime_type: 'application/pdf',
            deleted_at: null,
            encrypted_key: Buffer.from('test-encrypted-key'),
          },
        }),
      },
      partner_members: {
        // unauthorized user is NOT a member of this centre
        findFirst: async () => null,
      },
    } as any;

    const service = new BookingsService(
      mockPrisma,
      undefined,
      undefined,
      undefined,
      vaultService,
    );

    // 1. sharedDocumentUrl should reject with ForbiddenException (403)
    await expect(
      service.sharedDocumentUrl(unauthorizedCentreUserId, bookingId, shareId),
    ).rejects.toThrow(ForbiddenException);

    // 2. getDecryptedSharedDocument should reject with ForbiddenException (403)
    await expect(
      service.getDecryptedSharedDocument(
        unauthorizedCentreUserId,
        bookingId,
        shareId,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows authorized centre member to decrypt and view shared document', async () => {
    const citizenId = '22222222-2222-2222-2222-222222222222';
    const authorizedCentreUserId = '88888888-8888-8888-8888-888888888888';
    const bookingId = '44444444-4444-4444-4444-444444444444';
    const shareId = '55555555-5555-5555-5555-555555555555';
    const partnerId = '66666666-6666-6666-6666-666666666666';

    const plainContent = 'Verified Citizen Marksheet 10th - Grade A';
    const { data: encryptedData, encryptedKey } = vaultService.encrypt(
      Buffer.from(plainContent),
    );

    const mockStorage = {
      documentsBucket: 'documents',
      download: async () => encryptedData,
    } as any;

    const mockPrisma = {
      document_shares: {
        findFirst: async () => ({
          id: shareId,
          owner_user_id: citizenId,
          partner_id: partnerId,
          document_id: '77777777-7777-7777-7777-777777777777',
          user_documents: {
            id: '77777777-7777-7777-7777-777777777777',
            storage_path: 'documents/2222/test.pdf',
            file_name: 'marksheet.pdf',
            mime_type: 'application/pdf',
            deleted_at: null,
            encrypted_key: encryptedKey,
          },
        }),
      },
      partner_members: {
        findFirst: async () => ({ user_id: authorizedCentreUserId }),
      },
      document_access_logs: {
        create: async () => ({ id: 'log-1' }),
      },
    } as any;

    const service = new BookingsService(
      mockPrisma,
      mockStorage,
      undefined,
      undefined,
      vaultService,
    );

    const doc = await service.getDecryptedSharedDocument(
      authorizedCentreUserId,
      bookingId,
      shareId,
    );

    expect(doc.fileName).toBe('marksheet.pdf');
    expect(doc.mimeType).toBe('application/pdf');
    expect(doc.buffer.toString('utf8')).toBe(plainContent);
  });
});
