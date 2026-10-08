import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import type {
  OpportunityDetail,
  OpportunityList,
  OpportunityType,
  UpdateList,
} from '@applyfields/types';
import { OpportunitiesService } from './opportunities.service.js';

import { CacheService } from '../../common/cache.service.js';

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
    private readonly cache: CacheService,
  ) {}

  /** GET /api/v1/opportunities?type=govt_job&q=ssc — published, open opportunities from the database */
  @Get('opportunities')
  async list(
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('state') state?: string,
    @Query('qualification') qualification?: string,
    @Query('deadline') deadline?: string,
  ): Promise<OpportunityList> {
    if (type && !TYPES.includes(type as OpportunityType)) {
      throw new BadRequestException(`type must be one of: ${TYPES.join(', ')}`);
    }
    const key = `opportunities:${type ?? 'all'}:${category ?? ''}:${state ?? ''}:${qualification ?? ''}:${deadline ?? ''}:${q ?? ''}`;
    return this.cache.wrap(key, 30, async () => {
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

  /** GET /api/v1/updates — published admit cards, results, answer keys, date changes */
  @Get('updates')
  async updates(): Promise<UpdateList> {
    return this.cache.wrap('updates:latest', 30, async () => {
      return { items: await this.opportunities.updates(), sample: false };
    });
  }
}

