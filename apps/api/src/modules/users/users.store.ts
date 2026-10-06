import { Injectable, OnModuleInit, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  UserEducation,
  UserProfile,
  UserSummary,
} from '@applyfields/types';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const STORE_FILE_PATH = join(process.cwd(), '.data', 'users-store.json');

export interface UserDocumentEntity {
  id: string;
  user_id: string;
  document_type_code: string;
  title: string | null;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  details: Record<string, any>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserEntity {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  status: 'active' | 'suspended' | 'deleted';
  email_verified_at: string | null;
  phone_verified_at: string | null;
  mfa_enabled: boolean;
  last_login_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSessionEntity {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  last_used_at: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface OtpCodeEntity {
  id: string;
  user_id: string | null;
  target: string;
  purpose: 'verify_email' | 'verify_phone' | 'login' | 'reset_password';
  code_hash: string;
  attempts: number;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface ConsentEntity {
  id: string;
  user_id: string;
  purpose: 'terms' | 'privacy' | 'sms' | 'whatsapp' | 'email_updates' | 'analytics';
  policy_version: string;
  granted: boolean;
  granted_at: string;
  withdrawn_at: string | null;
  ip_address: string | null;
}

@Injectable()
export class UsersStore implements OnModuleInit {
  // In-memory fallback (used when prisma is not provided or in unit tests)
  private users = new Map<string, UserEntity>();
  private sessions = new Map<string, UserSessionEntity>();
  private otps = new Map<string, OtpCodeEntity>();
  private consents: ConsentEntity[] = [];
  private profiles = new Map<string, UserProfile>();
  private educations = new Map<string, UserEducation>();
  private documents = new Map<string, UserDocumentEntity>();

  constructor(@Optional() private readonly prisma?: PrismaService) {
    if (!this.prisma || this.isTestEnv()) {
      this.loadFromDisk();
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.prisma && !this.isTestEnv()) {
      try {
        await this.prisma.document_types.upsert({
          where: { code: 'resume' },
          update: { name: 'Resume / Curriculum Vitae' },
          create: {
            code: 'resume',
            name: 'Resume / Curriculum Vitae',
            category: 'education',
            has_expiry: false,
            description: 'Candidate resume or CV document',
            sort_order: 1,
          },
        });
      } catch (err: any) {
        console.warn('[UsersStore] Notice on document_types initialization:', err.message);
      }
    }
  }

  private isTestEnv(): boolean {
    return process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
  }

  private loadFromDisk(): void {
    if (this.isTestEnv()) return;
    try {
      if (existsSync(STORE_FILE_PATH)) {
        const raw = readFileSync(STORE_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.users)) {
          for (const u of data.users) this.users.set(u.id, u);
        }
        if (Array.isArray(data.sessions)) {
          for (const s of data.sessions) this.sessions.set(s.id, s);
        }
        if (Array.isArray(data.otps)) {
          for (const o of data.otps) this.otps.set(o.id, o);
        }
        if (Array.isArray(data.consents)) {
          this.consents = data.consents;
        }
        if (Array.isArray(data.profiles)) {
          for (const p of data.profiles) this.profiles.set(p.user_id, p);
        }
        if (Array.isArray(data.educations)) {
          for (const e of data.educations) this.educations.set(e.id, e);
        }
        if (Array.isArray(data.documents)) {
          for (const d of data.documents) this.documents.set(d.id, d);
        }
      }
    } catch (err) {
      console.warn('[UsersStore] Could not load data from disk, using fresh store:', err);
    }
  }

  private saveToDisk(): void {
    if (this.isTestEnv() || this.prisma) return;
    try {
      const dir = dirname(STORE_FILE_PATH);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const data = {
        users: Array.from(this.users.values()),
        sessions: Array.from(this.sessions.values()),
        otps: Array.from(this.otps.values()),
        consents: this.consents,
        profiles: Array.from(this.profiles.values()),
        educations: Array.from(this.educations.values()),
        documents: Array.from(this.documents.values()),
      };
      writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[UsersStore] Could not save data to disk:', err);
    }
  }

  // --- Mappers ---
  private mapDbUserToEntity(u: any): UserEntity {
    return {
      id: u.id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      password_hash: u.password_hash ?? '',
      status: u.status,
      email_verified_at: u.email_verified_at ? u.email_verified_at.toISOString() : null,
      phone_verified_at: u.phone_verified_at ? u.phone_verified_at.toISOString() : null,
      mfa_enabled: Boolean(u.mfa_enabled),
      last_login_at: u.last_login_at ? u.last_login_at.toISOString() : null,
      deleted_at: u.deleted_at ? u.deleted_at.toISOString() : null,
      created_at: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
      updated_at: u.updated_at ? u.updated_at.toISOString() : new Date().toISOString(),
    };
  }

  private mapDbProfileToDomain(p: any): UserProfile {
    return {
      user_id: p.user_id,
      full_name: p.full_name ?? null,
      date_of_birth: p.date_of_birth ? p.date_of_birth.toISOString().split('T')[0] : null,
      gender: p.gender ?? null,
      category: p.category ?? null,
      is_pwbd: Boolean(p.is_pwbd),
      pwbd_type: p.pwbd_type ?? null,
      is_ex_serviceman: Boolean(p.is_ex_serviceman),
      is_minority: Boolean(p.is_minority),
      special_conditions: Array.isArray(p.special_conditions) ? p.special_conditions : [],
      annual_family_income: p.annual_family_income != null ? Number(p.annual_family_income) : null,
      state_code: p.state_code ?? null,
      district: p.district ?? null,
      domicile_state_code: p.domicile_state_code ?? null,
      preferred_language: p.preferred_language ?? 'en',
      avatar_url: p.avatar_url ?? null,
      updated_at: p.updated_at ? p.updated_at.toISOString() : new Date().toISOString(),
    };
  }

  private mapDbEducationToDomain(e: any): UserEducation {
    return {
      id: e.id,
      user_id: e.user_id,
      level: e.level,
      degree: e.degree ?? null,
      stream: e.stream ?? null,
      board_or_university: e.board_or_university ?? null,
      institution_name: e.institution_name ?? null,
      year_of_passing: e.year_of_passing != null ? Number(e.year_of_passing) : null,
      score: e.score != null ? Number(e.score) : null,
      score_type: e.score_type ?? null,
      status: e.status ?? 'completed',
      created_at: e.created_at ? e.created_at.toISOString() : new Date().toISOString(),
      updated_at: e.updated_at ? e.updated_at.toISOString() : new Date().toISOString(),
    };
  }

  private mapDbDocumentToEntity(d: any): UserDocumentEntity {
    return {
      id: d.id,
      user_id: d.user_id,
      document_type_code: d.document_type_code,
      title: d.title ?? null,
      storage_path: d.storage_path,
      file_name: d.file_name ?? null,
      mime_type: d.mime_type ?? null,
      size_bytes: d.size_bytes != null ? Number(d.size_bytes) : null,
      details: typeof d.details === 'object' && d.details !== null ? d.details : {},
      deleted_at: d.deleted_at ? d.deleted_at.toISOString() : null,
      created_at: d.created_at ? d.created_at.toISOString() : new Date().toISOString(),
      updated_at: d.updated_at ? d.updated_at.toISOString() : new Date().toISOString(),
    };
  }

  // --- Users ---
  async createUser(data: {
    email?: string;
    phone?: string;
    password_hash: string;
  }): Promise<UserEntity> {
    const email = data.email ? data.email.toLowerCase().trim() : null;
    const phone = data.phone ? data.phone.trim() : null;

    if (this.prisma && !this.isTestEnv()) {
      const dbUser = await this.prisma.users.create({
        data: {
          email,
          phone,
          password_hash: data.password_hash,
          status: 'active',
          user_profiles: {
            create: {
              preferred_language: 'en',
              is_pwbd: false,
              is_ex_serviceman: false,
              is_minority: false,
              special_conditions: [],
            },
          },
        },
      });
      return this.mapDbUserToEntity(dbUser);
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const user: UserEntity = {
      id,
      email,
      phone,
      password_hash: data.password_hash,
      status: 'active',
      email_verified_at: null,
      phone_verified_at: null,
      mfa_enabled: false,
      last_login_at: null,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    this.users.set(id, user);

    this.profiles.set(id, {
      user_id: id,
      full_name: null,
      date_of_birth: null,
      gender: null,
      category: null,
      is_pwbd: false,
      pwbd_type: null,
      is_ex_serviceman: false,
      is_minority: false,
      special_conditions: [],
      annual_family_income: null,
      state_code: null,
      district: null,
      domicile_state_code: null,
      preferred_language: 'en',
      avatar_url: null,
      updated_at: now,
    });

    this.saveToDisk();
    return user;
  }

  async findUserById(id: string): Promise<UserEntity | undefined> {
    if (this.prisma && !this.isTestEnv()) {
      const u = await this.prisma.users.findUnique({ where: { id } });
      return u ? this.mapDbUserToEntity(u) : undefined;
    }
    return this.users.get(id);
  }

  async findUserByEmail(email: string): Promise<UserEntity | undefined> {
    const lower = email.toLowerCase().trim();
    if (this.prisma && !this.isTestEnv()) {
      const u = await this.prisma.users.findUnique({ where: { email: lower } });
      return u ? this.mapDbUserToEntity(u) : undefined;
    }
    return Array.from(this.users.values()).find((u) => u.email === lower);
  }

  async findUserByPhone(phone: string): Promise<UserEntity | undefined> {
    const trimmed = phone.trim();
    if (this.prisma && !this.isTestEnv()) {
      let u = await this.prisma.users.findUnique({ where: { phone: trimmed } });
      if (!u) {
        const digitsOnly = trimmed.replace(/\D/g, '');
        if (digitsOnly.length >= 7) {
          u = await this.prisma.users.findFirst({
            where: {
              phone: {
                endsWith: digitsOnly,
              },
            },
          });
        }
      }
      return u ? this.mapDbUserToEntity(u) : undefined;
    }

    // Exact match
    const exact = Array.from(this.users.values()).find((u) => u.phone === trimmed);
    if (exact) return exact;

    // Normalized digit matching
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      return Array.from(this.users.values()).find((u) => {
        if (!u.phone) return false;
        const uDigits = u.phone.replace(/\D/g, '');
        return uDigits === digitsOnly || uDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uDigits);
      });
    }

    return undefined;
  }

  async findUserByIdentifier(identifier: string): Promise<UserEntity | undefined> {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return this.findUserByEmail(trimmed);
    }
    return this.findUserByPhone(trimmed);
  }

  async updateUser(id: string, partial: Partial<UserEntity>): Promise<UserEntity | undefined> {
    if (this.prisma && !this.isTestEnv()) {
      const data: Prisma.usersUpdateInput = {
        updated_at: new Date(),
      };
      if (partial.email !== undefined) data.email = partial.email;
      if (partial.phone !== undefined) data.phone = partial.phone;
      if (partial.password_hash !== undefined) data.password_hash = partial.password_hash;
      if (partial.status !== undefined) data.status = partial.status as any;
      if (partial.email_verified_at !== undefined) {
        data.email_verified_at = partial.email_verified_at ? new Date(partial.email_verified_at) : null;
      }
      if (partial.phone_verified_at !== undefined) {
        data.phone_verified_at = partial.phone_verified_at ? new Date(partial.phone_verified_at) : null;
      }
      if (partial.mfa_enabled !== undefined) data.mfa_enabled = partial.mfa_enabled;
      if (partial.last_login_at !== undefined) {
        data.last_login_at = partial.last_login_at ? new Date(partial.last_login_at) : null;
      }
      if (partial.deleted_at !== undefined) {
        data.deleted_at = partial.deleted_at ? new Date(partial.deleted_at) : null;
      }

      const updated = await this.prisma.users.update({
        where: { id },
        data,
      });
      return this.mapDbUserToEntity(updated);
    }

    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = {
      ...user,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  toUserSummary(user: UserEntity): UserSummary {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      status: user.status,
      email_verified: Boolean(user.email_verified_at),
      phone_verified: Boolean(user.phone_verified_at),
      has_passkey: Boolean(user.mfa_enabled),
      created_at: user.created_at,
    };
  }

  // --- Consents ---
  async addConsent(data: Omit<ConsentEntity, 'id' | 'granted_at' | 'withdrawn_at'>): Promise<ConsentEntity> {
    if (this.prisma && !this.isTestEnv()) {
      const created = await this.prisma.consents.create({
        data: {
          user_id: data.user_id,
          purpose: data.purpose as any,
          policy_version: data.policy_version,
          granted: data.granted,
          ip_address: data.ip_address ?? null,
        },
      });
      return {
        id: created.id,
        user_id: created.user_id,
        purpose: created.purpose as any,
        policy_version: created.policy_version,
        granted: created.granted,
        granted_at: created.granted_at.toISOString(),
        withdrawn_at: created.withdrawn_at ? created.withdrawn_at.toISOString() : null,
        ip_address: created.ip_address,
      };
    }

    const consent: ConsentEntity = {
      id: randomUUID(),
      ...data,
      granted_at: new Date().toISOString(),
      withdrawn_at: null,
    };
    this.consents.push(consent);
    this.saveToDisk();
    return consent;
  }

  async getConsentsForUser(userId: string): Promise<ConsentEntity[]> {
    if (this.prisma && !this.isTestEnv()) {
      const list = await this.prisma.consents.findMany({
        where: { user_id: userId },
      });
      return list.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        purpose: c.purpose as any,
        policy_version: c.policy_version,
        granted: c.granted,
        granted_at: c.granted_at.toISOString(),
        withdrawn_at: c.withdrawn_at ? c.withdrawn_at.toISOString() : null,
        ip_address: c.ip_address,
      }));
    }
    return this.consents.filter((c) => c.user_id === userId);
  }

