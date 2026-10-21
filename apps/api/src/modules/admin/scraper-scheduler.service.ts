import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ScrapersAdminService } from './scrapers-admin.service.js';

const HOUR_MS = 3_600_000;

/**
 * Periodically triggers scrapers whose interval has elapsed.
 * Checks 45 seconds after start-up, then every hour.
 */
@Injectable()
export class ScraperSchedulerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ScraperSchedulerService.name);
  private timers: NodeJS.Timeout[] = [];
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly scrapersService: ScrapersAdminService,
  ) {}

  onApplicationBootstrap(): void {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.INGESTION_SCHEDULER === 'off'
    ) {
      this.logger.log('Ingestion scheduler is disabled (test or INGESTION_SCHEDULER=off)');
      return;
    }

    this.logger.log('Ingestion scheduler enabled: hourly checks active');
    this.timers.push(
      setTimeout(() => void this.runDueScrapers(), 45_000).unref(),
      setInterval(() => void this.runDueScrapers(), HOUR_MS).unref(),
    );
  }

  onApplicationShutdown(): void {
    this.timers.forEach(clearTimeout);
  }

  /**
   * Scan active scrape_sources and trigger any source whose interval has passed.
   */
  async runDueScrapers(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Previous scraper scheduler run is still in progress, skipping');
      return;
    }

    this.isRunning = true;
    try {
      const activeSources = await this.prisma.scrape_sources.findMany({
        where: { is_active: true },
      });

      const now = Date.now();
      const dueSources = activeSources.filter((source) => {
        if (!source.last_run_at) return true; // never run before
        const elapsed = now - source.last_run_at.getTime();
        const requiredInterval = (source.interval_hours || 6) * HOUR_MS;
        return elapsed >= requiredInterval;
      });

      if (dueSources.length === 0) {
        this.logger.debug('No scraper sources due for execution');
        return;
      }

      this.logger.log(
        `Found ${dueSources.length} scraper source(s) due for scheduled execution: ${dueSources.map((s) => s.key).join(', ')}`,
      );

      for (const source of dueSources) {
        try {
          const res = await this.scrapersService.triggerSource(source.id);
          this.logger.log(
            `Scheduled run for '${source.key}': ${res.message} (found: ${res.items_found ?? 0}, new: ${res.new_items ?? 0})`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed scheduled run for '${source.key}': ${msg}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Scraper scheduler error: ${msg}`);
    } finally {
      this.isRunning = false;
    }
  }
}
