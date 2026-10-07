import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersStore } from './users.store.js';
import {
  extractEducationFromResume,
  extractTextFromBuffer,
} from './resume-parser.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type {
  CreateEducationDto,
  UpdateEducationDto,
} from './dto/education.dto.js';
import type { UploadResumeDto } from './dto/resume.dto.js';
import type {
  MeResponse,
  ResumeApiResponse,
  UserEducation,
  UserProfile,
  UserResumeDocument,
} from '@applyfields/types';

@Injectable()
export class UsersService {
  constructor(private readonly store: UsersStore) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.store.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const profile = (await this.store.getProfile(userId)) ?? null;
    const education = await this.store.getUserEducation(userId);

    return {
      user: this.store.toUserSummary(user),
      profile,
      education,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfile> {
    const user = await this.store.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.store.updateProfile(userId, dto);
  }

  async getEducation(userId: string): Promise<UserEducation[]> {
    return await this.store.getUserEducation(userId);
  }

  async addEducation(
    userId: string,
    dto: CreateEducationDto,
  ): Promise<UserEducation> {
    return await this.store.addEducation(userId, {
      level: dto.level,
      degree: dto.degree ?? null,
      stream: dto.stream ?? null,
      board_or_university: dto.board_or_university ?? null,
      institution_name: dto.institution_name ?? null,
      year_of_passing: dto.year_of_passing ?? null,
      score: dto.score ?? null,
      score_type: dto.score_type ?? null,
      status: dto.status ?? 'completed',
    });
  }

  async updateEducation(
    id: string,
    userId: string,
    dto: UpdateEducationDto,
  ): Promise<UserEducation> {
    const updated = await this.store.updateEducation(id, userId, dto);
    if (!updated) {
      throw new NotFoundException('Education record not found');
    }
    return updated;
  }

  async deleteEducation(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const deleted = await this.store.deleteEducation(id, userId);
    if (!deleted) {
      throw new NotFoundException('Education record not found');
    }
    return { success: true };
  }

  // --- Resume Document & AI Extraction ---
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);
  private static readonly MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

  async uploadAndExtractResume(
    userId: string,
    dto: UploadResumeDto,
  ): Promise<ResumeApiResponse> {
    if (!UsersService.ALLOWED_MIME_TYPES.has(dto.mimeType)) {
      throw new BadRequestException(
        'Unsupported file type. Only PDF, DOCX, TXT, and images are accepted.',
      );
    }

    const user = await this.store.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strip data:mime;base64, prefix if present
    const base64Data = dto.fileBase64.includes(';base64,')
      ? dto.fileBase64.split(';base64,')[1]
      : dto.fileBase64;
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > UsersService.MAX_RESUME_BYTES) {
      throw new BadRequestException('File exceeds the 5 MB limit.');
    }

    // Save file securely to server storage directory
    const uploadDir = join(process.cwd(), 'uploads', 'resumes', userId);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = join(uploadDir, `${Date.now()}_${safeName}`);
    writeFileSync(storagePath, buffer);

    // Extract text with OCR fallback for scanned/image PDFs
    let extractedText = dto.text?.trim() || '';
    if (!extractedText || extractedText.length < 30) {
      extractedText = await extractTextFromBuffer(
        buffer,
        dto.mimeType,
        dto.fileName,
      );
    }

    // Parse qualifications using precision segmenter
    const qualifications = extractEducationFromResume(extractedText);

    // Save or replace active resume in user_documents.
    // extracted_text is not persisted — it's PII we don't need to store long-term.
    const docEntity = await this.store.saveUserResumeDocument(userId, {
      title: `Resume - ${dto.fileName}`,
      file_name: dto.fileName,
      storage_path: storagePath,
      mime_type: dto.mimeType,
      size_bytes: buffer.length,
      details: {
        qualifications,
        uploaded_at: new Date().toISOString(),
      },
    });

    // storage_path is an internal server path — never expose it to the client.
    const userResume: UserResumeDocument = {
      id: docEntity.id,
      user_id: docEntity.user_id,
      document_type_code: docEntity.document_type_code,
      title: docEntity.title,
      file_name: docEntity.file_name,
      mime_type: docEntity.mime_type,
      size_bytes: docEntity.size_bytes,
      details: docEntity.details,
      created_at: docEntity.created_at,
      updated_at: docEntity.updated_at,
    };

    return {
      success: true,
      resume: userResume,
      qualifications,
      text: extractedText,
    };
  }

  async getResume(userId: string): Promise<UserResumeDocument | null> {
    const docEntity = await this.store.getUserResumeDocument(userId);
    if (!docEntity) return null;
    return {
      id: docEntity.id,
      user_id: docEntity.user_id,
      document_type_code: docEntity.document_type_code,
      title: docEntity.title,
      file_name: docEntity.file_name,
      mime_type: docEntity.mime_type,
      size_bytes: docEntity.size_bytes,
      // storage_path intentionally omitted — internal server path
      details: docEntity.details,
      created_at: docEntity.created_at,
      updated_at: docEntity.updated_at,
    };
  }

  async getResumeStoragePath(
    userId: string,
  ): Promise<{ storage_path: string; mime_type: string | null; file_name: string | null } | null> {
    const docEntity = await this.store.getUserResumeDocument(userId);
    if (!docEntity?.storage_path) return null;
    return {
      storage_path: docEntity.storage_path,
      mime_type: docEntity.mime_type ?? null,
      file_name: docEntity.file_name ?? null,
    };
  }

  async deleteResume(userId: string): Promise<{ success: boolean }> {
    await this.store.deleteUserResumeDocument(userId);
    return { success: true };
  }
}
