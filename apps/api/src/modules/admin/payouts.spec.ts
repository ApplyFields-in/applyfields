import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AdminController } from './admin.controller.js';

/** POST /admin/payments/payouts: gross = online payments for completed bookings, never from the request. */
function setup({ overlap = false, empty = false } = {}) {
  const create = vi.fn(async ({ data }: any) => ({ id: 'payout-1', ...data }));
  // 3 online payments: centre's part = amount - convenience fee - refunds = 50_000 + 40_000 + 30_000.
  const rows = [
    { amount_paise: 51_000, platform_fee_paise: 1_000, refunded_amount_paise: 0 },
    { amount_paise: 41_000, platform_fee_paise: 1_000, refunded_amount_paise: 0 },
    { amount_paise: 41_000, platform_fee_paise: 1_000, refunded_amount_paise: 10_000 },
  ];
  const aggregate = vi.fn(async () => (empty ? [] : rows));
  const prisma: any = {
    partner_payouts: { findFirst: vi.fn(async () => (overlap ? { id: 'old' } : null)), create },
    payments: { findMany: aggregate },
    audit_logs: { create: vi.fn(async () => ({})) },
  };
  const ctrl = new AdminController({} as any, {} as any, prisma, {} as any);
  return { ctrl, create, aggregate };
}

const body = { partner_id: '11111111-1111-4111-8111-111111111111', period_start: '2026-11-01', period_end: '2026-11-07', commission_percent: 10 };

describe('createPayout', () => {
  it('computes gross from online payments and net = gross − commission', async () => {
    const { ctrl, create, aggregate } = setup();
    const res = await ctrl.createPayout('admin-1', body);
    expect(res).toMatchObject({ gross_paise: 120_000, commission_paise: 12_000, net_paise: 108_000, bookings: 3 });
    expect(create.mock.calls[0][0].data).toMatchObject({ gross_paise: 120_000, commission_paise: 12_000, net_paise: 108_000 });
    // The period is whole IST days: 1 Nov 00:00 IST up to (not including) 8 Nov 00:00 IST.
    const where = (aggregate.mock.calls[0] as any)[0].where.service_requests;
    expect(where.completed_at.gte.toISOString()).toBe('2026-10-31T18:30:00.000Z');
    expect(where.completed_at.lt.toISOString()).toBe('2026-11-07T18:30:00.000Z');
  });

  it('refuses an overlapping period, an empty period and a reversed range', async () => {
    await expect(setup({ overlap: true }).ctrl.createPayout(null, body)).rejects.toBeInstanceOf(BadRequestException);
    await expect(setup({ empty: true }).ctrl.createPayout(null, body)).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      setup().ctrl.createPayout(null, { ...body, period_start: '2026-11-08', period_end: '2026-11-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
