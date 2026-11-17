import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import {
  checkoutSignature,
  razorpay,
  razorpayKeys,
  sameSignature,
  webhookSignature,
  type RazorpayKeys,
  type RzpOrder,
  type RzpPayment,
  type RzpRefund,
  type RzpSubscription,
} from './razorpay.js';

export const PLUS_PLAN_CODE = 'user_plus_monthly';
/** Razorpay needs a fixed number of cycles; 60 months ≈ "until cancelled". */
const PLUS_TOTAL_COUNT = 60;
const PAYABLE_BOOKING = ['new', 'accepted', 'in_progress'] as const;

export const verifySchema = z.union([
  z.object({
    kind: z.literal('order'),
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  }),
  z.object({
    kind: z.literal('subscription'),
    razorpay_subscription_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  }),
]);
export type VerifyInput = z.infer<typeof verifySchema>;

export const refundSchema = z.object({
  /** Omit for a full refund of what is left. */
  amount_paise: z.number().int().positive().optional(),
  reason: z.string().trim().min(3).max(300),
});
export type RefundInput = z.infer<typeof refundSchema>;

const unix = (s: number | null | undefined) => (s ? new Date(s * 1000) : null);
const feePaise = () => Math.max(0, Number(process.env.BOOKING_CONVENIENCE_FEE_PAISE) || 0);

interface WebhookEvent {
  event: string;
  payload: {
    payment?: { entity: RzpPayment };
    subscription?: { entity: RzpSubscription };
    refund?: { entity: RzpRefund };
  };
}

