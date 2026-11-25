import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { StaffGuard } from '../../common/staff.guard.js';
import { VaultService } from '../../common/vault.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PartnersAdminController } from './partners-admin.controller.js';
import { PartnersService } from './partners.service.js';

describe('PartnersService - Vault Encryption & Admin Access Control', () => {
  const vaultService = new VaultService();

  it('encrypts partner verification file on upload (stored bytes != original) and decrypts on view', async () => {
    const originalBytes = Buffer.from('%PDF-1.7 CONFIDENTIAL PARTNER PAN: ABCDE1234F');
    const storedFiles = new Map<string, Buffer>();
    const savedDocs = new Map<string, any>();

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
      partner_members: {
        findFirst: vi.fn().mockResolvedValue({ partner_id: 'partner-1', role: 'owner' }),
      },
      partners: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      partner_documents: {
        create: vi.fn().mockImplementation(async ({ data }: any) => {
          const row = {
            id: 'partner-doc-1',
            ...data,
            reviewer_note: null,
            reviewed_at: null,
            created_at: new Date('2026-11-26T00:00:00Z'),
          };
          savedDocs.set(row.id, row);
          return row;
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
          return savedDocs.get(where.id) ?? null;
        }),
      },
    } as any;

    const service = new PartnersService(mockPrisma, mockStorage, undefined, vaultService);

    const created = await service.uploadDocument('partner-owner-1', {
      document_kind: 'owner_id',
      file_name: 'partner-pan.pdf',
      mime_type: 'application/pdf',
      file_base64: `data:application/pdf;base64,${originalBytes.toString('base64')}`,
    });

    const storedBytes = storedFiles.get(created.storage_path);
    expect(storedBytes).toBeDefined();
    expect(storedBytes!.equals(originalBytes)).toBe(false);
    expect(storedBytes!.toString('utf8')).not.toContain('ABCDE1234F');

    const savedRow = savedDocs.get(created.id);
    expect(savedRow.encrypted_key).toBeTruthy();
    expect(savedRow.encrypted_key.length).toBeGreaterThan(0);

    const viewed = await service.getPartnerDocumentFile(created.id);
    expect(viewed.fileName).toBe('owner_id.pdf');
    expect(viewed.mimeType).toBe('application/pdf');
    expect(viewed.buffer.equals(originalBytes)).toBe(true);
  });

  it('serves legacy partner verification files as-is when encrypted_key is NULL', async () => {
    const legacyBytes = Buffer.from('%PDF-1.4 Legacy Unencrypted Shop Licence 2024');
    const storagePath = 'partners/partner-1/shop_license/1700000000_legacy.pdf';

    const mockStorage = {
      documentsBucket: 'documents',
      download: vi.fn().mockResolvedValue(legacyBytes),
    } as any;

    const mockPrisma = {
      partner_documents: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'legacy-doc-1',
          partner_id: 'partner-1',
          document_kind: 'shop_license',
          storage_path: storagePath,
          encrypted_key: null,
        }),
      },
    } as any;

    const service = new PartnersService(mockPrisma, mockStorage, undefined, vaultService);
    const viewed = await service.getPartnerDocumentFile('legacy-doc-1');

    expect(viewed.fileName).toBe('shop_license.pdf');
    expect(viewed.mimeType).toBe('application/pdf');
    expect(viewed.buffer.equals(legacyBytes)).toBe(true);
  });

  it('returns 403 on GET /admin/partners/documents/:id/file for non-staff and non-support users, and 200 for support staff', async () => {
    const plainBytes = Buffer.from('PNG-GST-CERT');
    const { data: encryptedBytes, encryptedKey } = vaultService.encrypt(plainBytes);

    let currentRoles: Array<{ role: string }> = [];

    const mockPartnersService = new PartnersService(
      {
        partner_documents: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'doc-kyc-1',
            partner_id: 'partner-1',
            document_kind: 'gst_certificate',
            storage_path: 'partners/partner-1/gst_certificate/1700000000_gst.png',
            encrypted_key: new Uint8Array(encryptedKey),
          }),
        },
      } as any,
      {
        documentsBucket: 'documents',
        download: vi.fn().mockResolvedValue(encryptedBytes),
      } as any,
      undefined,
      vaultService,
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [PartnersAdminController],
      providers: [
        StaffGuard,
        Reflector,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: vi.fn().mockResolvedValue({ sub: 'user-1', mfa: true }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            users: {
              findUnique: vi.fn().mockImplementation(async () => ({
                id: 'user-1',
                email: 'user@example.com',
                status: 'active',
                user_profiles: { full_name: 'Test User' },
                user_roles_user_roles_user_idTousers: currentRoles,
              })),
            },
          },
        },
        {
          provide: PartnersService,
          useValue: mockPartnersService,
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      // 1. Non-staff citizen gets 403
      currentRoles = [];
      await request(app.getHttpServer())
        .get('/admin/partners/documents/doc-kyc-1/file')
        .set('Authorization', 'Bearer token')
        .expect(403);

      // 2. Staff without support role (e.g., content_editor) gets 403
      currentRoles = [{ role: 'content_editor' }];
      await request(app.getHttpServer())
        .get('/admin/partners/documents/doc-kyc-1/file')
        .set('Authorization', 'Bearer token')
        .expect(403);

      // 3. Support staff gets 200 and decrypted file bytes
      currentRoles = [{ role: 'support' }];
      const okRes = await request(app.getHttpServer())
        .get('/admin/partners/documents/doc-kyc-1/file')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(Buffer.from(okRes.body).equals(plainBytes)).toBe(true);
    } finally {
      await app.close();
    }
  });
});
