import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { jwtAccessSecret } from '../../common/jwt-secret.js';
import { UsersStore } from '../users/users.store.js';
import type { RegisterDto } from './dto/register.dto.js';
import type {
  LoginDto,
  LoginOtpDto,
  SocialLoginDto,
  PasskeyLoginDto,
  PasskeyRegisterDto,
} from './dto/login.dto.js';
import type {
  ResetPasswordDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dto/otp.dto.js';
import type { UserSummary } from '@applyfields/types';
import { sendOtpEmail } from '../notifications/email.js';

// Internal type — includes tokens so the controller can set cookies. Never sent to clients.
type LoginResult = { user: UserSummary; accessToken: string; refreshToken: string };

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB (OWASP recommendation for fast interactive logins)
  timeCost: 2,
  parallelism: 1,
  raw: false,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly store: UsersStore,
    private readonly jwtService: JwtService,
    @Optional() private readonly prisma?: PrismaService,
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
  ): Promise<{
    user: UserSummary;
    message: string;
    target: string;
    devOtp?: string;
  }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    // Check existing email/phone and compute password hash concurrently
    const [existingEmail, existingPhone, password_hash] = await Promise.all([
      dto.email ? this.store.findUserByEmail(dto.email) : Promise.resolve(null),
      dto.phone ? this.store.findUserByPhone(dto.phone) : Promise.resolve(null),
      argon2.hash(dto.password, ARGON2_OPTIONS),
    ]);

    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    if (existingPhone) {
      throw new ConflictException(
        'An account with this phone number already exists',
      );
    }

    const user = await this.store.createUser({
      email: dto.email,
      phone: dto.phone,
      password_hash,
    });

    // Save consents and dispatch OTP in parallel to minimize registration latency
    const target = (dto.email ?? dto.phone)!;
    const purpose = dto.email ? 'verify_email' : 'verify_phone';

    const fullName = dto.fullName?.trim();
    const [, , otpResult] = await Promise.all([
      this.store.addConsent({
        user_id: user.id,
        purpose: 'terms',
        policy_version: '2026-10-04',
        granted: true,
        ip_address: ipAddress ?? null,
      }),
      this.store.addConsent({
        user_id: user.id,
        purpose: 'privacy',
        policy_version: '2026-10-04',
        granted: true,
        ip_address: ipAddress ?? null,
      }),
      this.sendOtp({ target, purpose }, user.id),
      fullName ? this.store.updateProfile(user.id, { full_name: fullName }) : null,
    ]);

    return {
      user: this.store.toUserSummary(user),
      message:
        'Account created successfully. A verification code has been sent.',
      target,
      devOtp: otpResult.devOtp,
    };
  }

  async sendOtp(
    dto: SendOtpDto,
    userId?: string | null,
  ): Promise<{
    success: boolean;
    message: string;
    target: string;
    devOtp?: string;
  }> {
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

    // If target is an email address and RESEND_API_KEY is configured, dispatch the real OTP email:
    if (dto.target.includes('@')) {
      sendOtpEmail(dto.target, rawOtp, dto.purpose).catch((err) => {
        console.warn(`[OTP EMAIL] Could not deliver OTP email to ${maskedTarget}:`, err?.message ?? err);
      });
    }

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
      throw new BadRequestException(
        'Invalid, expired, or non-existent OTP code',
      );
    }

    if (otp.attempts >= 5) {
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
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
  ): Promise<LoginResult> {
    const user = await this.store.findUserByIdentifier(dto.identifier);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    let isValid = false;
    try {
      isValid = Boolean(user.password_hash) && (await argon2.verify(user.password_hash, dto.password));
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    const [, tokens] = await Promise.all([
      this.store.updateUser(user.id, {
        last_login_at: new Date().toISOString(),
      }),
      this.issueTokens(user, meta),
    ]);

    // Record audit log asynchronously without blocking the login response
    void this.recordStaffLoginAudit(user.id, meta).catch(() => {});

    return {
      user: this.store.toUserSummary(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async recordStaffLoginAudit(
    userId: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<void> {
    if (!this.prisma) return;
    try {
      const roles = await this.prisma.user_roles.findMany({
        where: { user_id: userId },
      });
      if (roles && roles.length > 0) {
        await this.prisma.audit_logs.create({
          data: {
            actor_id: userId,
            action: 'staff.login',
            target_type: 'user',
            target_id: userId,
            details: {
              roles: roles.map((r) => r.role),
              userAgent: meta.userAgent ?? null,
            },
            ip_address: meta.ipAddress ?? null,
          },
        });
      }
    } catch (err: any) {
      console.warn('Could not record staff.login in audit_logs:', err?.message);
    }
  }

  async loginWithOtp(
    dto: LoginOtpDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<LoginResult> {
    const target = (dto.identifier || dto.email || dto.phone || '').trim();
    if (!target) {
      throw new BadRequestException('Phone number or email is required');
    }

    await this.verifyOtp({
      target,
      purpose: 'login',
      code: dto.code,
    });

    const isEmail = target.includes('@');
    let user = isEmail
      ? await this.store.findUserByEmail(target.toLowerCase())
      : await this.store.findUserByPhone(target);

    if (!user) {
      // Create user if not existing
      const dummyPassword = randomBytes(24).toString('hex');
      const password_hash = await argon2.hash(dummyPassword, ARGON2_OPTIONS);
      user = await this.store.createUser({
        email: isEmail ? target.toLowerCase() : undefined,
        phone: !isEmail ? target : undefined,
        password_hash,
      });
      if (isEmail) {
        await this.store.updateUser(user.id, {
          email_verified_at: new Date().toISOString(),
        });
      } else {
        await this.store.updateUser(user.id, {
          phone_verified_at: new Date().toISOString(),
        });
      }
    }

    const [, tokens] = await Promise.all([
      this.store.updateUser(user.id, {
        last_login_at: new Date().toISOString(),
      }),
      this.issueTokens(user, meta),
    ]);

    return {
      user: this.store.toUserSummary(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async socialLogin(
    dto: SocialLoginDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<LoginResult> {
    let resolvedEmail = dto.email ? dto.email.toLowerCase().trim() : undefined;
    let resolvedName = dto.name?.trim();
    let avatarUrl: string | undefined = dto.avatarUrl?.trim();

    // Decode Google / Microsoft / Apple ID Token / Credential payload if present
    const rawToken = dto.idToken || dto.credential;
    if (rawToken && typeof rawToken === 'string') {
      try {
        const parts = rawToken.split('.');
        if (parts.length === 3) {
          const payloadBuf = Buffer.from(parts[1], 'base64url');
          const payload = JSON.parse(payloadBuf.toString('utf8'));
          if (!resolvedEmail) {
            if (payload.email) {
              resolvedEmail = String(payload.email).toLowerCase().trim();
            } else if (payload.preferred_username) {
              resolvedEmail = String(payload.preferred_username).toLowerCase().trim();
            } else if (payload.upn) {
              resolvedEmail = String(payload.upn).toLowerCase().trim();
            }
          }
          if (!resolvedName) {
            if (payload.name) {
              resolvedName = String(payload.name).trim();
            } else if (payload.given_name || payload.family_name) {
              resolvedName = `${payload.given_name || ''} ${payload.family_name || ''}`.trim();
            }
          }
          if (!avatarUrl && payload.picture && typeof payload.picture === 'string') {
            avatarUrl = payload.picture;
          }
        }
      } catch {
        // Fall back to provided parameters if token parsing fails
      }
    }

    // If an OAuth access token was provided and email is still unresolved, query user info
    if (!resolvedEmail && dto.accessToken) {
      try {
        if (dto.provider === 'google') {
          const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${dto.accessToken}` },
          });
          if (resp.ok) {
            const info = (await resp.json()) as { email?: string; name?: string; picture?: string };
            if (info.email) resolvedEmail = String(info.email).toLowerCase().trim();
            if (info.name && !resolvedName) resolvedName = String(info.name).trim();
            if (info.picture && !avatarUrl) avatarUrl = String(info.picture);
          }
        } else if (dto.provider === 'microsoft') {
          const resp = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${dto.accessToken}` },
          });
          if (resp.ok) {
            const info = (await resp.json()) as { mail?: string; userPrincipalName?: string; displayName?: string };
            const msEmail = info.mail || info.userPrincipalName;
            if (msEmail) resolvedEmail = String(msEmail).toLowerCase().trim();
            if (info.displayName && !resolvedName) resolvedName = String(info.displayName).trim();
          }
        }
      } catch {
        // Non-fatal network fallback
      }
    }

    const providerEmail =
      resolvedEmail || `${dto.provider}.citizen@applyfields.in`;

    let user = await this.store.findUserByEmail(providerEmail);
    if (!user) {
      const dummyPassword = randomBytes(24).toString('hex');
      const password_hash = await argon2.hash(dummyPassword, ARGON2_OPTIONS);
      user = await this.store.createUser({
        email: providerEmail,
        password_hash,
      });
      const fullName =
        resolvedName ||
        `${dto.provider.charAt(0).toUpperCase() + dto.provider.slice(1)} Citizen`;
      await Promise.all([
        this.store.updateUser(user.id, {
          email_verified_at: new Date().toISOString(),
        }),
        this.store.updateProfile(user.id, {
          full_name: fullName,
          avatar_url: avatarUrl,
        }),
      ]);
    } else {
      // Ensure existing social user email is marked verified and profile name updated if available
      const updateData: { email_verified_at?: string } = {};
      if (!user.email_verified_at) {
        updateData.email_verified_at = new Date().toISOString();
      }
      if (Object.keys(updateData).length > 0) {
        await this.store.updateUser(user.id, updateData);
      }
      if (resolvedName || avatarUrl) {
        await this.store.updateProfile(user.id, {
          ...(resolvedName ? { full_name: resolvedName } : {}),
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        });
      }
    }

    const [, tokens] = await Promise.all([
      this.store.updateUser(user.id, {
        last_login_at: new Date().toISOString(),
      }),
      this.issueTokens(user, meta),
    ]);
    return {
      user: this.store.toUserSummary(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async registerPasskey(
    userId: string,
    _dto: PasskeyRegisterDto,
  ): Promise<{ success: boolean; message: string; user: UserSummary }> {
    const user = await this.store.findUserById(userId);
    if (!user || user.status !== 'active') {
      throw new NotFoundException('Citizen account not found');
    }

    const updated = await this.store.updateUser(user.id, {
      mfa_enabled: true,
    });

    return {
      success: true,
      message: 'Biometric passkey successfully registered for this account.',
      user: this.store.toUserSummary(updated || user),
    };
  }

  async passkeyLogin(
    dto: PasskeyLoginDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<LoginResult> {
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException(
        'Registered email or phone number is required to sign in with passkey',
      );
    }

    const identifier = dto.email.trim();
    const user = await this.store.findUserByIdentifier(identifier);

    if (!user || user.status !== 'active') {
      throw new NotFoundException(
        'No registered citizen account found with this email or phone. Please register first.',
      );
    }

    if (!user.mfa_enabled) {
      throw new BadRequestException(
        'This account has not set up a biometric passkey yet. Please sign in with your password or OTP first, then enable passkey in your account.',
      );
    }

    const [, tokens] = await Promise.all([
      this.store.updateUser(user.id, {
        last_login_at: new Date().toISOString(),
      }),
      this.issueTokens(user, meta),
    ]);
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
      throw new UnauthorizedException(
        'User account is suspended or no longer active',
      );
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

  async logoutAllForUser(userId: string): Promise<void> {
    await this.store.revokeAllSessionsForUser(userId);
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.verifyOtp({
      target: dto.target,
      purpose: 'reset_password',
      code: dto.code,
    });

    const user = await this.store.findUserByIdentifier(dto.target);
    if (!user) {
      throw new NotFoundException('No account found for this target');
    }

    const password_hash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.store.updateUser(user.id, { password_hash });
    // Revoke all sessions on password change
    await this.store.revokeAllSessionsForUser(user.id);

    return {
      success: true,
      message:
        'Password has been successfully reset. Please log in with your new password.',
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

    const accessTtl = process.env.JWT_ACCESS_TTL ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtAccessSecret(),
      expiresIn: accessTtl as any,
    });

    // Refresh token: 30 days random crypto token, stored only as a hash in user_sessions
    const refreshToken = randomBytes(40).toString('hex');
    const refresh_token_hash = this.hashToken(refreshToken);
    const expires_at = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

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
