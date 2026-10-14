import { describe, expect, it } from 'vitest';
import { ReportsService } from './reports.service.js';

describe('ReportsService & Moderation Flow', () => {
  const mockPrisma = {} as any;
  const service = new ReportsService(mockPrisma);
  const reporterId = '33333333-3333-3333-3333-333333333333';
  const staffId = '44444444-4444-4444-4444-444444444444';

  it('submits a report on incorrect info successfully', async () => {
    const res = await service.submitReport(
      reporterId,
      {
        item_type: 'opportunity',
        item_id: '55555555-5555-5555-5555-555555555555',
        reason: 'incorrect_info',
        details: 'The official last date was extended to 30th November as per latest corrigendum.',
      },
      '127.0.0.1',
    );

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();
    expect(res.message).toContain('moderation queue');
  });

  it('enforces rate limiting when maximum requests are exceeded', async () => {
    const spammerIp = '192.168.1.100';
    for (let i = 0; i < 5; i++) {
      await service.submitReport(
        null,
        {
          item_type: 'service',
          item_id: '66666666-6666-6666-6666-666666666666',
          reason: 'broken_link',
          details: `Spam attempt ${i}`,
        },
        spammerIp,
      );
    }

    // 6th attempt should be rejected by rate limiter
    await expect(
      service.submitReport(
        null,
        {
          item_type: 'service',
          item_id: '66666666-6666-6666-6666-666666666666',
          reason: 'broken_link',
        },
        spammerIp,
      ),
    ).rejects.toThrow('Too many reports submitted');
  });

  it('allows staff to list and resolve reports with resolution notes', async () => {
    const list = await service.listAdminReports({ status: 'pending' });
    expect(list.total).toBeGreaterThanOrEqual(1);

    const reportId = list.items[0].id;
    const resolved = await service.resolveReport(staffId, reportId, {
      status: 'resolved',
      resolution_note: 'Verified against official commission notice and corrected deadline.',
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.assigned_to).toBe(staffId);
    expect(resolved.resolution_note).toContain('Verified against official');
    expect(resolved.resolved_at).toBeDefined();
  });
});
