import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AdminNotificationOverview,
  DeliveryStatus,
  ManualAlertInput,
  ManualAlertResult,
  MutableNotificationType,
  NotificationList,
  NotificationPreferences,
  NotificationPreferencesInput,
  NotificationType,
} from '@applyfields/types';
import type { Prisma } from '../../generated/prisma/client.js';
import { jwtAccessSecret } from '../../common/jwt-secret.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { addDays, todayIst } from '../opportunities/opportunities.service.js';
import { renderEmail, sendWithResend } from './email.js';
import {
  DEFAULT_REMINDER_DAYS,
  emailAllowed,
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
const MAX_ATTEMPTS = 3;
const RETRY_AFTER_MS = 5 * 60_000;
/** Resend's default limit is 2 requests/second. */
const SEND_GAP_MS = 550;

const webUrl = () => (process.env.WEB_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const apiPublicUrl = () => (process.env.API_PUBLIC_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
/** A different secret from login tokens, so an unsubscribe link can never be used to log in. */
const unsubscribeSecret = () => `${jwtAccessSecret()}:unsubscribe`;
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface NewNotification {
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  item_type?: 'opportunity' | 'service' | null;
  item_id?: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private sending: Promise<void> | null = null;
  private sendAgain = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * One in-app notification per user, plus a queued email where allowed. Users who muted the type
   * are skipped; anyone already notified under the same dedupe key is skipped by the database.
   * Returns how many notifications were created.
   */
  async notify(userIds: string[], n: NewNotification, key: (userId: string) => string | null): Promise<number> {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return 0;
    const [users, prefs, withdrawn] = await Promise.all([
      this.prisma.users.findMany({
        where: { id: { in: ids }, status: 'active', deleted_at: null },
        select: { id: true, email: true, email_verified_at: true },
      }),
      this.prisma.notification_preferences.findMany({
        where: { user_id: { in: ids } },
        select: { user_id: true, email_enabled: true, muted_types: true },
      }),
      this.emailConsentWithdrawn(ids),
    ]);
    const prefBy = new Map(prefs.map((p) => [p.user_id, p]));
    const targets = users.filter((u) => wantsType(prefBy.get(u.id)?.muted_types ?? [], n.type));
    if (targets.length === 0) return 0;

    const created = await this.prisma.notifications.createManyAndReturn({
      data: targets.map((u) => ({
        user_id: u.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        item_type: n.item_type ?? null,
        item_id: n.item_id ?? null,
        dedupe_key: key(u.id),
      })),
      skipDuplicates: true,
      select: { id: true, user_id: true },
    });

    const userBy = new Map(targets.map((u) => [u.id, u]));
    const emails = created.filter((c) => {
      const u = userBy.get(c.user_id)!;
      return emailAllowed({
        email: u.email,
        emailVerified: Boolean(u.email_verified_at),
        emailEnabled: prefBy.get(u.id)?.email_enabled ?? true,
        emailConsentWithdrawn: withdrawn.has(u.id),
      });
    });
    if (emails.length) {
      await this.prisma.notification_deliveries.createMany({
        data: emails.map((c) => ({ notification_id: c.id, channel: 'email' as const })),
      });
      this.kick();
    }
    return created.length;
  }

  /** Users whose latest email_updates consent says no. */
  private async emailConsentWithdrawn(userIds: string[]): Promise<Set<string>> {
    const rows = await this.prisma.consents.findMany({
      where: { user_id: { in: userIds }, purpose: 'email_updates' },
      select: { user_id: true, granted: true, withdrawn_at: true },
      orderBy: { granted_at: 'desc' },
    });
    const latest = new Map<string, (typeof rows)[number]>();
    for (const r of rows) if (!latest.has(r.user_id)) latest.set(r.user_id, r);
    return new Set([...latest.values()].filter((r) => !r.granted || r.withdrawn_at).map((r) => r.user_id));
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

    const savers = await this.prisma.saved_items.findMany({ where: parent, select: { user_id: true } });
    const parentTitle = u.opportunities?.title ?? u.gov_services?.name ?? '';
    const link = u.opportunities
      ? opportunityPath(u.opportunities.type, u.opportunities.slug)
      : u.gov_services
        ? `/services/${u.gov_services.slug}`
        : null;
    return this.notify(
      savers.map((s) => s.user_id),
      {
        type: notificationTypeForUpdate(u.kind),
        title: u.title,
        body: [`New update for ${parentTitle}, which you saved.`, u.summary].filter(Boolean).join(' '),
        link,
        ...parent,
      },
      () => updateKey(u.id),
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
            select: { title: true, body: true, link: true, user_id: true, users: { select: { email: true } } },
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
          const messageId = await sendWithResend(
            n.users.email,
            renderEmail({
              title: n.title,
              body: n.body,
              url: n.link ? `${webUrl()}${n.link}` : null,
              unsubscribeUrl,
              preferencesUrl: `${webUrl()}/notifications#preferences`,
            }),
            d.id,
            unsubscribeUrl,
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
    const [p, u] = await Promise.all([
      this.prisma.notification_preferences.findUnique({ where: { user_id: userId } }),
      this.prisma.users.findUnique({ where: { id: userId }, select: { email: true, email_verified_at: true } }),
    ]);
    return {
      email_enabled: p?.email_enabled ?? true,
      email_available: Boolean(u?.email && u.email_verified_at),
      muted_types: (p?.muted_types ?? []).filter((t): t is MutableNotificationType =>
        (MUTABLE_TYPES as string[]).includes(t),
      ),
      reminder_days_before: p?.reminder_days_before ?? DEFAULT_REMINDER_DAYS,
    };
  }

  async savePreferences(userId: string, input: NotificationPreferencesInput): Promise<NotificationPreferences> {
    const data = {
      email_enabled: input.email_enabled,
      muted_types: input.muted_types,
      reminder_days_before: [...new Set(input.reminder_days_before)].sort((a, b) => b - a),
    };
    await this.prisma.notification_preferences.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: { ...data, updated_at: new Date() },
    });
    return this.preferences(userId);
  }

  /* ------------------------------------------------------------------ Internal Portal */

  async overview(status?: DeliveryStatus): Promise<AdminNotificationOverview> {
    const [grouped, inAppTotal, inAppUnread, rows] = await Promise.all([
      this.prisma.notification_deliveries.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.notifications.count(),
      this.prisma.notifications.count({ where: { read_at: null } }),
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
    const counts = { pending: 0, sent: 0, delivered: 0, failed: 0, in_app_total: inAppTotal, in_app_unread: inAppUnread };
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
