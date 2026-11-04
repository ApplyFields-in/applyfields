import { Injectable, Logger } from '@nestjs/common';
import type { ChatbotObservabilityMetrics } from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ChatbotFeedbackDto } from './chatbot.schemas.js';

/** Counted against the daily quota. Greetings/off-topic use CHATBOT_FREE_EVENT so they never count. */
export const CHATBOT_QUERY_EVENT = 'chatbot_query';
export const CHATBOT_FREE_EVENT = 'chatbot_free_reply';
const FEEDBACK_EVENT = 'chatbot_feedback';
const WINDOW_DAYS = 30;
// ponytail: flat per-call estimate for claude-haiku-5-5 (~1.5k in / 300 out). Use logged usage tokens if cost matters.
const EST_LLM_CALL_USD = 0.0003;

export interface ChatbotQueryLog {
  query: string;
  mode: 'deterministic' | 'rag' | 'llm' | 'fallback' | 'limit_reached';
  latency_ms: number;
  opportunity_slug?: string | null;
  is_unanswered: boolean;
  is_cached: boolean;
  /** userId, or a hashed IP for guests. Stored in analytics_events.session_id and used for the quota. */
  quota_key: string;
  counts_quota: boolean;
}

/** All chatbot state lives in analytics_events, so it survives deploys and is shared by every API instance. */
@Injectable()
export class ChatbotAnalyticsService {
  private readonly logger = new Logger('ChatbotAnalyticsService');

  constructor(private readonly prisma: PrismaService) {}

  async logQuery(entry: ChatbotQueryLog): Promise<void> {
    try {
      await this.prisma.analytics_events.create({
        data: {
          session_id: entry.quota_key,
          event_name: entry.counts_quota ? CHATBOT_QUERY_EVENT : CHATBOT_FREE_EVENT,
          entity_type: 'opportunity',
          entity_id: entry.opportunity_slug || 'general',
          metadata: {
            query: entry.query.slice(0, 300),
            mode: entry.mode,
            latency_ms: entry.latency_ms,
            is_unanswered: entry.is_unanswered,
            is_cached: entry.is_cached,
          },
        },
      });
    } catch (err: any) {
      // Telemetry must never break a chat reply. Fails open: an unlogged query is not counted.
      this.logger.warn(`chatbot_query log failed: ${err.message}`);
    }
  }

  /** Queries counted against the quota for this key since `since` (IST midnight). */
  async countQueriesSince(quotaKey: string, since: Date): Promise<number> {
    return this.prisma.analytics_events.count({
      where: { event_name: CHATBOT_QUERY_EVENT, session_id: quotaKey, created_at: { gte: since } },
    });
  }

  async recordFeedback(dto: ChatbotFeedbackDto): Promise<void> {
    try {
      await this.prisma.analytics_events.create({
        data: {
          event_name: FEEDBACK_EVENT,
          entity_type: 'opportunity',
          entity_id: dto.opportunity_slug || 'general',
          metadata: { query: dto.query.slice(0, 300), rating: dto.rating, comments: dto.comments || '' },
        },
      });
    } catch (err: any) {
      this.logger.warn(`chatbot_feedback log failed: ${err.message}`);
    }
  }

  /** Real numbers only, last 30 days. An empty system shows zeros, never sample data. */
  async getObservabilityMetrics(): Promise<ChatbotObservabilityMetrics> {
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);

    const [totals, unanswered, feedback, recent] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ total: number; fast: number; llm: number; cached: number; avg_latency: number }>
      >`
        select count(*)::int as total,
               count(*) filter (where metadata->>'mode' = 'deterministic' or (metadata->>'is_cached')::boolean)::int as fast,
               count(*) filter (where metadata->>'mode' in ('llm', 'rag'))::int as llm,
               count(*) filter (where (metadata->>'is_cached')::boolean)::int as cached,
               coalesce(round(avg((metadata->>'latency_ms')::numeric)), 0)::int as avg_latency
        from analytics_events
        where event_name in (${CHATBOT_QUERY_EVENT}, ${CHATBOT_FREE_EVENT}) and created_at >= ${since}
      `,
      this.prisma.$queryRaw<Array<{ query: string; count: number; slug: string | null; last: Date }>>`
        select lower(metadata->>'query') as query, count(*)::int as count,
               max(entity_id) as slug, max(created_at) as last
        from analytics_events
        where event_name = ${CHATBOT_QUERY_EVENT} and (metadata->>'is_unanswered')::boolean
          and created_at >= ${since}
        group by 1 order by 2 desc, 4 desc limit 10
      `,
      this.prisma.$queryRaw<Array<{ helpful: number; unhelpful: number }>>`
        select count(*) filter (where metadata->>'rating' = 'helpful')::int as helpful,
               count(*) filter (where metadata->>'rating' = 'unhelpful')::int as unhelpful
        from analytics_events
        where event_name = ${FEEDBACK_EVENT} and created_at >= ${since}
      `,
      this.prisma.analytics_events.findMany({
        where: { event_name: { in: [CHATBOT_QUERY_EVENT, CHATBOT_FREE_EVENT] } },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
    ]);

    const t = totals[0] ?? { total: 0, fast: 0, llm: 0, cached: 0, avg_latency: 0 };
    const f = feedback[0] ?? { helpful: 0, unhelpful: 0 };
    const ratings = f.helpful + f.unhelpful;
    const slug = (s: string | null) => (s && s !== 'general' ? s : undefined);

    return {
      total_queries: t.total,
      fast_path_count: t.fast,
      llm_count: t.llm,
      cache_hits: t.cached,
      fast_path_percentage: t.total ? Math.round((t.fast / t.total) * 100) : 0,
      avg_latency_ms: t.avg_latency,
      estimated_cost_saved_usd: Number((t.fast * EST_LLM_CALL_USD).toFixed(2)),
      satisfaction_rate: ratings ? Math.round((f.helpful / ratings) * 100) : 0,
      ratings_count: ratings,
      helpful_count: f.helpful,
      unhelpful_count: f.unhelpful,
      top_unanswered_questions: unanswered.map((u) => ({
        query: u.query,
        count: u.count,
        opportunity_slug: slug(u.slug),
        last_asked_at: new Date(u.last).toISOString(),
      })),
      recent_queries: recent.map((r) => {
        const m = (r.metadata ?? {}) as Record<string, any>;
        return {
          id: r.id,
          query: String(m.query ?? ''),
          mode: m.mode ?? 'deterministic',
          latency_ms: Number(m.latency_ms ?? 0),
          opportunity_slug: slug(r.entity_id),
          is_unanswered: !!m.is_unanswered,
          is_cached: !!m.is_cached,
          created_at: r.created_at.toISOString(),
        };
      }),
    };
  }
}
