import { Controller, Get } from '@nestjs/common';
import type { ApiHealth, HomeSummary } from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CacheService } from '../../common/cache.service.js';
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

  /** GET /api/v1/home — everything the home dashboard needs, from the database */
  @Get('home')
  async summary(): Promise<HomeSummary> {
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
          application_end: { gte: today, lte: addDays(today, 12) },
        },
        select: CARD_SELECT,
        orderBy: { application_end: 'asc' },
        take: 5,
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
}
