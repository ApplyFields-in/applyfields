import { describe, expect, it, vi } from 'vitest';
import { ScrapersAdminService } from './scrapers-admin.service.js';
import { LinkHealthService } from './link-health.service.js';

describe('ScrapersAdminService', () => {
  it('correctly maps source health and summary metrics', async () => {
    const mockPrisma = {
      scrape_sources: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: '11111111-1111-1111-1111-111111111111',
            key: 'ssc',
            name: 'Staff Selection Commission',
            organization_id: 'org-1',
            list_url: 'https://ssc.gov.in',
            kind: 'api',
            is_active: true,
            interval_hours: 6,
            last_run_at: new Date(),
            last_success_at: new Date(),
            consecutive_failures: 0,
            organizations: { name: 'Staff Selection Commission' },
            scrape_runs: [
              {
                id: 'run-1',
                source_id: '11111111-1111-1111-1111-111111111111',
                status: 'success',
                started_at: new Date(),
                finished_at: new Date(),
                items_found: 10,
                new_items: 2,
                error: null,
              },
            ],
            _count: { scrape_runs: 5, scraped_documents: 25 },
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            key: 'upsc',
            name: 'Union Public Service Commission',
            organization_id: 'org-2',
            list_url: 'https://upsc.gov.in',
            kind: 'html',
            is_active: true,
            interval_hours: 6,
            last_run_at: new Date(Date.now() - 48 * 3600 * 1000), // stale
            last_success_at: new Date(Date.now() - 48 * 3600 * 1000),
            consecutive_failures: 0,
            organizations: { name: 'UPSC' },
            scrape_runs: [],
            _count: { scrape_runs: 1, scraped_documents: 4 },
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            key: 'ibps',
            name: 'IBPS',
            organization_id: null,
            list_url: 'https://ibps.in',
            kind: 'html',
            is_active: true,
            interval_hours: 6,
            last_run_at: new Date(),
            last_success_at: null,
            consecutive_failures: 3, // failing
            organizations: null,
            scrape_runs: [],
            _count: { scrape_runs: 3, scraped_documents: 0 },
          },
        ]),
      },
    };

    const service = new ScrapersAdminService(mockPrisma as any);
    const res = await service.listSources();

    expect(res.sources).toHaveLength(3);
    expect(res.sources[0].health).toBe('healthy');
    expect(res.sources[1].health).toBe('stale');
    expect(res.sources[2].health).toBe('failing');

    expect(res.summary).toEqual({
      total: 3,
      active: 3,
      healthy: 1,
      failing: 1,
      stale: 1,
    });
  });

  it('rejects trigger for inactive or non-existent source', async () => {
    const mockPrisma = {
      scrape_sources: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const service = new ScrapersAdminService(mockPrisma as any);
    await expect(
      service.triggerSource('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow('not found');
  });

  describe('reextract', () => {
    const id = '33333333-3333-3333-3333-333333333333';
    const service = new ScrapersAdminService({} as any);
    const respond = (status: number, body: unknown) =>
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
      );

    it('reports success with the new confidence', async () => {
      const fetchSpy = respond(200, { extracted: true, confidence: 0.82, error: null });
      await expect(service.reextract(id)).resolves.toEqual({
        success: true,
        message: 'Fields refilled from the notification.',
        confidence: 0.82,
      });
      expect(String(fetchSpy.mock.calls[0][0])).toMatch(new RegExp(`/extract/${id}$`));
    });

    it('passes on why nothing was extracted (e.g. scanned PDF)', async () => {
      respond(200, { extracted: false, confidence: null, error: 'Scanned PDF (no text layer)' });
      await expect(service.reextract(id)).resolves.toEqual({
        success: false,
        message: 'Scanned PDF (no text layer)',
      });
    });

    it('reports an ingestion failure without throwing', async () => {
      respond(404, 'This opportunity has no scraped notification to read');
      const res = await service.reextract(id);
      expect(res.success).toBe(false);
      expect(res.message).toContain('Ingestion failed (404)');
    });
  });
});

describe('LinkHealthService', () => {
  it('returns empty report when no checks have run', () => {
    const mockPrisma = { opportunities: {} };
    const service = new LinkHealthService(mockPrisma as any);
    const report = service.getLatestReport();

    expect(report.checked_count).toBe(0);
    expect(report.broken_count).toBe(0);
    expect(report.broken_links).toEqual([]);
  });
});
