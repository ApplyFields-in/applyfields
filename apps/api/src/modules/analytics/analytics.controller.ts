import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import type { AnalyticsBatchInput, AnalyticsEventInput } from '@applyfields/types';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * POST /api/v1/analytics/events
   * Lightweight public ingestion endpoint for anonymous citizen telemetry
   */
  @Post('events')
  @HttpCode(HttpStatus.OK)
  async recordEvent(@Body() body: AnalyticsEventInput) {
    if (!body?.event_name) {
      return { success: false, message: 'Missing event_name' };
    }
    return this.analyticsService.recordEvent(body);
  }

  /**
   * POST /api/v1/analytics/batch
   * Ingest a batch of events (e.g. from beacon flushes)
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async recordBatch(@Body() body: AnalyticsBatchInput) {
    return this.analyticsService.recordBatch(body?.events || []);
  }
}
