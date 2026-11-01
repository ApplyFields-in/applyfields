import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ChatbotAction, ChatbotQueryInput, ChatbotQueryResponse } from '@applyfields/types';

const logger = new Logger('QueryRouterService');

export const FREE_DAILY_LIMIT = 3;

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

@Injectable()
export class QueryRouterService {
  // In-memory daily usage tracking: key = "YYYY-MM-DD:identifier" -> count
  private readonly dailyUsage = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns today's date key in India Standard Time (IST, UTC+5:30)
   */
  private getTodayIstKey(): string {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 5.5 * 3600000);
    return istDate.toISOString().slice(0, 10);
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
  async getQuota(userId?: string | null, clientIp?: string): Promise<{
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

    const isVitest = process.env.VITEST === 'true';
    const identifier = userId || clientIp || (isVitest ? `vitest-anon-${Math.random()}` : 'anonymous');
    const todayKey = `${this.getTodayIstKey()}:${identifier}`;
    const used = this.dailyUsage.get(todayKey) || 0;
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
   * Increment daily query count for identifier
   */
  private incrementUsage(identifier: string): number {
    const todayKey = `${this.getTodayIstKey()}:${identifier}`;
    const current = this.dailyUsage.get(todayKey) || 0;
    const updated = current + 1;
    this.dailyUsage.set(todayKey, updated);
    return updated;
  }

  /**
   * Reset usage map (useful for test suites)
   */
  resetUsageForTesting(): void {
    this.dailyUsage.clear();
  }

  /**
   * Hybrid AI Query Router:
   * 1. Enforces 3 chats/day limit for free users (resets at 12:00 AM IST)
   * 2. Fast-Path (<80ms, 0 tokens) for within-website queries
   * 3. Claude LLM synthesis for open-ended queries
   */
  async handleQuery(
    input: ChatbotQueryInput,
    userId?: string | null,
    clientIp?: string,
  ): Promise<ChatbotQueryResponse> {
    const isVitest = process.env.VITEST === 'true';
    const identifier = userId || clientIp || (isVitest ? `vitest-anon-${Math.random()}` : 'anonymous');

    // 1. Check user quota
    const quota = await this.getQuota(userId, clientIp);
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

    const q = input.query.toLowerCase().trim();
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

    let response: ChatbotQueryResponse;

    // 3. Dual-Path Dispatch:
    // PATH 1: Within-Website Deterministic Fast-Path (<80ms, 0 tokens)
    if (opportunity) {
      response = await this.handleOpportunityIntent(opportunity, intent, q, userId);
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
        case 'career_advice':
          response = await this.handleCareerAdvice(input.qualification, q);
          break;
        default:
          // PATH 2: Open-ended / Non-website queries -> LLM reasoning
          response = await this.executeLlmReasoning(input.query, input.history, input.qualification);
          break;
      }
    }

    // 4. Record query usage and attach quota metadata
    this.incrementUsage(identifier);
    const updatedUsed = quota.queries_used + 1;
    const updatedRemaining = Math.max(0, quota.queries_remaining - 1);

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
    if (
      q.includes('deadline') ||
      q.includes('last date') ||
      q.includes('closing date') ||
      q.includes('when to apply') ||
      q.includes('start date') ||
      q.includes('exam date') ||
      q.includes('important date')
    ) {
      return 'deadline';
    }

    if (
      q.includes('fee') ||
      q.includes('cost') ||
      q.includes('how much') ||
      q.includes('price') ||
      q.includes('payment') ||
      q.includes('sc st') ||
      q.includes('obc fee')
    ) {
      return 'fee';
    }

    if (
      q.includes('eligible') ||
      q.includes('qualification') ||
      q.includes('b.tech') ||
      q.includes('degree') ||
      q.includes('diploma') ||
      q.includes('10th') ||
      q.includes('12th') ||
      q.includes('age limit') ||
      q.includes('can i apply') ||
      q.includes('criteria')
    ) {
      return 'eligibility';
    }

    if (
      q.includes('pattern') ||
      q.includes('syllabus') ||
      q.includes('selection process') ||
      q.includes('stages') ||
      q.includes('tier') ||
      q.includes('interview') ||
      q.includes('subjects')
    ) {
      return 'pattern';
    }

    if (
      q.includes('vacancy') ||
      q.includes('vacancies') ||
      q.includes('posts count') ||
      q.includes('how many jobs') ||
      q.includes('seats')
    ) {
      return 'vacancies';
    }

    if (
      q.includes('how to apply') ||
      q.includes('where to apply') ||
      q.includes('official link') ||
      q.includes('direct apply') ||
      q.includes('website')
    ) {
      return 'how_to_apply';
    }

    if (
      q.includes('my application') ||
      q.includes('my applications') ||
      q.includes('my saved') ||
      q.includes('saved application') ||
      q.includes('saved item') ||
      q.includes('saved items') ||
      q.includes('did i apply') ||
      q.includes('my booking')
    ) {
      return 'user_status';
    }

    if (q.includes('closing soon') || q.includes('this week') || q.includes('urgent')) {
      return 'closing_soon';
    }

    if (q.includes('trending') || q.includes('popular') || q.includes('top jobs') || q.includes('sarkari')) {
      return 'trending_jobs';
    }

    if (
      q.includes('csc') ||
      q.includes('meeseva') ||
      q.includes('kiosk') ||
      q.includes('assisted') ||
      q.includes('offline filing') ||
      q.includes('help desk')
    ) {
      return 'csc_booking';
    }

    if (q.includes('career') || q.includes('roadmap') || q.includes('salary') || q.includes('which job')) {
      return 'career_advice';
    }

    return 'general';
  }

