import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { UsersStore } from '../users/users.store.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto, LoginOtpDto } from './dto/login.dto.js';
import type { ResetPasswordDto, SendOtpDto, VerifyOtpDto } from './dto/otp.dto.js';
import type { AuthResponse, UserSummary } from '@applyfields/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly store: UsersStore,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generate6DigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(
    dto: RegisterDto,
    ipAddress?: string,
  ): Promise<{ user: UserSummary; message: string; target: string; devOtp?: string }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    if (dto.email && (await this.store.findUserByEmail(dto.email))) {
      throw new ConflictException('An account with this email already exists');
    }

    if (dto.phone && (await this.store.findUserByPhone(dto.phone))) {
      throw new ConflictException('An account with this phone number already exists');
    }

    // Passwords: store only an argon2id hash in users.password_hash. Never log or return it.
    const password_hash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });

    const user = await this.store.createUser({
      email: dto.email,
      phone: dto.phone,
      password_hash,
    });

    // Save consents row for the terms and privacy policy (DPDP Act compliance)
    await this.store.addConsent({
      user_id: user.id,
      purpose: 'terms',
      policy_version: '2026-10-04',
      granted: true,
      ip_address: ipAddress ?? null,
    });

    await this.store.addConsent({
      user_id: user.id,
      purpose: 'privacy',
      policy_version: '2026-10-04',
      granted: true,
      ip_address: ipAddress ?? null,
    });

    // Send verification OTP
    const target = (dto.email ?? dto.phone)!;
    const purpose = dto.email ? 'verify_email' : 'verify_phone';
    const otpResult = await this.sendOtp({ target, purpose }, user.id);

    return {
      user: this.store.toUserSummary(user),
      message: 'Account created successfully. A verification code has been sent.',
      target,
      devOtp: otpResult.devOtp,
    };
  }

  async sendOtp(
    dto: SendOtpDto,
    userId?: string | null,
  ): Promise<{ success: boolean; message: string; target: string; devOtp?: string }> {
    const rawOtp = this.generate6DigitOtp();
    const code_hash = this.hashToken(rawOtp);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    let resolvedUserId = userId ?? null;
    if (!resolvedUserId) {
      const existingUser = await this.store.findUserByIdentifier(dto.target);
      if (existingUser) {
        resolvedUserId = existingUser.id;
      }
    }

    await this.store.saveOtp({
      user_id: resolvedUserId,
      target: dto.target,
      purpose: dto.purpose,
      code_hash,
      expires_at,
    });

    // Security rule: In development, print OTPs to the API console instead of sending email/SMS.
    // DOB, gender, category, income and phone never go into logs or analytics.
    const maskedTarget = dto.target.includes('@')
      ? dto.target.replace(/(^.).+(?=@)/, '$1***')
      : dto.target.replace(/(^\+\d{2})\d+(\d{4}$)/, '$1******$2');

    console.log(
      `\x1b[36m[DEV OTP]\x1b[0m Generated code for \x1b[33m${maskedTarget}\x1b[0m (${dto.purpose}): \x1b[32m\x1b[1m${rawOtp}\x1b[0m (valid for 10m)`,
    );

    const isDev = process.env.NODE_ENV !== 'production';

    return {
      success: true,
      message: 'One-time verification code sent.',
      target: dto.target,
      devOtp: isDev ? rawOtp : undefined,
    };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ verified: boolean; message: string }> {
    const otp = await this.store.findLatestValidOtp(dto.target, dto.purpose);
    if (!otp) {
      throw new BadRequestException('Invalid, expired, or non-existent OTP code');
    }

    if (otp.attempts >= 5) {
      throw new BadRequestException('Too many failed attempts. Please request a new OTP.');
    }

    const inputHash = this.hashToken(dto.code);
    if (inputHash !== otp.code_hash) {
      await this.store.incrementOtpAttempt(otp.id);
      throw new BadRequestException('Incorrect OTP code');
    }

    await this.store.markOtpUsed(otp.id);

    // If verification, update user
    if (otp.user_id) {
      const now = new Date().toISOString();
      if (dto.purpose === 'verify_email') {
        await this.store.updateUser(otp.user_id, { email_verified_at: now });
      } else if (dto.purpose === 'verify_phone') {
        await this.store.updateUser(otp.user_id, { phone_verified_at: now });
      }
    }

    return {
      verified: true,
      message: 'Code verified successfully.',
    };
  }

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<AuthResponse & { refreshToken: string }> {
    const user = await this.store.findUserByIdentifier(dto.identifier);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    const isValid = await argon2.verify(user.password_hash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    await this.store.updateUser(user.id, { last_login_at: new Date().toISOString() });

    const tokens = await this.issueTokens(user, meta);
    return {
      user: this.store.toUserSummary(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async loginWithOtp(
    dto: LoginOtpDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<AuthResponse & { refreshToken: string }> {
    await this.verifyOtp({
      target: dto.phone,
      purpose: 'login',
      code: dto.code,
    });

    let user = await this.store.findUserByPhone(dto.phone);
    if (!user) {
      // Create user if not existing
      const dummyPassword = randomBytes(24).toString('hex');
      const password_hash = await argon2.hash(dummyPassword, { type: argon2.argon2id });
      user = await this.store.createUser({
        phone: dto.phone,
        password_hash,
      });
      await this.store.updateUser(user.id, { phone_verified_at: new Date().toISOString() });
    }

    await this.store.updateUser(user.id, { last_login_at: new Date().toISOString() });

    const tokens = await this.issueTokens(user, meta);
    return {
      user: this.store.toUserSummary(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshTokens(
    rawRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.store.findActiveSessionByTokenHash(tokenHash);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Token rotation: revoke old session
    await this.store.revokeSession(session.id);

    const user = await this.store.findUserById(session.user_id);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User account is suspended or no longer active');
    }

    const tokens = await this.issueTokens(user, meta);
    return {
      accessToken: tokens.accessToken,
      newRefreshToken: tokens.refreshToken,
    };
  }

  async logout(rawRefreshToken?: string): Promise<{ success: boolean }> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      const session = await this.store.findActiveSessionByTokenHash(tokenHash);
      if (session) {
        await this.store.revokeSession(session.id);
      }
    }
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    await this.verifyOtp({
      target: dto.target,
      purpose: 'reset_password',
      code: dto.code,
    });

    const user = await this.store.findUserByIdentifier(dto.target);
    if (!user) {
      throw new NotFoundException('No account found for this target');
    }

    const password_hash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
    });

    await this.store.updateUser(user.id, { password_hash });
    // Revoke all sessions on password change
    await this.store.revokeAllSessionsForUser(user.id);

    return {
      success: true,
      message: 'Password has been successfully reset. Please log in with your new password.',
    };
  }

  private async issueTokens(
    user: { id: string; email: string | null; phone: string | null },
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
    };

    const accessSecret =
      process.env.JWT_ACCESS_SECRET ?? 'applyfields_dev_jwt_access_secret_32bytes_min_key';
    const accessTtl = process.env.JWT_ACCESS_TTL ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessTtl as any,
    });

    // Refresh token: 30 days random crypto token, stored only as a hash in user_sessions
    const refreshToken = randomBytes(40).toString('hex');
    const refresh_token_hash = this.hashToken(refreshToken);
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await this.store.createSession({
      user_id: user.id,
      refresh_token_hash,
      expires_at,
      user_agent: meta.userAgent ?? null,
      ip_address: meta.ipAddress ?? null,
    });

    return { accessToken, refreshToken };
  }
}
