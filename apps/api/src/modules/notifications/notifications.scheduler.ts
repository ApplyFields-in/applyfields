import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';

const TICK_MS = 15 * 60_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;

/** Reminders only go out 08:00–21:00 India time, so nobody gets a 3 a.m. email. */
export const isDaytimeIst = (now = new Date()) => {
  const h = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
  return h >= 8 && h < 21;
};

/**
 * Every 15 minutes: create due reminders, then send queued emails (retries included).
 * Same timer pattern as ExpiryService; off when NODE_ENV=test or NOTIFICATIONS=off.
 */
@Injectable()
export class NotificationsScheduler implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private timers: NodeJS.Timeout[] = [];

  constructor(private readonly notifications: NotificationsService) {}

  onApplicationBootstrap(): void {
    if (process.env.NODE_ENV === 'test' || process.env.NOTIFICATIONS === 'off') return;
    this.timers.push(
      setTimeout(() => void this.run(), 45_000).unref(),
      setInterval(() => void this.run(), TICK_MS).unref(),
    );
  }

  onApplicationShutdown(): void {
    this.timers.forEach(clearTimeout);
  }

  private async run(): Promise<void> {
    try {
      if (isDaytimeIst()) {
        const created = await this.notifications.runReminders();
        if (created) this.logger.log(`Created ${created} reminder${created === 1 ? '' : 's'}`);
      }
      this.notifications.kick();
    } catch (err) {
      this.logger.warn(`Reminders failed: ${(err as Error).message}`);
    }
  }
}