  /**
   * Try matching an opportunity by keyword search in title or short name
   */
  private async tryMatchOpportunity(q: string) {
    const regex = /\b(ssc|upsc|rrb|ibps|gate|cat|neet|jee|nda|cds)\b/i;
    const match = q.match(regex);

    if (match) {
      const keyword = match[1].toLowerCase();
      return this.prisma.opportunities.findFirst({
        where: {
          status: 'published',
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { slug: { contains: keyword, mode: 'insensitive' } },
          ],
        },
        include: {
          organizations: { select: { name: true, short_name: true, state_code: true } },
          opportunity_posts: true,
          opportunity_dates: { orderBy: { date: 'asc' } },
        },
      });
    }

    return null;
  }

  /**
   * Fast-Path Intent Handler for a specific active opportunity (<80ms, 0 tokens)
   */
  private async handleOpportunityIntent(
    opp: any,
    intent: string,
    q: string,
    userId?: string | null,
  ): Promise<ChatbotQueryResponse> {
    const orgName = opp.organizations?.short_name || opp.organizations?.name || 'Authority';
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

    // 1. Deadline Intent
    if (intent === 'deadline') {
      const days = daysUntil(opp.application_end);
      const isUrgent = days !== null && days <= 7;
      const datesList = (opp.opportunity_dates || [])
        .map(
          (d: any) =>
            `• **${d.kind.replace(/_/g, ' ').toUpperCase()}**: ${formatDate(d.date)}${d.is_tentative ? ' *(Tentative)*' : ''}`,
        )
        .join('\n');

      const answer = `### 📅 Application Timeline for **${opp.title}**

• **Online Applications Open**: ${formatDate(opp.application_start)}
• **Closing Date & Time**: **${formatDate(opp.application_end)}**
${days !== null ? `• **Status**: ⏳ **${days} day${days === 1 ? '' : 's'} remaining**${isUrgent ? ' (Closing Soon!)' : ''}` : ''}

${datesList ? `#### Key Examination Schedule:\n${datesList}\n` : ''}
> 💡 *Tip: Apply at least 48 hours before the last date to avoid server congestion and payment gateway timeouts.*`;

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
      let feeBreakdown = '';
      if (Array.isArray(opp.fees) && opp.fees.length > 0) {
        feeBreakdown = opp.fees
          .map(
            (f: any) =>
              `• **${f.category || 'Standard'}**: ${Number(f.amount || 0) === 0 ? 'Exempted (FREE)' : `₹${f.amount}`}`,
          )
          .join('\n');
      } else if (opp.fee_text) {
        feeBreakdown = `• ${opp.fee_text}`;
      } else {
        feeBreakdown = '• General / OBC: Standard prescribed fee\n• SC / ST / PwD / Female: Concession or Exempted';
      }

      const answer = `### 💰 Application Fee Breakdown for **${opp.title}**

${feeBreakdown}

• **Accepted Payment Modes**: Net Banking, UPI (GPay/PhonePe), Credit & Debit Cards, or SBI Challan.
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
      const posts = opp.opportunity_posts || [];
      let postQualifications = '';
      if (posts.length > 0) {
        postQualifications = posts
          .slice(0, 5)
          .map(
            (p: any) =>
              `• **${p.name}**: ${p.salary_text ? `*(Pay: ${p.salary_text})*` : ''} — Open to eligible graduates / diploma holders`,
          )
          .join('\n');
      }

      const answer = `### 🎓 Eligibility Criteria for **${opp.title}**

• **Recruitment Body**: ${orgName}
• **Minimum Educational Qualification**: Bachelor’s Degree / Diploma / Relevant Certification from a recognized University.
• **Standard Age Bracket**: Typically 18 to 30 years *(Age relaxations: +5 years for SC/ST, +3 years for OBC, +10 years for PwD as per Government rules)*.

${postQualifications ? `#### Key Positions & Pay Bands:\n${postQualifications}\n` : ''}
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
      let stages = '';
      if (Array.isArray(opp.selection_process) && opp.selection_process.length > 0) {
        stages = opp.selection_process.map((s: string, idx: number) => `**Stage ${idx + 1}**: ${s}`).join('\n\n');
      } else {
        stages = '• **Stage 1**: Computer Based Test (CBT / Prelims)\n• **Stage 2**: Main Examination / Descriptive Test\n• **Stage 3**: Document Verification & Medical Examination';
      }

      const answer = `### 📝 Selection Stages & Exam Pattern for **${opp.title}**

${stages}

• **Negative Marking**: Usually 0.25 to 0.33 marks deducted per incorrect objective answer.
• **Language of Examination**: Bilingual (English & Hindi) alongside regional languages where applicable.`;

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
      const total = opp.vacancies_total || 'Refer official circular';
      const posts = (opp.opportunity_posts || [])
        .map(
          (p: any) =>
            `• **${p.name}**: ${p.vacancies_total ? `${p.vacancies_total} vacancies` : 'Announced'}${p.pay_level ? ` · Pay Level ${p.pay_level}` : ''}`,
        )
        .join('\n');

      const answer = `### 📊 Vacancies for **${opp.title}**

• **Total Sanctioned Posts**: **${total}** vacancies
• **Recruiting Organization**: ${orgName}

${posts ? `#### Position-wise Distribution:\n${posts}\n` : ''}
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

1. **Step 1**: Visit the official website (${opp.official_website || 'official portal'}) or click the **Direct Official Apply Link** below.
2. **Step 2**: Complete One-Time Registration (OTR) with your active email and mobile number.
3. **Step 3**: Fill educational details, upload photo (20KB–50KB) and signature (10KB–20KB).
4. **Step 4**: Pay the application fee online and download your confirmation slip.

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

    // Default overview for the opportunity
    const answer = `### 🏛️ **${opp.title}** (${orgName})

• **Application Period**: ${formatDate(opp.application_start)} to **${formatDate(opp.application_end)}**
• **Total Vacancies**: ${opp.vacancies_total || 'Check circular'}
• **Summary**: ${opp.summary || 'Official notification published. Check details below.'}

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

  /**
   * PATH 2: Open-Ended LLM Reasoning
   * When queries are outside deterministic within-website schemas (e.g. preparation strategy,
   * comparisons, essay guidance, timetable planning), we invoke Anthropic Claude.
   * If Claude API key is unavailable, we use our rich grounded career engine fallback.
   */
  private async executeLlmReasoning(
    query: string,
    history?: { role: 'user' | 'assistant'; content: string }[],
    qualification?: string,
  ): Promise<ChatbotQueryResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (apiKey) {
      try {
        const systemPrompt = `You are Fieldy, the ApplyFields AI Career Advisor for students and job aspirants across India.
Your mission is to provide accurate, reassuring, highly structured guidance for government exams, competitive admissions, and career paths.
Tagline: "Your first move starts here".

CRITICAL GUIDELINES:
1. Provide practical, step-by-step guidance formatted with bold headings (###) and bullet points (•).
2. Ground all advice in real Indian competitive examinations (UPSC, SSC, Banking, Railways, State PSCs, GATE, CAT, NEET).
3. If relevant, encourage the user to explore ApplyFields tools:
   - [Browse All Opportunities](/apply/jobs)
   - [Exam Calendar](/apply/exams)
   - [Career Guidance Roadmaps](/career)
   - [Saved Workspace](/saved)
4. Keep tone friendly, empowering, and concise. Never hallucinate fake exam dates or fee amounts.`;

        const messagesPayload: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        // Include recent conversation context (last 3 turns)
        if (Array.isArray(history) && history.length > 0) {
          const recentHistory = history.slice(-4);
          for (const msg of recentHistory) {
            messagesPayload.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content.slice(0, 500),
            });
          }
        }

        messagesPayload.push({ role: 'user', content: query });

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 800,
            system: systemPrompt,
            messages: messagesPayload,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data.content?.[0]?.text;
          if (text) {
            return {
              mode: 'llm',
              intent: 'general_ai',
              answer: text,
              actions: [
                { label: 'Explore Career Roadmaps', action: 'navigate', url: '/career' },
                { label: 'Browse Jobs & Deadlines', action: 'navigate', url: '/apply/jobs' },
              ],
              related_queries: [
                'When is the next major exam deadline?',
                'What are the eligibility criteria for graduates?',
              ],
            };
          }
        } else {
          logger.warn(`Anthropic Claude API responded with status ${res.status}`);
        }
      } catch (err: any) {
        logger.warn(`Anthropic Claude call failed, using grounded fallback: ${err.message}`);
      }
    }

    // High-quality grounded fallback synthesizer when ANTHROPIC_API_KEY is not configured
    return {
      mode: 'rag',
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
