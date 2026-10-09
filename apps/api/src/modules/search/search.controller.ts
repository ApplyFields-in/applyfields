import { Controller, Get, Post, Query } from '@nestjs/common';
import type { SearchResponse, SearchSuggestResponse } from '@applyfields/types';
import { ZodPipe } from '../../common/zod.pipe.js';
import {
  SearchService,
  searchQuerySchema,
  suggestQuerySchema,
  type SearchQuery,
  type SuggestQuery,
} from './search.service.js';
import { TypesenseService } from './typesense.service.js';

@Controller('search')
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly typesense: TypesenseService,
  ) {}

  /**
   * GET /api/v1/search?q=ssc cgl&type=&state=&qualification=&deadline=&sort=relevance|deadline&limit=20
   * Universal search with full-text + typo matching + related searches.
   */
  @Get()
  async find(@Query(new ZodPipe(searchQuerySchema)) query: SearchQuery): Promise<SearchResponse> {
    const [items, related] = await Promise.all([
      this.search.search(query),
      this.search.getRelatedTerms(query.q),
    ]);
    return {
      query: query.q,
      total: items.length,
      items,
      ...(related.length > 0 ? { related } : {}),
    };
  }

  /**
   * GET /api/v1/search/suggest?q=ssc&limit=6
   * Fast query autocomplete, related searches, and top preview items.
   */
  @Get('suggest')
  async suggest(@Query(new ZodPipe(suggestQuerySchema)) query: SuggestQuery): Promise<SearchSuggestResponse> {
    return this.search.suggest(query);
  }

  /**
   * GET /api/v1/search/typesense/health
   */
  @Get('typesense/health')
  getTypesenseHealth() {
    return {
      available: this.typesense.available,
      status: this.typesense.available ? 'connected' : 'disconnected (using postgres)',
    };
  }

  /**
   * POST /api/v1/search/typesense/sync
   * Reindexes published items from Postgres search_index into Typesense.
   */
  @Post('typesense/sync')
  async syncTypesense() {
    return this.typesense.syncFromPostgres();
  }
}
