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

  describe('generateAuthorizationUrl', () => {
    it('should generate a valid PKCE authorization URL with state and code verifier', async () => {
      const res = await service.generateAuthorizationUrl(testUserId);

      expect(res.authorizationUrl).toBeDefined();
      expect(res.state).toHaveLength(32);
      expect(res.codeVerifier).toBeDefined();

      const parsed = new URL(res.authorizationUrl);
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('state')).toBe(res.state);
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('code_challenge')).toBeDefined();
    });
  });

  describe('handleCallback and getStatus', () => {
    it('should exchange code for access token and link DigiLocker account', async () => {
      const auth = await service.generateAuthorizationUrl(testUserId);
      const callbackRes = await service.handleCallback('sandbox_auth_code_123', auth.state, testUserId);

      expect(callbackRes.success).toBe(true);
      expect(callbackRes.digilockerId).toMatch(/^DL-IN-/);

      const status = await service.getStatus(testUserId);
      expect(status.linked).toBe(true);
      expect(status.digilocker_id).toBe(callbackRes.digilockerId);
      expect(status.linked_at).toBeDefined();
    });
  });

  describe('getIssuedDocuments and importDocument', () => {
    it('should list candidate issued certificates and import them into user_documents', async () => {
      // 1. Initial list of issued documents
      const docsRes = await service.getIssuedDocuments(testUserId);
      expect(docsRes.items.length).toBeGreaterThanOrEqual(3);

      const class10Doc = docsRes.items.find((d) => d.type === 'class_10_marksheet');
      expect(class10Doc).toBeDefined();
      expect(class10Doc?.isImported).toBe(false);

      // 2. Import the Class 10 certificate
      const importRes = await service.importDocument(testUserId, class10Doc!.uri);
      expect(importRes.success).toBe(true);
      expect(importRes.document).toBeDefined();
      expect(importRes.document.source).toBe('digilocker');
      expect(importRes.document.digilocker_uri).toBe(class10Doc!.uri);
      expect(importRes.document.document_type_code).toBe('class_10_marksheet');
      expect(importRes.document.details.verified_by_digilocker).toBe(true);

      // 3. Re-query issued documents — it should now show as imported
      const updatedDocsRes = await service.getIssuedDocuments(testUserId);
      const updatedClass10 = updatedDocsRes.items.find((d) => d.uri === class10Doc!.uri);
      expect(updatedClass10?.isImported).toBe(true);

      // 4. Document Vault list should also reflect the imported document
      const vaultRes = await documentsService.listDocuments(testUserId);
      const vaultClass10 = vaultRes.items.find((d) => d.digilocker_uri === class10Doc!.uri);
      expect(vaultClass10).toBeDefined();
      expect(vaultClass10?.source).toBe('digilocker');
    });

    it('should reject importing an invalid URI', async () => {
      await expect(service.importDocument(testUserId, 'invalid-non-existent-uri')).rejects.toThrow(
        'not found in DigiLocker account',
      );
    });
  });

  describe('disconnect', () => {
    it('should unlink DigiLocker account', async () => {
      await service.connectSandbox(testUserId, 'DL-IN-999999');
      const before = await service.getStatus(testUserId);
      expect(before.linked).toBe(true);

      await service.disconnect(testUserId);
      const after = await service.getStatus(testUserId);
      expect(after.linked).toBe(false);
    });
  });
});
