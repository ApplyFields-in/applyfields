import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersStore } from '../users/users.store.js';

describe('AuthService', () => {
  let authService: AuthService;
  let store: UsersStore;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test_jwt_secret_key_32_characters_long_minimum',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [AuthService, UsersStore],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    store = module.get<UsersStore>(UsersStore);
  }, 30000);

  /** Signed-up accounts verify their email/phone once; mimic that for tests about later sign-ins. */
  const markVerified = async (identifier: string) => {
    const u = await store.findUserByIdentifier(identifier);
    await store.updateUser(u!.id, { email_verified_at: new Date().toISOString() });
  };
  /** login() result when a session was issued (fails the test if a code was asked instead). */
  const session = <T extends object>(r: T) => {
    if ('verificationRequired' in r) throw new Error('expected a session, got a code request');
    return r as Exclude<T, { verificationRequired: true }>;
  };

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(store).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user, save consents, and generate an OTP', async () => {
      const result = await authService.register({
        email: 'Citizen@Example.com',
        phone: '+919876543210',
        password: 'SecurePassword123!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('citizen@example.com'); // Lowercase rule
      expect(result.user.phone).toBe('+919876543210');

      // Verify consents saved (DPDP Act)
      const consents = await store.getConsentsForUser(result.user.id);
      expect(consents).toHaveLength(2);
      expect(consents.map((c) => c.purpose)).toContain('terms');
      expect(consents.map((c) => c.purpose)).toContain('privacy');

      // Verify password was hashed (never plain text)
      const user = await store.findUserById(result.user.id);
      expect(user?.password_hash).not.toBe('SecurePassword123!');
      expect(user?.password_hash).toMatch(/^\$argon2id\$/);
    });

    it('should reject registration if email already exists', async () => {
      await authService.register({
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

      await expect(
        authService.register({
          email: 'DUPLICATE@EXAMPLE.COM',
          password: 'Password123!',
        }),
      ).rejects.toThrow('already exists');
    });
  });

  describe('login and refresh token flow', () => {
    it('should log in with valid credentials, issue tokens, and refresh properly', async () => {
      await authService.register({
        email: 'user1@example.com',
        password: 'Password123!',
      });

      await markVerified('user1@example.com');
      const loginRes = session(await authService.login({
        identifier: 'user1@example.com',
        password: 'Password123!',
      }));

      expect(loginRes.accessToken).toBeDefined();
      expect(loginRes.refreshToken).toBeDefined();

      // Refresh flow
      const refreshRes = await authService.refreshTokens(loginRes.refreshToken);
      expect(refreshRes.accessToken).toBeDefined();
      expect(refreshRes.newRefreshToken).toBeDefined();
      expect(refreshRes.newRefreshToken).not.toBe(loginRes.refreshToken);

      // Old refresh token must now be revoked
      await expect(
        authService.refreshTokens(loginRes.refreshToken),
      ).rejects.toThrow();

      // Logout flow
      const logoutRes = await authService.logout(refreshRes.newRefreshToken);
      expect(logoutRes.success).toBe(true);

      // Logged out token cannot be used to refresh
      await expect(
        authService.refreshTokens(refreshRes.newRefreshToken),
      ).rejects.toThrow();
    });

    it('should log in using phone number with and without country code', async () => {
      await authService.register({
        phone: '+919876543210',
        password: 'PhonePassword123!',
      });

      // Login with full international phone number (+919876543210)
      await markVerified('+919876543210');
      const resWithCode = session(await authService.login({
        identifier: '+919876543210',
        password: 'PhonePassword123!',
      }));
      expect(resWithCode.accessToken).toBeDefined();
      expect(resWithCode.user.phone).toBe('+919876543210');

      // Login with local 10-digit phone number (9876543210)
      const resWithoutCode = session(await authService.login({
        identifier: '9876543210',
        password: 'PhonePassword123!',
      }));
      expect(resWithoutCode.accessToken).toBeDefined();
      expect(resWithoutCode.user.phone).toBe('+919876543210');
    });

    it('asks for a code only until the account is verified once', async () => {
      await authService.register({ email: 'firsttime@example.com', password: 'Password123!' });
      vi.spyOn(authService as any, 'generate6DigitOtp').mockReturnValue('246810');

      // Never verified (sign-up code skipped): password alone is not enough, a code is sent.
      const first = await authService.login({ identifier: 'firsttime@example.com', password: 'Password123!' });
      expect(first).toEqual({ verificationRequired: true, channel: 'email', sentTo: 'f***@example.com' });

      await authService.verifyPasswordLogin({ identifier: 'firsttime@example.com', password: 'Password123!', code: '246810' });

      // From now on: password only.
      const later = session(await authService.login({ identifier: 'firsttime@example.com', password: 'Password123!' }));
      expect(later.accessToken).toBeDefined();
      vi.restoreAllMocks();
    });

    it('should reject invalid password', async () => {
      await authService.register({
        email: 'user2@example.com',
        password: 'CorrectPassword!',
      });

      await expect(
        authService.login({
          identifier: 'user2@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow('Invalid email/phone or password');
    });
  });

  describe('OTP flow', () => {
    it('should reject invalid OTP codes up to 5 attempts', async () => {
      await authService.sendOtp({
        target: 'test@example.com',
        purpose: 'verify_email',
      });

      // Try 4 incorrect codes
      for (let i = 0; i < 4; i++) {
        await expect(
          authService.verifyOtp({
            target: 'test@example.com',
            purpose: 'verify_email',
            code: '000000',
          }),
        ).rejects.toThrow('Incorrect OTP code');
      }

      // 5th attempt triggers rate limit / max attempts
      await expect(
        authService.verifyOtp({
          target: 'test@example.com',
          purpose: 'verify_email',
          code: '000000',
        }),
      ).rejects.toThrow();
    });
  });

  describe('password + code login (staff)', () => {
    const claims = (jwt: string) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());

    it('needs both the password and the code, and only then issues an mfa session', async () => {
      await authService.register({ phone: '+919000000103', password: 'StaffPass123!' });
      vi.spyOn(authService as any, 'generate6DigitOtp').mockReturnValue('424242');

      await expect(
        authService.startPasswordLogin({ identifier: '9000000103', password: 'wrong' }),
      ).rejects.toThrow('Invalid email/phone or password');

      const start = await authService.startPasswordLogin({ identifier: '9000000103', password: 'StaffPass123!' });
      expect(start).toEqual({ channel: 'sms', sentTo: '******0103' });

      await expect(
        authService.verifyPasswordLogin({ identifier: '9000000103', password: 'StaffPass123!', code: '000000' }),
      ).rejects.toThrow('Incorrect OTP code');

      const res = await authService.verifyPasswordLogin({
        identifier: '9000000103', password: 'StaffPass123!', code: '424242',
      });
      expect(claims(res.accessToken).mfa).toBe(true);

      // mfa survives refresh; a password-only login never gets it
      const refreshed = await authService.refreshTokens(res.refreshToken);
      expect(claims(refreshed.accessToken).mfa).toBe(true);
      const plain = session(await authService.login({ identifier: '9000000103', password: 'StaffPass123!' }));
      expect(claims(plain.accessToken).mfa).toBeUndefined();
      vi.restoreAllMocks();
    });

    it('caps code requests per target (5 per 15 minutes)', async () => {
      for (let i = 0; i < 5; i++) {
        await authService.sendOtp({ target: 'limit@example.com', purpose: 'login' });
      }
      await expect(authService.sendOtp({ target: 'limit@example.com', purpose: 'login' })).rejects.toThrow(
        'Too many codes requested',
      );
    });
  });

  describe('Social and Passkey login', () => {
    const mockTokeninfo = (status: number, body: object) =>
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify(body), { status }) as any,
      );

    beforeEach(() => {
      process.env.GOOGLE_CLIENT_ID = 'web-client.apps.googleusercontent.com,android-client';
    });
    afterEach(() => {
      vi.restoreAllMocks();
      delete process.env.GOOGLE_CLIENT_ID;
    });

    it('never trusts an email sent by the client without a Google token', async () => {
      await expect(
        authService.socialLogin({ provider: 'google', email: 'super.admin@applyfields.com' }),
      ).rejects.toThrow('Google token is required');
    });

    it('rejects a token Google does not accept (forged / expired)', async () => {
      mockTokeninfo(400, { error: 'invalid_token' });
      await expect(
        authService.socialLogin({ provider: 'google', idToken: 'a.b.c', email: 'victim@x.com' }),
      ).rejects.toThrow('could not be verified');
    });

    it('rejects a valid Google token issued to another app', async () => {
      mockTokeninfo(200, { aud: 'someone-else', email: 'a@gmail.com', email_verified: 'true' });
      await expect(authService.socialLogin({ provider: 'google', idToken: 'a.b.c' })).rejects.toThrow(
        'could not be verified',
      );
    });

    it('signs in a verified Google user with an mfa session', async () => {
      mockTokeninfo(200, {
        aud: 'web-client.apps.googleusercontent.com',
        iss: 'https://accounts.google.com',
        email: 'Karthik.Candidate@gmail.com',
        email_verified: 'true',
        name: 'Karthik Candidate',
        picture: 'https://lh3.googleusercontent.com/a/avatar',
      });
      const res = await authService.socialLogin({ provider: 'google', idToken: 'a.b.c', email: 'ignored@x.com' });

      expect(res.user.email).toBe('karthik.candidate@gmail.com');
      const claims = JSON.parse(Buffer.from(res.accessToken.split('.')[1], 'base64url').toString());
      expect(claims.mfa).toBe(true);
      const profile = await store.getProfile(res.user.id);
      expect(profile?.full_name).toBe('Karthik Candidate');
    });

    it('keeps a blocked account out of Google and one-time-code login', async () => {
      const reg = await authService.register({ email: 'blocked@gmail.com', password: 'Password123!' });
      await store.updateUser(reg.user.id, { status: 'suspended' } as any);

      mockTokeninfo(200, { aud: 'web-client.apps.googleusercontent.com', email: 'blocked@gmail.com', email_verified: 'true' });
      await expect(authService.socialLogin({ provider: 'google', idToken: 'a.b.c' })).rejects.toThrow('not active');

      vi.spyOn(authService as any, 'generate6DigitOtp').mockReturnValue('135790');
      await authService.sendOtp({ target: 'blocked@gmail.com', purpose: 'login' });
      await expect(authService.loginWithOtp({ identifier: 'blocked@gmail.com', code: '135790' })).rejects.toThrow('not active');
    });

    it('accepts a popup access token whose azp is one of our client IDs', async () => {
      mockTokeninfo(200, { azp: 'android-client', email: 'pop@gmail.com', email_verified: 'true' });
      const res = await authService.socialLogin({ provider: 'google', accessToken: 'ya29.x' });
      expect(res.user.email).toBe('pop@gmail.com');
    });

    it('admin portal Google login never creates an account', async () => {
      mockTokeninfo(200, { aud: 'web-client.apps.googleusercontent.com', email: 'stranger@gmail.com', email_verified: 'true' });
      await expect(
        authService.socialLogin({ provider: 'google', idToken: 'a.b.c', existingOnly: true }),
      ).rejects.toThrow('No ApplyFields account');
      expect(await store.findUserByEmail('stranger@gmail.com')).toBeUndefined();
    });

    it('refuses providers we cannot verify yet', async () => {
      await expect(authService.socialLogin({ provider: 'apple', idToken: 'a.b.c' })).rejects.toThrow(
        'not available yet',
      );
    });

    it('refuses passkey sign-in until real WebAuthn exists (an email alone must never sign anyone in)', async () => {
      await authService.register({ email: 'registered.passkey@example.com', password: 'Password123!' });
      await expect(authService.passkeyLogin({ email: 'registered.passkey@example.com' } as any)).rejects.toThrow(
        'not available yet',
      );
    });
  });
});
