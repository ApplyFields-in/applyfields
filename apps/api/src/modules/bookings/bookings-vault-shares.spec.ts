import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
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

describe('BookingsService - Acknowledgment Slip Vault Encryption & 403 Security Check', () => {
  const vaultService = new VaultService();

  it('encrypts acknowledgment slip on markFiled (stored bytes != original) and decrypts on getSlipFile', async () => {
    const citizenId = '22222222-2222-2222-2222-222222222222';
    const operatorUserId = '88888888-8888-8888-8888-888888888888';
    const partnerId = '66666666-6666-6666-6666-666666666666';
    const bookingId = '44444444-4444-4444-4444-444444444444';

    const originalSlipBytes = Buffer.from('%PDF-1.7 Official Ack MVA-2026-98741 Citizen Receipt');
    const storedFiles = new Map<string, Buffer>();
    let savedRow: any = {
      id: bookingId,
      user_id: citizenId,
      partner_id: partnerId,
      status: 'in_progress',
      official_app_number: null,
      acknowledgment_slip_url: null,
      acknowledgment_slip_encrypted_key: null,
    };

    const mockStorage = {
      documentsBucket: 'documents',
      upload: vi.fn().mockImplementation(async (_bucket: string, path: string, data: Buffer) => {
        storedFiles.set(path, Buffer.from(data));
        return path;
      }),
      download: vi.fn().mockImplementation(async (_bucket: string, path: string) => {
        return storedFiles.get(path) ?? null;
      }),
    } as any;

    const mockPrisma = {
      service_requests: {
        findUnique: vi.fn().mockImplementation(async () => savedRow),
      },
      partner_members: {
        findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
          return where.user_id === operatorUserId && where.partner_id === partnerId
            ? { user_id: operatorUserId }
            : null;
        }),
      },
      $transaction: vi.fn().mockImplementation(async (fn: any) =>
        fn({
          service_requests: {
            update: vi.fn().mockImplementation(async ({ data }: any) => {
              savedRow = {
                ...savedRow,
                ...data,
                service_request_events: [],
                partner_reviews: null,
                created_at: new Date(),
                updated_at: new Date(),
              };
              return savedRow;
            }),
          },
          service_request_events: {
            create: vi.fn().mockResolvedValue({ id: 'ev-1' }),
          },
        }),
      ),
    } as any;

    const service = new BookingsService(mockPrisma, mockStorage, undefined, undefined, vaultService);

    const detail = await service.markFiled(operatorUserId, bookingId, {
      official_app_number: 'MVA-2026-98741',
      slip_base64: `data:application/pdf;base64,${originalSlipBytes.toString('base64')}`,
      slip_mime_type: 'application/pdf',
    });

    expect(detail.has_acknowledgment_slip).toBe(true);
    expect(savedRow.acknowledgment_slip_url).toMatch(/^acknowledgments\/44444444-4444-4444-4444-444444444444\/\d+\.pdf$/);
    expect(savedRow.acknowledgment_slip_encrypted_key).toBeTruthy();
    expect(savedRow.acknowledgment_slip_encrypted_key.length).toBeGreaterThan(0);

    const storedBytes = storedFiles.get(savedRow.acknowledgment_slip_url);
    expect(storedBytes).toBeDefined();
    expect(storedBytes!.equals(originalSlipBytes)).toBe(false);
    expect(storedBytes!.toString('utf8')).not.toContain('MVA-2026-98741');

    // Citizen can view decrypted slip
    const citizenSlip = await service.getSlipFile(citizenId, bookingId);
    expect(citizenSlip.fileName).toBe('acknowledgment-MVA-2026-98741.pdf');
    expect(citizenSlip.mimeType).toBe('application/pdf');
    expect(citizenSlip.buffer.equals(originalSlipBytes)).toBe(true);

    // Authorized partner member can view decrypted slip
    const partnerSlip = await service.getSlipFile(operatorUserId, bookingId);
    expect(partnerSlip.buffer.equals(originalSlipBytes)).toBe(true);
  });

  it('serves legacy acknowledgment slip as-is when acknowledgment_slip_encrypted_key is NULL', async () => {
    const citizenId = '22222222-2222-2222-2222-222222222222';
    const bookingId = '44444444-4444-4444-4444-444444444444';
    const legacySlipBytes = Buffer.from('%PDF-1.4 Legacy Unencrypted Slip 2024');

    const mockStorage = {
      documentsBucket: 'documents',
      download: vi.fn().mockResolvedValue(legacySlipBytes),
    } as any;

    const mockPrisma = {
      service_requests: {
        findUnique: vi.fn().mockResolvedValue({
          user_id: citizenId,
          partner_id: '66666666-6666-6666-6666-666666666666',
          acknowledgment_slip_url: 'acknowledgments/4444/legacy.pdf',
          acknowledgment_slip_encrypted_key: null,
          official_app_number: 'OLD-2024-001',
        }),
      },
    } as any;

    const service = new BookingsService(mockPrisma, mockStorage, undefined, undefined, vaultService);
    const slip = await service.getSlipFile(citizenId, bookingId);

    expect(slip.fileName).toBe('acknowledgment-OLD-2024-001.pdf');
    expect(slip.mimeType).toBe('application/pdf');
    expect(slip.buffer.equals(legacySlipBytes)).toBe(true);
  });

  it('throws ForbiddenException (403) when someone outside the booking tries to open its slip', async () => {
    const citizenId = '22222222-2222-2222-2222-222222222222';
    const outsiderUserId = '99999999-9999-9999-9999-999999999999';
    const bookingId = '44444444-4444-4444-4444-444444444444';

    const mockPrisma = {
      service_requests: {
        findUnique: vi.fn().mockResolvedValue({
          user_id: citizenId,
          partner_id: '66666666-6666-6666-6666-666666666666',
          acknowledgment_slip_url: 'acknowledgments/4444/slip.pdf',
          acknowledgment_slip_encrypted_key: Buffer.from('some-key'),
          official_app_number: 'MVA-2026-98741',
        }),
      },
      partner_members: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new BookingsService(mockPrisma, undefined, undefined, undefined, vaultService);
    await expect(service.getSlipFile(outsiderUserId, bookingId)).rejects.toThrow(ForbiddenException);
  });
});
