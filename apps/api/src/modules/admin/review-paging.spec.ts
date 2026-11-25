import type { ReviewListItem } from '@applyfields/types';
import { pageReviewItems } from './review-paging.js';

let n = 0;
function item(over: Partial<ReviewListItem> = {}): ReviewListItem {
  n += 1;
  return {
    id: `d${n}`,
    title: `Draft ${n}`,
    type: 'govt_job',
    organization: 'Org',
    source_key: 'ssc',
    source_url: 'https://example.org',
    confidence: 0.8,
    found_at: '2026-11-20T10:00:00.000Z',
    needs_care: false,
    missing: [],
    last_date: null,
    ...over,
  };
}
const ids = (r: { items: ReviewListItem[] }) => r.items.map((i) => i.id);

describe('pageReviewItems', () => {
  it('pages 25 at a time and reports the page count', () => {
    const all = Array.from({ length: 60 }, () => item());
    const p1 = pageReviewItems(all, {});
    expect(p1.items).toHaveLength(25);
    expect(p1).toMatchObject({ page: 1, page_size: 25, pages: 3, matching: 60 });
    const p3 = pageReviewItems(all, { page: 3 });
    expect(p3.items).toHaveLength(10);
    expect(p3.items[0].id).toBe(all[50].id);
  });

  it('clamps a page past the end to the last page, and below 1 to the first', () => {
    const all = Array.from({ length: 30 }, () => item());
    expect(pageReviewItems(all, { page: 99 }).page).toBe(2);
    expect(pageReviewItems(all, { page: 0 }).page).toBe(1);
    expect(pageReviewItems([], { page: 4 })).toMatchObject({ page: 1, pages: 1, items: [] });
  });

  it('counts ready vs missing over every draft, then filters by readiness before paging', () => {
    const ready = item();
    const missing = item({ missing: ['Last date'] });
    const all = [missing, ready, item({ missing: ['Source URL'] })];
    expect(pageReviewItems(all, {})).toMatchObject({ ready: 1, missing_info: 2, matching: 3 });
    expect(ids(pageReviewItems(all, { readiness: 'ready' }))).toEqual([ready.id]);
    const m = pageReviewItems(all, { readiness: 'missing' });
    expect(m.matching).toBe(2);
    expect(m.items.every((i) => i.missing.length > 0)).toBe(true);
  });

  it('sorts newest / oldest by when the scraper found it', () => {
    const a = item({ found_at: '2026-11-18T00:00:00.000Z' });
    const b = item({ found_at: '2026-11-20T00:00:00.000Z' });
    const c = item({ found_at: '2026-11-19T00:00:00.000Z' });
    expect(ids(pageReviewItems([a, b, c], { sort: 'newest' }))).toEqual([b.id, c.id, a.id]);
    expect(ids(pageReviewItems([a, b, c], { sort: 'oldest' }))).toEqual([a.id, c.id, b.id]);
  });

  it('sorts closing soonest with unknown last dates at the end', () => {
    const none = item({ last_date: null });
    const late = item({ last_date: '2026-12-30' });
    const soon = item({ last_date: '2026-11-25' });
    expect(ids(pageReviewItems([none, late, soon], { sort: 'closing' }))).toEqual([soon.id, late.id, none.id]);
  });

  it('sorts lowest confidence first, unscored drafts before everything', () => {
    const high = item({ confidence: 0.9 });
    const none = item({ confidence: null });
    const low = item({ confidence: 0.3 });
    expect(ids(pageReviewItems([high, none, low], { sort: 'confidence' }))).toEqual([none.id, low.id, high.id]);
  });

  it('defaults to newest first', () => {
    const old = item({ found_at: '2026-11-01T00:00:00.000Z' });
    const fresh = item({ found_at: '2026-11-21T00:00:00.000Z' });
    expect(ids(pageReviewItems([old, fresh], {}))).toEqual([fresh.id, old.id]);
  });
});
