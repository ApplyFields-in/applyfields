import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
  type OnModuleDestroy,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { recordJobRun } from '../../common/job-runs.js';
import { schedulerOff } from '../../common/schedulers.js';
import { createPushWorker } from './push-queue.js';

const TICK_MS = 15 * 60_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;

/** Reminders only go out 08:00–21:00 India time, so nobody gets a 3 a.m. email. */
export const isDaytimeIst = (now = new Date()) => {
  const h = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
  return h >= 8 && h < 21;
};

/**
 * Every 15 minutes: create due reminders, then send queued emails (retries included).
 * Same timer pattern as ExpiryService; off when NODE_ENV=test, SCHEDULERS=off or NOTIFICATIONS=off.
 */
@Injectable()
export class NotificationsScheduler implements OnApplicationBootstrap, OnModuleDestroy, OnApplicationShutdown {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private timers: NodeJS.Timeout[] = [];
  private lastDigestCycle: string | null = null;
  private pushWorker: ReturnType<typeof createPushWorker> = null;

  constructor(private readonly notifications: NotificationsService) {}

  onApplicationBootstrap(): void {
    // Push consumer has its own switch (PUSH_WORKER=off), so a push-only worker can run with SCHEDULERS=off.
    this.pushWorker = createPushWorker((rows) => this.notifications.dispatchPush(rows));
    this.pushWorker?.on('failed', (job, err) => this.logger.warn(`Push job ${job?.id} failed: ${err.message}`));
    if (this.pushWorker) this.logger.log('Push queue worker started');
    if (schedulerOff('NOTIFICATIONS')) return;
    this.timers.push(
      setTimeout(() => void this.run(), 45_000).unref(),
      setInterval(() => void this.run(), TICK_MS).unref(),
      // Scheduled broadcasts (festival greetings) go out within a minute of their time.
      setInterval(() => void this.runBroadcasts(), 60_000).unref(),
    );
  }

  /** Finishes the push job in hand before Prisma disconnects; waiting jobs stay in Redis. */
  async onModuleDestroy(): Promise<void> {
    await this.pushWorker?.close();
  }

  onApplicationShutdown(): Promise<void> {
    this.timers.forEach(clearTimeout);
    return this.notifications.flushPush(); // pushes already queued still go out
  }

  private async runBroadcasts(): Promise<void> {
    try {
      const sent = await this.notifications.runScheduledBroadcasts();
      if (sent) this.logger.log(`Sent ${sent} scheduled broadcast${sent === 1 ? '' : 's'}`);
    } catch (err) {
      this.logger.warn(`Scheduled broadcasts failed: ${(err as Error).message}`);
    }
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
