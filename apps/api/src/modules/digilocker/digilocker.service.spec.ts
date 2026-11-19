import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DigilockerService } from './digilocker.service.js';
import { DocumentsService } from '../documents/documents.service.js';
import { UsersStore } from '../users/users.store.js';
import { StorageService } from '../../common/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('DigilockerService', () => {
  let service: DigilockerService;
  let documentsService: DocumentsService;
  let usersStore: UsersStore;

  const testUserId = 'test-candidate-uuid-1234';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigilockerService,
        DocumentsService,
        UsersStore,
        StorageService,
        {
          provide: PrismaService,
          useValue: null,
        },
      ],
    }).compile();

    service = module.get<DigilockerService>(DigilockerService);
    documentsService = module.get<DocumentsService>(DocumentsService);
    usersStore = module.get<UsersStore>(UsersStore);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(documentsService).toBeDefined();
  });

  describe('without DigiLocker (API Setu) credentials', () => {
    beforeEach(() => {
      delete process.env.DIGILOCKER_CLIENT_ID;
    });

    it('offers no sign-in link and lists no documents (never sample ones)', async () => {
      const status = await service.getStatus(testUserId);
      expect(status.configured).toBe(false);
      expect(status.linked).toBe(false);
      expect(status.authorizeUrl).toBe('');
      await expect(service.generateAuthorizationUrl(testUserId)).rejects.toThrow('not connected');
      expect((await service.getIssuedDocuments(testUserId)).items).toEqual([]);
    });

    it('never creates a stand-in certificate on import', async () => {
      await expect(service.importDocument(testUserId, 'in.gov.cbse-CLASS-X-2021-9182734')).rejects.toThrow(
        'not available yet',
      );
      const vault = await documentsService.listDocuments(testUserId);
      expect(vault.items.filter((d) => d.source === 'digilocker')).toEqual([]);
    });

    it('does not link an account from an unknown or fake sign-in', async () => {
      await expect(service.handleCallback('sandbox_auth_code_123', 'unknown-state', testUserId)).rejects.toThrow();
      expect((await service.getStatus(testUserId)).linked).toBe(false);
    });
  });

  describe('with credentials', () => {
    beforeEach(() => {
      process.env.DIGILOCKER_CLIENT_ID = 'test-client';
    });
    afterEach(() => {
      delete process.env.DIGILOCKER_CLIENT_ID;
    });

    it('builds a PKCE authorization URL with state and code challenge', async () => {
      const res = await service.generateAuthorizationUrl(testUserId);
      expect(res.state).toHaveLength(32);
      const parsed = new URL(res.authorizationUrl);
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe('test-client');
      expect(parsed.searchParams.get('state')).toBe(res.state);
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('links the account only when DigiLocker returns a real token', async () => {
      const auth = await service.generateAuthorizationUrl(testUserId);
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('denied', { status: 400 }));
      await expect(service.handleCallback('code-1', auth.state, testUserId)).rejects.toThrow('could not be completed');
      fetchSpy.mockRestore();
      expect((await service.getStatus(testUserId)).linked).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('unlinks a DigiLocker account', async () => {
      await service.disconnect(testUserId);
      expect((await service.getStatus(testUserId)).linked).toBe(false);
    });
  });
});
