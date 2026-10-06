import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { OpportunitiesAdminService } from './opportunities-admin.service.js';

const HOUR_MS = 3_600_000;

/**
 * Closes published jobs whose last date has passed: shortly after start-up, then every hour.
 * Idempotent, so running several API instances (or a manual run) is harmless.
 */
@Injectable()
export class ExpiryService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ExpiryService.name);
  private timers: NodeJS.Timeout[] = [];

  constructor(private readonly opportunities: OpportunitiesAdminService) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test' || process.env.AUTO_CLOSE === 'off') return;
    this.timers.push(setTimeout(() => void this.run(), 30_000).unref(), setInterval(() => void this.run(), HOUR_MS).unref());
  }

  onApplicationShutdown(): void {
    this.timers.forEach(clearTimeout);
  }

  private async run(): Promise<void> {
    try {
      const { closed } = await this.opportunities.closeExpired();
      if (closed) this.logger.log(`Closed ${closed} expired opportunit${closed === 1 ? 'y' : 'ies'}`);
    } catch (err) {
      this.logger.warn(`Auto-close failed: ${(err as Error).message}`);
    }
  }
}