/**
 * Razorpay money flows (session 14, module 3):
 * - ApplyFields Plus: a Razorpay subscription (₹50/month). Cancel = stop renewing; Plus stays until `ends_at`.
 * - Pay a booking online: one order = the centre's charge + ApplyFields' convenience fee (`platform_fee_paise`).
 * - Refunds (staff, or automatic when a paid booking is cancelled/rejected).
 * Every state change is idempotent: the checkout callback and the webhook can both arrive, in any order, more than once.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  private keys(): RazorpayKeys {
    const keys = razorpayKeys();
    if (!keys) throw new ServiceUnavailableException('Online payments are not set up yet.');
    return keys;
  }

  config() {
    const keys = razorpayKeys();
    return {
      enabled: Boolean(keys),
      key_id: keys?.keyId ?? null,
      plus_enabled: Boolean(keys && process.env.RAZORPAY_PLUS_PLAN_ID?.trim()),
      plus_price_paise: 5000,
      convenience_fee_paise: feePaise(),
    };
  }

  // ---------------------------------------------------------------- Plus

  private async plusPlan() {
    const plan = await this.prisma.subscription_plans.findUnique({ where: { code: PLUS_PLAN_CODE } });
    if (!plan?.is_active) throw new ServiceUnavailableException('ApplyFields Plus is not available right now.');
    return plan;
  }

  /** The user's current Plus row: active/cancelled still inside its paid period, else the newest pending one. */
  private async currentPlus(userId: string) {
    return this.prisma.subscriptions.findFirst({
      where: {
        user_id: userId,
        OR: [
          { status: { in: ['active', 'cancelled'] }, ends_at: { gt: new Date() } },
          { status: 'pending', created_at: { gt: new Date(Date.now() - 86_400_000) } },
        ],
      },
      orderBy: [{ ends_at: { sort: 'desc', nulls: 'last' } }, { created_at: 'desc' }],
    });
  }

  async myPlus(userId: string) {
    const [plan, sub] = await Promise.all([
      this.prisma.subscription_plans.findUnique({ where: { code: PLUS_PLAN_CODE } }),
      this.currentPlus(userId),
    ]);
    const active = Boolean(sub && sub.status !== 'pending' && sub.ends_at && sub.ends_at > new Date());
    return {
      plan: plan ? { name: plan.name, price_paise: plan.price_paise, benefits: plan.benefits } : null,
      active,
      status: sub?.status ?? null,
      auto_renew: Boolean(active && sub?.auto_renew),
      ends_at: active ? sub!.ends_at!.toISOString() : null,
    };
  }

  /** Start Plus. Returns what Razorpay Checkout needs. */
  async subscribePlus(userId: string) {
    const keys = this.keys();
    const planId = process.env.RAZORPAY_PLUS_PLAN_ID?.trim();
    if (!planId) throw new ServiceUnavailableException('ApplyFields Plus is not set up yet.');
    const plan = await this.plusPlan();
    const current = await this.currentPlus(userId);

    if (current && current.status !== 'pending' && current.ends_at) {
      const until = current.ends_at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
      // ponytail: no "resume" (Razorpay can't un-cancel; a delayed-start subscription adds states). Add if users ask.
      throw new ConflictException(
        current.auto_renew ? 'You already have ApplyFields Plus.' : `Your Plus stays active until ${until}. You can subscribe again after that.`,
      );
    }
    // An unfinished checkout from today: reopen it instead of creating a second Razorpay subscription.
    if (current?.status === 'pending' && current.razorpay_subscription_id) {
      return { key_id: keys.keyId, subscription_id: current.razorpay_subscription_id, amount_paise: plan.price_paise };
    }

    const sub = await razorpay<RzpSubscription>(keys, 'POST', '/subscriptions', {
      plan_id: planId,
      total_count: PLUS_TOTAL_COUNT,
      customer_notify: 1,
      notes: { user_id: userId, plan: PLUS_PLAN_CODE },
    });
    await this.prisma.subscriptions.create({
      data: { plan_id: plan.id, user_id: userId, status: 'pending', auto_renew: true, razorpay_subscription_id: sub.id },
    });
    return { key_id: keys.keyId, subscription_id: sub.id, amount_paise: plan.price_paise };
  }

  /** Cancel Plus: renewal stops at once, Plus stays until the end of the month already paid for. */
  async cancelPlus(userId: string) {
    const keys = this.keys();
    const sub = await this.currentPlus(userId);
    if (!sub || sub.status === 'cancelled' || (sub.status === 'active' && !sub.auto_renew)) {
      throw new BadRequestException('You have no Plus subscription that renews.');
    }
    if (sub.razorpay_subscription_id) {
      // A pending one was never paid: cancel it now. An active one: at the end of the current cycle.
      await razorpay(keys, 'POST', `/subscriptions/${sub.razorpay_subscription_id}/cancel`, {
        cancel_at_cycle_end: sub.status === 'active' ? 1 : 0,
      }).catch((err: Error) => {
        // Already cancelled on Razorpay's side is fine; anything else must not look like a successful cancel.
        if (!/cancel/i.test(err.message)) throw new ServiceUnavailableException(`Could not cancel: ${err.message}`);
      });
    }
    await this.prisma.subscriptions.update({
      where: { id: sub.id },
      data: { auto_renew: false, ...(sub.status === 'pending' && { status: 'cancelled' }), updated_at: new Date() },
    });
    return this.myPlus(userId);
  }

  // ---------------------------------------------------------------- Bookings

  private async ownBooking(userId: string, bookingId: string) {
    const b = await this.prisma.service_requests.findUnique({
      where: { id: bookingId },
      select: { id: true, user_id: true, partner_id: true, status: true, quoted_paise: true, final_paise: true },
    });
    if (!b || b.user_id !== userId) throw new NotFoundException('Booking not found');
    return b;
  }

  async bookingPayment(userId: string, bookingId: string) {
    const b = await this.ownBooking(userId, bookingId);
    const charge = b.final_paise ?? b.quoted_paise ?? 0;
    const fee = feePaise();
    const paid = await this.prisma.payments.findFirst({
      where: { service_request_id: b.id, status: { in: ['paid', 'refunded'] } },
      orderBy: { created_at: 'desc' },
    });
    return {
      enabled: Boolean(razorpayKeys()),
      payable: !paid && charge > 0 && (PAYABLE_BOOKING as readonly string[]).includes(b.status),
      charge_paise: paid ? paid.amount_paise - paid.platform_fee_paise : charge,
      fee_paise: paid ? paid.platform_fee_paise : fee,
      total_paise: paid ? paid.amount_paise : charge + fee,
      status: paid?.status ?? 'unpaid',
      refunded_paise: paid?.refunded_amount_paise ?? 0,
      paid_at: paid?.paid_at?.toISOString() ?? null,
    };
  }

  /** Create (or reuse) the Razorpay order for a booking. The amount is always computed here, never sent by the client. */
  async bookingOrder(userId: string, bookingId: string) {
    const keys = this.keys();
    const b = await this.ownBooking(userId, bookingId);
    if (!(PAYABLE_BOOKING as readonly string[]).includes(b.status)) {
      throw new BadRequestException(`This booking is ${b.status}; it can't be paid online.`);
    }
    const charge = b.final_paise ?? b.quoted_paise ?? 0;
    if (charge <= 0) throw new BadRequestException('The centre has not set a price for this booking yet.');
    const fee = feePaise();
    const total = charge + fee;

    const existing = await this.prisma.payments.findMany({ where: { service_request_id: b.id, status: { not: 'failed' } } });
    if (existing.some((p) => p.status === 'paid' || p.status === 'refunded')) {
      throw new ConflictException('This booking is already paid.');
    }
    const reusable = existing.find((p) => p.status === 'created' && p.amount_paise === total && p.razorpay_order_id);
    if (reusable) return { key_id: keys.keyId, order_id: reusable.razorpay_order_id!, amount_paise: total };

    const order = await razorpay<RzpOrder>(keys, 'POST', '/orders', {
      amount: total,
      currency: 'INR',
      receipt: `AF-${b.id.slice(0, 8).toUpperCase()}`,
      notes: { service_request_id: b.id },
    });
    // The price changed since an older unpaid order: that order can no longer be the one paid for.
    await this.prisma.payments.updateMany({
      where: { service_request_id: b.id, status: 'created' },
      data: { status: 'failed', failure_reason: 'Replaced by a new order (price changed)', updated_at: new Date() },
    });
    await this.prisma.payments.create({
      data: {
        user_id: userId,
        partner_id: b.partner_id,
        purpose: 'service_charge',
        amount_paise: total,
        platform_fee_paise: fee,
        service_request_id: b.id,
        razorpay_order_id: order.id,
      },
    });
    return { key_id: keys.keyId, order_id: order.id, amount_paise: total };
  }

  // ---------------------------------------------------------------- Checkout callback + webhook

  /** Razorpay Checkout's success handler. Signature proves the payment; state is then set exactly like the webhook. */
  async verify(userId: string, input: VerifyInput) {
    const keys = this.keys();
    if (input.kind === 'order') {
      const expected = checkoutSignature(keys.keySecret, input.razorpay_order_id, input.razorpay_payment_id);
      if (!sameSignature(expected, input.razorpay_signature)) throw new BadRequestException('Payment could not be verified.');
      const row = await this.prisma.payments.findUnique({ where: { razorpay_order_id: input.razorpay_order_id } });
      if (!row || row.user_id !== userId) throw new ForbiddenException();
      await this.markOrderPaid(input.razorpay_order_id, input.razorpay_payment_id);
      return { ok: true };
    }
    const expected = checkoutSignature(keys.keySecret, input.razorpay_payment_id, input.razorpay_subscription_id);
    if (!sameSignature(expected, input.razorpay_signature)) throw new BadRequestException('Payment could not be verified.');
    const sub = await this.prisma.subscriptions.findUnique({ where: { razorpay_subscription_id: input.razorpay_subscription_id } });
    if (!sub || sub.user_id !== userId) throw new ForbiddenException();
    const live = await razorpay<RzpSubscription>(keys, 'GET', `/subscriptions/${input.razorpay_subscription_id}`);
    await this.syncSubscription(live);
    return { ok: true };
  }

  /** POST /payments/webhook. Returns false for a bad signature (controller → 400). */
  async webhook(rawBody: Buffer | undefined, signature: string | undefined): Promise<boolean> {
    const secret = razorpayKeys()?.webhookSecret;
    if (!secret || !rawBody || !sameSignature(webhookSignature(secret, rawBody), signature)) return false;
    const evt = JSON.parse(rawBody.toString('utf8')) as WebhookEvent;
    const payment = evt.payload.payment?.entity;
    const subscription = evt.payload.subscription?.entity;

    switch (evt.event) {
      case 'payment.captured':
      case 'order.paid':
        // Plus renewals also arrive here with Razorpay's own order ids; those match no row and are handled below.
        if (payment?.order_id) await this.markOrderPaid(payment.order_id, payment.id);
        break;
      case 'payment.failed':
        if (payment?.order_id) {
          await this.prisma.payments.updateMany({
            where: { razorpay_order_id: payment.order_id, status: 'created' },
            data: { failure_reason: payment.error_description ?? 'Payment failed', updated_at: new Date() },
          });
        }
        break;
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged':
      case 'subscription.cancelled':
      case 'subscription.completed':
      case 'subscription.halted':
        if (subscription) await this.syncSubscription(subscription, evt.event === 'subscription.charged' ? payment : undefined);
        break;
      case 'refund.processed':
        if (payment) {
          await this.prisma.payments.updateMany({
            where: { razorpay_payment_id: payment.id },
            data: {
              refunded_amount_paise: payment.amount_refunded ?? 0,
              ...((payment.amount_refunded ?? 0) >= payment.amount && { status: 'refunded' }),
              updated_at: new Date(),
            },
          });
        }
        break;
      default:
        break;
    }
    return true;
  }

  /** created → paid, once. A booking cancelled while the citizen was paying is refunded straight away. */
  private async markOrderPaid(orderId: string, paymentId: string) {
    const { count } = await this.prisma.payments.updateMany({
      where: { razorpay_order_id: orderId, status: { in: ['created', 'failed'] } },
      data: { status: 'paid', razorpay_payment_id: paymentId, paid_at: new Date(), failure_reason: null, updated_at: new Date() },
    });
    if (!count) return;
    const row = await this.prisma.payments.findUnique({
      where: { razorpay_order_id: orderId },
      include: { service_requests: { select: { status: true } } },
    });
    const status = row?.service_requests?.status;
    if (row && (status === 'cancelled' || status === 'rejected')) {
      await this.refundBooking(row.service_request_id!, `Booking was ${status} before the payment completed`);
    } else if (row?.user_id && row.service_request_id) {
      // Receipt (in-app + email from services@). A failed notification must not undo the payment.
      const rupees = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      const fee = row.platform_fee_paise;
      await this.notifications
        ?.notify(
          [row.user_id],
          {
            type: 'request_update',
            title: `Payment received: ${rupees(row.amount_paise)}`,
            body:
              `Receipt AF-${row.service_request_id.slice(0, 8).toUpperCase()} · Payment ID ${paymentId}. ` +
              `Service charge ${rupees(row.amount_paise - fee)}` +
              (fee ? ` + convenience fee ${rupees(fee)}` : '') +
              '.',
            link: `${(process.env.SERVICE_URL ?? 'https://service.applyfields.com').replace(/\/$/, '')}/bookings/${row.service_request_id}`,
          },
          () => `payment:${orderId}`,
        )
        .catch(() => null);
    }
  }

  /** Mirror Razorpay's subscription state onto our row; record the charge's payment once. */
  private async syncSubscription(s: RzpSubscription, charge?: RzpPayment) {
    const row = await this.prisma.subscriptions.findUnique({ where: { razorpay_subscription_id: s.id } });
    if (!row) {
      this.logger.warn(`Razorpay subscription ${s.id} has no row`);
      return;
    }
    const endsAt = unix(s.current_end);
    await this.prisma.subscriptions.update({
      where: { id: row.id },
      data: {
        ...(s.status === 'active' && { status: 'active', starts_at: row.starts_at ?? unix(s.current_start) }),
        ...(s.status === 'cancelled' && { status: 'cancelled', auto_renew: false }),
        ...((s.status === 'completed' || s.status === 'expired') && { status: 'expired', auto_renew: false }),
        ...(s.status === 'halted' && { auto_renew: false }),
        // ends_at only moves forward (events can arrive out of order).
        ...(endsAt && (!row.ends_at || endsAt > row.ends_at) && { ends_at: endsAt }),
        updated_at: new Date(),
      },
    });
    if (charge) {
      await this.prisma.payments.upsert({
        where: { razorpay_payment_id: charge.id },
        create: {
          user_id: row.user_id,
          purpose: 'user_subscription',
          amount_paise: charge.amount,
          status: 'paid',
          subscription_id: row.id,
          razorpay_payment_id: charge.id,
          paid_at: new Date(),
        },
        update: {},
      });
    }
  }

  // ---------------------------------------------------------------- Refunds

  /** Staff refund (admin Payments desk). Partial refunds allowed; never more than what is left. */
  async refund(paymentId: string, input: RefundInput, actorId: string | null) {
    const keys = this.keys();
    const p = await this.prisma.payments.findUnique({ where: { id: paymentId } });
    if (!p) throw new NotFoundException('Payment not found');
    if (p.status !== 'paid' || !p.razorpay_payment_id) throw new BadRequestException('Only paid online payments can be refunded.');
    const left = p.amount_paise - p.refunded_amount_paise;
    const amount = input.amount_paise ?? left;
    if (amount <= 0 || amount > left) throw new BadRequestException(`You can refund at most ₹${left / 100}.`);

    await razorpay<RzpRefund>(keys, 'POST', `/payments/${p.razorpay_payment_id}/refund`, {
      amount,
      notes: { reason: input.reason.slice(0, 250) },
    });
    const refunded = p.refunded_amount_paise + amount;
    const row = await this.prisma.payments.update({
      where: { id: p.id },
      data: { refunded_amount_paise: refunded, ...(refunded >= p.amount_paise && { status: 'refunded' }), updated_at: new Date() },
    });
    await this.prisma.audit_logs
      .create({
        data: { actor_id: actorId, action: 'payment_refunded', target_type: 'payment', target_id: p.id, details: { amount_paise: amount, reason: input.reason } },
      })
      .catch(() => null);
    return { id: row.id, status: row.status, refunded_amount_paise: row.refunded_amount_paise };
  }

  /**
   * Full refund of a booking's online payment (citizen cancelled, centre rejected). Never throws: the cancel itself
   * must go through; if Razorpay fails, admins are alerted to refund from the Payments desk.
   */
  async refundBooking(bookingId: string, reason: string): Promise<void> {
    const p = await this.prisma.payments.findFirst({ where: { service_request_id: bookingId, status: 'paid' } });
    if (!p) return;
    try {
      await this.refund(p.id, { reason }, null);
    } catch (err) {
      this.logger.error(`Auto-refund failed for payment ${p.id}: ${(err as Error).message}`);
      await this.notifications
        ?.notifyStaff(
          ['admin'],
          { title: 'Refund needed', body: `Booking AF-${bookingId.slice(0, 8).toUpperCase()}: ${reason}. Auto-refund failed; refund it from Payments.`, path: '/payments' },
          `refund_failed:${p.id}`,
        )
        .catch(() => null);
    }
  }
}
