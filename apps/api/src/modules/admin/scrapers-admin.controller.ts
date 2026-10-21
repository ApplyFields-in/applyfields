import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  LinkHealthReport,
  ScrapeSourcesListResponse,
  ScrapeSourceRunsResponse,
  ScrapeTriggerResponse,
} from '@applyfields/types';
import { StaffGuard } from '../../common/staff.guard.js';
import { Roles } from '../../common/roles.decorator.js';
import { ActorId } from '../../common/actor.js';
import { ScrapersAdminService } from './scrapers-admin.service.js';
import { LinkHealthService } from './link-health.service.js';

@Controller('admin')
@UseGuards(StaffGuard)
export class ScrapersAdminController {
  constructor(
    private readonly scrapersService: ScrapersAdminService,
    private readonly linkHealthService: LinkHealthService,
  ) {}

  /**
   * GET /api/v1/admin/sources — list all scrape sources with operational health and counters
   */
  @Get('sources')
  @Roles('reviewer')
  listSources(): Promise<ScrapeSourcesListResponse> {
    return this.scrapersService.listSources();
  }

  /**
   * GET /api/v1/admin/sources/:id/runs — run history and failure logs for one source
   */
  @Get('sources/:id/runs')
  @Roles('reviewer')
  getSourceRuns(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<ScrapeSourceRunsResponse> {
    return this.scrapersService.getSourceRuns(id, limit || 20);
  }

  /**
   * POST /api/v1/admin/sources/:id/trigger — manually run a registered scraper now
   */
  @Post('sources/:id/trigger')
  @Roles('reviewer')
  triggerSource(
    @Param('id', ParseUUIDPipe) id: string,
    @ActorId() actorId: string,
  ): Promise<ScrapeTriggerResponse> {
    return this.scrapersService.triggerSource(id, actorId);
  }

  /**
   * GET /api/v1/admin/link-health — get latest live broken links report
   */
  @Get('link-health')
  @Roles('reviewer')
  getLinkHealth(): LinkHealthReport {
    return this.linkHealthService.getLatestReport();
  }

  /**
   * POST /api/v1/admin/link-health/check — trigger live URL validation across published items
   */
  @Post('link-health/check')
  @Roles('reviewer')
  checkLinks(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<LinkHealthReport> {
    return this.linkHealthService.runHealthCheck(limit || 50);
  }
}
