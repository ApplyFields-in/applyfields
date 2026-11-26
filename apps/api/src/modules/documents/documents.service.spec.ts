import { describe, expect, it } from 'vitest';
import {
  DocumentsService,
  maskSensitiveIdentifier,
} from './documents.service.js';
import { VaultService } from '../../common/vault.service.js';

describe('DocumentsService & Sensitive ID Masking', () => {
  describe('maskSensitiveIdentifier', () => {
    it('masks 12-digit Aadhaar number keeping only last 4 digits', () => {
      expect(maskSensitiveIdentifier('123456789012')).toBe('**** **** 9012');
      expect(maskSensitiveIdentifier('9876 5432 1098')).toBe('**** **** 1098');
    });

    it('masks Indian PAN cards correctly', () => {
      expect(maskSensitiveIdentifier('ABCDE1234F')).toBe('*****1234F');
    });

    it('masks general numbers keeping last 4 digits', () => {
      expect(maskSensitiveIdentifier('VOTERID9988')).toBe('**** **** 9988');
    });

    it('handles empty or short input gracefully', () => {
      expect(maskSensitiveIdentifier(null)).toBeNull();
      expect(maskSensitiveIdentifier('')).toBeNull();
      expect(maskSensitiveIdentifier('12')).toBe('****');
    });
  });

  describe('Document Upload & Management', () => {
    const mockPrisma = {} as any;
    const mockStorage = {
      documentsBucket: 'documents',
      upload: async () => null, // fallback to local/in-memory
      signedUrl: async () => 'https://signed.supabase.co/doc.pdf',
      download: async () => null,
    } as any;
    const vaultService = new VaultService();

    const service = new DocumentsService(mockPrisma, mockStorage, vaultService);
    const userId = '11111111-1111-1111-1111-111111111111';

    it('rejects unsupported file mime types', async () => {
      await expect(
        service.uploadDocument(userId, {
          documentTypeCode: 'photo',
          fileName: 'malicious.exe',
          mimeType: 'application/x-msdownload',
          fileBase64: Buffer.from('test').toString('base64'),
        }),
      ).rejects.toThrow('Unsupported file format');
    });

    it('successfully uploads and masks sensitive identifier on document', async () => {
      const doc = await service.uploadDocument(userId, {
        documentTypeCode: 'marksheet_10th',
        fileName: 'Class_10_Memo.pdf',
        mimeType: 'application/pdf',
        fileBase64: Buffer.from('sample class 10 memo file content').toString('base64'),
        identifierNumber: '556677889900',
      });

      expect(doc.id).toBeDefined();
      expect(doc.document_type_code).toBe('marksheet_10th');
      expect(doc.file_name).toBe('Class_10_Memo.pdf');
      expect(doc.masked_identifier).toBe('**** **** 9900');
      // Nothing is invented from the file: a new document has no fields until the person adds them.
      expect(doc.details.extracted_fields).toEqual([]);
      expect(JSON.stringify(doc.details)).not.toContain('556677889900');
    });

    it('never stores a full Aadhaar number typed into a field', async () => {
      const list = await service.listDocuments(userId);
      const updated = await service.updateDocumentDetails(userId, list.items[0].id, {
        details: {
          extracted_fields: [
            { key: 'aadhaar_number', label: 'Aadhaar', value: '1234 5678 9012' },
            { key: 'note', label: 'Note', value: 'Aadhaar 123456789012 on the card' },
            { key: 'phone', label: 'Phone', value: '+91 98765 43210' },
          ],
        },
      });
      const values = updated.details.extracted_fields?.map((f) => f.value);
      expect(values).toEqual(['XXXX XXXX 9012', 'Aadhaar XXXX XXXX 9012 on the card', '+91 98765 43210']);
    });

    it('updates document details and extracted fields', async () => {
      const list = await service.listDocuments(userId);
      const docId = list.items[0].id;

      const updated = await service.updateDocumentDetails(userId, docId, {
        identifierNumber: '998877665544',
        title: 'Updated 10th Certificate',
        details: {
          extracted_fields: [
            { key: 'candidate_name', label: 'Candidate Name', value: 'Likhith Kumar K' },
            { key: 'roll_number', label: 'Roll Number', value: '998877665544' },
          ],
        },
      });

      expect(updated.title).toBe('Updated 10th Certificate');
      expect(updated.masked_identifier).toBe('**** **** 5544');
      expect(updated.details.extracted_fields?.[0].value).toBe('Likhith Kumar K');
    });

    it('lists user documents accurately', async () => {
      const list = await service.listDocuments(userId);
      expect(list.total).toBeGreaterThanOrEqual(1);
      expect(list.items[0].document_type_code).toBe('marksheet_10th');
    });

    it('evaluates readiness check against opportunity requirements', async () => {
      // Upload degree as well
      await service.uploadDocument(userId, {
        documentTypeCode: 'degree_certificate',
        fileName: 'BTech_Degree.pdf',
        mimeType: 'application/pdf',
        fileBase64: Buffer.from('degree certificate').toString('base64'),
      });

      const readiness = await service.checkReadiness(userId, 'test-slug');
      expect(readiness.required_count).toBeGreaterThan(0);
      expect(readiness.ready_count).toBeGreaterThanOrEqual(2);
      expect(readiness.percentage).toBeGreaterThan(0);
    });

    it('deletes document successfully', async () => {
      const list = await service.listDocuments(userId);
      const docId = list.items[0].id;
      const res = await service.deleteDocument(userId, docId);
      expect(res.success).toBe(true);

      const remaining = await service.listDocuments(userId);
      expect(remaining.items.find((d) => d.id === docId)).toBeUndefined();
    });

    it('encrypts new uploaded document and decrypts back to original bytes via getDecryptedFile', async () => {
      const originalContent = 'CONFIDENTIAL: Aadhaar 1234 5678 9012 Marks 98%';
      const uploaded = await service.uploadDocument(userId, {
        documentTypeCode: 'id_proof',
        fileName: 'Aadhaar_Card.pdf',
        mimeType: 'application/pdf',
        fileBase64: Buffer.from(originalContent).toString('base64'),
      });

      const file = await service.getDecryptedFile(userId, uploaded.id);
      expect(file.fileName).toBe('Aadhaar_Card.pdf');
      expect(file.mimeType).toBe('application/pdf');
      expect(file.buffer.toString('utf8')).toBe(originalContent);
    });

    it('successfully serves legacy unencrypted file where encrypted_key is null', async () => {
      // Directly inject a legacy unencrypted document into in-memory store
      const legacyId = '99999999-9999-9999-9999-999999999999';
      const legacyContent = 'Legacy unencrypted certificate from 2024';
      const tmpPath = require('node:path').join(process.cwd(), 'uploads', 'documents', userId, 'legacy.pdf');
      const fs = require('node:fs');
      if (!fs.existsSync(require('node:path').dirname(tmpPath))) {
        fs.mkdirSync(require('node:path').dirname(tmpPath), { recursive: true });
      }
      fs.writeFileSync(tmpPath, Buffer.from(legacyContent));

      (service as any).inMemoryDocs.set(legacyId, {
        id: legacyId,
        user_id: userId,
        document_type_code: 'degree_certificate',
        file_name: 'legacy.pdf',
        mime_type: 'application/pdf',
        storage_path: tmpPath,
        encrypted_key: null, // Legacy unencrypted file
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const file = await service.getDecryptedFile(userId, legacyId);
      expect(file.buffer.toString('utf8')).toBe(legacyContent);
    });
  });
});