  // --- Sessions ---
  async createSession(data: {
    user_id: string;
    refresh_token_hash: string;
    expires_at: string;
    device_name?: string | null;
    user_agent?: string | null;
    ip_address?: string | null;
  }): Promise<UserSessionEntity> {
    if (this.prisma && !this.isTestEnv()) {
      const created = await this.prisma.user_sessions.create({
        data: {
          user_id: data.user_id,
          refresh_token_hash: data.refresh_token_hash,
          device_name: data.device_name ?? null,
          user_agent: data.user_agent ?? null,
          ip_address: data.ip_address ?? null,
          last_used_at: new Date(),
          expires_at: new Date(data.expires_at),
        },
      });
      return {
        id: created.id,
        user_id: created.user_id,
        refresh_token_hash: created.refresh_token_hash,
        device_name: created.device_name,
        user_agent: created.user_agent,
        ip_address: created.ip_address,
        last_used_at: created.last_used_at ? created.last_used_at.toISOString() : new Date().toISOString(),
        expires_at: created.expires_at.toISOString(),
        revoked_at: created.revoked_at ? created.revoked_at.toISOString() : null,
        created_at: created.created_at.toISOString(),
      };
    }

    const session: UserSessionEntity = {
      id: randomUUID(),
      user_id: data.user_id,
      refresh_token_hash: data.refresh_token_hash,
      device_name: data.device_name ?? null,
      user_agent: data.user_agent ?? null,
      ip_address: data.ip_address ?? null,
      last_used_at: new Date().toISOString(),
      expires_at: data.expires_at,
      revoked_at: null,
      created_at: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    this.saveToDisk();
    return session;
  }

  async findActiveSessionByTokenHash(tokenHash: string): Promise<UserSessionEntity | undefined> {
    if (this.prisma && !this.isTestEnv()) {
      const now = new Date();
      const s = await this.prisma.user_sessions.findFirst({
        where: {
          refresh_token_hash: tokenHash,
          revoked_at: null,
          expires_at: { gt: now },
        },
      });
      if (!s) return undefined;
      return {
        id: s.id,
        user_id: s.user_id,
        refresh_token_hash: s.refresh_token_hash,
        device_name: s.device_name,
        user_agent: s.user_agent,
        ip_address: s.ip_address,
        last_used_at: s.last_used_at ? s.last_used_at.toISOString() : new Date().toISOString(),
        expires_at: s.expires_at.toISOString(),
        revoked_at: null,
        created_at: s.created_at.toISOString(),
      };
    }

    const now = new Date().toISOString();
    return Array.from(this.sessions.values()).find(
      (s) =>
        s.refresh_token_hash === tokenHash &&
        !s.revoked_at &&
        s.expires_at > now,
    );
  }

  async revokeSession(id: string): Promise<void> {
    if (this.prisma && !this.isTestEnv()) {
      await this.prisma.user_sessions.update({
        where: { id },
        data: { revoked_at: new Date() },
      });
      return;
    }

    const session = this.sessions.get(id);
    if (session) {
      session.revoked_at = new Date().toISOString();
      this.sessions.set(id, session);
      this.saveToDisk();
    }
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    if (this.prisma && !this.isTestEnv()) {
      await this.prisma.user_sessions.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      return;
    }

    const now = new Date().toISOString();
    for (const [id, session] of this.sessions.entries()) {
      if (session.user_id === userId && !session.revoked_at) {
        session.revoked_at = now;
        this.sessions.set(id, session);
      }
    }
    this.saveToDisk();
  }

  // --- OTPs ---
  async saveOtp(data: {
    user_id?: string | null;
    target: string;
    purpose: 'verify_email' | 'verify_phone' | 'login' | 'reset_password';
    code_hash: string;
    expires_at: string;
  }): Promise<OtpCodeEntity> {
    if (this.prisma && !this.isTestEnv()) {
      const created = await this.prisma.otp_codes.create({
        data: {
          user_id: data.user_id ?? null,
          target: data.target.trim().toLowerCase(),
          purpose: data.purpose as any,
          code_hash: data.code_hash,
          attempts: 0,
          expires_at: new Date(data.expires_at),
        },
      });
      return {
        id: created.id,
        user_id: created.user_id,
        target: created.target,
        purpose: created.purpose as any,
        code_hash: created.code_hash,
        attempts: created.attempts,
        expires_at: created.expires_at.toISOString(),
        used_at: created.used_at ? created.used_at.toISOString() : null,
        created_at: created.created_at.toISOString(),
      };
    }

    const otp: OtpCodeEntity = {
      id: randomUUID(),
      user_id: data.user_id ?? null,
      target: data.target.trim().toLowerCase(),
      purpose: data.purpose,
      code_hash: data.code_hash,
      attempts: 0,
      expires_at: data.expires_at,
      used_at: null,
      created_at: new Date().toISOString(),
    };
    this.otps.set(otp.id, otp);
    this.saveToDisk();
    return otp;
  }

  async findLatestValidOtp(
    target: string,
    purpose: 'verify_email' | 'verify_phone' | 'login' | 'reset_password',
  ): Promise<OtpCodeEntity | undefined> {
    const normalized = target.trim().toLowerCase();
    const now = new Date().toISOString();
    const isEmail = normalized.includes('@');
    const targetDigits = !isEmail ? normalized.replace(/\D/g, '') : '';

    if (this.prisma && !this.isTestEnv()) {
      const otps = await this.prisma.otp_codes.findMany({
        where: {
          purpose: purpose as any,
          used_at: null,
          expires_at: { gt: new Date(now) },
          attempts: { lt: 5 },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      });

      const matched = otps.find((o) => {
        if (o.target === normalized) return true;
        if (!isEmail && !o.target.includes('@') && targetDigits.length >= 7) {
          const oDigits = o.target.replace(/\D/g, '');
          return oDigits === targetDigits || oDigits.endsWith(targetDigits) || targetDigits.endsWith(oDigits);
        }
        return false;
      });

      if (!matched) return undefined;
      return {
        id: matched.id,
        user_id: matched.user_id,
        target: matched.target,
        purpose: matched.purpose as any,
        code_hash: matched.code_hash,
        attempts: matched.attempts,
        expires_at: matched.expires_at.toISOString(),
        used_at: null,
        created_at: matched.created_at.toISOString(),
      };
    }

    const matches = Array.from(this.otps.values())
      .filter((o) => {
        if (o.purpose !== purpose || o.used_at || o.expires_at <= now || o.attempts >= 5) {
          return false;
        }
        if (o.target === normalized) return true;
        if (!isEmail && !o.target.includes('@') && targetDigits.length >= 7) {
          const oDigits = o.target.replace(/\D/g, '');
          return oDigits === targetDigits || oDigits.endsWith(targetDigits) || targetDigits.endsWith(oDigits);
        }
        return false;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return matches[0];
  }

  async incrementOtpAttempt(otpId: string): Promise<void> {
    if (this.prisma && !this.isTestEnv()) {
      await this.prisma.otp_codes.update({
        where: { id: otpId },
        data: { attempts: { increment: 1 } },
      });
      return;
    }

    const otp = this.otps.get(otpId);
    if (otp) {
      otp.attempts += 1;
      this.otps.set(otpId, otp);
      this.saveToDisk();
    }
  }

  async markOtpUsed(otpId: string): Promise<void> {
    if (this.prisma && !this.isTestEnv()) {
      await this.prisma.otp_codes.update({
        where: { id: otpId },
        data: { used_at: new Date() },
      });
      return;
    }

    const otp = this.otps.get(otpId);
    if (otp) {
      otp.used_at = new Date().toISOString();
      this.otps.set(otpId, otp);
      this.saveToDisk();
    }
  }

  // --- Profiles ---
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    if (this.prisma && !this.isTestEnv()) {
      const p = await this.prisma.user_profiles.findUnique({
        where: { user_id: userId },
      });
      return p ? this.mapDbProfileToDomain(p) : undefined;
    }
    return this.profiles.get(userId);
  }

  async updateProfile(userId: string, partial: Partial<UserProfile>): Promise<UserProfile> {
    if (this.prisma && !this.isTestEnv()) {
      const dataToUpdate: Prisma.user_profilesUpdateInput = {
        updated_at: new Date(),
      };
      if (partial.full_name !== undefined) dataToUpdate.full_name = partial.full_name;
      if (partial.date_of_birth !== undefined) {
        dataToUpdate.date_of_birth = partial.date_of_birth ? new Date(partial.date_of_birth + 'T00:00:00Z') : null;
      }
      if (partial.gender !== undefined) dataToUpdate.gender = partial.gender as any;
      if (partial.category !== undefined) dataToUpdate.category = partial.category as any;
      if (partial.is_pwbd !== undefined) dataToUpdate.is_pwbd = partial.is_pwbd;
      if (partial.pwbd_type !== undefined) dataToUpdate.pwbd_type = partial.pwbd_type;
      if (partial.is_ex_serviceman !== undefined) dataToUpdate.is_ex_serviceman = partial.is_ex_serviceman;
      if (partial.is_minority !== undefined) dataToUpdate.is_minority = partial.is_minority;
      if (partial.special_conditions !== undefined) dataToUpdate.special_conditions = partial.special_conditions;
      if (partial.annual_family_income !== undefined) dataToUpdate.annual_family_income = partial.annual_family_income;
      if (partial.state_code !== undefined) dataToUpdate.state_code = partial.state_code;
      if (partial.district !== undefined) dataToUpdate.district = partial.district;
      if (partial.domicile_state_code !== undefined) dataToUpdate.domicile_state_code = partial.domicile_state_code;
      if (partial.preferred_language !== undefined) dataToUpdate.preferred_language = partial.preferred_language;
      if (partial.avatar_url !== undefined) dataToUpdate.avatar_url = partial.avatar_url;

      const upserted = await this.prisma.user_profiles.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          full_name: partial.full_name ?? null,
          date_of_birth: partial.date_of_birth ? new Date(partial.date_of_birth + 'T00:00:00Z') : null,
          gender: partial.gender as any,
          category: partial.category as any,
          is_pwbd: partial.is_pwbd ?? false,
          pwbd_type: partial.pwbd_type ?? null,
          is_ex_serviceman: partial.is_ex_serviceman ?? false,
          is_minority: partial.is_minority ?? false,
          special_conditions: partial.special_conditions ?? [],
          annual_family_income: partial.annual_family_income ?? null,
          state_code: partial.state_code ?? null,
          district: partial.district ?? null,
          domicile_state_code: partial.domicile_state_code ?? null,
          preferred_language: partial.preferred_language ?? 'en',
          avatar_url: partial.avatar_url ?? null,
        },
        update: dataToUpdate,
      });
      return this.mapDbProfileToDomain(upserted);
    }

    const existing = this.profiles.get(userId) ?? {
      user_id: userId,
      full_name: null,
      date_of_birth: null,
      gender: null,
      category: null,
      is_pwbd: false,
      pwbd_type: null,
      is_ex_serviceman: false,
      is_minority: false,
      special_conditions: [],
      annual_family_income: null,
      state_code: null,
      district: null,
      domicile_state_code: null,
      preferred_language: 'en',
      avatar_url: null,
      updated_at: new Date().toISOString(),
    };

    const updated: UserProfile = {
      ...existing,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);
    this.saveToDisk();
    return updated;
  }

