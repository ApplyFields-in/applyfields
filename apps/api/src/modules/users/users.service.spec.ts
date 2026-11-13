import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { UsersService } from './users.service.js';
import type { UsersStore } from './users.store.js';
import type { StorageService } from '../../common/storage.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let mockStore: Record<string, ReturnType<typeof vi.fn>>;
  let mockStorageService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    mockStore = {
      findUserById: vi.fn(),
      getProfile: vi.fn(),
      getUserEducation: vi.fn(),
      listSessionsForUser: vi.fn(),
      revokeSession: vi.fn(),
      revokeOtherSessionsForUser: vi.fn(),
      getSavedItems: vi.fn(),
      getApplications: vi.fn(),
      getUserDocuments: vi.fn(),
      findLatestValidOtp: vi.fn(),
      markOtpUsed: vi.fn(),
      incrementOtpAttempt: vi.fn(),
      deleteUserAccount: vi.fn(),
      findPublicProfileByHandle: vi.fn(),
      getExamScores: vi.fn(),
      createExamScore: vi.fn(),
      updateExamScore: vi.fn(),
      deleteExamScore: vi.fn(),
      findUserByEmail: vi.fn(),
      findUserByPhone: vi.fn(),
      saveOtp: vi.fn(),
      updateUser: vi.fn(),
      exportUserData: vi.fn(),
    };

    mockStorageService = {
      getPublicUrl: vi.fn(),
      upload: vi.fn(),
    };

    service = new UsersService(
      mockStore as unknown as UsersStore,
      mockStorageService as unknown as StorageService,
    );
  });

  describe('Sessions Management', () => {
    it('lists user sessions with current session flagged', async () => {
      mockStore.listSessionsForUser.mockResolvedValue([
        { id: 'sess-1', user_id: 'u-1', user_agent: 'Chrome', ip_address: '1.1.1.1', created_at: new Date().toISOString(), last_active_at: new Date().toISOString(), isCurrent: true },
        { id: 'sess-2', user_id: 'u-1', user_agent: 'Safari', ip_address: '2.2.2.2', created_at: new Date().toISOString(), last_active_at: new Date().toISOString(), isCurrent: false },
      ]);

      const result = await service.listSessions('u-1', 'sess-1');
      expect(result).toHaveLength(2);
      expect(result[0].isCurrent).toBe(true);
      expect(result[1].isCurrent).toBe(false);
      expect(mockStore.listSessionsForUser).toHaveBeenCalledWith('u-1', 'sess-1');
    });

    it('revokes a single session', async () => {
      mockStore.revokeSession.mockResolvedValue(true);
      const res = await service.revokeSession('sess-2');
      expect(res).toEqual({ success: true });
      expect(mockStore.revokeSession).toHaveBeenCalledWith('sess-2');
    });

    it('logs out all other sessions', async () => {
      mockStore.revokeOtherSessionsForUser.mockResolvedValue(true);
      const res = await service.revokeOtherSessions('u-1', 'sess-1');
      expect(res).toEqual({ success: true });
      expect(mockStore.revokeOtherSessionsForUser).toHaveBeenCalledWith('u-1', 'sess-1');
    });
  });

  describe('Data Export (DPDP compliance)', () => {
    it('returns structured personal data export from store', async () => {
      const mockExport = {
        platform: 'applyfields',
        exported_at: new Date().toISOString(),
        compliance: 'DPDP Act 2023',
        account: {
          id: 'u-1',
          email: 'test@example.com',
          phone: '9999999999',
          status: 'active',
          created_at: new Date().toISOString(),
        },
        profile: { id: 'u-1', full_name: 'Karthik Rao' },
        education: [{ id: 'edu-1', degree: 'B.Tech' }],
        saved_items: [{ id: 'save-1', item_id: 'job-1' }],
        applications: [{ id: 'app-1', status: 'submitted' }],
        documents: [{ id: 'doc-1', document_type: 'resume' }],
        exam_scores: [{ id: 'score-1', exam_name: 'GATE' }],
      };
      mockStore.exportUserData.mockResolvedValue(mockExport);

      const res = await service.exportUserData('u-1');
      expect(res.account.email).toBe('test@example.com');
      expect(res.profile?.full_name).toBe('Karthik Rao');
      expect(res.education).toHaveLength(1);
      expect(res.saved_items).toHaveLength(1);
      expect(res.applications).toHaveLength(1);
      expect(res.documents).toHaveLength(1);
      expect(res.exam_scores).toHaveLength(1);
      expect(res.exported_at).toBeDefined();
    });
  });

  describe('Account Erasure', () => {
    it('verifies password and erases account', async () => {
      const hashed = await argon2.hash('SecretPass123!');
      mockStore.findUserById.mockResolvedValue({ id: 'u-1', password_hash: hashed, email: 'user@example.com' });
      mockStore.deleteUserAccount.mockResolvedValue(true);

      const res = await service.deleteUserAccount('u-1', { password: 'SecretPass123!' });
      expect(res.success).toBe(true);
      expect(mockStore.deleteUserAccount).toHaveBeenCalledWith('u-1');
    });

    it('rejects deletion on incorrect password', async () => {
      const hashed = await argon2.hash('SecretPass123!');
      mockStore.findUserById.mockResolvedValue({ id: 'u-1', password_hash: hashed });

      await expect(
        service.deleteUserAccount('u-1', { password: 'WrongPassword' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('verifies OTP code when code is supplied', async () => {
      const codeHash = createHash('sha256').update('123456').digest('hex');
      mockStore.findUserById.mockResolvedValue({ id: 'u-1', password_hash: 'hash', email: 'otp@example.com' });
      mockStore.findLatestValidOtp.mockResolvedValue({ id: 'otp-1', code_hash: codeHash });
      mockStore.deleteUserAccount.mockResolvedValue(true);

      const res = await service.deleteUserAccount('u-1', { code: '123456' });
      expect(res.success).toBe(true);
      expect(mockStore.markOtpUsed).toHaveBeenCalledWith('otp-1');
      expect(mockStore.deleteUserAccount).toHaveBeenCalledWith('u-1');
    });
  });

  describe('Public Profile', () => {
    it('throws NotFoundException if handle does not exist or is private', async () => {
      mockStore.findPublicProfileByHandle.mockResolvedValue(null);
      await expect(service.getPublicProfile('nobody')).rejects.toThrow(NotFoundException);
    });

    it('returns filtered public profile data for a public handle', async () => {
      mockStore.findPublicProfileByHandle.mockResolvedValue({
        profile: {
          id: 'u-1',
          full_name: 'Suresh Kumar',
          handle: 'suresh',
          is_public: true,
          avatar_url: null,
          target_role: 'Civil Engineer',
          special_conditions: ['AutoCAD', 'STAAD.Pro'],
        },
        education: [
          { id: 'ed-1', degree: 'B.Tech Civil', institution_name: 'IIT Hyderabad' },
        ],
        examScores: [
          { id: 'sc-1', exam_name: 'GATE 2024', score: '780', percentile: '99.1' },
        ],
        user: { created_at: new Date('2024-01-01'), email_verified_at: '2024-01-01T00:00:00Z' },
      });

      const res = await service.getPublicProfile('suresh');
      expect(res.handle).toBe('suresh');
      expect(res.fullName).toBe('Suresh Kumar');
      expect(res.examScores).toHaveLength(1);
      expect(res.highestDegree).toBe('B.Tech Civil');
      expect(res.isVerified).toBe(true);
    });
  });

  describe('Competitive Exam Scores', () => {
    it('creates a new exam score', async () => {
      mockStore.createExamScore.mockResolvedValue({
        id: 'score-1',
        user_id: 'u-1',
        exam_type: 'upsc_cse',
        exam_name: 'UPSC CSE',
        year: 2026,
        score: '112',
      });

      const res = await service.addExamScore('u-1', {
        exam_type: 'upsc_cse',
        exam_name: 'UPSC CSE',
        year: 2026,
        score: '112',
      });
      expect(res.id).toBe('score-1');
      expect(mockStore.createExamScore).toHaveBeenCalledWith('u-1', {
        exam_type: 'upsc_cse',
        exam_name: 'UPSC CSE',
        year: 2026,
        score: '112',
      });
    });

    it('updates an existing exam score', async () => {
      mockStore.updateExamScore.mockResolvedValue({ id: 'score-1', user_id: 'u-1', exam_name: 'GATE', score: '125' });

      const res = await service.updateExamScore('score-1', 'u-1', { score: '125' });
      expect(res.score).toBe('125');
    });

    it('throws NotFoundException when update returns null', async () => {
      mockStore.updateExamScore.mockResolvedValue(null);
      await expect(
        service.updateExamScore('score-1', 'u-1', { score: '125' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Change Contact Flow (Email / Phone)', () => {
    it('disallows starting change to an email already registered', async () => {
      mockStore.findUserByEmail.mockResolvedValue({ id: 'u-2', email: 'taken@example.com' });
      await expect(
        service.startChangeContact('u-1', { type: 'email', value: 'taken@example.com' }),
      ).rejects.toThrow('This email is already registered to another account.');
    });

    it('generates and stores OTP for a new email', async () => {
      mockStore.findUserByEmail.mockResolvedValue(null);
      mockStore.saveOtp.mockResolvedValue(true);

      const res = await service.startChangeContact('u-1', { type: 'email', value: 'new@example.com' });
      expect(res.success).toBe(true);
      expect(mockStore.saveOtp).toHaveBeenCalled();
    });

    it('verifies OTP and updates contact', async () => {
      const codeHash = createHash('sha256').update('123456').digest('hex');
      mockStore.findLatestValidOtp.mockResolvedValue({ id: 'otp-1', code_hash: codeHash });
      mockStore.updateUser.mockResolvedValue({ id: 'u-1', email: 'new@example.com' });

      const res = await service.verifyChangeContact('u-1', {
        type: 'email',
        value: 'new@example.com',
        code: '123456',
      });

      expect(res.success).toBe(true);
      expect(mockStore.markOtpUsed).toHaveBeenCalledWith('otp-1');
      expect(mockStore.updateUser).toHaveBeenCalledWith('u-1', expect.objectContaining({
        email: 'new@example.com',
      }));
    });
  });
});
