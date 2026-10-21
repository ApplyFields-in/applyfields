import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AnalyticsEventInput,
  AnalyticsFunnelSummary,
} from '@applyfields/types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ingest a single privacy-first anonymous analytics event
   */
  async recordEvent(input: AnalyticsEventInput): Promise<{ success: boolean }> {
    try {
      await this.prisma.analytics_events.create({
        data: {
          event_name: input.event_name,
          session_id: input.session_id ? input.session_id.slice(0, 64) : null,
          entity_type: input.entity_type || null,
          entity_id: input.entity_id ? input.entity_id.slice(0, 64) : null,
          metadata: (input.metadata as any) ?? {},
        },
      });
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`Failed to record analytics event: ${err?.message}`);
      return { success: false };
    }
  }

  /**
   * Ingest a batch of anonymous analytics events
   */
  async recordBatch(events: AnalyticsEventInput[]): Promise<{ success: boolean; count: number }> {
    if (!events || events.length === 0) {
      return { success: true, count: 0 };
    }

    try {
      const rows = events.map((ev) => ({
        event_name: ev.event_name,
        session_id: ev.session_id ? ev.session_id.slice(0, 64) : null,
        entity_type: ev.entity_type || null,
        entity_id: ev.entity_id ? ev.entity_id.slice(0, 64) : null,
        metadata: (ev.metadata as any) ?? {},
      }));

      await this.prisma.analytics_events.createMany({
        data: rows,
        skipDuplicates: true,
      });

      return { success: true, count: rows.length };
    } catch (err: any) {
      this.logger.warn(`Failed to record analytics batch: ${err?.message}`);
      return { success: false, count: 0 };
    }
  }

  /**
   * Aggregate citizen funnel conversion metrics across standard touchpoints
   */
  async getFunnelSummary(days: number = 30): Promise<AnalyticsFunnelSummary> {
    const validDays = Math.max(1, Math.min(365, days || 30));
    const since = new Date(Date.now() - validDays * 24 * 60 * 60 * 1000);

    const [eventsByStep, distinctSessions, totalEventsCount, topQueriesRaw, topOpportunitiesRaw] =
      await Promise.all([
        this.prisma.analytics_events.groupBy({
          by: ['event_name'],
          where: { created_at: { gte: since } },
          _count: { _all: true },
        }),
        this.prisma.analytics_events.findMany({
          where: {
            created_at: { gte: since },
            session_id: { not: null },
          },
          distinct: ['session_id'],
          select: { session_id: true },
        }),
        this.prisma.analytics_events.count({
          where: { created_at: { gte: since } },
        }),
        this.prisma
          .$queryRaw<Array<{ query: string; count: bigint }>>`
          SELECT (metadata->>'query') as query, COUNT(*) as count
          FROM analytics_events
          WHERE event_name = 'search' AND metadata->>'query' IS NOT NULL AND created_at >= ${since}
          GROUP BY (metadata->>'query')
          ORDER BY count DESC
          LIMIT 5;
        `
          .catch(() => []),
        this.prisma
          .$queryRaw<Array<{ id: string; count: bigint }>>`
          SELECT entity_id as id, COUNT(*) as count
          FROM analytics_events
          WHERE event_name = 'opportunity_view' AND entity_id IS NOT NULL AND created_at >= ${since}
          GROUP BY entity_id
          ORDER BY count DESC
          LIMIT 5;
        `
          .catch(() => []),
      ]);

    const stepCounts: Record<string, number> = {};
    for (const item of eventsByStep) {
      stepCounts[item.event_name] = item._count._all;
    }

    const searches = stepCounts['search'] || 0;
    const views = stepCounts['opportunity_view'] || 0;
    const eligibility_checks = stepCounts['eligibility_check'] || 0;
    const saves = stepCounts['opportunity_save'] || 0;
    const external_applies = stepCounts['external_apply_click'] || 0;
    const service_browses = stepCounts['service_browse'] || 0;
    const bookings_started = stepCounts['booking_slot_start'] || 0;
    const bookings_completed = stepCounts['booking_slot_completed'] || 0;

    const search_to_view =
      searches > 0 ? Number(((views / searches) * 100).toFixed(1)) : 0;
    const view_to_eligibility =
      views > 0 ? Number(((eligibility_checks / views) * 100).toFixed(1)) : 0;
    const eligibility_to_apply =
      eligibility_checks > 0
        ? Number(((external_applies / eligibility_checks) * 100).toFixed(1))
        : 0;
    const browse_to_booking =
      service_browses > 0
        ? Number(((bookings_completed / service_browses) * 100).toFixed(1))
        : 0;

    return {
      period_days: validDays,
      total_events: totalEventsCount,
      total_sessions: distinctSessions.length,
      funnel: {
        searches,
        views,
        eligibility_checks,
        saves,
        external_applies,
        service_browses,
        bookings_started,
        bookings_completed,
      },
      conversion_rates: {
        search_to_view,
        view_to_eligibility,
        eligibility_to_apply,
        browse_to_booking,
      },
      top_search_queries: (topQueriesRaw || []).map((q) => ({
        query: q.query || '',
        count: Number(q.count || 0),
      })),
      top_viewed_opportunities: (topOpportunitiesRaw || []).map((o) => ({
        id: o.id || '',
        count: Number(o.count || 0),
      })),
    };
  }
}
