import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ChatbotAction, ChatbotQueryInput, ChatbotQueryResponse } from '@applyfields/types';
import { NotificationDigestService, type OpportunityDigest } from './notification-digest.service.js';
import { SemanticCacheService } from './semantic-cache.service.js';
import { ChatbotAnalyticsService } from './chatbot-analytics.service.js';
import { GuidanceService } from '../guidance/guidance.service.js';

const logger = new Logger('QueryRouterService');

export const FREE_DAILY_LIMIT = 3;
const LLM_MODEL = 'claude-haiku-5-5';

/** Whole-word/phrase match, so "fee" doesn't hit "coffee" and "cost" doesn't hit "costume". */
function hasAny(q: string, terms: string[]): boolean {
  return terms.some((t) =>
    new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`).test(q),
  );
}

const SMALLTALK =
  /^(hi+|hello|hey|hlo|namaste|namaskar|good (morning|afternoon|evening|night)|thanks?( you)?|thank u|thx|ty|ok(ay)?|cool|nice|great|bye|good ?bye|who are you|what can you do|help)[\s!.?]*$/;

// ponytail: keyword vocab, not an embedding classifier. Add terms when admin "unanswered" logs show misses.
const DOMAIN_TERMS = [
  'job', 'jobs', 'exam', 'exams', 'recruitment', 'vacancy', 'vacancies', 'notification', 'post', 'posts',
  'govt', 'government', 'sarkari', 'apply', 'application', 'applications', 'admission', 'admissions',
  'scholarship', 'scholarships', 'college', 'colleges', 'university', 'course', 'courses', 'degree',
  'career', 'careers', 'roadmap', 'syllabus', 'eligible', 'eligibility', 'qualification', 'fee', 'fees',
  'deadline', 'deadlines', 'last date', 'result', 'results', 'admit card', 'hall ticket', 'answer key',
  'cutoff', 'cut off', 'salary', 'stipend', 'study', 'studies', 'prepare', 'preparation', 'coaching',
  'interview', 'internship', 'apprentice', 'officer', 'clerk', 'teacher', 'engineer', 'doctor', 'nurse',
  'upsc', 'ssc', 'rrb', 'ibps', 'sbi', 'rbi', 'lic', 'gate', 'cat', 'neet', 'jee', 'nda', 'cds', 'afcat',
  'capf', 'cuet', 'psc', 'appsc', 'tspsc', 'tet', 'ctet', 'eamcet', 'ias', 'ips', 'railway', 'railways',
  'bank', 'banking', 'police', 'defence', 'army', 'navy', 'air force', 'psu', 'pan', 'aadhaar', 'aadhar',
  'passport', 'certificate', 'caste', 'income', 'ration card', 'voter', 'meeseva', 'csc', 'kiosk',
  '10th', '12th', 'inter', 'intermediate', 'ssc board', 'b.tech', 'btech', 'b.sc', 'bsc', 'b.com', 'bcom',
  'ba', 'ma', 'mba', 'mca', 'bca', 'mbbs', 'b.pharm', 'diploma', 'iti', 'polytechnic', 'graduate',
  'graduation', 'engineering', 'medical', 'student', 'marks', 'rank', 'document', 'documents', 'saved',
  'booking', 'age limit', 'pattern', 'selection', 'tier', 'mock test', 'previous papers',
];

const OFF_TOPIC_TERMS = [
  'joke', 'jokes', 'poem', 'song', 'songs', 'lyrics', 'movie', 'movies', 'film', 'web series', 'recipe',
  'cook', 'weather', 'cricket', 'ipl', 'football', 'match score', 'girlfriend', 'boyfriend', 'dating',
  'horoscope', 'astrology', 'bitcoin', 'crypto', 'stock tip', 'write code', 'python code', 'javascript',
  'program to', 'translate', 'story', 'game', 'games', 'meme', 'celebrity', 'actor', 'actress', 'riddle',
];

/** Questions that must never reach the LLM: greetings and clearly off-topic chatter. */
export function classifyRelevance(q: string, hasPageContext: boolean): 'smalltalk' | 'off_topic' | 'relevant' {
  if (SMALLTALK.test(q)) return 'smalltalk';
  if (hasAny(q, DOMAIN_TERMS)) return 'relevant';
  if (hasAny(q, OFF_TOPIC_TERMS)) return 'off_topic';
  // Short context-free noise ("pizza", "asdf"). On an opportunity page, a short question is about that page.
  if (!hasPageContext && q.split(/\s+/).length <= 3) return 'off_topic';
  return 'relevant';
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return 'Not announced yet';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const target = new Date(d).getTime();
  const now = Date.now();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

/** Start of today in IST (UTC+5:30): free chats reset at 12:00 AM IST. */
export function istMidnight(now = Date.now()): Date {
  const IST_MS = 5.5 * 3_600_000;
  const d = new Date(now + IST_MS);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - IST_MS);
}

@Injectable()
export class QueryRouterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly digestService: NotificationDigestService = new NotificationDigestService(),
    private readonly cacheService: SemanticCacheService = new SemanticCacheService(),
    private readonly analyticsService: ChatbotAnalyticsService = new ChatbotAnalyticsService(prisma),
  ) {}

  getCacheService(): SemanticCacheService {
    return this.cacheService;
  }

  getAnalyticsService(): ChatbotAnalyticsService {
    return this.analyticsService;
  }

  /** Who the quota belongs to: the user, or a hashed IP for guests (raw IPs are never stored). */
  private quotaKey(userId?: string | null, clientIp?: string): string {
    if (userId) return userId;
    // Tests without an IP get a fresh key per call so anonymous cases don't share one quota.
    const ip = clientIp || (process.env.VITEST === 'true' ? `vitest-${Math.random()}` : 'unknown');
    return `ip:${createHash('sha256').update(ip).digest('hex').slice(0, 40)}`;
  }

  /**
   * Check if user has an active premium subscription (ApplyFields Plus)
   */
  async checkIsPremium(userId?: string | null): Promise<boolean> {
    if (!userId) return false;
    try {
      if (!this.prisma.subscriptions) return false;
      const activeSub = await this.prisma.subscriptions.findFirst({
        where: {
          user_id: userId,
          status: 'active',
          ends_at: { gt: new Date() },
        },
        select: { id: true },
      });
      return !!activeSub;
    } catch {
      return false;
    }
  }

  /**
   * Get quota status for user or client IP
   */
  async getQuota(userId?: string | null, clientIp?: string) {
    return this.quotaFor(this.quotaKey(userId, clientIp), userId);
  }

  /** Counted from analytics_events, so it survives restarts and is shared by every API instance. */
  private async quotaFor(key: string, userId?: string | null): Promise<{
    daily_limit: number;
    queries_used: number;
    queries_remaining: number;
    is_premium: boolean;
    limit_reached: boolean;
  }> {
    const isPremium = await this.checkIsPremium(userId);
    if (isPremium) {
      return {
        daily_limit: 9999,
        queries_used: 0,
        queries_remaining: 9999,
        is_premium: true,
        limit_reached: false,
      };
    }

    // ponytail: count-then-insert, so two parallel requests can both get the last free chat. Fine at 3/day.
    const used = await this.analyticsService.countQueriesSince(key, istMidnight());
    const remaining = Math.max(0, FREE_DAILY_LIMIT - used);

    return {
      daily_limit: FREE_DAILY_LIMIT,
      queries_used: used,
      queries_remaining: remaining,
      is_premium: false,
      limit_reached: used >= FREE_DAILY_LIMIT,
    };
  }

  /**
   * Retrieve structured 1-page notification digest for an opportunity
   */
  async getOpportunityDigest(slug: string): Promise<OpportunityDigest | null> {
    const opp = await this.prisma.opportunities.findFirst({
      where: { slug },
      include: {
        organizations: { select: { name: true, short_name: true, state_code: true } },
        opportunity_posts: true,
        opportunity_dates: { orderBy: { date: 'asc' } },
      },
    });
    if (!opp) return null;
    return this.digestService.generateDigest(opp);
  }

  /**
   * Hybrid AI Query Router:
   * 1. Enforces 3 chats/day limit for free users (resets at 12:00 AM IST)
   * 2. Fast-Path (<80ms, 0 tokens) for deterministic queries
   * 3. 1-Page Notification Digest RAG + Claude LLM synthesis for deep reasoning
   */
  async handleQuery(
    input: ChatbotQueryInput,
    userId?: string | null,
    clientIp?: string,
  ): Promise<ChatbotQueryResponse> {
    const key = this.quotaKey(userId, clientIp);
    const q = input.query.toLowerCase().trim();
    const cacheScope = input.opportunity_slug || input.opportunity_id;

    // 0. Relevance gate: greetings / off-topic get a canned reply. Zero LLM cost, no quota used.
    const relevance = classifyRelevance(q, !!cacheScope);
    if (relevance !== 'relevant') {
      const quota = await this.quotaFor(key, userId);
      await this.analyticsService.logQuery({
        query: input.query,
        mode: 'deterministic',
        latency_ms: 0,
        opportunity_slug: input.opportunity_slug,
        is_unanswered: false,
        is_cached: false,
        quota_key: key,
        counts_quota: false,
      });
      return { ...this.cannedReply(relevance), ...quota };
    }

    // 1. Check user quota
    const quota = await this.quotaFor(key, userId);
    if (quota.limit_reached) {
      return {
        mode: 'limit_reached',
        intent: 'limit_reached',
        answer: `### 🌟 Daily Free Chat Limit Reached (3/3)\n\nYou have used all **3 free AI chats** for today.\n\nFree chats reset daily at midnight (12:00 AM IST).\n\nUpgrade to **ApplyFields Plus** (₹50/month) for unlimited AI queries, in-depth multi-stage exam insights, syllabus breakdowns, and assisted CSC desk bookings!`,
        actions: [
          { label: 'Upgrade to ApplyFields Plus (₹50/mo)', action: 'navigate', url: '/account' },
          { label: 'Browse Jobs & Deadlines Directly', action: 'navigate', url: '/apply/jobs' },
        ],
        daily_limit: quota.daily_limit,
        queries_used: quota.queries_used,
        queries_remaining: 0,
        is_premium: false,
        limit_reached: true,
      };
    }

    const startTime = Date.now();

    // Global follow-ups ("what's the fee?" after asking about SSC CGL) depend on history, so skip the cache for them.
    const useCache = !input.history?.length || !!cacheScope;
    // Global LLM answers are tailored to the student's qualification, so it is part of the key.
    const cacheKey = cacheScope || (input.qualification ? `qual:${input.qualification}` : undefined);

    // Check semantic response cache first (<20ms, zero DB and zero LLM cost)
    const cachedResponse = useCache ? this.cacheService.get(cacheKey, input.query) : null;
    if (cachedResponse) {
      const latency = Date.now() - startTime;
      await this.analyticsService.logQuery({
        query: input.query,
        mode: cachedResponse.mode,
        latency_ms: latency,
        opportunity_slug: input.opportunity_slug,
        is_unanswered: false,
        is_cached: true,
        quota_key: key,
        counts_quota: true,
      });

      return {
        ...cachedResponse,
        daily_limit: quota.daily_limit,
        queries_used: quota.is_premium ? 0 : quota.queries_used + 1,
        queries_remaining: quota.is_premium ? 9999 : Math.max(0, quota.queries_remaining - 1),
        is_premium: quota.is_premium,
        limit_reached: !quota.is_premium && quota.queries_used + 1 >= quota.daily_limit,
      };
    }

    const intent = this.classifyIntent(q);

    // 2. Resolve opportunity context if available
    let opportunity = null;
    if (input.opportunity_slug) {
      opportunity = await this.prisma.opportunities.findFirst({
        where: { slug: input.opportunity_slug },
        include: {
          organizations: { select: { name: true, short_name: true, state_code: true } },
          opportunity_posts: true,
          opportunity_dates: { orderBy: { date: 'asc' } },
        },
      });
    } else if (input.opportunity_id) {
      opportunity = await this.prisma.opportunities.findFirst({
        where: { id: input.opportunity_id },
        include: {
          organizations: { select: { name: true, short_name: true, state_code: true } },
          opportunity_posts: true,
          opportunity_dates: { orderBy: { date: 'asc' } },
        },
      });
    }

    // Try keyword matching against known competitive examinations if not on a specific page
    if (!opportunity) {
      opportunity = await this.tryMatchOpportunity(q);
    }

    // Follow-up: "what's the fee?" right after asking about SSC CGL → answer from the DB, not the LLM.
    if (!opportunity && intent !== 'general' && intent !== 'user_status' && intent !== 'closing_soon') {
      const lastUser = [...(input.history ?? [])].reverse().find((m) => m.role === 'user');
      if (lastUser) opportunity = await this.tryMatchOpportunity(lastUser.content.toLowerCase());
    }

    let response: ChatbotQueryResponse;

    // 3. Dual-Path Dispatch:
    // PATH 1: Within-Website Deterministic Fast-Path (<80ms, 0 tokens)
    if (opportunity) {
      response = await this.handleOpportunityIntent(opportunity, intent, input.query, userId, input.history);
    } else {
      switch (intent) {
        case 'deadline':
        case 'closing_soon':
          response = await this.handleClosingSoon();
          break;
        case 'user_status':
          response = await this.handleUserStatus(userId);
          break;
        case 'trending_jobs':
          response = await this.handleTrendingJobs();
          break;
        case 'csc_booking':
          response = this.handleCscBooking();
          break;
        case 'career_advice': {
          // A bare "career" gets the free static map; a specific question deserves a real answer.
          const staticAdvice = await this.handleCareerAdvice(input.qualification, q);
          response =
            q.split(/\s+/).length <= 3
              ? staticAdvice
              : await this.executeLlmReasoning(input.query, input.history, input.qualification, undefined, staticAdvice);
          break;
        }
        default:
          // PATH 2: Open-ended / Non-website queries -> LLM reasoning
          response = await this.executeLlmReasoning(input.query, input.history, input.qualification);
          break;
      }
    }

    // 4. Attach quota metadata (the logQuery row below is what counts this query)
    const updatedUsed = quota.queries_used + 1;
    const updatedRemaining = Math.max(0, quota.queries_remaining - 1);

    const latency = Date.now() - startTime;
    const isUnanswered =
      response.mode === 'fallback' ||
      response.answer.toLowerCase().includes('does not mention') ||
      response.answer.toLowerCase().includes('not available in the official');

    // Store in semantic cache if solid answer. Never cache per-user answers (would leak one user's counts to others).
    if (useCache && response.mode !== 'limit_reached' && !isUnanswered && response.intent !== 'user_status') {
      this.cacheService.set(cacheKey, input.query, response);
    }

    // Log query telemetry for admin observability
    await this.analyticsService.logQuery({
      query: input.query,
      mode: response.mode,
      latency_ms: latency,
      opportunity_slug: opportunity?.slug || input.opportunity_slug,
      is_unanswered: isUnanswered,
      is_cached: false,
      quota_key: key,
      counts_quota: true,
    });

    return {
      ...response,
      daily_limit: quota.daily_limit,
      queries_used: quota.is_premium ? 0 : updatedUsed,
      queries_remaining: quota.is_premium ? 9999 : updatedRemaining,
      is_premium: quota.is_premium,
      limit_reached: !quota.is_premium && updatedUsed >= quota.daily_limit,
    };
  }

  /**
   * Classify intent from prompt keywords
   */
  private classifyIntent(q: string): string {
    const rules: Array<[string, string[]]> = [
      ['digest', ['digest', 'circular summary', '1-page', 'one page', 'full details', 'complete circular']],
      ['user_status', ['my application', 'my applications', 'my saved', 'saved application', 'saved applications', 'saved item', 'saved items', 'did i apply', 'my booking', 'my bookings']],
      ['deadline', ['deadline', 'deadlines', 'last date', 'closing date', 'when to apply', 'start date', 'exam date', 'important date', 'important dates', 'dates']],
      // Salary before fee: "how much salary" is not a fee question.
      ['career_advice', ['salary', 'pay scale', 'in hand', 'in-hand', 'stipend', 'career', 'careers', 'roadmap', 'which job', 'scope']],
      ['fee', ['fee', 'fees', 'cost', 'how much', 'price', 'payment', 'sc st', 'obc fee']],
      ['eligibility', ['eligible', 'eligibility', 'qualification', 'qualifications', 'b.tech', 'btech', 'degree', 'diploma', '10th', '12th', 'age limit', 'age', 'can i apply', 'criteria']],
      ['pattern', ['pattern', 'syllabus', 'selection process', 'stages', 'tier', 'interview', 'subjects', 'negative marking']],
      ['vacancies', ['vacancy', 'vacancies', 'posts count', 'how many jobs', 'how many posts', 'seats']],
      ['how_to_apply', ['how to apply', 'where to apply', 'official link', 'apply link', 'direct apply', 'website']],
      ['closing_soon', ['closing soon', 'this week', 'urgent']],
      ['trending_jobs', ['trending', 'popular', 'top jobs', 'sarkari', 'latest jobs']],
      ['csc_booking', ['csc', 'meeseva', 'kiosk', 'assisted', 'offline filing', 'help desk']],
    ];
    return rules.find(([, terms]) => hasAny(q, terms))?.[0] ?? 'general';
  }

  /**
   * Try matching an opportunity by keyword search in title or short name
   */
  private async tryMatchOpportunity(q: string) {
    const regex =
      /\b(ssc|upsc|rrb|ibps|sbi|rbi|lic|gate|cat|neet|jee|nda|cds|afcat|capf|cuet|appsc|tspsc|ctet|tet|eamcet|ntpc|cgl|chsl)\b/i;
    const match = q.match(regex);
    if (!match) return null;

    const keyword = match[1].toLowerCase();
    const candidates = await this.prisma.opportunities.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { slug: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { application_end: 'desc' },
      take: 10,
      include: {
        organizations: { select: { name: true, short_name: true, state_code: true } },
        opportunity_posts: true,
        opportunity_dates: { orderBy: { date: 'asc' } },
      },
    });

    // "ssc chsl fee" must pick SSC CHSL, not whichever SSC row comes first: score by query words in title/slug.
    const words = q.split(/[^a-z0-9]+/).filter((w) => w.length > 1);
    const score = (o: { title: string; slug: string }) => {
      const hay = `${o.title} ${o.slug}`.toLowerCase();
      return words.filter((w) => hay.includes(w)).length;
    };
    return candidates.reduce<(typeof candidates)[number] | null>(
      (best, o) => (!best || score(o) > score(best) ? o : best),
      null,
    );
  }

  /**
   * Fast-Path Intent Handler with 1-Page Structured Digest
   */
  private async handleOpportunityIntent(
    opp: any,
    intent: string,
    rawQuery: string,
    userId?: string | null,
    history?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<ChatbotQueryResponse> {
    const digest = this.digestService.generateDigest(opp);
    const orgName = digest.organization;
    const actions: ChatbotAction[] = [];

    // Base actions
    if (opp.apply_url || opp.official_page_url) {
      actions.push({
        label: '🔗 Direct Official Apply Link',
        action: 'open_url',
        url: opp.apply_url || opp.official_page_url,
      });
    }

    actions.push({
      label: '⭐ Save to My Opportunities',
      action: 'save',
      item_slug: opp.slug,
      item_type: opp.type,
    });

    actions.push({
      label: '🏪 Book Assisted Center Filing',
      action: 'book_service',
      url: `/service/checkout?service=application-filing&ref=${opp.slug}`,
    });

    // Assisted CSC/MeeSeva Booking Intent
    if (intent === 'csc_booking') {
      return {
        mode: 'deterministic',
        intent: 'csc_booking',
        answer: `### 🏪 Verified CSC & MeeSeva Assisted Filing for **${opp.title}**\n\nNeed help filing your application with zero errors?\n\nApplyFields connects you with certified **MeeSeva / CSC Kiosk Partners**:\n\n• **Standard CSC Assistance Fee**: ₹50 per application\n• **Document Resizing**: Guaranteed compliance with exact KB limits for photos and signatures\n• **OTR (One-Time Registration)**: Instant creation and credential verification\n• **Physical Receipt**: Official printed fee acknowledgement with barcode\n\n*Click below to reserve a priority assistance slot:*`,
        actions: [
          {
            label: '🏪 Book Assisted CSC / MeeSeva Filing (₹50)',
            action: 'book_service',
            url: `/service/checkout?service=application-filing&opportunity=${opp.slug}`,
            item_slug: opp.slug,
            item_type: 'service',
          },
          ...actions.filter((a) => a.action !== 'book_service'),
        ],
        citations: ['Official Application Portal', 'ApplyFields Partner Network'],
        related_queries: [
          'What documents should I take to the center?',
          'When is the final deadline to apply?',
          'What is the application fee for General / SC / ST / OBC?',
        ],
      };
    }

    // 0. Full 1-Page Digest Intent
    if (intent === 'digest') {
      return {
        mode: 'deterministic',
        intent: 'digest',
        answer: digest.digestMarkdown,
        actions,
        citations: [
          '1-Page Official Circular Digest',
          opp.notification_pdf_url ? 'Official Notification PDF' : 'Authority Portal',
        ],
        related_queries: [
          'When is the final deadline to apply?',
          'What is the application fee for General / SC / ST / OBC?',
          'Am I eligible with a B.Tech / Degree qualification?',
          'Explain the exam pattern and selection stages',
        ],
      };
    }

    // 1. Deadline Intent
    if (intent === 'deadline') {
      const days = daysUntil(opp.application_end);
      const isUrgent = days !== null && days <= 7;

      const answer = `### 📅 Application Timeline for **${opp.title}**

${digest.sections.dates}
${days !== null ? `• **Status**: ⏳ **${days} day${days === 1 ? '' : 's'} remaining**${isUrgent ? ' (Closing Soon!)' : ''}` : ''}

> 💡 *Tip: Apply at least 48 hours before the deadline to avoid server congestion and payment gateway timeouts.*`;

      return {
        mode: 'deterministic',
        intent: 'deadline',
        answer,
        actions,
        related_queries: [
          'What is the application fee?',
          'Am I eligible with my degree?',
          'Explain exam pattern and selection stages',
        ],
        citations: [opp.notification_pdf_url ? 'Official Notification PDF' : 'Authority Portal'],
      };
    }

    // 2. Fee Intent
    if (intent === 'fee') {
      const answer = `### 💰 Application Fee Breakdown for **${opp.title}**

${digest.sections.fees}

• **Processing Note**: Application fee is non-refundable once transaction ID is generated on the official gateway.`;

      return {
        mode: 'deterministic',
        intent: 'fee',
        answer,
        actions,
        related_queries: [
          'When is the final deadline?',
          'Am I eligible for this vacancy?',
          'What documents are required to upload?',
        ],
      };
    }

    // 3. Eligibility Intent
    if (intent === 'eligibility') {
      const answer = `### 🎓 Eligibility Criteria for **${opp.title}**

${digest.sections.eligibility}

> 🔍 *Use the ApplyFields [Eligibility Checker](/eligibility) on your profile to verify your specific degree, domicile state, and reservation category.*`;

      return {
        mode: 'deterministic',
        intent: 'eligibility',
        answer,
        actions,
        related_queries: [
          'When is the final deadline?',
          'What is the application fee?',
          'Explain exam pattern and selection stages',
        ],
      };
    }

    // 4. Pattern / Selection Process Intent
    if (intent === 'pattern') {
      const answer = `### 📝 Selection Stages & Exam Pattern for **${opp.title}**

${digest.sections.examPattern}`;

      return {
        mode: 'deterministic',
        intent: 'pattern',
        answer,
        actions,
        related_queries: [
          'When is the exam date?',
          'What is the application fee?',
          'Where is the official apply link?',
        ],
      };
    }

    // 5. Vacancy Intent
    if (intent === 'vacancies') {
      const answer = `### 📊 Vacancies for **${opp.title}**

${digest.sections.vacancies}

> 📌 *Vertical reservations (SC/ST/OBC/EWS) and horizontal quotas (Ex-Servicemen/PwD) are allocated as per Government of India guidelines.*`;

      return {
        mode: 'deterministic',
        intent: 'vacancies',
        answer,
        actions,
        related_queries: [
          'When is the final deadline?',
          'Am I eligible for these posts?',
          'What is the salary structure?',
        ],
      };
    }

    // 6. How to Apply Intent
    if (intent === 'how_to_apply') {
      const answer = `### 🚀 How to Apply for **${opp.title}**

${digest.sections.howToApply}

> 🏪 *Need someone to verify your certificates and fill the form accurately? You can book an assisted filing session at your local MeeSeva/CSC partner center below.*`;

      return {
        mode: 'deterministic',
        intent: 'how_to_apply',
        answer,
        actions,
        related_queries: [
          'What is the application fee?',
          'When is the final deadline?',
          'What documents are needed?',
        ],
      };
    }

    // If query is an open-ended question about this opportunity (e.g. comparison, deep advice, edge cases):
    // Execute LLM Reasoning grounded strictly in this opportunity's 1-Page Digest!
    const lower = rawQuery.toLowerCase();
    const isDeepQuery =
      intent === 'career_advice' || // salary / scope questions: the digest has pay levels, let the LLM read it
      (rawQuery.length > 25 && !lower.startsWith('what is') && !lower.startsWith('when is'));
    if (isDeepQuery) {
      return this.executeLlmReasoning(rawQuery, history, undefined, digest.digestMarkdown);
    }

    // Default overview for the opportunity
    const answer = `### 🏛️ **${opp.title}** (${orgName})

• **Application Period**: ${digest.keyFacts.applicationStart} to **${digest.keyFacts.applicationEnd}**
• **Total Vacancies**: ${digest.keyFacts.totalVacancies}
• **Fees**: ${digest.keyFacts.feeGeneral} (Gen/OBC) · ${digest.keyFacts.feeConcession} (SC/ST/Women)

How can I help you regarding this opportunity? You can ask about **deadlines**, **fees**, **eligibility**, or **exam pattern**.`;

    return {
      mode: 'deterministic',
      intent: 'general',
      answer,
      actions,
      related_queries: [
        'When is the final deadline?',
        'What is the application fee for General / SC / ST / OBC?',
        'Am I eligible with a Degree qualification?',
        'Explain the exam pattern and selection stages',
      ],
    };
  }

  /**
   * Handle closing soon opportunities across the platform
   */
  private async handleClosingSoon(): Promise<ChatbotQueryResponse> {
    const today = new Date();
    const opps = await this.prisma.opportunities.findMany({
      where: {
        status: 'published',
        application_end: { gte: today },
      },
      orderBy: { application_end: 'asc' },
      take: 4,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        application_end: true,
        organizations: { select: { short_name: true } },
      },
    });

    if (opps.length === 0) {
      return {
        mode: 'deterministic',
        intent: 'closing_soon',
        answer: 'There are currently no active opportunities closing in the immediate countdown. Browse all active jobs under `/apply`.',
      };
    }

    const items = opps
      .map((o) => {
        const days = daysUntil(o.application_end);
        return `• [**${o.title}**](/apply/${o.type === 'govt_job' ? 'jobs' : o.type === 'exam' ? 'exams' : 'scholarships'}/${o.slug}) — Closes **${formatDate(o.application_end)}** (${days}d left)`;
      })
      .join('\n');

    return {
      mode: 'deterministic',
      intent: 'closing_soon',
      answer: `### ⏳ Opportunities Closing Soon\n\nThese critical applications close within the next few days:\n\n${items}\n\n*Click on any item to view details or save for reminders.*`,
      actions: [
        { label: 'Browse All Closing Deadlines', action: 'navigate', url: '/apply?sort=deadline' },
      ],
      related_queries: ['Show top government jobs', 'What exams are available for graduates?'],
    };
  }

  /**
   * Handle authenticated user's application status
   */
  private async handleUserStatus(userId?: string | null): Promise<ChatbotQueryResponse> {
    if (!userId) {
      return {
        mode: 'deterministic',
        intent: 'user_status',
        answer: `### 🔒 Sign In Required\n\nTo view your saved bookmarks, deadline reminders, and center filing bookings, please [Sign In](/login) to your ApplyFields account.`,
        actions: [{ label: 'Sign In to ApplyFields', action: 'navigate', url: '/login' }],
      };
    }

    const [savedCount, appsCount] = await Promise.all([
      this.prisma.saved_items.count({ where: { user_id: userId } }),
      this.prisma.applications.count({ where: { user_id: userId } }),
    ]);

    return {
      mode: 'deterministic',
      intent: 'user_status',
      answer: `### 👤 Your ApplyFields Workspace\n\n• **Saved Opportunities**: ${savedCount} item${savedCount === 1 ? '' : 's'}\n• **Tracked Applications**: ${appsCount} application${appsCount === 1 ? '' : 's'}\n\nYou can review all your saved items, download admit cards, and manage reminder cadences in your workspace.`,
      actions: [
        { label: 'View Saved Opportunities', action: 'navigate', url: '/saved' },
        { label: 'Open Application Tracker', action: 'navigate', url: '/applications' },
      ],
      related_queries: ['Show opportunities closing soon', 'Recommend jobs matching my profile'],
    };
  }

  /**
   * Handle trending government jobs
   */
  private async handleTrendingJobs(): Promise<ChatbotQueryResponse> {
    const opps = await this.prisma.opportunities.findMany({
      where: { status: 'published', type: 'govt_job' },
      orderBy: { vacancies_total: 'desc' },
      take: 4,
      select: {
        title: true,
        slug: true,
        vacancies_total: true,
        application_end: true,
      },
    });

    const list = opps
      .map(
        (o) =>
          `• [**${o.title}**](/apply/jobs/${o.slug}) — ${o.vacancies_total ? `${o.vacancies_total} Posts` : 'Open'} · Closes ${formatDate(o.application_end)}`,
      )
      .join('\n');

    return {
      mode: 'deterministic',
      intent: 'trending_jobs',
      answer: `### 📈 Major Government Recruitments\n\nHere are high-vacancy national recruitments currently open:\n\n${list}`,
      actions: [{ label: 'View All Government Jobs', action: 'navigate', url: '/apply/jobs' }],
      related_queries: ['When is the SSC CGL deadline?', 'What are the application fees?'],
    };
  }

  /**
   * Handle assisted filing / CSC kiosk queries
   */
  private handleCscBooking(): ChatbotQueryResponse {
    return {
      mode: 'deterministic',
      intent: 'csc_booking',
      answer: `### 🏪 Assisted Center Filing (CSC / MeeSeva Partner Desks)

ApplyFields partners with certified CSC and MeeSeva kiosks across India to provide verified, in-person application filing:

• **Document Verification**: Precise photo and signature dimension resizing.
• **Zero-Error Guarantee**: Applications cross-checked against official notification guidelines.
• **Instant Tracking**: SMS confirmation and digital acknowledgment receipts.

*Book your slot online and walk in with your certificates:*`,
      actions: [
        {
          label: '🏪 Book Assisted Center Filing',
          action: 'book_service',
          url: '/service/checkout?service=application-filing',
        },
        { label: 'Find Nearby CSC Centers', action: 'navigate', url: '/service/centers' },
      ],
      related_queries: ['What documents are required to apply?', 'How to apply online?'],
    };
  }

  /**
   * Handle career guidance questions
   */
  private async handleCareerAdvice(
    qualification?: string,
    q: string = '',
  ): Promise<ChatbotQueryResponse> {
    const qual = qualification?.toLowerCase() || 'graduate';

    return {
      mode: 'deterministic',
      intent: 'career_advice',
      answer: `### 🧭 Career Guidance & Pathways for ${qual.toUpperCase()}

• **Central Civil & Administrative Services**: UPSC CSE, SSC CGL (Group B/C), State PSCs.
• **Banking & Insurance**: IBPS PO/Clerk, SBI PO, RBI Grade B.
• **Technical / Engineering (if B.Tech/Diploma)**: GATE (PSU recruitment), RRB SSE/JE, ISRO/DRDO.
• **Defense Services**: CDS, AFCAT, CAPF (Assistant Commandant).

> Explore interactive milestone roadmaps and syllabus breakdowns in our **[Career Guidance Hub](/career)**.`,
      actions: [
        { label: 'Explore Career Roadmaps', action: 'navigate', url: '/career' },
        { label: 'College & Degree Catalog', action: 'navigate', url: '/career/colleges' },
      ],
      related_queries: [
        'Which job has the highest starting salary?',
        'What government exams can I give after 12th?',
      ],
    };
  }

  /** Zero-cost replies for greetings and off-topic questions (never hit the LLM, never use quota). */
  private cannedReply(kind: 'smalltalk' | 'off_topic'): ChatbotQueryResponse {
    const answer =
      kind === 'smalltalk'
        ? `Hi! I'm **Fieldy**, your ApplyFields assistant. 👋\n\nAsk me about **government jobs, exams, scholarships, admissions, careers** or **government services** (PAN, Aadhaar, certificates) — deadlines, fees, eligibility, syllabus and how to apply.`
        : `I can only help with **government jobs, exams, scholarships, admissions, careers** and **government services** on ApplyFields.\n\nTry asking something like the suggestions below.`;
    return {
      mode: 'deterministic',
      intent: kind,
      answer,
      actions: [
        { label: 'Browse Jobs & Deadlines', action: 'navigate', url: '/apply/jobs' },
        { label: 'Explore Careers', action: 'navigate', url: '/career' },
      ],
      related_queries: [
        'Which government exams are closing this week?',
        'What exams can I write after 12th?',
        'SSC CGL eligibility and fees',
      ],
    };
  }

  /**
   * PATH 2: Grounded LLM reasoning over the opportunity digest, or over matching ApplyFields pages.
   */
  private async executeLlmReasoning(
    query: string,
    history?: { role: 'user' | 'assistant'; content: string }[],
    qualification?: string,
    digestContext?: string,
    fallback?: ChatbotQueryResponse,
  ): Promise<ChatbotQueryResponse> {
    // Real ApplyFields pages matching the question: grounding for the LLM and relevant buttons for the user.
    const sources = digestContext
      ? []
      : await new GuidanceService(this.prisma).retrieveContext(query).catch(() => []);
    const sourceActions: ChatbotAction[] = sources
      .slice(0, 3)
      .map((s) => ({ label: s.title.slice(0, 60), action: 'navigate', url: s.url }));
    const actions: ChatbotAction[] = sourceActions.length
      ? sourceActions
      : [
          { label: 'Browse Jobs & Deadlines', action: 'navigate', url: '/apply/jobs' },
          { label: 'Explore Career Roadmaps', action: 'navigate', url: '/career' },
        ];

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (apiKey) {
      try {
        const context = digestContext
          ? `OFFICIAL NOTIFICATION DIGEST (the only source of truth for this opportunity):\n${digestContext}`
          : sources.length
            ? `APPLYFIELDS PAGES MATCHING THE QUESTION (link them as [title](url) where useful):\n${sources.map((s) => `- [${s.title}](${s.url}) (${s.type})`).join('\n')}`
            : 'No matching ApplyFields page was found. Point the user to /apply/jobs, /apply/exams or /career when useful.';

        const systemPrompt = `You are Fieldy, the ApplyFields assistant for students and job aspirants in India.

Scope: government jobs, competitive exams, scholarships, admissions, colleges, courses, careers, and government services (PAN, Aadhaar, passport, certificates, MeeSeva/CSC). If the question is outside this scope, reply with exactly one short sentence saying you can only help with these topics, and nothing else.

How to answer:
- Answer the exact question first, in 1-2 sentences. Then add at most 5 short bullets only if they help.
- Keep it under 180 words. Use **bold** for key facts and ### only for a heading when the answer has sections.
- Never invent dates, fees, vacancies, age limits or eligibility rules. If the context below does not contain the fact, say "The official notification does not mention this" (for an opportunity) or tell the user to check the official website.
- ApplyFields is a guide, not a government body: always send users to the official site to apply.
${qualification ? `\nThe student's qualification: ${qualification}. Tailor the answer to it.` : ''}

${context}`;

        // Last 4 turns; the API requires the first message to be from the user (the widget's welcome bubble is not).
        const recent = (history ?? []).slice(-4).map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));
        while (recent.length && recent[0].role !== 'user') recent.shift();

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: LLM_MODEL,
            max_tokens: 1024,
            output_config: { effort: 'low' },
            system: systemPrompt,
            messages: [...recent, { role: 'user', content: query }],
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            stop_reason?: string;
            content?: Array<{ type: string; text?: string }>;
          };
          // content[0] can be a thinking block; take the text block.
          const text = data.content?.find((b) => b.type === 'text')?.text?.trim();
          if (text && data.stop_reason !== 'refusal') {
            return {
              mode: 'llm',
              intent: 'general_ai',
              answer: text,
              actions,
              related_queries: digestContext
                ? ['When is the final deadline?', 'What is the application fee?', 'Am I eligible?']
                : ['Which exams are closing this week?', 'What exams can I write after graduation?'],
            };
          }
        } else {
          logger.warn(`Anthropic API responded with status ${res.status}`);
        }
      } catch (err: any) {
        logger.warn(`Anthropic call failed, using grounded fallback: ${err.message}`);
      }
    }

    if (fallback) return fallback;

    // No LLM available: matching ApplyFields pages beat a generic menu. mode 'fallback' keeps it out of the cache.
    if (sources.length) {
      return {
        mode: 'fallback',
        intent: 'general',
        answer: `### ✦ Fieldy · ApplyFields AI Advisor\n\nHere is what I found on ApplyFields for your question:\n\n${sources.map((s) => `• [**${s.title}**](${s.url})`).join('\n')}`,
        actions,
      };
    }

    return {
      mode: 'fallback',
      intent: 'general',
      answer: `### ✦ Fieldy · ApplyFields AI Advisor

I am here to guide your educational journey and competitive exam strategy.

• **📅 Official Deadlines & Notifications**: Verified schedules from UPSC, SSC, RRB, IBPS, and State PSCs.
• **💰 Fees & Concessions**: Category-wise fee structures and exemption rules.
• **🎓 Eligibility Verification**: Qualification requirements, degree matches, and age relaxations.
• **📝 Exam Schemes**: Multi-tier syllabus breakdowns and negative marking schemes.
• **🏪 Assisted Kiosk Filing**: Professional form filling at partner MeeSeva/CSC desks.

*Try asking about specific exams, or click the suggested actions below to get started!*`,
      actions: [
        { label: 'Browse All Opportunities', action: 'navigate', url: '/apply/jobs' },
        { label: 'Explore Career Roadmaps', action: 'navigate', url: '/career' },
        { label: 'Saved Workspace', action: 'navigate', url: '/saved' },
      ],
      related_queries: [
        'When is the final deadline to apply?',
        'What is the application fee for General / SC / ST / OBC?',
        'Am I eligible with a B.Tech / Degree qualification?',
        'Explain the exam pattern and selection stages',
      ],
    };
  }
}
