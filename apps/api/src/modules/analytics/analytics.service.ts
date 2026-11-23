import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AnalyticsEventInput,
  AnalyticsFunnelSummary,
  AnalyticsOverview,
} from '@applyfields/types';

const COLLEGE_TYPES = new Set(['college', 'university', 'training_institute']);

/** Fills the days with no rows, so the chart has one bar per day (IST dates). */
function everyDay(rows: Array<{ day: string; count: bigint | number }>, days: number): Array<{ day: string; count: number }> {
  const by = new Map(rows.map((r) => [r.day, Number(r.count)]));
  const out: Array<{ day: string; count: number }> = [];
  const istToday = new Date(Date.now() + 5.5 * 3600_000);
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(istToday.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day, count: by.get(day) ?? 0 });
  }
  return out;
}

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

  /** People, visits, partners and bookings for the admin Analytics page. */
  async getOverview(days = 30): Promise<AnalyticsOverview> {
    const d = Math.max(1, Math.min(90, days || 30));
    const since = new Date(Date.now() - d * 86_400_000);
    const ist = (col: string) => `to_char((${col} at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD')`;

    const [total, fresh, active, signups, views, visitors, viewsByDay, topPages, partners, bookings, completed, published, events] =
      await Promise.all([
        this.prisma.users.count({ where: { deleted_at: null } }),
        this.prisma.users.count({ where: { deleted_at: null, created_at: { gte: since } } }),
        this.prisma.users.count({ where: { deleted_at: null, last_login_at: { gte: since } } }),
        this.prisma.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
          `select ${ist('created_at')} as day, count(*) as count from users
           where deleted_at is null and created_at >= $1 group by 1`,
          since,
        ),
        this.prisma.analytics_events.count({ where: { event_name: 'page_view', created_at: { gte: since } } }),
        this.prisma.$queryRaw<Array<{ n: bigint }>>`
          select count(distinct session_id) as n from analytics_events
          where event_name = 'page_view' and created_at >= ${since}`,
        this.prisma.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
          `select ${ist('created_at')} as day, count(*) as count from analytics_events
           where event_name = 'page_view' and created_at >= $1 group by 1`,
          since,
        ),
        this.prisma.$queryRaw<Array<{ site: string | null; path: string | null; views: bigint }>>`
          select metadata->>'site' as site, metadata->>'path' as path, count(*) as views from analytics_events
          where event_name = 'page_view' and created_at >= ${since}
          group by 1, 2 order by views desc limit 10`,
        this.prisma.partners.groupBy({ by: ['type', 'verification_status'], _count: { _all: true } }),
        this.prisma.service_requests.count({ where: { created_at: { gte: since } } }),
        this.prisma.service_requests.count({ where: { created_at: { gte: since }, status: 'completed' } }),
        this.prisma.opportunities.count({ where: { status: 'published' } }),
        this.prisma.analytics_events.groupBy({
          by: ['event_name'],
          where: { event_name: { in: ['opportunity_view', 'opportunity_save'] }, created_at: { gte: since } },
          _count: { _all: true },
        }),
      ]);

    const blank = () => ({ pending: 0, verified: 0, rejected: 0 });
    const byKind = { centres: blank(), colleges: blank() };
    for (const p of partners) {
      const st = p.verification_status;
      if (st === 'suspended') continue; // shown on the Partners page, not in these three columns
      byKind[COLLEGE_TYPES.has(p.type) ? 'colleges' : 'centres'][st] += p._count._all;
    }
    const ev = (name: string) => events.find((e) => e.event_name === name)?._count._all ?? 0;

    return {
      period_days: d,
      users: { total, new: fresh, active, signups_by_day: everyDay(signups, d) },
      visits: {
        page_views: views,
        visitors: Number(visitors[0]?.n ?? 0),
        views_by_day: everyDay(viewsByDay, d),
        top_pages: topPages.map((r) => ({ site: r.site ?? 'web', path: r.path ?? '/', views: Number(r.views) })),
      },
      partners: byKind,
      bookings: { total: bookings, completed },
      opportunities: { published, views: ev('opportunity_view'), saves: ev('opportunity_save') },
    };
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
