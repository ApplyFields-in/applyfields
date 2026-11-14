import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersStore } from './users.store.js';
import { StorageService } from '../../common/storage.service.js';
import {
  extractEducationFromResume,
  extractProfileFromResume,
  extractTextFromBuffer,
} from './resume-parser.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type {
  CreateEducationDto,
  UpdateEducationDto,
} from './dto/education.dto.js';
import type { UploadResumeDto } from './dto/resume.dto.js';
import type { CreateExamScoreDto, UpdateExamScoreDto } from './dto/exam-score.dto.js';
import type {
  DeleteAccountDto,
  StartChangeContactDto,
  VerifyChangeContactDto,
} from './dto/account.dto.js';
import type {
  MeResponse,
  PublicProfileResponse,
  ResumeApiResponse,
  UserCompetitiveExamScore,
  UserDataExport,
  UserEducation,
  UserProfile,
  UserResumeDocument,
  UserSessionItem,
} from '@applyfields/types';

@Injectable()
export class UsersService {
  constructor(
    private readonly store: UsersStore,
    private readonly storageService: StorageService,
  ) {}

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

    // Upload to Supabase Storage; fall back to local disk when Storage isn't configured (dev/CI)
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectName = `${Date.now()}_${safeName}`;
    const supabasePath = await this.storageService.upload(
      this.storageService.resumesBucket,
      `resumes/${userId}/${objectName}`,
      buffer,
      dto.mimeType,
    );
    let storagePath: string;
    if (supabasePath) {
      storagePath = `resumes/${userId}/${objectName}`;
    } else {
      // ponytail: local fallback for dev — remove once Supabase Storage is mandatory
      const uploadDir = join(process.cwd(), 'uploads', 'resumes', userId);
      if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
      storagePath = join(uploadDir, objectName);
      writeFileSync(storagePath, buffer);
    }

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
      // Not stored: name/DOB/address only go into the profile if the citizen confirms them
      profile: extractProfileFromResume(extractedText),
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

  /** Returns a 1-hour signed download URL from Supabase Storage, or null if not on Supabase (dev). */
  async getResumeSignedUrl(userId: string): Promise<string | null> {
    const docEntity = await this.store.getUserResumeDocument(userId);
    if (!docEntity?.storage_path) return null;
    // Local FS paths (dev fallback) are absolute — don't try to sign them
    if (docEntity.storage_path.startsWith('/') || docEntity.storage_path.includes(':\\')) return null;
    return this.storageService.signedUrl(
      this.storageService.resumesBucket,
      docEntity.storage_path,
      3600,
      docEntity.file_name ?? undefined,
    );
  }

  async deleteResume(userId: string): Promise<{ success: boolean }> {
    await this.store.deleteUserResumeDocument(userId);
    return { success: true };
  }

  // --- Sessions Management ---
  async listSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<UserSessionItem[]> {
    return this.store.listSessionsForUser(userId, currentSessionId);
  }

  async revokeSession(id: string): Promise<{ success: boolean }> {
    await this.store.revokeSession(id);
    return { success: true };
  }

  async revokeOtherSessions(
    userId: string,
    keepSessionId?: string,
  ): Promise<{ success: boolean }> {
    await this.store.revokeOtherSessionsForUser(userId, keepSessionId);
    return { success: true };
  }

  // --- Competitive Exam Scores ---
  async getExamScores(userId: string): Promise<UserCompetitiveExamScore[]> {
    return this.store.getExamScores(userId);
  }

  async addExamScore(
    userId: string,
    dto: CreateExamScoreDto,
  ): Promise<UserCompetitiveExamScore> {
    return this.store.createExamScore(userId, dto);
  }

  async updateExamScore(
    id: string,
    userId: string,
    dto: UpdateExamScoreDto,
  ): Promise<UserCompetitiveExamScore> {
    const updated = await this.store.updateExamScore(id, userId, dto);
    if (!updated) {
      throw new NotFoundException('Competitive exam score record not found');
    }
    return updated;
  }

  async deleteExamScore(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const deleted = await this.store.deleteExamScore(id, userId);
    if (!deleted) {
      throw new NotFoundException('Competitive exam score record not found');
    }
    return { success: true };
  }

  // --- DPDP Data Portability & Account Deletion ---
  async exportUserData(userId: string): Promise<UserDataExport> {
    return this.store.exportUserData(userId);
  }

  async deleteUserAccount(
    userId: string,
    dto: DeleteAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.store.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');

    // If user has a password set, require password verification or code verification
    if (user.password_hash) {
      let verified = false;
      if (dto.password) {
        verified = await argon2.verify(user.password_hash, dto.password);
      } else if (dto.code && (user.email || user.phone)) {
        const target = user.email || user.phone!;
        const hash = createHash('sha256').update(dto.code.trim()).digest('hex');
        const otp = await this.store.findLatestValidOtp(
          target,
          'reset_password',
        );
        if (otp && otp.code_hash === hash) {
          verified = true;
          await this.store.markOtpUsed(otp.id);
        }
      }

      if (!verified) {
        throw new BadRequestException(
          'Incorrect password or verification code. Account deletion was not authorized.',
        );
      }
    }

    await this.eraseAccount(userId, null);
    return {
      success: true,
      message: 'Your account and all personal data have been permanently deleted.',
    };
  }

