import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  DocumentReadinessCheck,
  UpdateDocumentDetailsInput,
  UploadDocumentInput,
  UserDocumentListResponse,
  UserDocumentSummary,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../../common/storage.service.js';
import { extractDocumentFields } from './document-extractor.js';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  marksheet_10th: '10th Marksheet / Matriculation Certificate',
  degree_certificate: 'Degree Certificate / Graduation Memo',
  caste_certificate: 'Category / Caste Certificate (OBC/SC/ST/EWS)',
  photo: 'Recent Passport Photograph',
  signature: 'Applicant Signature Specimen',
  resume: 'Resume / Curriculum Vitae',
  id_proof: 'Government ID Proof (Aadhaar / Voter ID / PAN)',
};

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export function maskSensitiveIdentifier(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/\s+/g, '');
  if (cleaned.length < 4) return '****';

  // Check 12-digit Aadhaar format: **** **** 1234
  if (/^\d{12}$/.test(cleaned)) {
    return `**** **** ${cleaned.slice(-4)}`;
  }

  // Check 10-char PAN format: *****1234A
  if (/^[A-Z]{5}\d{4}[A-Z]$/i.test(cleaned)) {
    return `*****${cleaned.slice(5)}`;
  }

  // General fallback: mask all except last 4
  const last4 = cleaned.slice(-4);
  return `**** **** ${last4}`;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  // In-memory fallback map for unit tests and local mock storage
  private inMemoryDocs = new Map<string, UserDocumentSummary & { storage_path: string }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private isPrismaUsable(): boolean {
    return Boolean(this.prisma && process.env.NODE_ENV !== 'test');
  }

  async listDocuments(userId: string): Promise<UserDocumentListResponse> {
    if (this.isPrismaUsable()) {
      try {
        const rows = await this.prisma.user_documents.findMany({
          where: {
            user_id: userId,
            deleted_at: null,
          },
          orderBy: { created_at: 'desc' },
        });

        const items: UserDocumentSummary[] = rows.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          document_type_code: r.document_type_code,
          document_type_name:
            DOCUMENT_TYPE_LABELS[r.document_type_code] || r.document_type_code,
          title: r.title,
          file_name: r.file_name,
          mime_type: r.mime_type,
          size_bytes: r.size_bytes,
          issued_on: r.issued_on ? r.issued_on.toISOString().split('T')[0] : null,
          expires_on: r.expires_on ? r.expires_on.toISOString().split('T')[0] : null,
          issuing_authority: r.issuing_authority,
          masked_identifier:
            (r.details as Record<string, any>)?.masked_identifier || null,
          details: (r.details as Record<string, any>) || {},
          source: (r.source as any) || 'upload',
          digilocker_uri: r.digilocker_uri || null,
          created_at: r.created_at.toISOString(),
          updated_at: r.updated_at.toISOString(),
        }));

        return { total: items.length, items };
      } catch (err) {
        this.logger.warn(`Failed to list documents from DB: ${(err as Error).message}`);
      }
    }

    const items = Array.from(this.inMemoryDocs.values())
      .filter((d) => d.user_id === userId)
      .map(({ storage_path: _, ...d }) => d);

    return { total: items.length, items };
  }

  async uploadDocument(
    userId: string,
    dto: UploadDocumentInput,
  ): Promise<UserDocumentSummary> {
    if (!dto.documentTypeCode) {
      throw new BadRequestException('Document type code is required.');
    }
    if (!ALLOWED_MIME_TYPES.has(dto.mimeType)) {
      throw new BadRequestException(
        'Unsupported file format. Please upload PDF, PNG, JPG, or DOCX.',
      );
    }

    const base64Data = dto.fileBase64.includes(';base64,')
      ? dto.fileBase64.split(';base64,')[1]
      : dto.fileBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_DOCUMENT_BYTES) {
      throw new BadRequestException('Document file exceeds the 10 MB maximum limit.');
    }

    return this.saveDocumentRecord(userId, {
      documentTypeCode: dto.documentTypeCode,
      title: dto.title,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      buffer,
      issuedOn: dto.issuedOn,
      expiresOn: dto.expiresOn,
      issuingAuthority: dto.issuingAuthority,
      identifierNumber: dto.identifierNumber,
      details: dto.details,
      source: 'upload',
    });
  }

  async saveDocumentRecord(
    userId: string,
    params: {
      documentTypeCode: string;
      title?: string;
      fileName: string;
      mimeType: string;
      buffer: Buffer;
      issuedOn?: string;
      expiresOn?: string;
      issuingAuthority?: string;
      identifierNumber?: string;
      details?: Record<string, any>;
      source?: 'upload' | 'digilocker';
      digilocker_uri?: string;
    },
  ): Promise<UserDocumentSummary> {
    const safeName = (params.fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectName = `${Date.now()}_${safeName}`;
    const remotePath = `documents/${userId}/${params.documentTypeCode}/${objectName}`;

    // Upload to Supabase Storage; fallback to local disk for dev
    const uploadedPath = await this.storageService.upload(
      this.storageService.documentsBucket,
      remotePath,
      params.buffer,
      params.mimeType,
    );

    let storagePath: string;
    if (uploadedPath) {
      storagePath = remotePath;
    } else {
      const uploadDir = join(
        process.cwd(),
        'uploads',
        'documents',
        userId,
        params.documentTypeCode,
      );
      if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
      storagePath = join(uploadDir, objectName);
      writeFileSync(storagePath, params.buffer);
    }

    const maskedId = maskSensitiveIdentifier(params.identifierNumber);
    const extractedFields =
      params.details?.extracted_fields ||
      extractDocumentFields(
        params.documentTypeCode,
        params.fileName,
        params.identifierNumber,
        params.buffer,
      );

    const docSource = params.source || 'upload';
    const digilockerUri = params.digilocker_uri || null;

    const details = {
      ...(params.details || {}),
      masked_identifier: maskedId,
      extracted_fields: extractedFields,
      uploaded_at: new Date().toISOString(),
      ...(docSource === 'digilocker'
        ? {
            verified_by_digilocker: true,
            verification_source: 'digilocker',
            digilocker_uri: digilockerUri,
          }
        : {}),
    };

    const docId = randomUUID();
    const typeLabel =
      DOCUMENT_TYPE_LABELS[params.documentTypeCode] || params.documentTypeCode;
    const title = params.title?.trim() || `${typeLabel} - ${params.fileName}`;

    if (this.isPrismaUsable()) {
      try {
        // Soft-delete any existing document of this type for clean replacement if needed
        await this.prisma.user_documents.updateMany({
          where: {
            user_id: userId,
            document_type_code: params.documentTypeCode,
            deleted_at: null,
          },
          data: { deleted_at: new Date() },
        });

        // Ensure document_types entry exists
        await this.prisma.document_types.upsert({
          where: { code: params.documentTypeCode },
          create: {
            code: params.documentTypeCode,
            name: typeLabel,
            category: 'citizen_identity',
          },
          update: {},
        });

        const created = await this.prisma.user_documents.create({
          data: {
            id: docId,
            user_id: userId,
            document_type_code: params.documentTypeCode,
            title,
            storage_path: storagePath,
            file_name: params.fileName,
            mime_type: params.mimeType,
            size_bytes: params.buffer.length,
            issued_on: params.issuedOn ? new Date(params.issuedOn) : null,
            expires_on: params.expiresOn ? new Date(params.expiresOn) : null,
            issuing_authority: params.issuingAuthority || null,
            details: details as any,
            source: docSource as any,
            digilocker_uri: digilockerUri,
          },
        });

        return {
          id: created.id,
          user_id: created.user_id,
          document_type_code: created.document_type_code,
          document_type_name: typeLabel,
          title: created.title,
          file_name: created.file_name,
          mime_type: created.mime_type,
          size_bytes: created.size_bytes,
          issued_on: created.issued_on
            ? created.issued_on.toISOString().split('T')[0]
            : null,
          expires_on: created.expires_on
            ? created.expires_on.toISOString().split('T')[0]
            : null,
          issuing_authority: created.issuing_authority,
          masked_identifier: maskedId,
          details,
          source: (created.source as any) || docSource,
          digilocker_uri: created.digilocker_uri || digilockerUri,
          created_at: created.created_at.toISOString(),
          updated_at: created.updated_at.toISOString(),
        };
      } catch (err) {
        this.logger.warn(`Failed to store document in DB: ${(err as Error).message}`);
      }
    }

    // In-memory fallback
    const now = new Date().toISOString();
    const docSummary: UserDocumentSummary & { storage_path: string } = {
      id: docId,
      user_id: userId,
      document_type_code: params.documentTypeCode,
      document_type_name: typeLabel,
      title,
      file_name: params.fileName,
      mime_type: params.mimeType,
      size_bytes: params.buffer.length,
      issued_on: params.issuedOn || null,
      expires_on: params.expiresOn || null,
      issuing_authority: params.issuingAuthority || null,
      masked_identifier: maskedId,
      details,
      source: docSource,
      digilocker_uri: digilockerUri,
      created_at: now,
      updated_at: now,
      storage_path: storagePath,
    };

    // Remove any previous of same type
    for (const [key, val] of this.inMemoryDocs.entries()) {
      if (val.user_id === userId && val.document_type_code === params.documentTypeCode) {
        this.inMemoryDocs.delete(key);
      }
    }

    this.inMemoryDocs.set(docId, docSummary);
    const { storage_path: _, ...resSummary } = docSummary;
    return resSummary;
  }

  async getDocumentById(
    userId: string,
    docId: string,
  ): Promise<UserDocumentSummary> {
    if (this.isPrismaUsable()) {
      try {
        const doc = await this.prisma.user_documents.findFirst({
          where: { id: docId, user_id: userId, deleted_at: null },
        });
        if (doc) {
          return {
            id: doc.id,
            user_id: doc.user_id,
            document_type_code: doc.document_type_code,
            document_type_name:
              DOCUMENT_TYPE_LABELS[doc.document_type_code] ||
              doc.document_type_code,
            title: doc.title,
            file_name: doc.file_name,
            mime_type: doc.mime_type,
            size_bytes: doc.size_bytes,
            issued_on: doc.issued_on
              ? doc.issued_on.toISOString().split('T')[0]
              : null,
            expires_on: doc.expires_on
              ? doc.expires_on.toISOString().split('T')[0]
              : null,
            issuing_authority: doc.issuing_authority,
            masked_identifier:
              (doc.details as Record<string, any>)?.masked_identifier || null,
            details: (doc.details as Record<string, any>) || {},
            source: (doc.source as any) || 'upload',
            digilocker_uri: doc.digilocker_uri || null,
            created_at: doc.created_at.toISOString(),
            updated_at: doc.updated_at.toISOString(),
          };
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch document from DB: ${(err as Error).message}`);
      }
    }

    const doc = this.inMemoryDocs.get(docId);
    if (!doc || doc.user_id !== userId) {
      throw new NotFoundException('Document not found or access denied.');
    }
    const { storage_path: _, ...resSummary } = doc;
    return resSummary;
  }

  async getDownloadInfo(
    userId: string,
    docId: string,
  ): Promise<{
    signedUrl?: string;
    storagePath?: string;
    fileName?: string;
    mimeType?: string;
  }> {
    let storagePath: string | undefined;
    let fileName = 'document.pdf';
    let mimeType = 'application/pdf';

    if (this.isPrismaUsable()) {
      try {
        const doc = await this.prisma.user_documents.findFirst({
          where: { id: docId, user_id: userId, deleted_at: null },
        });
        if (doc) {
          storagePath = doc.storage_path;
          fileName = doc.file_name || fileName;
          mimeType = doc.mime_type || mimeType;
        }
      } catch {
        // fallback
      }
    }

    if (!storagePath) {
      const memDoc = this.inMemoryDocs.get(docId);
      if (memDoc && memDoc.user_id === userId) {
        storagePath = memDoc.storage_path;
        fileName = memDoc.file_name || fileName;
        mimeType = memDoc.mime_type || mimeType;
      }
    }

    if (!storagePath) {
      throw new NotFoundException('Document not found.');
    }

    // Try Supabase signed URL (600s expiration)
    const signedUrl = await this.storageService.signedUrl(
      this.storageService.documentsBucket,
      storagePath,
      600,
      fileName,
    );

    return {
      signedUrl: signedUrl || undefined,
      storagePath,
      fileName,
      mimeType,
    };
  }

  async getPreviewInfo(
    userId: string,
    docId: string,
  ): Promise<{
    signedUrl?: string;
    storagePath?: string;
    fileName?: string;
    mimeType?: string;
  }> {
    return this.getDownloadInfo(userId, docId);
  }

  async updateDocumentDetails(
    userId: string,
    docId: string,
    input: UpdateDocumentDetailsInput,
  ): Promise<UserDocumentSummary> {
    const maskedId = input.identifierNumber
      ? maskSensitiveIdentifier(input.identifierNumber)
      : undefined;

    if (this.isPrismaUsable()) {
      try {
        const existing = await this.prisma.user_documents.findFirst({
          where: { id: docId, user_id: userId, deleted_at: null },
        });

        if (!existing) {
          throw new NotFoundException('Document not found or access denied.');
        }

        const mergedDetails = {
          ...((existing.details as Record<string, any>) || {}),
          ...input.details,
          ...(maskedId !== undefined ? { masked_identifier: maskedId } : {}),
          updated_at: new Date().toISOString(),
        };

        const updated = await this.prisma.user_documents.update({
          where: { id: docId },
          data: {
            title: input.title ? input.title.trim() : existing.title,
            details: mergedDetails as any,
            updated_at: new Date(),
          },
        });

        const typeLabel =
          DOCUMENT_TYPE_LABELS[updated.document_type_code] ||
          updated.document_type_code;

        return {
          id: updated.id,
          user_id: updated.user_id,
          document_type_code: updated.document_type_code,
          document_type_name: typeLabel,
          title: updated.title,
          file_name: updated.file_name,
          mime_type: updated.mime_type,
          size_bytes: updated.size_bytes,
          issued_on: updated.issued_on
            ? updated.issued_on.toISOString().split('T')[0]
            : null,
          expires_on: updated.expires_on
            ? updated.expires_on.toISOString().split('T')[0]
            : null,
          issuing_authority: updated.issuing_authority,
          masked_identifier:
            (updated.details as Record<string, any>)?.masked_identifier || null,
          details: (updated.details as Record<string, any>) || {},
          source: (updated.source as any) || 'upload',
          created_at: updated.created_at.toISOString(),
          updated_at: updated.updated_at.toISOString(),
        };
      } catch (err) {
        if (err instanceof NotFoundException) throw err;
        this.logger.warn(`Failed to update document details in DB: ${(err as Error).message}`);
      }
    }

    const doc = this.inMemoryDocs.get(docId);
    if (!doc || doc.user_id !== userId) {
      throw new NotFoundException('Document not found or access denied.');
    }

    const updatedDetails = {
      ...(doc.details || {}),
      ...input.details,
      ...(maskedId !== undefined ? { masked_identifier: maskedId } : {}),
      updated_at: new Date().toISOString(),
    };

    doc.details = updatedDetails;
    if (input.title) doc.title = input.title.trim();
    if (maskedId !== undefined) doc.masked_identifier = maskedId;
    doc.updated_at = new Date().toISOString();

    this.inMemoryDocs.set(docId, doc);
    const { storage_path: _, ...resSummary } = doc;
    return resSummary;
  }

  async deleteDocument(
    userId: string,
    docId: string,
  ): Promise<{ success: boolean }> {
    if (this.isPrismaUsable()) {
      try {
        const updated = await this.prisma.user_documents.updateMany({
          where: { id: docId, user_id: userId },
          data: { deleted_at: new Date() },
        });
        if (updated.count > 0) return { success: true };
      } catch (err) {
        this.logger.warn(`Failed to soft-delete document: ${(err as Error).message}`);
      }
    }

    const doc = this.inMemoryDocs.get(docId);
    if (!doc || doc.user_id !== userId) {
      throw new NotFoundException('Document not found');
    }
    this.inMemoryDocs.delete(docId);
    return { success: true };
  }

  async checkReadiness(
    userId: string,
    opportunitySlug: string,
  ): Promise<DocumentReadinessCheck> {
    const userDocs = await this.listDocuments(userId);
    const userTypes = new Set(userDocs.items.map((d) => d.document_type_code));

    let oppTitle = 'Opportunity';
    let oppReqDocs: Array<{ name: string; mandatory: boolean; spec: string | null }> = [];

    if (this.isPrismaUsable()) {
      try {
        const opp = await this.prisma.opportunities.findFirst({
          where: { slug: opportunitySlug },
          select: { id: true, title: true, required_documents: true },
        });
        if (opp) {
          oppTitle = opp.title;
          oppReqDocs = Array.isArray(opp.required_documents)
            ? (opp.required_documents as any)
            : [];
        }
      } catch {
        // fallback
      }
    }

    // Default required documents if none specified in DB
    if (!oppReqDocs || oppReqDocs.length === 0) {
      oppReqDocs = [
        { name: '10th Marksheet / Matriculation Certificate', mandatory: true, spec: 'Class X proof of age' },
        { name: 'Degree / Graduation Certificate', mandatory: true, spec: 'Recognized university memo' },
        { name: 'Category / Caste Certificate', mandatory: false, spec: 'If claiming OBC/SC/ST/EWS reservation' },
        { name: 'Recent Passport Photograph', mandatory: true, spec: 'Clear front-facing photo' },
        { name: 'Applicant Signature', mandatory: true, spec: 'Black ink signature' },
      ];
    }

    // Match document requirements against user's documents
    const mapped = oppReqDocs.map((req) => {
      const lower = req.name.toLowerCase();
      let matchedCode: string | null = null;

      if (lower.includes('10th') || lower.includes('matric') || lower.includes('class x')) {
        matchedCode = 'marksheet_10th';
      } else if (lower.includes('degree') || lower.includes('graduat') || lower.includes('diploma') || lower.includes('memo')) {
        matchedCode = 'degree_certificate';
      } else if (lower.includes('caste') || lower.includes('category') || lower.includes('obc') || lower.includes('sc') || lower.includes('st') || lower.includes('ews')) {
        matchedCode = 'caste_certificate';
      } else if (lower.includes('photo') || lower.includes('photograph')) {
        matchedCode = 'photo';
      } else if (lower.includes('sign') || lower.includes('signature')) {
        matchedCode = 'signature';
      } else if (lower.includes('resume') || lower.includes('cv')) {
        matchedCode = 'resume';
      } else if (lower.includes('aadhaar') || lower.includes('id') || lower.includes('pan')) {
        matchedCode = 'id_proof';
      }

      const matchedDoc = matchedCode
        ? userDocs.items.find((d) => d.document_type_code === matchedCode)
        : null;

      return {
        name: req.name,
        mandatory: req.mandatory,
        spec: req.spec,
        matched: Boolean(matchedDoc),
        matched_document: matchedDoc || null,
      };
    });

    const readyCount = mapped.filter((m) => m.matched).length;
    const totalCount = mapped.length;
    const percentage = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 100;
    const isFullyReady = mapped.filter((m) => m.mandatory).every((m) => m.matched);

    return {
      opportunity_title: oppTitle,
      required_count: totalCount,
      ready_count: readyCount,
      percentage,
      is_fully_ready: isFullyReady,
      required_documents: mapped,
    };
  }
}
