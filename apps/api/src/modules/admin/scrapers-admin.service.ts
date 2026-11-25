import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ReextractResponse,
  ScrapeSourceItem,
  ScrapeSourcesListResponse,
  ScrapeSourceRunsResponse,
  ScrapeTriggerResponse,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ScrapersAdminService {
  private readonly logger = new Logger(ScrapersAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all scraping sources with health status, last run and document counts.
   */
  async listSources(): Promise<ScrapeSourcesListResponse> {
    // Totals across every scraped notice: what the AI filled, what needs hand work, and
    // where the resulting opportunities are (waiting in /review or already on the site).
    const totalsQuery = this.prisma.$queryRaw<ScrapeSourcesListResponse['documents'][]>`
      select count(*)::int as total,
             count(*) filter (where d.extraction is not null)::int as ai_filled,
             count(*) filter (where d.error is not null)::int as needs_manual,
             count(distinct o.id) filter (where o.status = 'draft')::int as drafts_waiting,
             count(distinct o.id) filter (where o.status in ('published', 'closed'))::int as published
      from scraped_documents d
      left join opportunities o on o.id = d.opportunity_id`;

    const sourcesQuery = this.prisma.scrape_sources.findMany({
      orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
      include: {
        organizations: {
          select: { name: true },
        },
        scrape_runs: {
          orderBy: { started_at: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            scrape_runs: true,
            scraped_documents: true,
          },
        },
      },
    });

    const [sources, [documents]] = await Promise.all([sourcesQuery, totalsQuery]);
    const now = Date.now();
    let healthyCount = 0;
    let failingCount = 0;
    let staleCount = 0;
    let activeCount = 0;

    const items: ScrapeSourceItem[] = sources.map((s) => {
      if (s.is_active) activeCount++;

      // Compute health
      let health: 'healthy' | 'failing' | 'stale' | 'idle' | 'disabled' = 'idle';
      if (!s.is_active) {
        health = 'disabled';
      } else if (s.consecutive_failures > 0) {
        health = 'failing';
        failingCount++;
      } else if (
        s.last_run_at &&
        now - s.last_run_at.getTime() > s.interval_hours * 2 * 3_600_000
      ) {
        health = 'stale';
        staleCount++;
      } else if (s.last_success_at) {
        health = 'healthy';
        healthyCount++;
      }

      const latestRun = s.scrape_runs[0]
        ? {
            id: s.scrape_runs[0].id,
            source_id: s.scrape_runs[0].source_id,
            status: s.scrape_runs[0].status as any,
            started_at: s.scrape_runs[0].started_at.toISOString(),
            finished_at: s.scrape_runs[0].finished_at?.toISOString() ?? null,
            items_found: s.scrape_runs[0].items_found,
            new_items: s.scrape_runs[0].new_items,
            error: s.scrape_runs[0].error,
          }
        : null;

      return {
        id: s.id,
        key: s.key,
        name: s.name,
        organization_id: s.organization_id,
        organization_name: s.organizations?.name ?? null,
        list_url: s.list_url,
        kind: s.kind,
        is_active: s.is_active,
        interval_hours: s.interval_hours,
        last_run_at: s.last_run_at?.toISOString() ?? null,
        last_success_at: s.last_success_at?.toISOString() ?? null,
        consecutive_failures: s.consecutive_failures,
        health,
        latest_run: latestRun,
        total_runs: s._count.scrape_runs,
        total_documents: s._count.scraped_documents,
      };
    });

    return {
      sources: items,
      summary: {
        total: sources.length,
        active: activeCount,
        healthy: healthyCount,
        failing: failingCount,
        stale: staleCount,
      },
      documents,
    };
  }

  /**
   * Get run history for one source.
   */
  async getSourceRuns(sourceId: string, limit = 20): Promise<ScrapeSourceRunsResponse> {
    const source = await this.prisma.scrape_sources.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new NotFoundException(`Scraper source ${sourceId} not found`);
    }

    const [runs, total] = await Promise.all([
      this.prisma.scrape_runs.findMany({
        where: { source_id: sourceId },
        orderBy: { started_at: 'desc' },
        take: limit,
      }),
      this.prisma.scrape_runs.count({
        where: { source_id: sourceId },
      }),
    ]);

    return {
      source_id: source.id,
      key: source.key,
      name: source.name,
      runs: runs.map((r) => ({
        id: r.id,
        source_id: r.source_id,
        status: r.status as any,
        started_at: r.started_at.toISOString(),
        finished_at: r.finished_at?.toISOString() ?? null,
        items_found: r.items_found,
        new_items: r.new_items,
        error: r.error,
      })),
      total,
    };
  }

  /**
   * Trigger a scrape run for a registered source by calling the ingestion service.
   */
  async triggerSource(sourceId: string, _actorId?: string): Promise<ScrapeTriggerResponse> {
    const source = await this.prisma.scrape_sources.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new NotFoundException(`Scraper source ${sourceId} not found`);
    }

    if (!source.is_active) {
      throw new BadRequestException(`Scraper source '${source.name}' is inactive`);
    }

    const res = await this.postToIngestion(`/scrape/${source.key}`, 60_000);
    if (!res.ok) return { success: false, message: res.message, source_key: source.key };
    const payload = res.payload;
    return {
      success: true,
      message: `Scrape run completed with status '${payload.status ?? 'success'}'`,
      source_key: source.key,
      run_id: payload.run_id,
      status: payload.status,
      items_found: payload.items_found,
      new_items: payload.new_items,
      duplicates: payload.duplicates,
      failed_items: payload.failed_items,
    };
  }

  /** Re-read a draft's notification (Groq) and refill its fields — session 05 "Re-extract". */
  async reextract(opportunityId: string): Promise<ReextractResponse> {
    // Groq can wait up to 60 s on its free-tier rate limit, plus the request itself.
    const res = await this.postToIngestion(`/extract/${opportunityId}`, 180_000);
    if (!res.ok) return { success: false, message: res.message };
    const { extracted, confidence, error } = res.payload;
    return extracted
      ? { success: true, message: 'Fields refilled from the notification.', confidence }
      : { success: false, message: error || 'Nothing could be read from the notification.' };
  }

  private async postToIngestion(
    path: string,
    timeoutMs: number,
  ): Promise<{ ok: true; payload: Record<string, any> } | { ok: false; message: string }> {
    const base = (process.env.INGESTION_URL || 'http://localhost:8000').replace(/\/$/, '');
    const targetUrl = `${base}${path}`;
    this.logger.log(`Calling ingestion: POST ${targetUrl}`);
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        const errorText = (await res.text()).slice(0, 200);
        this.logger.warn(`Ingestion responded ${res.status}: ${errorText}`);
        return { ok: false, message: `Ingestion failed (${res.status}): ${errorText}` };
      }
      return { ok: true, payload: (await res.json()) as Record<string, any> };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to reach ingestion service at ${targetUrl}: ${msg}`);
      return { ok: false, message: `Could not reach ingestion service: ${msg}` };
    }
  }
}