  // --- Education ---
  async getUserEducation(userId: string): Promise<UserEducation[]> {
    if (this.prisma && !this.isTestEnv()) {
      const list = await this.prisma.user_education.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      });
      return list.map((e) => this.mapDbEducationToDomain(e));
    }
    return Array.from(this.educations.values()).filter((e) => e.user_id === userId);
  }

  async addEducation(
    userId: string,
    data: Omit<UserEducation, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ): Promise<UserEducation> {
    if (this.prisma && !this.isTestEnv()) {
      const created = await this.prisma.user_education.create({
        data: {
          user_id: userId,
          level: data.level,
          degree: data.degree ?? null,
          stream: data.stream ?? null,
          board_or_university: data.board_or_university ?? null,
          institution_name: data.institution_name ?? null,
          year_of_passing: data.year_of_passing ?? null,
          score: data.score != null ? new Prisma.Decimal(data.score) : null,
          score_type: data.score_type as any,
          status: (data.status ?? 'completed') as any,
        },
      });
      return this.mapDbEducationToDomain(created);
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const entry: UserEducation = {
      id,
      user_id: userId,
      level: data.level,
      degree: data.degree ?? null,
      stream: data.stream ?? null,
      board_or_university: data.board_or_university ?? null,
      institution_name: data.institution_name ?? null,
      year_of_passing: data.year_of_passing ?? null,
      score: data.score ?? null,
      score_type: data.score_type ?? null,
      status: data.status ?? 'completed',
      created_at: now,
      updated_at: now,
    };
    this.educations.set(id, entry);
    this.saveToDisk();
    return entry;
  }

  async updateEducation(
    id: string,
    userId: string,
    partial: Partial<UserEducation>,
  ): Promise<UserEducation | undefined> {
    if (this.prisma && !this.isTestEnv()) {
      const existing = await this.prisma.user_education.findFirst({
        where: { id, user_id: userId },
      });
      if (!existing) return undefined;

      const dataToUpdate: Prisma.user_educationUpdateInput = {
        updated_at: new Date(),
      };
      if (partial.level !== undefined) dataToUpdate.level = partial.level;
      if (partial.degree !== undefined) dataToUpdate.degree = partial.degree;
      if (partial.stream !== undefined) dataToUpdate.stream = partial.stream;
      if (partial.board_or_university !== undefined) dataToUpdate.board_or_university = partial.board_or_university;
      if (partial.institution_name !== undefined) dataToUpdate.institution_name = partial.institution_name;
      if (partial.year_of_passing !== undefined) dataToUpdate.year_of_passing = partial.year_of_passing;
      if (partial.score !== undefined) {
        dataToUpdate.score = partial.score != null ? new Prisma.Decimal(partial.score) : null;
      }
      if (partial.score_type !== undefined) dataToUpdate.score_type = partial.score_type as any;
      if (partial.status !== undefined) dataToUpdate.status = partial.status as any;

      const updated = await this.prisma.user_education.update({
        where: { id },
        data: dataToUpdate,
      });
      return this.mapDbEducationToDomain(updated);
    }

    const entry = this.educations.get(id);
    if (!entry || entry.user_id !== userId) return undefined;
    const updated: UserEducation = {
      ...entry,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    this.educations.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  async deleteEducation(id: string, userId: string): Promise<boolean> {
    if (this.prisma && !this.isTestEnv()) {
      const existing = await this.prisma.user_education.findFirst({
        where: { id, user_id: userId },
      });
      if (!existing) return false;

      await this.prisma.user_education.delete({
        where: { id },
      });
      return true;
    }

    const entry = this.educations.get(id);
    if (!entry || entry.user_id !== userId) return false;
    const res = this.educations.delete(id);
    this.saveToDisk();
    return res;
  }

  // --- Resume Documents ---
  async saveUserResumeDocument(
    userId: string,
    data: {
      title: string;
      file_name: string;
      storage_path: string;
      mime_type: string;
      size_bytes: number;
      details: Record<string, any>;
    },
  ): Promise<UserDocumentEntity> {
    if (this.prisma && !this.isTestEnv()) {
      try {
        await this.prisma.document_types.upsert({
          where: { code: 'resume' },
          update: { name: 'Resume / Curriculum Vitae' },
          create: {
            code: 'resume',
            name: 'Resume / Curriculum Vitae',
            category: 'education',
            has_expiry: false,
            description: 'Candidate resume or CV document',
            sort_order: 1,
          },
        });
      } catch {}

      const existing = await this.prisma.user_documents.findFirst({
        where: {
          user_id: userId,
          document_type_code: 'resume',
          deleted_at: null,
        },
      });

      if (existing) {
        const updated = await this.prisma.user_documents.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            file_name: data.file_name,
            storage_path: data.storage_path,
            mime_type: data.mime_type,
            size_bytes: data.size_bytes,
            details: data.details,
            updated_at: new Date(),
          },
        });
        return this.mapDbDocumentToEntity(updated);
      }

      const created = await this.prisma.user_documents.create({
        data: {
          user_id: userId,
          document_type_code: 'resume',
          title: data.title,
          file_name: data.file_name,
          storage_path: data.storage_path,
          mime_type: data.mime_type,
          size_bytes: data.size_bytes,
          details: data.details,
        },
      });
      return this.mapDbDocumentToEntity(created);
    }

    const existing = Array.from(this.documents.values()).find(
      (d) => d.user_id === userId && d.document_type_code === 'resume' && !d.deleted_at,
    );
    const now = new Date().toISOString();
    if (existing) {
      const updated: UserDocumentEntity = {
        ...existing,
        title: data.title,
        file_name: data.file_name,
        storage_path: data.storage_path,
        mime_type: data.mime_type,
        size_bytes: data.size_bytes,
        details: data.details,
        updated_at: now,
      };
      this.documents.set(existing.id, updated);
      this.saveToDisk();
      return updated;
    }

    const id = randomUUID();
    const doc: UserDocumentEntity = {
      id,
      user_id: userId,
      document_type_code: 'resume',
      title: data.title,
      file_name: data.file_name,
      storage_path: data.storage_path,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      details: data.details,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    this.documents.set(id, doc);
    this.saveToDisk();
    return doc;
  }

  async getUserResumeDocument(userId: string): Promise<UserDocumentEntity | null> {
    if (this.prisma && !this.isTestEnv()) {
      const doc = await this.prisma.user_documents.findFirst({
        where: {
          user_id: userId,
          document_type_code: 'resume',
          deleted_at: null,
        },
        orderBy: { updated_at: 'desc' },
      });
      return doc ? this.mapDbDocumentToEntity(doc) : null;
    }

    const doc = Array.from(this.documents.values()).find(
      (d) => d.user_id === userId && d.document_type_code === 'resume' && !d.deleted_at,
    );
    return doc ?? null;
  }

  async deleteUserResumeDocument(userId: string): Promise<boolean> {
    if (this.prisma && !this.isTestEnv()) {
      await this.prisma.user_documents.updateMany({
        where: {
          user_id: userId,
          document_type_code: 'resume',
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
        },
      });
      return true;
    }

    for (const [id, doc] of this.documents.entries()) {
      if (doc.user_id === userId && doc.document_type_code === 'resume' && !doc.deleted_at) {
        this.documents.set(id, { ...doc, deleted_at: new Date().toISOString() });
      }
    }
    this.saveToDisk();
    return true;
  }
}
