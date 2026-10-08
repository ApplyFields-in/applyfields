import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { ApiHealth, HomePersonal, HomeSummary } from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CacheService } from '../../common/cache.service.js';
import { OptionalAuthGuard, type MaybeUserRequest } from '../auth/auth.guard.js';
import { EligibilityService } from '../eligibility/eligibility.service.js';
import {
  addDays,
  CARD_SELECT,
  openWhere,
  OpportunitiesService,
  todayIst,
} from '../opportunities/opportunities.service.js';

@Controller()
export class HomeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opportunities: OpportunitiesService,
    private readonly eligibility: EligibilityService,
    private readonly cache: CacheService,
  ) {}

  /** GET /api/v1/health — used by the web footer to show "API connected" (also checks the database) */
  @Get('health')
  async health(): Promise<ApiHealth> {
    return this.cache.wrap('health', 15, async () => {
      await this.prisma.$queryRaw`select 1`;
      return {
        status: 'ok',
        service: 'applyfields-api',
        time: new Date().toISOString(),
      };
    });
  }

  /** GET /api/v1/home — the home dashboard. Logged in: adds recommended, saved and recently viewed. */
  @Get('home')
  @UseGuards(OptionalAuthGuard)
  async summary(@Req() req: MaybeUserRequest): Promise<HomeSummary> {
    const [shared, personal] = await Promise.all([
      this.shared(),
      req.user ? this.personal(req.user.userId) : null,
    ]);
    return { ...shared, personal };
  }

  private shared(): Promise<Omit<HomeSummary, 'personal'>> {
    return this.cache.wrap('home:summary', 30, async () => {
      const today = todayIst();
      const open = openWhere(today);
      const weekAgo = new Date(Date.now() - 7 * 86_400_000);

    const [
      openJobs,
      newJobs,
      openExams,
      admitCards,
      openScholarships,
      closingWeek,
      closingSoon,
      latest,
      updates,
    ] = await Promise.all([
      this.prisma.opportunities.count({ where: { ...open, type: 'govt_job' } }),
      this.prisma.opportunities.count({
        where: { ...open, type: 'govt_job', published_at: { gte: weekAgo } },
      }),
      this.prisma.opportunities.count({ where: { ...open, type: 'exam' } }),
      this.prisma.updates.count({
        where: {
          status: 'published',
          kind: 'admit_card',
          published_at: { gte: addDays(today, -30) },
        },
      }),
      this.prisma.opportunities.count({
        where: { ...open, type: 'scholarship' },
      }),
      this.prisma.opportunities.count({
        where: {
          status: 'published',
          application_end: { gte: today, lte: addDays(today, 7) },
        },
      }),
      this.prisma.opportunities.findMany({
        where: {
          status: 'published',
          application_end: { gte: today, lte: addDays(today, 30) },
        },
        select: CARD_SELECT,
        orderBy: { application_end: 'asc' },
        take: 8,
      }),
      this.prisma.opportunities.findMany({
        where: open,
        select: CARD_SELECT,
        orderBy: { published_at: 'desc' },
        take: 4,
      }),
      this.opportunities.updates(5),
    ]);

    return {
      generated_at: new Date().toISOString(),
      stats: [
        {
          key: 'open_jobs',
          label: 'Open government jobs',
          value: openJobs,
          hint: `+${newJobs} this week`,
        },
        {
          key: 'exams_this_month',
          label: 'Exams open now',
          value: openExams,
          hint: `${admitCards} admit card${admitCards === 1 ? '' : 's'} out`,
        },
        {
          key: 'scholarships_open',
          label: 'Scholarships open',
          value: openScholarships,
          hint: 'Central + state',
        },
        {
          key: 'closing_this_week',
          label: 'Closing this week',
          value: closingWeek,
          hint: 'Don’t miss them',
        },
      ],
      closing_soon: closingSoon.map((r) => this.opportunities.toCard(r, today)),
      popular: latest.map((r) => this.opportunities.toCard(r, today)),
      updates,
      popular_searches: [
        'SSC CGL',
        'APPSC Group 2',
        'NEET UG',
        'Police jobs Telangana',
        'PAN card',
        'NSP scholarship',
      ],
      sample: false,
    };
    });
  }

  private async personal(userId: string): Promise<HomePersonal> {
    const mine = { user_id: userId, item_type: 'opportunity' as const };
    const [profile, open, saved, viewed, savedSlugs] = await Promise.all([
      this.eligibility.profile(userId),
      this.opportunities.list(undefined, undefined, 200),
      this.prisma.saved_items.findMany({
        where: mine,
        select: { item_id: true },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      this.prisma.recently_viewed.findMany({
        where: mine,
        select: { item_id: true },
        orderBy: { viewed_at: 'desc' },
        take: 5,
      }),
      this.opportunities.savedSlugs(userId),
    ]);
    const ready = EligibilityService.ready(profile);
    const [recommended, savedCards, viewedCards] = await Promise.all([
      ready ? this.eligibility.annotate(profile, open) : [],
      this.opportunities.cardsByIds(saved.map((s) => s.item_id)),
      this.opportunities.cardsByIds(viewed.map((v) => v.item_id)),
    ]);
    const mark = (cards: typeof savedCards) => this.opportunities.markSaved(cards, savedSlugs);
    return {
      profile_ready: ready,
      recommended: mark(
        recommended
          .filter((c) => c.eligibility === 'eligible' || c.eligibility === 'likely_eligible')
          .slice(0, 6),
      ),
      saved: mark(savedCards),
      recently_viewed: mark(viewedCards),
    };
  }
}
