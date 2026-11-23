import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { StaffGuard } from '../../common/staff.guard.js';
import type { AnalyticsFunnelSummary, AnalyticsOverview } from '@applyfields/types';

@Controller('admin/analytics')
@UseGuards(StaffGuard)
export class AnalyticsAdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** GET /api/v1/admin/analytics/overview?days=30 — users, visits, partners, bookings. */
  @Get('overview')
  getOverview(@Query('days') days?: string): Promise<AnalyticsOverview> {
    return this.analyticsService.getOverview(Number(days) || 30);
  }

  /**
   * GET /api/v1/admin/analytics/funnel?days=30
   * Retrieves high-level citizen conversion funnel metrics for staff dashboard
   */
  @Get('funnel')
  async getFunnelSummary(
    @Query('days') days?: string,
  ): Promise<AnalyticsFunnelSummary> {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getFunnelSummary(
      isNaN(parsedDays) ? 30 : parsedDays,
    );
  }
}
