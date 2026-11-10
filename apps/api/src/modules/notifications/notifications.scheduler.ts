import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { recordJobRun } from '../../common/job-runs.js';

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
  private lastDigestCycle: string | null = null;

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
      let created = 0;
      if (isDaytimeIst()) {
        created = await this.notifications.runReminders();
        created += await this.notifications.runOpenReminders();
        if (created) this.logger.log(`Created ${created} reminder${created === 1 ? '' : 's'}`);
      }
      this.notifications.kick();

      // Check for Daily 3-Slot Personalized Cadence (09:00 Morning, 14:00 Afternoon, 19:00 Evening IST)
      const now = new Date();
      const istHours = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
      const istDate = new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

      let activeSlot: 'morning' | 'afternoon' | 'evening' | null = null;
      if (istHours >= 9 && istHours < 12) {
        activeSlot = 'morning';
      } else if (istHours >= 14 && istHours < 17) {
        activeSlot = 'afternoon';
      } else if (istHours >= 19 && istHours < 22) {
        activeSlot = 'evening';
      }

      recordJobRun('notifications', true, `${created} reminder${created === 1 ? '' : 's'} created`);
      if (activeSlot) {
        const slotKey = `${istDate}-${activeSlot}`;
        if (this.lastDigestCycle !== slotKey) {
          this.lastDigestCycle = slotKey;
          const dispatched = await this.notifications.runDailyCadence(activeSlot);
          if (dispatched) {
            this.logger.log(`Dispatched ${activeSlot} cadence notifications to ${dispatched} candidates`);
          }
        }
      }
    } catch (err) {
      recordJobRun('notifications', false, (err as Error).message);
      this.logger.warn(`Scheduler run failed: ${(err as Error).message}`);
    }
  }
}
