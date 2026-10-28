import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  EligibilityResponse,
  OpportunityCard,
  OpportunityDetail,
  OpportunityList,
  OpportunityType,
  UpdateList,
} from '@applyfields/types';

import { OpportunitiesService } from './opportunities.service.js';
import { EligibilityService } from '../eligibility/eligibility.service.js';
import { OptionalAuthGuard, type MaybeUserRequest } from '../auth/auth.guard.js';
import { CacheService } from '../../common/cache.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const TYPES: OpportunityType[] = [
  'govt_job',
  'exam',
  'scholarship',
  'admission',
];

@Controller()
export class OpportunitiesController {
  constructor(
    private readonly opportunities: OpportunitiesService,
    private readonly eligibility: EligibilityService,
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /api/v1/opportunities?type=govt_job&q=ssc&eligible=true — published, open opportunities.
   * Logged in: every card gets an eligibility badge; eligible=true hides the ones you're not eligible for.
   */
  @Get('opportunities')
  @UseGuards(OptionalAuthGuard)
  async list(
    @Req() req: MaybeUserRequest,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('state') state?: string,
    @Query('qualification') qualification?: string,
    @Query('deadline') deadline?: string,
    @Query('eligible') eligible?: string,
  ): Promise<OpportunityList> {
    if (type && !TYPES.includes(type as OpportunityType)) {
      throw new BadRequestException(`type must be one of: ${TYPES.join(', ')}`);
    }
    const key = `opportunities:${type ?? 'all'}:${category ?? ''}:${state ?? ''}:${qualification ?? ''}:${deadline ?? ''}:${q ?? ''}`;
    const data = await this.cache.wrap<OpportunityList>(key, 30, async () => {
      const items = await this.opportunities.list({
        type: type as OpportunityType | undefined,
        q,
        category,
        state,
        qualification,
        deadline,
      });
      return {
        type: (type as OpportunityType | undefined) ?? 'all',
        query: q ?? '',
        total: items.length,
        items,
        sample: false,
      };
    });
    if (!req.user) return data;

    const [profile, saved] = await Promise.all([
      this.eligibility.profile(req.user.userId),
      this.opportunities.savedSlugs(req.user.userId),
    ]);
    let items = this.opportunities.markSaved(await this.eligibility.annotate(profile, data.items), saved);
    if (eligible === 'true' || eligible === '1') {
      items = items.filter((i) => i.eligibility !== 'not_eligible');
    }
    return { ...data, total: items.length, items };
  }

  /** GET /api/v1/opportunities/trending — top 10 most-saved opportunities in the last 48 hours */
  @Get('opportunities/trending')
  async trending(): Promise<{ items: OpportunityCard[] }> {
    return this.cache.wrap('opportunities:trending', 5, async () => {
      const items = await this.opportunities.trending(10);
      return { items };
    });
  }

  /** GET /api/v1/opportunities/:slug — complete published detail page */

  @Get('opportunities/:slug')
  async detail(@Param('slug') slug: string): Promise<OpportunityDetail> {
    const key = `opportunity:slug:${slug}`;
    const item = await this.cache.wrap(key, 30, async () => {
      return this.opportunities.findBySlug(slug);
    });
    if (!item) {
      throw new NotFoundException(`Opportunity with slug "${slug}" not found`);
    }
    return item;
  }

  /** GET /api/v1/opportunities/:slug/eligibility — "Am I eligible?" with a reason per rule */
  @Get('opportunities/:slug/eligibility')
  @UseGuards(OptionalAuthGuard)
  async eligibilityFor(
    @Req() req: MaybeUserRequest,
    @Param('slug') slug: string,
  ): Promise<EligibilityResponse> {
    if (!req.user) return { slug, status: 'login_required' };
    return this.eligibility.check(req.user.userId, slug);
  }

  /** POST /api/v1/opportunities/:slug/view — the detail page calls this; feeds "Recently viewed" */
  @Post('opportunities/:slug/view')
  @HttpCode(204)
  @UseGuards(OptionalAuthGuard)
  async viewed(
    @Req() req: MaybeUserRequest,
    @Param('slug') slug: string,
  ): Promise<void> {
    if (!req.user) return;
    const o = await this.prisma.opportunities.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!o) return;
    const key = {
      user_id: req.user.userId,
      item_type: 'opportunity' as const,
      item_id: o.id,
    };
    await this.prisma.recently_viewed.upsert({
      where: { user_id_item_type_item_id: key },
      create: key,
      update: { viewed_at: new Date() },
    });
  }

  /** GET /api/v1/opportunities/:slug/similar — up to 5 related opportunities (same type + category) */
  @Get('opportunities/:slug/similar')
  async similar(@Param('slug') slug: string): Promise<{ items: OpportunityCard[] }> {
    return this.cache.wrap(`opportunities:similar:${slug}`, 10, async () => {
      const items = await this.opportunities.similar(slug);
      return { items };
    });
  }

  /** GET /api/v1/updates — published admit cards, results, answer keys, date changes */

  @Get('updates')
  async updates(): Promise<UpdateList> {
    return this.cache.wrap('updates:latest', 30, async () => {
      return { items: await this.opportunities.updates(), sample: false };
    });
  }
}
