import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Logger, NotFoundException, type OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import type {
  AdminBroadcastInput,
  AdminBroadcastResult,
  AdminNotificationOverview,
  DeliveryStatus,
  DeviceTokenInput,
  ManualAlertInput,
  ManualAlertResult,
  MutableNotificationType,
  NotificationList,
  NotificationPreferences,
  NotificationPreferencesInput,
  NotificationType,
  PushPublicKeyResponse,
  PushSubscriptionInput,
  ScheduledBroadcastItem,
  ScheduledBroadcastStatus,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import type { staff_role } from '../../generated/prisma/enums.js';
import { jwtAccessSecret } from '../../common/jwt-secret.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { addDays, todayIst } from '../opportunities/opportunities.service.js';
import { renderEmail, sendWithResend, senderFor, SENDERS } from './email.js';
import { EXPO_BATCH, isExpoPushToken, sendExpoPushBatch } from './expo-push.js';
import { getVapidKeys, sendWebPush, type PushResult } from './web-push.js';
import { createPushQueue, PUSH_JOB_OPTS, type PushJob, type PushRow } from './push-queue.js';
import { SseService } from './sse.service.js';
import {
  DEFAULT_REMINDER_DAYS,
  MAX_REMINDER_DAYS,
  MUTABLE_TYPES,
  notificationTypeForUpdate,
  opportunityPath,
  reminderBucket,
  reminderKey,
  updateKey,
  wantsType,
} from './notification-rules.js';

const DAY_MS = 86_400_000;
/** Users per notify round trip: keeps IN-lists and insert batches a sane size. */
export const NOTIFY_CHUNK = 1000;
/** Browser pushes in flight at once. */
const PUSH_CONCURRENCY = 20;
const MAX_ATTEMPTS = 3;
const RETRY_AFTER_MS = 5 * 60_000;
/** Resend's default limit is 2 requests/second. */
const SEND_GAP_MS = 550;

const webUrl = () => (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
/** Staff alerts link to the admin website; the admin app maps the same paths to its own screens. */
export const adminLink = (path: string) =>
  `${(process.env.ADMIN_URL ?? 'https://applyfields-admin.vercel.app').replace(/\/$/, '')}${path}`;
const apiPublicUrl = () => (process.env.API_PUBLIC_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
/** A different secret from login tokens, so an unsubscribe link can never be used to log in. */
const unsubscribeSecret = () => `${jwtAccessSecret()}:unsubscribe`;
const isoDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Prisma `subscriptions` filter for "has ApplyFields Plus right now". A cancelled Plus keeps working until the
 * end of the month already paid for (ends_at).
 */
export const plusActive = () => ({
  OR: [
    { status: 'active' as const, ends_at: null },
    { status: { in: ['active' as const, 'cancelled' as const] }, ends_at: { gt: new Date() } },
  ],
});

export interface NewNotification {
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  item_type?: 'opportunity' | 'service' | null;
  item_id?: string | null;
  /** false = in-app only (admin "in-app only" broadcasts). Default: push too. */
  push?: boolean;
  /** Muted under this switch instead of its type (the daily messages). */
  mute_key?: MutableNotificationType;
}

/** One notification for one user (each user may get a different payload). */
export interface NotifyItem {
  userId: string;
  n: NewNotification;
  key: string | null;
}

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  /** In-process fallback when REDIS_URL is unset (local dev, tests). */
  private pushQueue: Promise<void> = Promise.resolve();
  /** Redis-backed push queue: survives restarts and can run on a separate worker. */
  private readonly redisQueue = createPushQueue();
  private sending: Promise<void> | null = null;
  private sendAgain = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sse: SseService,
  ) {}

  /**
   * One in-app notification per user, plus real-time SSE toast and push (browser web push / phone
   * Expo push) where allowed. Never email: email and SMS are only for sign-up and password-reset
   * codes (AuthService.sendOtp). Users who muted the type are skipped; anyone already notified
   * under the same dedupe key is skipped by the database.
   * Returns how many notifications were created.
   */
  async notify(userIds: string[], n: NewNotification, key: (userId: string) => string | null): Promise<number> {
    return this.notifyMany([...new Set(userIds)].map((userId) => ({ userId, n, key: key(userId) })));
  }

  /**
   * Decisions about the person's own account (partner approved / rejected): notify() plus one email,
   * the one exception to "no notification emails". Only to a verified address, and never to someone
   * who turned email off. Nothing is resent if the key was already used.
   */
  async notifyAccount(userIds: string[], n: NewNotification, key: string): Promise<number> {
    const created = await this.notify(userIds, n, () => key);
    if (created === 0) return 0;
    const rows = await this.prisma.notifications.findMany({
      where: {
        user_id: { in: userIds },
        dedupe_key: key,
        notification_deliveries: { none: { channel: 'email' } },
        users: { email: { not: null }, email_verified_at: { not: null } },
      },
      select: { id: true, user_id: true },
    });
    const off = await this.prisma.notification_preferences.findMany({
      where: { user_id: { in: rows.map((r) => r.user_id) }, email_enabled: false },
      select: { user_id: true },
    });
    const optedOut = new Set(off.map((p) => p.user_id));
    const emails = rows.filter((r) => !optedOut.has(r.user_id));
    if (emails.length) {
      await this.prisma.notification_deliveries.createMany({
        data: emails.map((r) => ({ notification_id: r.id, channel: 'email' as const })),
      });
      this.kick();
    }
    return created;
  }

  /**
   * notify() where every user can get their own payload (e.g. “Hi {name}”). Works in chunks of
   * NOTIFY_CHUNK users, so 1 lakh users is ~100 batched round trips instead of 1 lakh single ones.
   */
  async notifyMany(items: NotifyItem[]): Promise<number> {
    let created = 0;
    for (let i = 0; i < items.length; i += NOTIFY_CHUNK) {
      created += await this.notifyChunk(items.slice(i, i + NOTIFY_CHUNK));
    }
    return created;
  }

  private async notifyChunk(items: NotifyItem[]): Promise<number> {
    const ids = [...new Set(items.map((i) => i.userId))];
    if (ids.length === 0) return 0;
    const [users, prefs] = await Promise.all([
      this.prisma.users.findMany({
        where: { id: { in: ids }, status: 'active', deleted_at: null },
        select: { id: true },
      }),
      this.prisma.notification_preferences.findMany({
        where: { user_id: { in: ids } },
        select: { user_id: true, push_enabled: true, muted_types: true },
      }),
    ]);
    const active = new Set(users.map((u) => u.id));
    const prefBy = new Map(prefs.map((p) => [p.user_id, p]));
    const targets = items.filter(
      (i) => active.has(i.userId) && wantsType(prefBy.get(i.userId)?.muted_types ?? [], i.n.mute_key ?? i.n.type),
    );
    if (targets.length === 0) return 0;

    // The returned rows carry their own payload, so per-user titles reach SSE and push unchanged.
    const created = await this.prisma.notifications.createManyAndReturn({
      data: targets.map(({ userId, n, key }) => ({
        user_id: userId,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        item_type: n.item_type ?? null,
        item_id: n.item_id ?? null,
        dedupe_key: key,
      })),
      skipDuplicates: true,
      select: { id: true, user_id: true, type: true, title: true, body: true, link: true },
    });

    // 1. Instant in-app toasts (SSE) to open browser tabs.
    // ponytail: SSE only reaches tabs connected to this process. With several API instances, rows
    // created by the scheduler worker show up on the next list refresh and as push, not as a toast;
    // add Postgres LISTEN/NOTIFY or Redis pub/sub if live toasts for scheduled alerts matter.
    const now = new Date().toISOString();
    for (const c of created) {
      this.sse.sendToUser(c.user_id, 'notification', {
        id: c.id, type: c.type, title: c.title, body: c.body, link: c.link, read: false, created_at: now,
      });
    }

    // 2. Push in the background, one chunk after another so concurrency stays bounded.
    const inAppOnly = new Set(targets.filter((t) => t.n.push === false).map((t) => t.userId));
    const pushRows = created.filter(
      (c) => !inAppOnly.has(c.user_id) && (prefBy.get(c.user_id)?.push_enabled ?? true),
    );
    if (pushRows.length) await this.queuePush(pushRows);
    return created.length;
  }

  /** One job per chunk (≤ NOTIFY_CHUNK users) into Redis; in-process if Redis is off or unreachable. */
  private async queuePush(rows: PushRow[]): Promise<void> {
    if (this.redisQueue) {
      try {
        await this.redisQueue.add('send', { rows } satisfies PushJob, PUSH_JOB_OPTS);
        return;
      } catch (err) {
        this.logger.warn(`Push queue unreachable, sending in-process: ${(err as Error).message}`);
      }
    }
    this.pushQueue = this.pushQueue.then(() =>
      this.dispatchPush(rows).catch((err) => this.logger.warn(`Push dispatch error: ${(err as Error).message}`)),
    );
  }

  /** Waits for in-process push sends (tests and graceful shutdown). */
  flushPush(): Promise<void> {
    return this.pushQueue;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redisQueue?.close();
  }

  /**
   * Browser Web Push (VAPID) and phone Expo push for freshly created notifications.
   * Phones go 100 per Expo request; browsers go PUSH_CONCURRENCY at a time.
   * Expired subscriptions are removed and delivery rows are written in one insert.
   * Throws only if the subscription lookup fails (nothing sent yet), so a queue retry is safe.
   */
  async dispatchPush(rows: PushRow[]): Promise<void> {
    const subs = await this.prisma.push_subscriptions.findMany({
      where: { user_id: { in: [...new Set(rows.map((r) => r.user_id))] } },
    });
    if (subs.length === 0) return;

    const rowsByUser = new Map<string, PushRow[]>();
    for (const r of rows) rowsByUser.set(r.user_id, [...(rowsByUser.get(r.user_id) ?? []), r]);

    type Job = { sub: (typeof subs)[number]; row: PushRow; phone: boolean };
    const jobs: Job[] = subs.flatMap((sub) =>
      (rowsByUser.get(sub.user_id) ?? []).map((row) => ({ sub, row, phone: isExpoPushToken(sub.endpoint) })),
    );
    const payload = (r: PushRow) => ({ title: r.title, body: r.body, link: r.link, tag: r.type });
    const results: { job: Job; res: PushResult }[] = [];

    // Phones: Expo takes up to 100 messages per request.
    const phone = jobs.filter((j) => j.phone);
    for (let i = 0; i < phone.length; i += EXPO_BATCH) {
      const batch = phone.slice(i, i + EXPO_BATCH);
      const res = await sendExpoPushBatch(batch.map((j) => ({ token: j.sub.endpoint, payload: payload(j.row) })));
      batch.forEach((job, k) => results.push({ job, res: res[k] }));
    }

    // Browsers: one request per subscription, a bounded number in flight.
    const web = jobs.filter((j) => !j.phone);
    for (let i = 0; i < web.length; i += PUSH_CONCURRENCY) {
      const batch = web.slice(i, i + PUSH_CONCURRENCY);
      const res = await Promise.all(
        batch.map((j) =>
          sendWebPush({ endpoint: j.sub.endpoint, p256dh: j.sub.p256dh, auth: j.sub.auth }, payload(j.row)),
        ),
      );
      batch.forEach((job, k) => results.push({ job, res: res[k] }));
    }

    const expired = [...new Set(results.filter((r) => r.res.expired).map((r) => r.job.sub.id))];
    if (expired.length) {
      await this.prisma.push_subscriptions.deleteMany({ where: { id: { in: expired } } }).catch(() => null);
    }
    await this.prisma.notification_deliveries
      .createMany({
        data: results.map(({ job, res }) => ({
          notification_id: job.row.id,
          channel: 'push' as const,
          status: res.success ? ('sent' as const) : ('failed' as const),
          provider: job.phone ? 'expo-push' : 'web-push',
          sent_at: res.success ? new Date() : null,
          last_error: res.error ?? null,
        })),
      })
      .catch(() => null);
  }

  /* ------------------------------------------------------------------ events */

  /** A published update (admit card, result, date change…) → everyone who saved its job or service. */
  async notifyUpdatePublished(updateId: string): Promise<number> {
    const u = await this.prisma.updates.findUnique({
      where: { id: updateId },
      select: {
        id: true,
        kind: true,
        title: true,
        summary: true,
        status: true,
        opportunity_id: true,
        service_id: true,
        opportunities: { select: { slug: true, type: true, title: true } },
        gov_services: { select: { slug: true, name: true } },
      },
    });
    if (!u || u.status !== 'published') return 0;
    const parent = u.opportunity_id
      ? { item_type: 'opportunity' as const, item_id: u.opportunity_id }
      : u.service_id
        ? { item_type: 'service' as const, item_id: u.service_id }
        : null;
    if (!parent) return 0;

    const [savers, subs] = await Promise.all([
      this.prisma.saved_items.findMany({ where: parent, select: { user_id: true } }),
      this.prisma.subscriptions.findMany({
        where: {
          ...plusActive(),
        },
        select: { user_id: true },
      }),
    ]);
    const targetUserIds = [
      ...new Set([
        ...savers.map((s) => s.user_id),
        ...subs.map((s) => s.user_id).filter((id): id is string => Boolean(id)),
      ]),
    ];

    const parentTitle = u.opportunities?.title ?? u.gov_services?.name ?? '';
    const link = u.opportunities
      ? opportunityPath(u.opportunities.type, u.opportunities.slug)
      : u.gov_services
        ? `/services/${u.gov_services.slug}`
        : null;
    return this.notify(
      targetUserIds,
      {
        type: notificationTypeForUpdate(u.kind),
        title: `⚡ ${u.title}`,
        body: [`Official update released for ${parentTitle}.`, u.summary].filter(Boolean).join(' '),
        link,
        ...parent,
      },
      () => updateKey(u.id),
    );
  }

  /**
   * Premium / Subscribed instant dispatch:
   * When an opportunity is published, active subscribers receive an instant alert.
   * Free candidates receive the consolidated notice in the next 12-hour digest.
   */
  async notifySubscribersNewOpportunity(opportunityId: string): Promise<number> {
    const opp = await this.prisma.opportunities.findUnique({
      where: { id: opportunityId },
      select: { id: true, title: true, type: true, slug: true, status: true },
    });
    if (!opp || opp.status !== 'published') return 0;

    const subs = await this.prisma.subscriptions.findMany({
      where: {
        ...plusActive(),
      },
      select: { user_id: true },
    });
    const subscriberIds = [...new Set(subs.map((s) => s.user_id).filter((id): id is string => Boolean(id)))];
    if (subscriberIds.length === 0) return 0;

    const notifType: NotificationType =
      opp.type === 'govt_job'
        ? 'new_job'
        : opp.type === 'exam'
          ? 'new_exam'
          : opp.type === 'scholarship'
            ? 'new_scholarship'
            : 'new_admission';

    return this.notify(
      subscriberIds,
      {
        type: notifType,
        title: `⚡ Instant Alert: ${opp.title}`,
        body: `New ${opp.type.replace('_', ' ')} published. Tap to check requirements and eligibility.`,
        link: opportunityPath(opp.type, opp.slug),
        item_type: 'opportunity',
        item_id: opp.id,
      },
      () => `instant_opp:${opp.id}`,
    );
  }

  /** "N days before" reminders for saved jobs: last date and exam date. Safe to run any number of times. */
  async runReminders(today = todayIst()): Promise<number> {
    const horizon = addDays(today, MAX_REMINDER_DAYS);
    const [ends, exams] = await Promise.all([
      this.prisma.opportunities.findMany({
        where: { status: 'published', application_end: { gte: today, lte: horizon } },
        select: { id: true, slug: true, type: true, title: true, application_end: true },
      }),
      this.prisma.opportunity_dates.findMany({
        where: {
          kind: 'exam_date',
          date: { gte: today, lte: horizon },
          opportunities: { status: { in: ['published', 'closed'] } },
        },
        select: { date: true, opportunities: { select: { id: true, slug: true, type: true, title: true } } },
      }),
    ]);
    const events = [
      ...ends.map((o) => ({ ...o, event: 'last_date' as const, date: o.application_end! })),
      ...exams.map((d) => ({ ...d.opportunities, event: 'exam_date' as const, date: d.date })),
    ];
    if (events.length === 0) return 0;

    const saved = await this.prisma.saved_items.findMany({
      where: { item_type: 'opportunity', item_id: { in: [...new Set(events.map((e) => e.id))] }, reminder_enabled: true },
      select: { user_id: true, item_id: true },
    });
    const prefs = await this.prisma.notification_preferences.findMany({
      where: { user_id: { in: [...new Set(saved.map((s) => s.user_id))] } },
      select: { user_id: true, reminder_days_before: true },
    });
    const daysBy = new Map(prefs.map((p) => [p.user_id, p.reminder_days_before]));

    let created = 0;
    for (const e of events) {
      const daysLeft = Math.round((e.date.getTime() - today.getTime()) / DAY_MS);
      const bucketBy = new Map<string, number>();
      for (const s of saved) {
        if (s.item_id !== e.id) continue;
        const bucket = reminderBucket(daysLeft, daysBy.get(s.user_id) ?? DEFAULT_REMINDER_DAYS);
        if (bucket !== null) bucketBy.set(s.user_id, bucket);
      }
      if (bucketBy.size === 0) continue;
      const when = daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
      created += await this.notify(
        [...bucketBy.keys()],
        e.event === 'last_date'
          ? {
              type: 'closing_reminder',
              title: `Last date ${when}: ${e.title}`,
              body: `Applications close on ${isoDate(e.date)}. Apply on the official website before then.`,
              link: opportunityPath(e.type, e.slug),
              item_type: 'opportunity',
              item_id: e.id,
            }
          : {
              type: 'closing_reminder',
              title: `Exam ${when}: ${e.title}`,
              body: `The exam is on ${isoDate(e.date)}. Check the official website for your admit card and centre.`,
              link: opportunityPath(e.type, e.slug),
              item_type: 'opportunity',
              item_id: e.id,
            },
        (userId) => reminderKey(e.id, e.event, isoDate(e.date), bucketBy.get(userId)!),
      );
    }
    return created;
  }

  /**
   * Staff alert (in-app + push to the admin app + email): every active staff member with one of `roles`,
   * plus admins/super admins. Type `system`, so staff can't mute it. Fire-and-forget at call sites:
   * the action that triggered it has already succeeded.
   */
  async notifyStaff(
    roles: string[],
    alert: { title: string; body: string; path: string },
    dedupeKey: string,
  ): Promise<number> {
    const rows = await this.prisma.user_roles.findMany({
      where: {
        role: { in: [...new Set([...roles, 'admin', 'super_admin'])] as staff_role[] },
        users_user_roles_user_idTousers: { status: 'active' },
      },
      select: { user_id: true },
    });
    const staff = [...new Set(rows.map((r) => r.user_id))];
    if (staff.length === 0) return 0;
    return this.notify(
      staff,
      { type: 'system', title: alert.title, body: alert.body, link: adminLink(alert.path) },
      () => dedupeKey,
    );
  }

  /**
   * "Remind me when applications open" (Plus): pending `reminders` rows whose job's application_start has
   * arrived. Reads the job's current date (a corrigendum that moves it is honoured). Users whose Plus lapsed
   * are skipped and their reminder cancelled. Safe to run any number of times (dedupe key + status).
   */
  async runOpenReminders(today = todayIst()): Promise<number> {
    const pending = await this.prisma.reminders.findMany({
      where: { status: 'pending', item_type: 'opportunity' },
      select: { user_id: true, item_id: true },
    });
    if (pending.length === 0) return 0;
    const opps = await this.prisma.opportunities.findMany({
      where: { id: { in: [...new Set(pending.map((r) => r.item_id))] }, status: 'published', application_start: { lte: today } },
      select: { id: true, slug: true, type: true, title: true, application_start: true, application_end: true },
    });
    if (opps.length === 0) return 0;

    const dueUsers = [...new Set(pending.filter((r) => opps.some((o) => o.id === r.item_id)).map((r) => r.user_id))];
    const subs = await this.prisma.subscriptions.findMany({
      where: { user_id: { in: dueUsers }, ...plusActive() },
      select: { user_id: true },
    });
    const plus = new Set(subs.map((s) => s.user_id));

    let created = 0;
    for (const o of opps) {
      const users = pending.filter((r) => r.item_id === o.id).map((r) => r.user_id);
      const send = users.filter((u) => plus.has(u));
      if (send.length) {
        created += await this.notify(
          send,
          {
            type: 'closing_reminder',
            title: `Applications are open: ${o.title}`,
            body: `Applications opened on ${isoDate(o.application_start!)}${
              o.application_end ? ` and close on ${isoDate(o.application_end)}` : ''
            }. Apply on the official website.`,
            link: opportunityPath(o.type, o.slug),
            item_type: 'opportunity',
            item_id: o.id,
          },
          () => `open_reminder:${o.id}`,
        );
      }
      const now = new Date();
      const where = { item_type: 'opportunity' as const, item_id: o.id, status: 'pending' as const };
      await this.prisma.reminders.updateMany({ where: { ...where, user_id: { in: send } }, data: { status: 'sent', sent_at: now, updated_at: now } });
      await this.prisma.reminders.updateMany({
        where: { ...where, user_id: { in: users.filter((u) => !plus.has(u)) } },
        data: { status: 'cancelled', updated_at: now },
      });
    }
    return created;
  }

  /* ------------------------------------------------------------------ email queue */

  /** Starts sending queued emails in the background; a call while sending runs one more pass after. */
  kick(): void {
    if (this.sending) {
      this.sendAgain = true;
      return;
    }
    this.sending = (async () => {
      do {
        this.sendAgain = false;
        await this.sendPending();
      } while (this.sendAgain);
    })()
      .catch((err: Error) => this.logger.warn(`Email queue failed: ${err.message}`))
      .finally(() => {
        this.sending = null;
      });
  }

  /** Waits for the background sender (tests and the manual check). */
  async drain(): Promise<void> {
    while (this.sending) await this.sending;
  }

  private async sendPending(): Promise<void> {
    // a crash after the last claim leaves attempts used up but still pending
    await this.prisma.notification_deliveries.updateMany({
      where: { status: 'pending', attempts: { gte: MAX_ATTEMPTS } },
      data: { status: 'failed', updated_at: new Date() },
    });
    for (;;) {
      const rows = await this.prisma.notification_deliveries.findMany({
        where: {
          status: 'pending',
          channel: 'email',
          attempts: { lt: MAX_ATTEMPTS },
          OR: [{ attempts: 0 }, { updated_at: { lt: new Date(Date.now() - RETRY_AFTER_MS) } }],
        },
        orderBy: { created_at: 'asc' },
        take: 50,
        select: {
          id: true,
          attempts: true,
          notifications: {
            select: {
              type: true,
              dedupe_key: true,
              title: true,
              body: true,
              link: true,
              user_id: true,
              users: { select: { email: true } },
            },
          },
        },
      });
      if (rows.length === 0) return;
      for (const d of rows) {
        // claim it: only one sender (instance, timer or kick) gets each delivery
        const claimed = await this.prisma.notification_deliveries.updateMany({
          where: { id: d.id, status: 'pending', attempts: d.attempts },
          data: { attempts: { increment: 1 }, updated_at: new Date() },
        });
        if (claimed.count === 0) continue;
        const n = d.notifications;
        try {
          if (!n.users.email) throw new Error('The user has no email address');
          const unsubscribeUrl = this.unsubscribeUrl(n.user_id);
          const sender = senderFor(n.type, n.dedupe_key);
          const messageId = await sendWithResend(
            n.users.email,
            renderEmail({
              title: n.title,
              body: n.body,
              url: n.link ? (/^https?:\/\//.test(n.link) ? n.link : `${webUrl()}${n.link}`) : null,
              unsubscribeUrl,
              preferencesUrl: `${webUrl()}/notifications#preferences`,
              sender,
            }),
            d.id,
            unsubscribeUrl,
            SENDERS[sender](),
          );
          await this.prisma.notification_deliveries.update({
            where: { id: d.id },
            data: {
              status: 'sent',
              provider: 'resend',
              provider_message_id: messageId,
              sent_at: new Date(),
              last_error: null,
              updated_at: new Date(),
            },
          });
        } catch (err) {
          await this.prisma.notification_deliveries.update({
            where: { id: d.id },
            data: {
              status: d.attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending',
              provider: 'resend',
              last_error: (err as Error).message.slice(0, 500),
              updated_at: new Date(),
            },
          });
        }
        await sleep(SEND_GAP_MS);
      }
    }
  }

  /* ------------------------------------------------------------------ unsubscribe */

  unsubscribeUrl(userId: string): string {
    const token = this.jwt.sign({ sub: userId, purpose: 'unsubscribe' }, { secret: unsubscribeSecret(), expiresIn: '365d' });
    return `${apiPublicUrl()}/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
  }

  /** Turns email off for the user in the token. False when the link is invalid or expired. */
  async unsubscribe(token: string): Promise<boolean> {
    let userId: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; purpose?: string }>(token, { secret: unsubscribeSecret() });
      if (payload.purpose !== 'unsubscribe') return false;
      userId = payload.sub;
    } catch {
      return false;
    }
    if (!(await this.prisma.users.count({ where: { id: userId } }))) return false;
    await this.prisma.notification_preferences.upsert({
      where: { user_id: userId },
      create: { user_id: userId, email_enabled: false },
      update: { email_enabled: false, updated_at: new Date() },
    });
    return true;
  }

  /* ------------------------------------------------------------------ the user's inbox */

  async list(userId: string): Promise<NotificationList> {
    const [rows, unread] = await Promise.all([
      this.prisma.notifications.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 50,
        select: { id: true, type: true, title: true, body: true, link: true, read_at: true, created_at: true },
      }),
      this.prisma.notifications.count({ where: { user_id: userId, read_at: null } }),
    ]);
    return {
      unread,
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        link: r.link,
        read: r.read_at !== null,
        created_at: r.created_at.toISOString(),
      })),
    };
  }

  async markRead(userId: string, id?: string): Promise<void> {
    await this.prisma.notifications.updateMany({
      where: { user_id: userId, read_at: null, ...(id ? { id } : {}) },
      data: { read_at: new Date() },
    });
  }

  async preferences(userId: string): Promise<NotificationPreferences> {
    const [p, u, isSubscribed] = await Promise.all([
      this.prisma.notification_preferences.findUnique({ where: { user_id: userId } }),
      this.prisma.users.findUnique({ where: { id: userId }, select: { email: true, email_verified_at: true } }),
      this.isUserSubscribed(userId),
    ]);
    return {
      email_enabled: p?.email_enabled ?? true,
      email_available: Boolean(u?.email && u.email_verified_at),
      push_enabled: p?.push_enabled ?? true,
      is_subscribed: isSubscribed,
      muted_types: (p?.muted_types ?? []).filter((t): t is MutableNotificationType =>
        (MUTABLE_TYPES as string[]).includes(t),
      ),
      reminder_days_before: p?.reminder_days_before ?? DEFAULT_REMINDER_DAYS,
    };
  }

  async savePreferences(userId: string, input: NotificationPreferencesInput): Promise<NotificationPreferences> {
    const data: {
      email_enabled?: boolean;
      push_enabled?: boolean;
      muted_types?: string[];
      reminder_days_before?: number[];
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };
    if (typeof input.email_enabled === 'boolean') data.email_enabled = input.email_enabled;
    if (typeof input.push_enabled === 'boolean') data.push_enabled = input.push_enabled;
    if (input.muted_types) data.muted_types = input.muted_types;
    if (input.reminder_days_before) {
      data.reminder_days_before = [...new Set(input.reminder_days_before)].sort((a, b) => b - a);
    }

    await this.prisma.notification_preferences.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        email_enabled: input.email_enabled ?? true,
        push_enabled: input.push_enabled ?? true,
        muted_types: input.muted_types ?? [],
        reminder_days_before: input.reminder_days_before ?? DEFAULT_REMINDER_DAYS,
      },
      update: data,
    });
    return this.preferences(userId);
  }

  /* ------------------------------------------------------------------ Web Push & SSE */

  getPushPublicKey(): PushPublicKeyResponse {
    return { publicKey: getVapidKeys().publicKey };
  }

  async subscribePush(userId: string, input: PushSubscriptionInput): Promise<void> {
    await this.prisma.push_subscriptions.upsert({
      where: { endpoint: input.endpoint },
      create: {
        user_id: userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        user_agent: input.user_agent ?? null,
      },
      update: {
        user_id: userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        user_agent: input.user_agent ?? null,
        updated_at: new Date(),
      },
    });

    await this.prisma.notification_preferences.upsert({
      where: { user_id: userId },
      create: { user_id: userId, push_enabled: true },
      update: { push_enabled: true, updated_at: new Date() },
    });
  }

  /**
   * Registers an Android/iOS device for push. The Expo token takes the place of
   * the W3C endpoint; `p256dh`/`auth` hold the platform instead of ECDH keys,
   * which are meaningless for Expo. dispatchWebPush() tells the two apart with
   * isExpoPushToken(), so no second table and no migration.
   */
  async registerDeviceToken(userId: string, input: DeviceTokenInput): Promise<void> {
    const userAgent = `expo/${input.platform}${input.device_name ? ` ${input.device_name}` : ''}`;
    await this.prisma.push_subscriptions.upsert({
      where: { endpoint: input.token },
      create: {
        user_id: userId,
        endpoint: input.token,
        p256dh: input.platform,
        auth: 'expo',
        user_agent: userAgent.slice(0, 500),
      },
      update: {
        user_id: userId,
        p256dh: input.platform,
        auth: 'expo',
        user_agent: userAgent.slice(0, 500),
        updated_at: new Date(),
      },
    });

    await this.prisma.notification_preferences.upsert({
      where: { user_id: userId },
      create: { user_id: userId, push_enabled: true },
      update: { push_enabled: true, updated_at: new Date() },
    });
  }

  /** Drops one phone. Other devices and the browser keep getting push. */
  async removeDeviceToken(userId: string, token: string): Promise<void> {
    await this.prisma.push_subscriptions.deleteMany({
      where: { user_id: userId, endpoint: token },
    });
  }

  async unsubscribePush(userId: string, endpoint?: string): Promise<void> {
    if (endpoint) {
      await this.prisma.push_subscriptions.deleteMany({
        where: { user_id: userId, endpoint },
      });
    } else {
      await this.prisma.push_subscriptions.deleteMany({
        where: { user_id: userId },
      });
      await this.prisma.notification_preferences.updateMany({
        where: { user_id: userId },
        data: { push_enabled: false, updated_at: new Date() },
      });
    }
  }

  registerSseClient(userId: string, res: Response): void {
    this.sse.addClient(userId, res);
  }

  async isUserSubscribed(userId: string): Promise<boolean> {
    const sub = await this.prisma.subscriptions.findFirst({
      where: {
        user_id: userId,
        ...plusActive(),
      },
      select: { id: true },
    });
    return Boolean(sub);
  }

  /**
   * Twice-daily digest (09:00 AM & 09:00 PM IST) for regular candidates:
   * Compiles new opportunities and updates published in the last 12 hours.
   */
  async runTwiceDailyDigest(): Promise<number> {
    const twelveHoursAgo = new Date(Date.now() - 12 * 3600 * 1000);
    const [recentOpps, recentUpdates, allActiveUsers] = await Promise.all([
      this.prisma.opportunities.findMany({
        where: { status: 'published', published_at: { gte: twelveHoursAgo } },
        select: { id: true, title: true, type: true, slug: true },
        take: 10,
      }),
      this.prisma.updates.findMany({
        where: { status: 'published', published_at: { gte: twelveHoursAgo } },
        select: { id: true, title: true, kind: true },
        take: 5,
      }),
      this.prisma.users.findMany({
        where: { status: 'active', deleted_at: null },
        select: { id: true },
      }),
    ]);

    if (recentOpps.length === 0 && recentUpdates.length === 0) return 0;

    const summaryParts: string[] = [];
    if (recentOpps.length > 0) {
      summaryParts.push(`${recentOpps.length} new ${recentOpps.length === 1 ? 'opportunity' : 'opportunities'}`);
    }
    if (recentUpdates.length > 0) {
      summaryParts.push(`${recentUpdates.length} new ${recentUpdates.length === 1 ? 'admit card/result update' : 'updates'}`);
    }

    const title = `ApplyFields 12-Hour Digest: ${summaryParts.join(' & ')}`;
    const topItem = recentOpps[0];
    const link = topItem ? opportunityPath(topItem.type, topItem.slug) : '/notifications';
    const body = `New releases today: ${recentOpps.slice(0, 3).map((o) => o.title).join(', ')}. Check eligibility and save before closing dates.`;

    const digestBucket = new Date().toISOString().slice(0, 13);
    return this.notify(
      allActiveUsers.map((u) => u.id),
      {
        type: 'system',
        title,
        body,
        link,
      },
      (userId) => `digest:${digestBucket}:${userId}`,
    );
  }

  /**
   * Daily 3-Slot Personalized Cadence:
   * - Slot 1 (Morning ~09:00 AM IST): Personalized greeting & career recommendation ("Hi {username}, looking good today! ✨ Have you seen this career option: ...")
   * - Slot 2 (Afternoon ~02:00 PM IST): Countdown & Deadline urgency alert ("Deadline Alert, {username} ⏳ ...")
   *   Only when a published opportunity really closes within 7 days — never a generic "closes this week".
   * - Slot 3 (Evening ~07:00 PM IST): Career roadmap & pathway spotlight ("Evening Career Spotlight for {username} 🧭 ...")
   */
  async runDailyCadence(slot: 'morning' | 'afternoon' | 'evening'): Promise<number> {
    const today = todayIst();
    const istDate = new Date().toISOString().slice(0, 10);

    const [activeUsers, topOpp, closingOpp, careerSpotlight] = await Promise.all([
      this.prisma.users.findMany({
        where: { status: 'active', deleted_at: null },
        select: {
          id: true,
          user_profiles: { select: { full_name: true } },
        },
      }),
      this.prisma.opportunities.findFirst({
        where: { status: 'published' },
        orderBy: [{ published_at: 'desc' }, { vacancies_total: 'desc' }],
        select: { id: true, title: true, slug: true, type: true, vacancies_total: true },
      }),
      this.prisma.opportunities.findFirst({
        where: {
          status: 'published',
          application_end: { gte: today, lte: addDays(today, 7) },
        },
        orderBy: { application_end: 'asc' },
        select: { id: true, title: true, slug: true, type: true, application_end: true },
      }),
      this.prisma.careers.findFirst({
        orderBy: { title: 'asc' },
        select: { id: true, title: true, slug: true },
      }),
    ]);

    if (activeUsers.length === 0) return 0;
    // Nothing real closes this week: no deadline alert (we never claim deadlines we don't have).
    if (slot === 'afternoon' && !closingOpp) return 0;

    // Build every user's message first, then send them all through the batched notifyMany().
    const items: NotifyItem[] = activeUsers.map((u) => {
      const fullName = u.user_profiles?.full_name?.trim();
      const firstName = fullName ? fullName.split(' ')[0] : 'Friend';
      const key = `daily_cadence:${slot}:${istDate}:${u.id}`;

      if (slot === 'morning') {
        return {
          userId: u.id,
          key,
          n: {
            type: 'system',
            mute_key: 'daily_morning',
            title: `Hi ${firstName}, looking good today! ✨`,
            body: topOpp
              ? `Have you seen this career option: ${topOpp.title}? ${topOpp.vacancies_total ? `${topOpp.vacancies_total} posts announced.` : ''} Check eligibility & dates.`
              : 'Explore top government recruitments and competitive admissions open today.',
            link: topOpp ? opportunityPath(topOpp.type, topOpp.slug) : '/jobs',
            item_type: topOpp ? 'opportunity' : null,
            item_id: topOpp?.id ?? null,
          },
        };
      }
      if (slot === 'afternoon') {
        return {
          userId: u.id,
          key,
          n: {
            type: 'closing_reminder',
            mute_key: 'daily_afternoon',
            title: `Deadline Alert, ${firstName} ⏳`,
            body: `${closingOpp!.title} closes on ${isoDate(closingOpp!.application_end)}! Don't miss your chance to apply.`,
            link: opportunityPath(closingOpp!.type, closingOpp!.slug),
            item_type: 'opportunity',
            item_id: closingOpp!.id,
          },
        };
      }
      // Evening links to a career page, not an opportunity, so no opportunity item is attached.
      return {
        userId: u.id,
        key,
        n: {
          type: 'system',
          mute_key: 'daily_evening',
          title: `Evening Career Spotlight for ${firstName} 🧭`,
          body: careerSpotlight
            ? `Your first move starts here! Explore verified career pathways and salary roadmaps for ${careerSpotlight.title}.`
            : 'Your first move starts here! Explore verified career roadmaps, degree pathways, and exam syllabi.',
          link: careerSpotlight ? `/career/${careerSpotlight.slug}` : '/career',
        },
      };
    });

    return this.notifyMany(items);
  }

  /* ------------------------------------------------------------------ Internal Portal */

  async overview(status?: DeliveryStatus): Promise<AdminNotificationOverview> {
    const [grouped, inAppTotal, inAppUnread, pushTotal, rows] = await Promise.all([
      this.prisma.notification_deliveries.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.notifications.count(),
      this.prisma.notifications.count({ where: { read_at: null } }),
      this.prisma.push_subscriptions.count(),
      this.prisma.notification_deliveries.findMany({
        where: status ? { status } : {},
        orderBy: { created_at: 'desc' },
        take: 100,
        select: {
          id: true,
          channel: true,
          status: true,
          attempts: true,
          last_error: true,
          created_at: true,
          sent_at: true,
          notifications: { select: { type: true, title: true, users: { select: { email: true } } } },
        },
      }),
    ]);
    const counts = {
      pending: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      in_app_total: inAppTotal,
      in_app_unread: inAppUnread,
      push_subscriptions_total: pushTotal,
    };
    for (const g of grouped) counts[g.status] = g._count._all;
    return {
      counts,
      items: rows.map((r) => ({
        id: r.id,
        channel: r.channel,
        status: r.status,
        attempts: r.attempts,
        last_error: r.last_error,
        created_at: r.created_at.toISOString(),
        sent_at: r.sent_at?.toISOString() ?? null,
        type: r.notifications.type,
        title: r.notifications.title,
        user_email: r.notifications.users.email,
      })),
    };
  }

  /** A manual alert from the team: to everyone who saved a job, or to one user. */
  async alert(input: ManualAlertInput, actor: string | null): Promise<ManualAlertResult> {
    let userIds: string[];
    let item: Pick<NewNotification, 'item_type' | 'item_id'> = {};
    if (input.audience.kind === 'savers') {
      const o = await this.prisma.opportunities.findUnique({
        where: { slug: input.audience.opportunity_slug },
        select: { id: true },
      });
      if (!o) throw new NotFoundException(`No job or exam with slug ${input.audience.opportunity_slug}`);
      const savers = await this.prisma.saved_items.findMany({
        where: { item_type: 'opportunity', item_id: o.id },
        select: { user_id: true },
      });
      userIds = savers.map((s) => s.user_id);
      item = { item_type: 'opportunity', item_id: o.id };
    } else {
      const u = await this.prisma.users.findFirst({
        where: { email: { equals: input.audience.email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!u) throw new BadRequestException({ message: 'Some fields are not valid', errors: ['audience.email: no user with this email'] });
      userIds = [u.id];
    }
    const alertId = randomUUID();
    const notified = await this.notify(
      userIds,
      { type: 'system', title: input.title, body: input.body, link: input.link, ...item },
      () => `alert:${alertId}`,
    );
    await this.prisma.audit_logs.create({
      data: {
        actor_id: actor,
        action: 'notification.alert',
        target_type: 'notification',
        target_id: alertId,
        details: JSON.parse(JSON.stringify({ ...input, notified })) as Prisma.InputJsonValue,
      },
    });
    return { notified };
  }

  /**
   * Broadcast alert from Staff/Admin Portal:
   * Supports audience 'all', 'subscribers', 'savers', or specific 'user' by email.
   * Delivers in-app notification, Web Push, and optionally queues email.
   */
  async broadcast(
    { send_at, ...input }: AdminBroadcastInput,
    actor: string | null,
    broadcastId: string = randomUUID(),
  ): Promise<AdminBroadcastResult> {
    if (send_at) {
      const row = await this.prisma.scheduled_broadcasts.create({
        data: { input: input as unknown as Prisma.InputJsonValue, send_at: new Date(send_at), created_by: actor },
        select: { id: true, send_at: true },
      });
      await this.prisma.audit_logs.create({
        data: {
          actor_id: actor,
          action: 'notification.broadcast_scheduled',
          target_type: 'notification',
          target_id: row.id,
          details: JSON.parse(JSON.stringify({ ...input, send_at })) as Prisma.InputJsonValue,
        },
      });
      return { notified: 0, push_sent: 0, scheduled_for: row.send_at.toISOString() };
    }

    let userIds: string[];
    let item: Pick<NewNotification, 'item_type' | 'item_id'> = {};

    if (input.audience.kind === 'all') {
      const users = await this.prisma.users.findMany({
        where: { status: 'active', deleted_at: null },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (input.audience.kind === 'subscribers') {
      const subs = await this.prisma.subscriptions.findMany({
        where: {
          ...plusActive(),
        },
        select: { user_id: true },
      });
      userIds = subs.map((s) => s.user_id).filter((id): id is string => Boolean(id));
    } else if (input.audience.kind === 'partners') {
      const members = await this.prisma.partner_members.findMany({ select: { user_id: true } });
      userIds = members.map((m) => m.user_id);
    } else if (input.audience.kind === 'staff') {
      const roles = await this.prisma.user_roles.findMany({ select: { user_id: true } });
      userIds = roles.map((r) => r.user_id);
    } else if (input.audience.kind === 'savers') {
      const o = await this.prisma.opportunities.findUnique({
        where: { slug: input.audience.opportunity_slug },
        select: { id: true },
      });
      if (!o) throw new NotFoundException(`No job or exam with slug ${input.audience.opportunity_slug}`);
      const savers = await this.prisma.saved_items.findMany({
        where: { item_type: 'opportunity', item_id: o.id },
        select: { user_id: true },
      });
      userIds = savers.map((s) => s.user_id);
      item = { item_type: 'opportunity', item_id: o.id };
    } else {
      const u = await this.prisma.users.findFirst({
        where: { email: { equals: input.audience.email, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!u) throw new BadRequestException({ message: 'No user with this email' });
      userIds = [u.id];
    }

    const push = !input.channels || input.channels.includes('push');
    const notified = await this.notify(
      userIds,
      {
        type: 'system',
        title: input.title,
        body: input.body,
        link: input.link,
        push,
        ...item,
      },
      (userId) => `broadcast:${broadcastId}:${userId}`,
    );

    const pushCount = push
      ? await this.prisma.push_subscriptions.count({ where: { user_id: { in: userIds } } })
      : 0;

    await this.prisma.audit_logs.create({
      data: {
        actor_id: actor,
        action: 'notification.broadcast',
        target_type: 'notification',
        target_id: broadcastId,
        details: JSON.parse(JSON.stringify({ ...input, notified, push_subscriptions_targeted: pushCount })) as Prisma.InputJsonValue,
      },
    });

    return { notified, push_sent: pushCount, scheduled_for: null };
  }

  /**
   * Scheduled broadcasts whose time has come (called every minute by the scheduler). Each row is
   * claimed with a conditional update first, so a row is never sent twice; the row id is the
   * broadcast id, so the per-user dedupe keys also stop any repeat.
   * ponytail: a crash mid-send leaves the row 'sending'; reset it to 'scheduled' by hand to finish
   * it (already-notified users are skipped by the dedupe key).
   */
  async runScheduledBroadcasts(now = new Date()): Promise<number> {
    const due = await this.prisma.scheduled_broadcasts.findMany({
      where: { status: 'scheduled', send_at: { lte: now } },
      orderBy: { send_at: 'asc' },
      take: 10,
      select: { id: true, input: true, created_by: true },
    });
    let sent = 0;
    for (const row of due) {
      const claim = await this.prisma.scheduled_broadcasts.updateMany({
        where: { id: row.id, status: 'scheduled' },
        data: { status: 'sending' },
      });
      if (claim.count === 0) continue;
      try {
        const res = await this.broadcast(row.input as unknown as AdminBroadcastInput, row.created_by, row.id);
        await this.prisma.scheduled_broadcasts.update({
          where: { id: row.id },
          data: { status: 'sent', notified: res.notified, sent_at: new Date() },
        });
        sent++;
      } catch (err) {
        await this.prisma.scheduled_broadcasts.update({
          where: { id: row.id },
          data: { status: 'failed', last_error: (err as Error).message.slice(0, 500) },
        });
      }
    }
    return sent;
  }

  /** Upcoming, in-flight and recent scheduled broadcasts for the Internal Portal. */
  async listScheduled(): Promise<ScheduledBroadcastItem[]> {
    const rows = await this.prisma.scheduled_broadcasts.findMany({
      where: { OR: [{ status: { in: ['scheduled', 'sending'] } }, { send_at: { gte: addDays(new Date(), -30) } }] },
      orderBy: { send_at: 'desc' },
      take: 50,
    });
    return rows.map((r) => {
      const input = r.input as unknown as AdminBroadcastInput;
      return {
        id: r.id,
        title: input.title,
        audience: input.audience.kind,
        in_app_only: Boolean(input.channels && !input.channels.includes('push')),
        send_at: r.send_at.toISOString(),
        status: r.status as ScheduledBroadcastStatus,
        notified: r.notified,
        last_error: r.last_error,
      };
    });
  }

  /** Only a broadcast that hasn't started sending can be cancelled. */
  async cancelScheduled(id: string, actor: string | null): Promise<void> {
    const res = await this.prisma.scheduled_broadcasts.updateMany({
      where: { id, status: 'scheduled' },
      data: { status: 'cancelled' },
    });
    if (res.count === 0) throw new NotFoundException('No scheduled broadcast with this id (already sent or cancelled?)');
    await this.prisma.audit_logs.create({
      data: { actor_id: actor, action: 'notification.broadcast_cancelled', target_type: 'notification', target_id: id },
    });
  }

  /** Failed email → back in the queue with fresh attempts. */
  async retry(deliveryId: string): Promise<void> {
    const res = await this.prisma.notification_deliveries.updateMany({
      where: { id: deliveryId, status: 'failed' },
      data: { status: 'pending', attempts: 0, last_error: null, updated_at: new Date() },
    });
    if (res.count === 0) throw new NotFoundException('No failed delivery with this id');
    this.kick();
  }
}
