import { describe, expect, it, vi } from 'vitest';
import {
  CommunityService,
  createCommentSchema,
  createThreadSchema,
  reportContentSchema,
  resolveReportSchema,
  toggleUpvoteSchema,
} from './community.service.js';

describe('Community Schemas Validation', () => {
  describe('createThreadSchema', () => {
    it('validates a complete discussion thread', () => {
      const input = {
        title: 'TSPSC Group 1 Mains Exam Center List Out',
        content: 'Candidates can now check their assigned examination centers across Hyderabad and Warangal.',
        category: 'admit_card',
        author_name: 'Vikram Rao',
      };
      const parsed = createThreadSchema.parse(input);
      expect(parsed.title).toBe('TSPSC Group 1 Mains Exam Center List Out');
      expect(parsed.category).toBe('admit_card');
      expect(parsed.author_name).toBe('Vikram Rao');
    });

    it('rejects short title or content', () => {
      expect(() =>
        createThreadSchema.parse({
          title: 'Hi',
          content: 'Hello',
        }),
      ).toThrow();
    });
  });

  describe('createCommentSchema', () => {
    it('validates a comment reply', () => {
      const parsed = createCommentSchema.parse({
        content: 'Is biometric attendance compulsory at the examination venue?',
        author_name: 'Priya',
      });
      expect(parsed.content).toContain('biometric');
      expect(parsed.author_name).toBe('Priya');
    });

    it('rejects empty content', () => {
      expect(() => createCommentSchema.parse({ content: ' ' })).toThrow();
    });
  });

  describe('toggleUpvoteSchema', () => {
    it('validates thread upvote', () => {
      const parsed = toggleUpvoteSchema.parse({
        thread_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      });
      expect(parsed.thread_id).toBe('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
    });

    it('rejects both thread_id and comment_id provided', () => {
      expect(() =>
        toggleUpvoteSchema.parse({
          thread_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          comment_id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        }),
      ).toThrow();
    });
  });

  describe('reportContentSchema & resolveReportSchema', () => {
    it('validates reporting content', () => {
      const parsed = reportContentSchema.parse({
        item_type: 'opportunity',
        item_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        reason: 'incorrect_info',
        details: 'The official last date was extended by 5 days on the department website.',
      });
      expect(parsed.reason).toBe('incorrect_info');
    });

    it('validates resolving report', () => {
      const parsed = resolveReportSchema.parse({
        status: 'resolved',
        resolution_note: 'Verified against gazette notification. Information corrected.',
        action: 'hide',
      });
      expect(parsed.status).toBe('resolved');
      expect(parsed.action).toBe('hide');
    });
  });
});

describe('CommunityService Integration Logic', () => {
  it('lists threads with opportunities joined and counts', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockImplementation((queryParts: any) => {
        const queryStr = (
          queryParts?.text ||
          queryParts?.sql ||
          (queryParts?.strings ? queryParts.strings.join('') : '') ||
          String(queryParts)
        ).toLowerCase();

        if (queryStr.includes('count(*)::int as count')) {
          return Promise.resolve([{ count: 1 }]);
        }
        if (queryStr.includes('from community_threads')) {
          return Promise.resolve([
            {
              id: 'thread-1',
              opportunity_id: 'opp-1',
              opportunity_title: 'UPSC Civil Services 2026',
              opportunity_slug: 'upsc-civil-services-2026',
              category: 'exam_prep',
              user_id: 'user-1',
              author_name: 'Sneha Reddy',
              title: 'Best strategy for GS Paper 1 History section?',
              content: 'Should we prioritize ancient history NCERTs or Tamil Nadu board textbooks?',
              is_pinned: true,
              is_locked: false,
              is_hidden: false,
              view_count: 42,
              upvotes_count: 15,
              replies_count: 5,
              created_at: new Date('2026-10-12T10:00:00Z'),
              updated_at: new Date('2026-10-12T10:00:00Z'),
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      $executeRaw: vi.fn().mockResolvedValue(1),
    };

    const service = new CommunityService(mockPrisma as any);
    const result = await service.listThreads({});
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('thread-1');
    expect(result.items[0].opportunity_title).toBe('UPSC Civil Services 2026');
    expect(result.items[0].is_pinned).toBe(true);
  });

  it('creates a discussion thread', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockImplementation((queryParts: any) => {
        const queryStr = (
          queryParts?.text ||
          queryParts?.sql ||
          (queryParts?.strings ? queryParts.strings.join('') : '') ||
          String(queryParts)
        ).toLowerCase();

        if (queryStr.includes('from profiles')) {
          return Promise.resolve([{ full_name: 'Anil Kumar' }]);
        }
        if (queryStr.includes('from opportunities')) {
          return Promise.resolve([{ title: 'SSC CGL 2026', slug: 'ssc-cgl-2026' }]);
        }
        if (queryStr.includes('insert into community_threads')) {
          return Promise.resolve([
            {
              id: 'thread-new',
              opportunity_id: 'opp-1',
              category: 'admit_card',
              user_id: 'user-1',
              author_name: 'Anil Kumar',
              title: 'Admit Card Download Link Active',
              content: 'Candidates can now download tier 1 admit cards from regional SSC portals.',
              is_pinned: false,
              is_locked: false,
              is_hidden: false,
              view_count: 0,
              upvotes_count: 0,
              replies_count: 0,
              created_at: new Date('2026-10-12T12:00:00Z'),
              updated_at: new Date('2026-10-12T12:00:00Z'),
            },
          ]);
        }
        return Promise.resolve([]);
      }),
    };

    const service = new CommunityService(mockPrisma as any);
    const result = await service.createThread('user-1', {
      title: 'Admit Card Download Link Active',
      content: 'Candidates can now download tier 1 admit cards from regional SSC portals.',
      category: 'admit_card',
      opportunity_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    });

    expect(result.id).toBe('thread-new');
    expect(result.author_name).toBe('Anil Kumar');
    expect(result.category).toBe('admit_card');
  });
});
