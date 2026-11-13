import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BookingsService, walkInSchema } from './bookings.service.js';

/** Counter walk-ins: saved as a paid, in-progress booking of the operator's own centre. */
function setup({ member = true, service = { name: 'PAN card application' } as { name: string } | null } = {}) {
  const create = vi.fn(async ({ data }: any) => ({
    id: '11111111-2222-4333-8444-555555555555',
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
    service_request_events: [],
    document_shares: [],
  }));
  const eventCreate = vi.fn(async () => ({}));
  const prisma: any = {
    partner_members: { findFirst: vi.fn(async () => (member ? { partner_id: 'centre-1' } : null)) },
    partner_services: { findFirst: vi.fn(async () => service) },
    $transaction: async (fn: any) => fn({ service_requests: { create }, service_request_events: { create: eventCreate } }),
  };
  return { svc: new BookingsService(prisma), prisma, create, eventCreate };
}

const input = walkInSchema.parse({
  citizen_name: 'Ravi Kumar',
  contact_phone: '9000000103',
  partner_service_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  service_name: 'ignored when a rate-card service is picked',
  amount_paise: 15000,
  payment_mode: 'upi',
});

describe('createWalkIn', () => {
  it('creates an in-progress, already-paid booking for the operator’s centre', async () => {
    const { svc, prisma, create, eventCreate } = setup();
    const res = await svc.createWalkIn('operator-1', input);

    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({ partner_id: 'centre-1', user_id: null, status: 'in_progress', quoted_paise: 15000, final_paise: 15000 });
    expect(data.user_note).toBe('Applicant: Ravi Kumar; Contact: 9000000103; Service: PAN card application; Walk-in at counter, paid UPI');
    // The rate-card lookup is scoped to the operator's own centre.
    expect(prisma.partner_services.findFirst.mock.calls[0][0].where).toEqual({ id: input.partner_service_id, partner_id: 'centre-1' });
    expect((eventCreate.mock.calls[0] as any)[0].data).toMatchObject({ from_status: null, to_status: 'in_progress', actor_user_id: 'operator-1' });
    expect(res.status).toBe('in_progress');
  });

  it('refuses non-members and services from another centre’s rate card', async () => {
    await expect(setup({ member: false }).svc.createWalkIn('x', input)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(setup({ service: null }).svc.createWalkIn('x', input)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates input', () => {
    expect(walkInSchema.safeParse({ ...input, amount_paise: -1 }).success).toBe(false);
    expect(walkInSchema.safeParse({ ...input, contact_phone: '12345' }).success).toBe(false);
    expect(walkInSchema.safeParse({ ...input, payment_mode: 'card' }).success).toBe(false);
  });
});
