import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import type {
  LinkHealthCheckItem,
  LinkHealthReport,
} from '@applyfields/types';
import { PrismaService } from '../../prisma/prisma.service.js';

const DAY_MS = 86_400_000;

@Injectable()
export class LinkHealthService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(LinkHealthService.name);
  private timers: NodeJS.Timeout[] = [];
  private lastReport: LinkHealthReport | null = null;
  private isChecking = false;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap(): void {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.LINK_HEALTH === 'off'
    ) {
      this.logger.log('Link health worker disabled (test or LINK_HEALTH=off)');
      return;
    }

    // Run first check 2 minutes after startup, then daily
    this.timers.push(
      setTimeout(() => void this.runHealthCheck(30), 120_000).unref(),
      setInterval(() => void this.runHealthCheck(100), DAY_MS).unref(),
    );
  }

  onApplicationShutdown(): void {
    this.timers.forEach(clearTimeout);
  }

  /**
   * Return latest cached health report or an empty initial report.
   */
  getLatestReport(): LinkHealthReport {
    return (
      this.lastReport ?? {
        checked_count: 0,
        broken_count: 0,
        healthy_count: 0,
        checked_at: new Date().toISOString(),
        broken_links: [],
      }
    );
  }

  /**
   * Checks HTTP status for an external URL using HEAD request with GET fallback.
   */
  private async checkUrl(
    url: string,
  ): Promise<{ ok: boolean; status: number | null; error?: string }> {
    try {
      // Try HEAD first
      let res = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'ApplyFieldsBot/0.1 (+https://applyfields.in/bot)',
        },
        signal: AbortSignal.timeout(6000),
      });

      // Some government websites block HEAD requests or return 405 Method Not Allowed
      if (res.status === 405) {
        res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'ApplyFieldsBot/0.1 (+https://applyfields.in/bot)',
            Range: 'bytes=0-100',
          },
          signal: AbortSignal.timeout(6000),
        });
      }

      return {
        ok: res.status >= 200 && res.status < 400,
        status: res.status,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: null,
        error: msg,
      };
    }
  }

  /**
   * Run health checks on published opportunities with live links.
   */
  async runHealthCheck(limit = 50): Promise<LinkHealthReport> {
    if (this.isChecking) {
      this.logger.debug('Link health check already in progress');
      return this.getLatestReport();
    }

    this.isChecking = true;
    try {
      const opportunities = await this.prisma.opportunities.findMany({
        where: {
          status: 'published',
          OR: [
            { apply_url: { not: null } },
            { notification_pdf_url: { not: null } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          apply_url: true,
          notification_pdf_url: true,
        },
        orderBy: { last_verified_at: 'asc' }, // oldest verified first
        take: limit,
      });

      const brokenLinks: LinkHealthCheckItem[] = [];
      let healthyCount = 0;

      for (const opp of opportunities) {
        let applyOk = true;
        let applyStatus: number | null = 200;
        let pdfOk = true;
        let pdfStatus: number | null = 200;
        let errorMsg: string | null = null;

        if (opp.apply_url) {
          const res = await this.checkUrl(opp.apply_url);
          applyOk = res.ok;
          applyStatus = res.status;
          if (!res.ok) errorMsg = res.error ?? `HTTP ${res.status}`;
        }

        if (opp.notification_pdf_url) {
          const res = await this.checkUrl(opp.notification_pdf_url);
          pdfOk = res.ok;
          pdfStatus = res.status;
          if (!res.ok && !errorMsg) errorMsg = res.error ?? `HTTP ${res.status}`;
        }

        const isHealthy = applyOk && pdfOk;
        if (isHealthy) {
          healthyCount++;
        } else {
          brokenLinks.push({
            opportunity_id: opp.id,
            title: opp.title,
            slug: opp.slug,
            status: opp.status,
            apply_url: opp.apply_url,
            apply_url_status: applyStatus,
            apply_url_ok: applyOk,
            pdf_url: opp.notification_pdf_url,
            pdf_url_status: pdfStatus,
            pdf_url_ok: pdfOk,
            last_checked_at: new Date().toISOString(),
            error: errorMsg,
          });
        }

        // Update verification timestamp in DB
        await this.prisma.opportunities
          .update({
            where: { id: opp.id },
            data: { last_verified_at: new Date() },
          })
          .catch(() => {});
      }

      this.lastReport = {
        checked_count: opportunities.length,
        broken_count: brokenLinks.length,
        healthy_count: healthyCount,
        checked_at: new Date().toISOString(),
        broken_links: brokenLinks,
      };

      if (brokenLinks.length > 0) {
        this.logger.warn(
          `Link health check found ${brokenLinks.length} broken link(s) out of ${opportunities.length} checked`,
        );
      } else {
        this.logger.log(
          `Link health check passed: all ${opportunities.length} links operational`,
        );
      }

      return this.lastReport;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Link health check failed: ${msg}`);
      return this.getLatestReport();
    } finally {
      this.isChecking = false;
    }
  }
}
