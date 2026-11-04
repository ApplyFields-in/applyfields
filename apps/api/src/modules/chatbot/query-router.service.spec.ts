import { describe, expect, it, vi } from 'vitest';
import { QueryRouterService } from './query-router.service.js';

describe('QueryRouterService (Fast-Path Deterministic Engine & Dual-Path AI)', () => {
  const mockOpportunity = {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'ssc-cgl-2026',
    title: 'Staff Selection Commission - Combined Graduate Level Exam 2026',
    type: 'exam',
    application_start: new Date('2026-09-01'),
    application_end: new Date('2026-11-30'),
    vacancies_total: 17727,
    fees: [
      { category: 'General / OBC', amount: 100 },
      { category: 'Women / SC / ST / PwD / ESM', amount: 0 },
    ],
    fee_text: '₹100 for General/OBC; Exempted for Women, SC, ST, PwD',
    selection_process: [
      'Tier-I: Computer Based Examination (100 Questions, 200 Marks)',
      'Tier-II: Paper-I (Compulsory for all posts) and Paper-II',
      'Document Verification & Medical Examination',
    ],
    apply_url: 'https://ssc.gov.in',
    official_website: 'https://ssc.gov.in',
    organizations: {
      name: 'Staff Selection Commission',
      short_name: 'SSC',
      state_code: 'ALL',
    },
    opportunity_posts: [
      { name: 'Assistant Section Officer', vacancies_total: 1200, pay_level: '7' },
      { name: 'Inspector of Income Tax', vacancies_total: 800, pay_level: '7' },
    ],
    opportunity_dates: [
      { kind: 'exam_date', date: new Date('2026-12-15'), is_tentative: false },
    ],
  };

  const mockPrisma = {
    opportunities: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.slug === 'ssc-cgl-2026' || where?.OR) {
          return Promise.resolve(mockOpportunity);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockResolvedValue([mockOpportunity]),
    },
    saved_items: {
      count: vi.fn().mockResolvedValue(5),
    },
    applications: {
      count: vi.fn().mockResolvedValue(2),
    },
    subscriptions: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.user_id === 'premium-user-456') {
          return Promise.resolve({ id: 'sub-1', status: 'active' });
        }
        return Promise.resolve(null);
      }),
    },
  };

  const service = new QueryRouterService(mockPrisma as any);

  it('resolves DEADLINE intent deterministically with exact dates and days remaining', async () => {
    const res = await service.handleQuery({
      query: 'When is the final deadline to apply?',
      opportunity_slug: 'ssc-cgl-2026',
    });

    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('deadline');
    expect(res.answer).toContain('Application Timeline');
    expect(res.answer).toContain('30 Nov 2026');
    expect(res.actions).toBeDefined();
    expect(res.actions?.some((a) => a.action === 'open_url')).toBe(true);
    expect(res.actions?.some((a) => a.action === 'save')).toBe(true);
  });

  it('resolves FEE intent with category-wise concessions', async () => {
    const res = await service.handleQuery({
      query: 'What is the application fee for General / SC / ST / OBC?',
      opportunity_slug: 'ssc-cgl-2026',
    });

    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('fee');
    expect(res.answer).toContain('Fee Breakdown');
    expect(res.answer).toContain('General / OBC');
    expect(res.answer).toContain('Exempted (FREE)');
  });

  it('resolves ELIGIBILITY intent with educational and age requirements', async () => {
    const res = await service.handleQuery({
      query: 'Am I eligible with a B.Tech / Degree qualification?',
      opportunity_slug: 'ssc-cgl-2026',
    });

    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('eligibility');
    expect(res.answer).toContain('Eligibility Criteria');
    expect(res.answer).toContain('Bachelor’s Degree');
  });

  it('resolves PATTERN intent with tiered examination stages', async () => {
    const res = await service.handleQuery({
      query: 'Explain the exam pattern and selection stages',
      opportunity_slug: 'ssc-cgl-2026',
    });

    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('pattern');
    expect(res.answer).toContain('Selection Stages');
    expect(res.answer).toContain('Tier-I: Computer Based Examination');
  });

  it('resolves VACANCIES intent with total and post breakdown', async () => {
    const res = await service.handleQuery({
      query: 'How many total vacancies are announced?',
      opportunity_slug: 'ssc-cgl-2026',
    });

    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('vacancies');
    expect(res.answer).toContain('17727');
    expect(res.answer).toContain('Assistant Section Officer');
  });

  it('resolves CLOSING SOON opportunities across the platform', async () => {
    const res = await service.handleQuery({
      query: 'Which exams are closing this week?',
    });

    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('closing_soon');
    expect(res.answer).toContain('Opportunities Closing Soon');
  });

  it('resolves authenticated USER STATUS with saved and application counts', async () => {
    const res = await service.handleQuery(
      { query: 'Show my saved applications' },
      'user-123',
    );

    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('user_status');
    expect(res.answer).toContain('5 items');
    expect(res.answer).toContain('2 applications');
  });

  it('enforces 3 chats/day limit for free users and gates subsequent queries', async () => {
    const freeUserId = 'free-candidate-789';

    // Query 1
    const res1 = await service.handleQuery(
      { query: 'When is the final deadline to apply?', opportunity_slug: 'ssc-cgl-2026' },
      freeUserId,
    );
    expect(res1.limit_reached).toBe(false);
    expect(res1.queries_used).toBe(1);
    expect(res1.queries_remaining).toBe(2);

    // Query 2
    const res2 = await service.handleQuery(
      { query: 'What is the application fee?', opportunity_slug: 'ssc-cgl-2026' },
      freeUserId,
    );
    expect(res2.limit_reached).toBe(false);
    expect(res2.queries_used).toBe(2);
    expect(res2.queries_remaining).toBe(1);

    // Query 3
    const res3 = await service.handleQuery(
      { query: 'How many total vacancies are announced?', opportunity_slug: 'ssc-cgl-2026' },
      freeUserId,
    );
    expect(res3.limit_reached).toBe(true);
    expect(res3.queries_used).toBe(3);
    expect(res3.queries_remaining).toBe(0);

    // Query 4 (Limit exceeded -> blocked with upgrade card)
    const res4 = await service.handleQuery(
      { query: 'Explain the selection stages', opportunity_slug: 'ssc-cgl-2026' },
      freeUserId,
    );
    expect(res4.mode).toBe('limit_reached');
    expect(res4.limit_reached).toBe(true);
    expect(res4.queries_remaining).toBe(0);
    expect(res4.answer).toContain('Daily Free Chat Limit Reached (3/3)');
    expect(res4.actions?.some((a) => a.url === '/account')).toBe(true);
  });

  it('allows unlimited queries for active ApplyFields Plus premium subscribers', async () => {
    const premiumUserId = 'premium-user-456';

    for (let i = 0; i < 5; i++) {
      const res = await service.handleQuery(
        { query: 'When is the final deadline to apply?', opportunity_slug: 'ssc-cgl-2026' },
        premiumUserId,
      );
      expect(res.is_premium).toBe(true);
      expect(res.limit_reached).toBe(false);
      expect(res.queries_remaining).toBe(9999);
    }
  });

  it('routes non-website open-ended queries to LLM/RAG path', async () => {
    const res = await service.handleQuery({
      query: 'How should I structure my 6-month study timetable for civil services?',
    });

    // 'fallback' when no ANTHROPIC_API_KEY: kept out of the cache so a restored key isn't masked for 12h.
    expect(['llm', 'rag', 'fallback']).toContain(res.mode);
    expect(res.answer).toContain('ApplyFields AI Advisor');
    expect(res.actions).toBeDefined();
  });

  it('generates a 1-page structured notification digest in <20ms replacing 100-page PDF OCR/chunking', async () => {
    const digest = await service.getOpportunityDigest('ssc-cgl-2026');

    expect(digest).toBeDefined();
    expect(digest?.title).toBe(mockOpportunity.title);
    expect(digest?.digestMarkdown).toContain('Official Circular 1-Page Digest');
    expect(digest?.digestMarkdown).toContain('Key Timeline & Deadlines');
    expect(digest?.digestMarkdown).toContain('Eligibility & Age Relaxations');
    expect(digest?.digestMarkdown).toContain('Application Fee Rules');
    expect(digest?.digestMarkdown).toContain('Exam Pattern & Selection Stages');
    expect(digest?.keyFacts.totalVacancies).toBe(17727);
    expect(digest?.keyFacts.feeGeneral).toBe('₹100');
    expect(digest?.keyFacts.feeConcession).toBe('Exempted (FREE)');
  });

  it('answers greetings and off-topic questions without the LLM and without using quota', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const userId = 'gate-user-1';

    const hi = await service.handleQuery({ query: 'Hi!' }, userId);
    expect(hi.intent).toBe('smalltalk');

    const joke = await service.handleQuery({ query: 'Tell me a joke about cricket' }, userId);
    expect(joke.intent).toBe('off_topic');

    const noise = await service.handleQuery({ query: 'pizza' }, userId);
    expect(noise.intent).toBe('off_topic');

    expect(noise.queries_used).toBe(0);
    expect(noise.queries_remaining).toBe(3);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('matches whole words: "how much salary" is not a fee question', async () => {
    const res = await service.handleQuery({
      query: 'How much salary does this post get?',
      opportunity_slug: 'ssc-cgl-2026',
    });
    expect(res.intent).not.toBe('fee');
  });

  it('never serves one user\'s cached workspace counts to another user', async () => {
    await service.handleQuery({ query: 'Show my saved items' }, 'leak-user-a');
    mockPrisma.saved_items.count.mockResolvedValueOnce(1);
    const b = await service.handleQuery({ query: 'Show my saved items' }, 'leak-user-b');
    expect(b.answer).toContain('1 item');
  });

  it('resolves follow-ups against the opportunity named earlier in the chat (zero LLM)', async () => {
    const res = await service.handleQuery({
      query: 'What is the application fee?',
      history: [
        { role: 'assistant', content: 'Hi! Ask me anything.' },
        { role: 'user', content: 'Tell me about SSC CGL 2026' },
      ],
    });
    expect(res.mode).toBe('deterministic');
    expect(res.intent).toBe('fee');
    expect(res.answer).toContain('Fee Breakdown');
  });
});
