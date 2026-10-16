import { describe, expect, it } from 'vitest';
import {
  DocumentsService,
  maskSensitiveIdentifier,
} from './documents.service.js';

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
    } as any;

    const service = new DocumentsService(mockPrisma, mockStorage);
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
      expect(doc.details.extracted_fields).toBeDefined();
      expect(doc.details.extracted_fields?.length).toBeGreaterThan(0);
      expect(doc.details.extracted_fields?.some((f) => f.key === 'roll_number')).toBe(true);
    });

    it('returns preview info for uploaded document', async () => {
      const list = await service.listDocuments(userId);
      const docId = list.items[0].id;
      const preview = await service.getPreviewInfo(userId, docId);
      expect(preview).toBeDefined();
      expect(preview.fileName).toBe('Class_10_Memo.pdf');
      expect(preview.mimeType).toBe('application/pdf');
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
  });
});