  /** Permanent delete: DB row (+ cascades), audit entry, then Storage files. actorId = staff, null = the user. */
  async eraseAccount(userId: string, actorId: string | null): Promise<void> {
    const paths = await this.store.deleteUserAccount(userId, actorId);
    // Uploaded files: resumes live in the resumes bucket, everything else in documents.
    // ponytail: best-effort — a failed Storage call leaves orphan files (logged); add a retry sweep if it happens.
    const resumes = paths.filter((p) => p.startsWith('resumes/'));
    const docs = paths.filter((p) => p.startsWith('documents/'));
    await Promise.all([
      this.storageService.remove(this.storageService.resumesBucket, resumes),
      this.storageService.remove(this.storageService.documentsBucket, docs),
    ]);
  }

  // --- Public Profile Portfolio ---
  async getPublicProfile(handle: string): Promise<PublicProfileResponse> {
    const data = await this.store.findPublicProfileByHandle(handle);
    if (!data) {
      throw new NotFoundException(
        'Candidate profile not found or is private.',
      );
    }

    const { profile, education, examScores } = data;
    const highestEdu = education.length > 0 ? education[0] : undefined;

    return {
      fullName: profile.full_name || handle,
      handle: profile.handle || handle,
      avatarUrl: profile.avatar_url ?? undefined,
      stateName: profile.state_code ?? undefined,
      district: profile.district ?? undefined,
      domicileState: profile.domicile_state_code ?? undefined,
      category: profile.category ?? undefined,
      highestDegree:
        highestEdu?.degree ||
        highestEdu?.level?.replace(/_/g, ' ') ||
        undefined,
      stream: highestEdu?.stream ?? undefined,
      institution:
        highestEdu?.institution_name ||
        highestEdu?.board_or_university ||
        undefined,
      yearOfPassing: highestEdu?.year_of_passing ?? undefined,
      score: highestEdu?.score ?? undefined,
      scoreType: highestEdu?.score_type ?? undefined,
      skills: profile.special_conditions || [],
      targetJobTypes: [
        'Central Government PSUs',
        'State Engineering Services',
        'Higher Technical Education',
      ],
      examScores: examScores,
      isVerified: Boolean(
        data.user.email_verified_at || data.user.phone_verified_at,
      ),
    };
  }

  // --- Change Email or Phone ---
  async startChangeContact(
    userId: string,
    dto: StartChangeContactDto,
  ): Promise<{ success: boolean; message: string }> {
    const cleanVal = dto.value.trim().toLowerCase();
    const existing =
      dto.type === 'email'
        ? await this.store.findUserByEmail(cleanVal)
        : await this.store.findUserByPhone(cleanVal);

    if (existing && existing.id !== userId) {
      throw new BadRequestException(
        `This ${dto.type} is already registered to another account.`,
      );
    }

    // Generate random 6 digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = createHash('sha256').update(code).digest('hex');
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await this.store.saveOtp({
      user_id: userId,
      target: cleanVal,
      purpose: dto.type === 'email' ? 'verify_email' : 'verify_phone',
      code_hash,
      expires_at,
    });

    console.info(
      `[Auth] Verification OTP for ${dto.type} change (${cleanVal}): ${code}`,
    );

    return {
      success: true,
      message: `Verification code sent to ${dto.value}.`,
    };
  }

  async verifyChangeContact(
    userId: string,
    dto: VerifyChangeContactDto,
  ): Promise<{ success: boolean; message: string }> {
    const cleanVal = dto.value.trim().toLowerCase();
    const purpose = dto.type === 'email' ? 'verify_email' : 'verify_phone';
    const otp = await this.store.findLatestValidOtp(cleanVal, purpose);

    if (!otp) {
      throw new BadRequestException(
        'No pending verification code found or code has expired.',
      );
    }

    const codeHash = createHash('sha256').update(dto.code.trim()).digest('hex');
    if (otp.code_hash !== codeHash) {
      await this.store.incrementOtpAttempt(otp.id);
      throw new BadRequestException('Invalid verification code.');
    }

    await this.store.markOtpUsed(otp.id);

    const now = new Date().toISOString();
    if (dto.type === 'email') {
      await this.store.updateUser(userId, {
        email: cleanVal,
        email_verified_at: now,
      });
    } else {
      await this.store.updateUser(userId, {
        phone: cleanVal,
        phone_verified_at: now,
      });
    }

    return {
      success: true,
      message: `Your ${dto.type} has been updated and verified successfully.`,
    };
  }
}
