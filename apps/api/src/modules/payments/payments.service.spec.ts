import { createHmac } from 'node:crypto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentsService } from './payments.service.js';

const SECRET = 'whsec_test';
const sign = (body: string) => createHmac('sha256', SECRET).update(body).digest('hex');

function fetchReturning(json: unknown, ok = true) {
  return vi.fn(async () => ({ ok, status: ok ? 200 : 400, json: async () => json }));
}

beforeEach(() => {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_x';
  process.env.RAZORPAY_KEY_SECRET = 'secret_x';
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  process.env.RAZORPAY_PLUS_PLAN_ID = 'plan_x';
  process.env.BOOKING_CONVENIENCE_FEE_PAISE = '1000';
});
afterEach(() => vi.unstubAllGlobals());

describe('webhook', () => {
  it('rejects a bad signature and changes nothing', async () => {
    const prisma: any = { payments: { updateMany: vi.fn() } };
    const body = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: {} }));
    expect(await new PaymentsService(prisma).webhook(body, 'nope')).toBe(false);
    expect(prisma.payments.updateMany).not.toHaveBeenCalled();
  });

  it('marks an order paid once; a repeat delivery is a no-op', async () => {
    const updateMany = vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const prisma: any = {
      payments: {
        updateMany,
        findUnique: vi.fn(async () => ({ id: 'p1', service_request_id: 'b1', service_requests: { status: 'accepted' } })),
      },
    };
    const svc = new PaymentsService(prisma);
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1', amount: 6000 } } } });
    expect(await svc.webhook(Buffer.from(raw), sign(raw))).toBe(true);
    expect(await svc.webhook(Buffer.from(raw), sign(raw))).toBe(true);
    expect(updateMany.mock.calls[0][0].where).toEqual({ razorpay_order_id: 'order_1', status: { in: ['created', 'failed'] } });
    expect(prisma.payments.findUnique).toHaveBeenCalledTimes(1); // second delivery stopped at count 0
  });

  it('refunds a payment that lands after the booking was cancelled', async () => {
    vi.stubGlobal('fetch', fetchReturning({ id: 'rfnd_1', payment_id: 'pay_1', amount: 6000 }));
    const paidRow = { id: 'p1', status: 'paid', razorpay_payment_id: 'pay_1', amount_paise: 6000, refunded_amount_paise: 0 };
    const prisma: any = {
      payments: {
        updateMany: vi.fn(async () => ({ count: 1 })),
        findUnique: vi.fn(async ({ where }: any) =>
          where.razorpay_order_id ? { id: 'p1', service_request_id: 'b1', service_requests: { status: 'cancelled' } } : paidRow,
        ),
        findFirst: vi.fn(async () => paidRow),
        update: vi.fn(async ({ data }: any) => ({ ...paidRow, ...data })),
      },
      audit_logs: { create: vi.fn(async () => ({})) },
    };
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1', amount: 6000 } } } });
    await new PaymentsService(prisma).webhook(Buffer.from(raw), sign(raw));
    expect(prisma.payments.update.mock.calls[0][0].data).toMatchObject({ refunded_amount_paise: 6000, status: 'refunded' });
  });

  it('subscription.charged extends Plus and records the charge once', async () => {
    const row = { id: 's1', user_id: 'u1', starts_at: null, ends_at: new Date('2026-11-01') };
    const prisma: any = {
      subscriptions: { findUnique: vi.fn(async () => row), update: vi.fn(async () => ({})) },
      payments: { upsert: vi.fn(async () => ({})) },
    };
    const end = Math.floor(new Date('2026-12-15').getTime() / 1000);
    const raw = JSON.stringify({
      event: 'subscription.charged',
      payload: {
        subscription: { entity: { id: 'sub_1', status: 'active', current_start: end - 2_592_000, current_end: end } },
        payment: { entity: { id: 'pay_9', amount: 5000 } },
      },
    });
    await new PaymentsService(prisma).webhook(Buffer.from(raw), sign(raw));
    expect(prisma.subscriptions.update.mock.calls[0][0].data).toMatchObject({ status: 'active', ends_at: new Date(end * 1000) });
    expect(prisma.payments.upsert.mock.calls[0][0]).toMatchObject({ where: { razorpay_payment_id: 'pay_9' }, update: {} });
  });
});

describe('bookings', () => {
  it('orders charge + convenience fee, computed on the server', async () => {
    const fetchMock = fetchReturning({ id: 'order_new', amount: 6000, status: 'created' });
    vi.stubGlobal('fetch', fetchMock);
    const prisma: any = {
      service_requests: {
        findUnique: vi.fn(async () => ({ id: 'b1', user_id: 'u1', partner_id: 'c1', status: 'accepted', quoted_paise: 5000, final_paise: null })),
      },
      payments: { findMany: vi.fn(async () => []), updateMany: vi.fn(async () => ({ count: 0 })), create: vi.fn(async () => ({})) },
    };
    const res = await new PaymentsService(prisma).bookingOrder('u1', 'b1');
    expect(res).toEqual({ key_id: 'rzp_test_x', order_id: 'order_new', amount_paise: 6000 });
    expect(JSON.parse((fetchMock.mock.calls[0] as any)[1].body).amount).toBe(6000);
    expect(prisma.payments.create.mock.calls[0][0].data).toMatchObject({ amount_paise: 6000, platform_fee_paise: 1000, purpose: 'service_charge' });
  });

  it('refuses to pay a booking twice', async () => {
    const prisma: any = {
      service_requests: { findUnique: vi.fn(async () => ({ id: 'b1', user_id: 'u1', partner_id: 'c1', status: 'accepted', quoted_paise: 5000 })) },
      payments: { findMany: vi.fn(async () => [{ status: 'paid' }]) },
    };
    await expect(new PaymentsService(prisma).bookingOrder('u1', 'b1')).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('refund', () => {
  it('never refunds more than what is left', async () => {
    const prisma: any = {
      payments: { findUnique: vi.fn(async () => ({ id: 'p1', status: 'paid', razorpay_payment_id: 'pay_1', amount_paise: 6000, refunded_amount_paise: 5000 })) },
    };
    await expect(new PaymentsService(prisma).refund('p1', { amount_paise: 2000, reason: 'test' }, null)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('Plus', () => {
  it('cancel stops renewal at cycle end and keeps the paid month', async () => {
    const fetchMock = fetchReturning({ id: 'sub_1', status: 'active' });
    vi.stubGlobal('fetch', fetchMock);
    const sub = { id: 's1', status: 'active', auto_renew: true, razorpay_subscription_id: 'sub_1', ends_at: new Date(Date.now() + 10 * 86_400_000) };
    const prisma: any = {
      subscriptions: { findFirst: vi.fn(async () => sub), update: vi.fn(async () => ({})) },
      subscription_plans: { findUnique: vi.fn(async () => ({ name: 'ApplyFields Plus', price_paise: 5000, benefits: [] })) },
    };
    await new PaymentsService(prisma).cancelPlus('u1');
    expect((fetchMock.mock.calls[0] as any)[0]).toContain('/subscriptions/sub_1/cancel');
    expect(JSON.parse((fetchMock.mock.calls[0] as any)[1].body)).toEqual({ cancel_at_cycle_end: 1 });
    expect(prisma.subscriptions.update.mock.calls[0][0].data).toMatchObject({ auto_renew: false });
    expect(prisma.subscriptions.update.mock.calls[0][0].data.status).toBeUndefined();
  });
});
