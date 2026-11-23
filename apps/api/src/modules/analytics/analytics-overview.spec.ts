import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service.js';

describe('AnalyticsService.getOverview', () => {
  it('fills every day, splits partners into centres and colleges, and counts visits', async () => {
    const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
    const prisma: any = {
      users: { count: vi.fn().mockResolvedValueOnce(120).mockResolvedValueOnce(15).mockResolvedValueOnce(40) },
      $queryRawUnsafe: vi
        .fn()
        .mockResolvedValueOnce([{ day: today, count: 3n }]) // sign-ups
        .mockResolvedValueOnce([{ day: today, count: 50n }]), // page views
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ n: 22n }]) // visitors
        .mockResolvedValueOnce([{ site: 'web', path: '/apply', views: 30n }]),
      analytics_events: {
        count: vi.fn().mockResolvedValue(50),
        groupBy: vi.fn().mockResolvedValue([{ event_name: 'opportunity_view', _count: { _all: 9 } }]),
      },
      partners: {
        groupBy: vi.fn().mockResolvedValue([
          { type: 'xerox_printing', verification_status: 'pending', _count: { _all: 2 } },
          { type: 'meeseva', verification_status: 'verified', _count: { _all: 1 } },
          { type: 'college', verification_status: 'pending', _count: { _all: 4 } },
          { type: 'csc', verification_status: 'suspended', _count: { _all: 1 } },
        ]),
      },
      service_requests: { count: vi.fn().mockResolvedValueOnce(8).mockResolvedValueOnce(5) },
      opportunities: { count: vi.fn().mockResolvedValue(70) },
    };
    const o = await new AnalyticsService(prisma).getOverview(7);
    expect(o.users).toMatchObject({ total: 120, new: 15, active: 40 });
    expect(o.users.signups_by_day).toHaveLength(7);
    expect(o.users.signups_by_day.at(-1)).toEqual({ day: today, count: 3 });
    expect(o.visits).toMatchObject({ page_views: 50, visitors: 22, top_pages: [{ site: 'web', path: '/apply', views: 30 }] });
    expect(o.partners).toEqual({
      centres: { pending: 2, verified: 1, rejected: 0 },
      colleges: { pending: 4, verified: 0, rejected: 0 },
    });
    expect(o.bookings).toEqual({ total: 8, completed: 5 });
    expect(o.opportunities).toEqual({ published: 70, views: 9, saves: 0 });
  });
});
