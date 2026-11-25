import type { ReviewListItem, ReviewReadiness, ReviewSort } from '@applyfields/types';

export const REVIEW_PAGE_SIZE = 25;

const time = (iso: string) => Date.parse(iso);
const SORTS: Record<ReviewSort, (a: ReviewListItem, b: ReviewListItem) => number> = {
  newest: (a, b) => time(b.found_at) - time(a.found_at),
  oldest: (a, b) => time(a.found_at) - time(b.found_at),
  // unknown last date goes last
  closing: (a, b) => (a.last_date ?? '9999').localeCompare(b.last_date ?? '9999'),
  // unscored (null) first: it needs the most care
  confidence: (a, b) => (a.confidence ?? -1) - (b.confidence ?? -1),
};

/**
 * Review queue tabs + sort + pages. "Ready" (nothing missing) is worked out in code, so this runs
 * over every matching draft before slicing a page. Counts cover all drafts in the current
 * source / careful filter, so the tabs show the same numbers on every page.
 */
export function pageReviewItems(
  all: ReviewListItem[],
  opts: { readiness?: ReviewReadiness; sort?: ReviewSort; page?: number; pageSize?: number },
) {
  const pageSize = opts.pageSize ?? REVIEW_PAGE_SIZE;
  const ready = all.filter((i) => i.missing.length === 0).length;
  const shown =
    opts.readiness === 'ready'
      ? all.filter((i) => i.missing.length === 0)
      : opts.readiness === 'missing'
        ? all.filter((i) => i.missing.length > 0)
        : all;
  const sorted = [...shown].sort(SORTS[opts.sort ?? 'newest']);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1)), pages);
  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    matching: sorted.length,
    ready,
    missing_info: all.length - ready,
    page,
    page_size: pageSize,
    pages,
  };
}
