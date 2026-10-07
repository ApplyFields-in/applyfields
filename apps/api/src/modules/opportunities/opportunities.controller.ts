import {
  BadRequestException,
  Controller,
  Get,
  NotImplementedException,
  Param,
  Query,
} from '@nestjs/common';
import type {
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
  ): Promise<OpportunityList> {
    if (type && !TYPES.includes(type as OpportunityType)) {
      throw new BadRequestException(`type must be one of: ${TYPES.join(', ')}`);
    }
    const key = `opportunities:${type ?? 'all'}:${q ?? ''}`;
    return this.cache.wrap(key, 30, async () => {
      const items = await this.opportunities.list(
        type as OpportunityType | undefined,
        q,
      );
      return {
        type: (type as OpportunityType | undefined) ?? 'all',
        query: q ?? '',
        total: items.length,
        items,
        sample: false,
      };
    });
  }

  /** GET /api/v1/opportunities/:slug — the detail page arrives in Week 3 */
  @Get('opportunities/:slug')
  detail(@Param('slug') slug: string): never {
    throw new NotImplementedException(
      `Opportunity details for "${slug}" are being built (Week 3).`,
    );
  }

  /** GET /api/v1/updates — published admit cards, results, answer keys, date changes */
  @Get('updates')
  async updates(): Promise<UpdateList> {
    return this.cache.wrap('updates:latest', 30, async () => {
      return { items: await this.opportunities.updates(), sample: false };
    });
  }
}

