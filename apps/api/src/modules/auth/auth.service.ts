import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomInt } from 'node:crypto';
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
import { sendOtpSms } from '../notifications/sms.js';

// Internal type — includes tokens so the controller can set cookies. Never sent to clients.
type LoginResult = { user: UserSummary; accessToken: string; refreshToken: string };

/** Password was right but the account never verified its email/phone: a one-time code was sent instead of a session. */
export type VerificationRequired = { verificationRequired: true; channel: 'email' | 'sms'; sentTo: string };

/** Refresh sessions slide: every refresh starts a new window, so an active user stays signed in until they sign out. */
export const SESSION_DAYS = 180;

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
    return randomInt(100000, 1000000).toString();
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
    // Each code allows 5 guesses; capping sends stops "request a fresh code" brute force and SMS pumping.
    // ponytail: per-target limit only; add per-IP + Turnstile when public SMS goes live.
    const recent = await this.store.countOtpsSince(dto.target, new Date(Date.now() - 15 * 60 * 1000));
    if (recent >= 5) {
      throw new HttpException(
        'Too many codes requested. Please wait 15 minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

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

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(
        `\x1b[36m[DEV OTP]\x1b[0m Generated code for \x1b[33m${maskedTarget}\x1b[0m (${dto.purpose}): \x1b[32m\x1b[1m${rawOtp}\x1b[0m (valid for 10m)`,
      );
    }

    // Real delivery when the provider is configured (Resend for email, MSG91 for SMS).
    const delivery = dto.target.includes('@')
      ? sendOtpEmail(dto.target, rawOtp, dto.purpose)
      : sendOtpSms(dto.target, rawOtp);
    delivery.catch((err) => {
      console.warn(`[OTP] Could not deliver code to ${maskedTarget}:`, err?.message ?? err);
    });

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

  private async checkPassword(identifier: string, password: string) {
    const user = await this.store.findUserByIdentifier(identifier);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    let isValid = false;
    try {
      isValid = Boolean(user.password_hash) && (await argon2.verify(user.password_hash, password));
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }
    return user;
  }

  /** The code goes to the same channel the user signed in with: email → inbox, phone → SMS. */
  private codeTarget(identifier: string, user: { email: string | null; phone: string | null }): string {
    const target = identifier.includes('@') ? user.email : user.phone;
    if (!target) throw new BadRequestException('No email or phone on this account to send a code to');
    return target;
  }

  /** Sends a 6-digit login code to the channel the user signed in with. devOtp stays in the dev API console. */
  private async sendLoginCode(identifier: string, user: { id: string; email: string | null; phone: string | null }) {
    const target = this.codeTarget(identifier, user);
    await this.sendOtp({ target, purpose: 'login' }, user.id);
    const sentTo = target.includes('@')
      ? target.replace(/(^.).+(?=@)/, '$1***')
      : target.replace(/^.*(\d{4})$/, '******$1');
    return { channel: (target.includes('@') ? 'email' : 'sms') as 'email' | 'sms', sentTo };
  }

  /** Staff (admin portal) step 1: always password + code. No tokens yet. */
  async startPasswordLogin(dto: LoginDto): Promise<{ channel: 'email' | 'sms'; sentTo: string }> {
    const user = await this.checkPassword(dto.identifier, dto.password);
    return this.sendLoginCode(dto.identifier, user);
  }

  /** Step 2: password and code are checked together, so there is no half-logged-in state to store. */
  async verifyPasswordLogin(
    dto: LoginDto & { code: string },
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<LoginResult> {
    const user = await this.checkPassword(dto.identifier, dto.password);
    await this.verifyOtp({ target: this.codeTarget(dto.identifier, user), purpose: 'login', code: dto.code });
    // The code proved this email/phone, so later password sign-ins won't ask again.
    const now = new Date().toISOString();
    await this.store.updateUser(
      user.id,
      dto.identifier.includes('@') ? { email_verified_at: now } : { phone_verified_at: now },
    );

    const [, tokens] = await Promise.all([
      this.store.updateUser(user.id, { last_login_at: new Date().toISOString() }),
      this.issueTokens(user, meta, true),
    ]);
    void this.recordStaffLoginAudit(user.id, meta).catch(() => {});

    return {
      user: this.store.toUserSummary(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Citizen/partner password sign-in. The code is asked only once: accounts that verified their
   * email or phone (at sign-up, via a code login or Google) get a session straight away.
   */
  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<LoginResult | VerificationRequired> {
    const user = await this.checkPassword(dto.identifier, dto.password);
    if (!user.email_verified_at && !user.phone_verified_at) {
      return { verificationRequired: true, ...(await this.sendLoginCode(dto.identifier, user)) };
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

    // Blocked/suspended accounts stay out whichever way they sign in (password login checks this too).
    if (user && user.status !== 'active') {
      throw new UnauthorizedException('This account is not active. Contact ApplyFields support.');
    }

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

  /**
   * Checks a Google ID token (Sign-In button) or access token (popup flow) with Google's tokeninfo
   * endpoint, which validates signature + expiry, then checks it was issued to one of our client IDs.
   * GOOGLE_CLIENT_ID may hold several IDs (web, Android, iOS) separated by commas.
   */
  private async verifyGoogleToken(
    dto: SocialLoginDto,
  ): Promise<{ email: string; name?: string; picture?: string }> {
    if (dto.provider !== 'google') {
      throw new BadRequestException(`${dto.provider} sign-in is not available yet`);
    }
    const clientIds = (process.env.GOOGLE_CLIENT_ID ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (clientIds.length === 0) {
      throw new ServiceUnavailableException('Google sign-in is not configured on the server');
    }

    const idToken = dto.idToken || dto.credential;
    const query = idToken
      ? `id_token=${encodeURIComponent(idToken)}`
      : dto.accessToken
        ? `access_token=${encodeURIComponent(dto.accessToken)}`
        : null;
    if (!query) throw new BadRequestException('Google token is required');

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?${query}`).catch(() => null);
    if (!res) throw new ServiceUnavailableException('Could not reach Google to verify sign-in');
    if (!res.ok) throw new UnauthorizedException('Google sign-in could not be verified');

    const info = (await res.json()) as {
      aud?: string; azp?: string; iss?: string; email?: string;
      email_verified?: string | boolean; name?: string; picture?: string;
    };
    const ourClient = clientIds.includes(info.aud ?? '') || clientIds.includes(info.azp ?? '');
    const issuerOk = !info.iss || info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
    const verified = info.email_verified === true || info.email_verified === 'true';
    if (!ourClient || !issuerOk || !info.email || !verified) {
      throw new UnauthorizedException('Google sign-in could not be verified');
    }
    return { email: info.email.toLowerCase().trim(), name: info.name, picture: info.picture };
  }

  async socialLogin(
    dto: SocialLoginDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<LoginResult> {
    // Never trust an email sent by the browser: only an identity Google has verified for our client ID.
    const google = await this.verifyGoogleToken(dto);
    const providerEmail = google.email;
    const resolvedName = (google.name ?? dto.name)?.trim();
    const avatarUrl = (google.picture ?? dto.avatarUrl)?.trim();

    let user = await this.store.findUserByEmail(providerEmail);
    if (!user && dto.existingOnly) {
      throw new UnauthorizedException('No ApplyFields account uses this Google email.');
    }
    // Blocked/suspended accounts stay out whichever way they sign in (password login checks this too).
    if (user && user.status !== 'active') {
      throw new UnauthorizedException('This account is not active. Contact ApplyFields support.');
    }
    if (!user) {
      const dummyPassword = randomBytes(24).toString('hex');
      const password_hash = await argon2.hash(dummyPassword, ARGON2_OPTIONS);
      user = await this.store.createUser({
        email: providerEmail,
        password_hash,
      });
      const fullName =
        resolvedName ||
        'Google Citizen';
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
      this.issueTokens(user, meta, true),
    ]);
    return {
      user: this.store.toUserSummary(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ponytail: there is no real WebAuthn check yet; the old version signed anyone in from an email
  // alone. Both stay off until passkeys verify a signed challenge against a stored public key.
  async registerPasskey(
    _userId: string,
    _dto: PasskeyRegisterDto,
  ): Promise<{ success: boolean; message: string; user: UserSummary }> {
    throw new BadRequestException('Passkeys are not available yet.');
  }

  async passkeyLogin(
    _dto: PasskeyLoginDto,
    _meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<LoginResult> {
    throw new BadRequestException('Passkey sign-in is not available yet. Please use your password or Google.');
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

    const tokens = await this.issueTokens(user, meta, rawRefreshToken.startsWith('m.'));
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

  /** `mfa` = signed in with password + code, or a verified Google account. StaffGuard requires it. */
  private async issueTokens(
    user: { id: string; email: string | null; phone: string | null },
    meta: { userAgent?: string; ipAddress?: string },
    mfa = false,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      ...(mfa ? { mfa: true } : {}),
    };

    const accessTtl = process.env.JWT_ACCESS_TTL ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtAccessSecret(),
      expiresIn: accessTtl as any,
    });

    // Refresh token: 30 days random crypto token, stored only as a hash in user_sessions
    // The "m." prefix carries mfa through refresh; only the hash is stored, so it can't be forged.
    const refreshToken = (mfa ? 'm.' : '') + randomBytes(40).toString('hex');
    const refresh_token_hash = this.hashToken(refreshToken);
    const expires_at = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
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
