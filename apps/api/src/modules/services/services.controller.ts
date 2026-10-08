import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { GovServiceCard, GovServiceDetail, GovServiceList } from '@applyfields/types';
import { ServicesService } from './services.service.js';
import { CacheService } from '../../common/cache.service.js';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly services: ServicesService,
    private readonly cache: CacheService,
  ) {}

  /** GET /api/v1/services — public list of published citizen services */
  @Get()
  async list(
    @Query('category') category?: string,
    @Query('state') state?: string,
    @Query('q') q?: string,
  ): Promise<GovServiceList> {
    const key = `services:list:${category ?? ''}:${state ?? ''}:${q ?? ''}`;
    return this.cache.wrap(key, 30, async () => {
      const items = await this.services.list({ category, state, q });
      return {
        total: items.length,
        query: q ?? '',
        category: category ?? 'All',
        items,
      };
    });
  }

  /** GET /api/v1/services/:slug — complete published citizen service details */
  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<GovServiceDetail> {
    const key = `services:slug:${slug}`;
    const item = await this.cache.wrap(key, 30, async () => {
      return this.services.findBySlug(slug);
    });
    if (!item) {
      throw new NotFoundException(`Government service with slug "${slug}" not found`);
    }
    return item;
  }
}
