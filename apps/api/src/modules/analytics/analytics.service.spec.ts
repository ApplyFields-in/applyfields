import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service.js';

describe('AnalyticsService', () => {
  const mockCreate = vi.fn().mockResolvedValue({ id: 'mock-uuid-1' });
  const mockCreateMany = vi.fn().mockResolvedValue({ count: 2 });
  const mockGroupBy = vi.fn().mockResolvedValue([
    { event_name: 'search', _count: { _all: 100 } },
    { event_name: 'opportunity_view', _count: { _all: 50 } },
    { event_name: 'eligibility_check', _count: { _all: 25 } },
    { event_name: 'opportunity_save', _count: { _all: 15 } },
    { event_name: 'external_apply_click', _count: { _all: 10 } },
    { event_name: 'service_browse', _count: { _all: 40 } },
    { event_name: 'booking_slot_start', _count: { _all: 20 } },
    { event_name: 'booking_slot_completed', _count: { _all: 8 } },
  ]);
  const mockFindMany = vi.fn().mockResolvedValue([
    { session_id: 'sess-1' },
    { session_id: 'sess-2' },
  ]);
  const mockCount = vi.fn().mockResolvedValue(268);
  const mockQueryRaw = vi.fn().mockResolvedValue([
    { query: 'upsc prelims', count: 42n },
  ]);

  const mockPrisma = {
    analytics_events: {
      create: mockCreate,
      createMany: mockCreateMany,
      groupBy: mockGroupBy,
      findMany: mockFindMany,
      count: mockCount,
    },
    $queryRaw: mockQueryRaw,
  } as any;

  const service = new AnalyticsService(mockPrisma);

  it('records a single analytics event without PII', async () => {
    const res = await service.recordEvent({
      event_name: 'opportunity_view',
      session_id: 'anon_sess_abc123',
      entity_type: 'opportunity',
      entity_id: 'opp-uuid-999',
      metadata: { category: 'government_job' },
    });

    expect(res.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event_name: 'opportunity_view',
          session_id: 'anon_sess_abc123',
          entity_type: 'opportunity',
          entity_id: 'opp-uuid-999',
        }),
      }),
    );
  });

  it('records a batch of analytics events', async () => {
    const res = await service.recordBatch([
      {
        event_name: 'search',
        session_id: 'anon_sess_1',
        metadata: { query: 'bank po' },
      },
      {
        event_name: 'external_apply_click',
        session_id: 'anon_sess_1',
        entity_id: 'opp-1',
      },
    ]);

    expect(res.success).toBe(true);
    expect(res.count).toBe(2);
    expect(mockCreateMany).toHaveBeenCalled();
  });

  it('computes citizen conversion funnel summary with drop-off conversion rates', async () => {
    const summary = await service.getFunnelSummary(30);

    expect(summary.period_days).toBe(30);
    expect(summary.total_events).toBe(268);
    expect(summary.total_sessions).toBe(2);

    expect(summary.funnel.searches).toBe(100);
    expect(summary.funnel.views).toBe(50);
    expect(summary.funnel.eligibility_checks).toBe(25);
    expect(summary.funnel.external_applies).toBe(10);
    expect(summary.funnel.service_browses).toBe(40);
    expect(summary.funnel.bookings_completed).toBe(8);

    // 50 views / 100 searches = 50%
    expect(summary.conversion_rates.search_to_view).toBe(50);
    // 25 checks / 50 views = 50%
    expect(summary.conversion_rates.view_to_eligibility).toBe(50);
    // 10 applies / 25 checks = 40%
    expect(summary.conversion_rates.eligibility_to_apply).toBe(40);
    // 8 bookings / 40 browses = 20%
    expect(summary.conversion_rates.browse_to_booking).toBe(20);
  });
});
