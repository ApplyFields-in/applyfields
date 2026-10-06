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
  });

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

      const loginRes = await authService.login({
        identifier: 'user1@example.com',
        password: 'Password123!',
      });

      expect(loginRes.accessToken).toBeDefined();
      expect(loginRes.refreshToken).toBeDefined();

      // Refresh flow
      const refreshRes = await authService.refreshTokens(loginRes.refreshToken);
      expect(refreshRes.accessToken).toBeDefined();
      expect(refreshRes.newRefreshToken).toBeDefined();
      expect(refreshRes.newRefreshToken).not.toBe(loginRes.refreshToken);

      // Old refresh token must now be revoked
      await expect(authService.refreshTokens(loginRes.refreshToken)).rejects.toThrow();

      // Logout flow
      const logoutRes = await authService.logout(refreshRes.newRefreshToken);
      expect(logoutRes.success).toBe(true);

      // Logged out token cannot be used to refresh
      await expect(authService.refreshTokens(refreshRes.newRefreshToken)).rejects.toThrow();
    });

    it('should log in using phone number with and without country code', async () => {
      await authService.register({
        phone: '+919876543210',
        password: 'PhonePassword123!',
      });

      // Login with full international phone number (+919876543210)
      const resWithCode = await authService.login({
        identifier: '+919876543210',
        password: 'PhonePassword123!',
      });
      expect(resWithCode.accessToken).toBeDefined();
      expect(resWithCode.user.phone).toBe('+919876543210');

      // Login with local 10-digit phone number (9876543210)
      const resWithoutCode = await authService.login({
        identifier: '9876543210',
        password: 'PhonePassword123!',
      });
      expect(resWithoutCode.accessToken).toBeDefined();
      expect(resWithoutCode.user.phone).toBe('+919876543210');
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

  describe('Social and Passkey login', () => {
    it('should log in or register via social provider (google / apple)', async () => {
      const googleRes = await authService.socialLogin({
        provider: 'google',
        email: 'test.google@applyfields.in',
        name: 'Google User',
      });

      expect(googleRes.accessToken).toBeDefined();
      expect(googleRes.refreshToken).toBeDefined();
      expect(googleRes.user.email).toBe('test.google@applyfields.in');

      const appleRes = await authService.socialLogin({
        provider: 'apple',
      });
      expect(appleRes.accessToken).toBeDefined();
      expect(appleRes.user.email).toBe('apple.citizen@applyfields.in');
    });

    it('should log in or register via passkey', async () => {
      const passkeyRes = await authService.passkeyLogin({
        email: 'biometric@applyfields.in',
        credentialId: 'cred-12345',
      });

      expect(passkeyRes.accessToken).toBeDefined();
      expect(passkeyRes.refreshToken).toBeDefined();
      expect(passkeyRes.user.email).toBe('biometric@applyfields.in');
    });
  });
});
