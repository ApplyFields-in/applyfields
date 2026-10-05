import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  UserEducation,
  UserProfile,
  UserSummary,
} from '@applyfields/types';

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
export class UsersStore {
  private users = new Map<string, UserEntity>();
  private sessions = new Map<string, UserSessionEntity>();
  private otps = new Map<string, OtpCodeEntity>();
  private consents: ConsentEntity[] = [];
  private profiles = new Map<string, UserProfile>();
  private educations = new Map<string, UserEducation>();

  // --- Users ---
  createUser(data: {
    email?: string;
    phone?: string;
    password_hash: string;
  }): UserEntity {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: UserEntity = {
      id,
      email: data.email ? data.email.toLowerCase().trim() : null,
      phone: data.phone ? data.phone.trim() : null,
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

    // Initial blank profile
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

    return user;
  }

  findUserById(id: string): UserEntity | undefined {
    return this.users.get(id);
  }

  findUserByEmail(email: string): UserEntity | undefined {
    const lower = email.toLowerCase().trim();
    return Array.from(this.users.values()).find((u) => u.email === lower);
  }

  findUserByPhone(phone: string): UserEntity | undefined {
    const trimmed = phone.trim();
    // 1. Exact match
    const exact = Array.from(this.users.values()).find((u) => u.phone === trimmed);
    if (exact) return exact;

    // 2. Normalized digit matching (e.g. 10 digits without +91, or formatted with spaces/dashes)
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

  findUserByIdentifier(identifier: string): UserEntity | undefined {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return this.findUserByEmail(trimmed);
    }
    return this.findUserByPhone(trimmed);
  }

  updateUser(id: string, partial: Partial<UserEntity>): UserEntity | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = {
      ...user,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    this.users.set(id, updated);
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
      created_at: user.created_at,
    };
  }

  // --- Consents ---
  addConsent(data: Omit<ConsentEntity, 'id' | 'granted_at' | 'withdrawn_at'>): ConsentEntity {
    const consent: ConsentEntity = {
      id: randomUUID(),
      ...data,
      granted_at: new Date().toISOString(),
      withdrawn_at: null,
    };
    this.consents.push(consent);
    return consent;
  }

  getConsentsForUser(userId: string): ConsentEntity[] {
    return this.consents.filter((c) => c.user_id === userId);
  }

  // --- Sessions ---
  createSession(data: {
    user_id: string;
    refresh_token_hash: string;
    expires_at: string;
    device_name?: string | null;
    user_agent?: string | null;
    ip_address?: string | null;
  }): UserSessionEntity {
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
    return session;
  }

  findActiveSessionByTokenHash(tokenHash: string): UserSessionEntity | undefined {
    const now = new Date().toISOString();
    return Array.from(this.sessions.values()).find(
      (s) =>
        s.refresh_token_hash === tokenHash &&
        !s.revoked_at &&
        s.expires_at > now,
    );
  }

  revokeSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.revoked_at = new Date().toISOString();
      this.sessions.set(id, session);
    }
  }

  revokeAllSessionsForUser(userId: string): void {
    const now = new Date().toISOString();
    for (const [id, session] of this.sessions.entries()) {
      if (session.user_id === userId && !session.revoked_at) {
        session.revoked_at = now;
        this.sessions.set(id, session);
      }
    }
  }

  // --- OTPs ---
  saveOtp(data: {
    user_id?: string | null;
    target: string;
    purpose: 'verify_email' | 'verify_phone' | 'login' | 'reset_password';
    code_hash: string;
    expires_at: string;
  }): OtpCodeEntity {
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
    return otp;
  }

  findLatestValidOtp(
    target: string,
    purpose: 'verify_email' | 'verify_phone' | 'login' | 'reset_password',
  ): OtpCodeEntity | undefined {
    const normalized = target.trim().toLowerCase();
    const now = new Date().toISOString();
    const isEmail = normalized.includes('@');
    const targetDigits = !isEmail ? normalized.replace(/\D/g, '') : '';

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

  incrementOtpAttempt(otpId: string): void {
    const otp = this.otps.get(otpId);
    if (otp) {
      otp.attempts += 1;
      this.otps.set(otpId, otp);
    }
  }

  markOtpUsed(otpId: string): void {
    const otp = this.otps.get(otpId);
    if (otp) {
      otp.used_at = new Date().toISOString();
      this.otps.set(otpId, otp);
    }
  }

  // --- Profiles ---
  getProfile(userId: string): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  updateProfile(userId: string, partial: Partial<UserProfile>): UserProfile {
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
    return updated;
  }

  // --- Education ---
  getUserEducation(userId: string): UserEducation[] {
    return Array.from(this.educations.values()).filter((e) => e.user_id === userId);
  }

  addEducation(userId: string, data: Omit<UserEducation, 'id' | 'user_id' | 'created_at' | 'updated_at'>): UserEducation {
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
    return entry;
  }

  updateEducation(id: string, userId: string, partial: Partial<UserEducation>): UserEducation | undefined {
    const entry = this.educations.get(id);
    if (!entry || entry.user_id !== userId) return undefined;
    const updated: UserEducation = {
      ...entry,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    this.educations.set(id, updated);
    return updated;
  }

  deleteEducation(id: string, userId: string): boolean {
    const entry = this.educations.get(id);
    if (!entry || entry.user_id !== userId) return false;
    return this.educations.delete(id);
  }
}
