import type { AdminOpportunityList, ReviewList, ReviewReadiness, ReviewSort } from '@applyfields/types';
import { Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import { ChevronLeft, ChevronRight, CircleAlert, CircleCheck, FileClock, Inbox, Send, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';

import { apiGet, apiGetWithStatus } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';
import { ReviewQueueClient } from './review-queue-client';
import { ReviewSortMenu } from './review-sort-menu';

export const metadata = { title: SECTIONS.review.title };

/** Review queue — drafts from the scrapers, newest first. Data: GET /api/v1/admin/review */
export default async function Page({ searchParams }: PageProps<'/review'>) {
  await connection();
  const sp = await searchParams;
  const source = typeof sp.source === 'string' ? sp.source : '';
  const careful = sp.careful === '1';
  const ready: ReviewReadiness | '' = sp.ready === 'ready' || sp.ready === 'missing' ? sp.ready : '';
  const sort: ReviewSort = sp.sort === 'oldest' || sp.sort === 'closing' || sp.sort === 'confidence' ? sp.sort : 'newest';
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);

  const state = { source, careful, ready, sort, page };
  type State = typeof state;
  const toQuery = (st: State) => {
    const q = new URLSearchParams();
    if (st.source) q.set('source', st.source);
    if (st.careful) q.set('careful', '1');
    if (st.ready) q.set('ready', st.ready);
    if (st.sort !== 'newest') q.set('sort', st.sort);
    if (st.page > 1) q.set('page', String(st.page));
    return q;
  };
  const [res, live] = await Promise.all([
    apiGetWithStatus<ReviewList>(`/admin/review?${toQuery(state)}`),
    apiGet<AdminOpportunityList>('/admin/opportunities?status=published'),
  ]);
  const data = res.data;

  // Changing any filter goes back to page 1; only page links keep `page`.
  const href = (next: Partial<State>) => {
    const q = toQuery({ ...state, page: 1, ...next });
    return q.size ? `/review?${q}` : '/review';
  };

  return (
    <>
      <PageHeader
        eyebrow="Apply & Ingestion Department · Review Cockpit"
        title="Review queue"
        description="Drafts found by the scrapers. Check each one against its official PDF before it goes live."
        icon={<Inbox />}
      />

      {data === null ? (
        <ApiOffline status={res.status} error={res.error} />
      ) : (
        <>
          {/* Summary */}
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Stat icon={<Inbox />} label="Waiting for review" value={data.total} />
            <Stat icon={<TriangleAlert />} label="Check carefully" value={data.needs_care} hint="confidence below 60%" />
            <Stat icon={<FileClock />} label="Waiting for extraction" value={data.waiting_extraction} hint="downloaded, not read yet" />
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2" role="navigation" aria-label="Filter the queue">
            <FilterChip href={href({ ready: '' })} active={!ready}>
              All drafts <Count n={data.ready + data.missing_info} />
            </FilterChip>
            <FilterChip href={href({ ready: 'ready' })} active={ready === 'ready'}>
              <CircleCheck aria-hidden="true" /> Ready to publish <Count n={data.ready} />
            </FilterChip>
            <FilterChip href="/opportunities?status=published" active={false}>
              <Send aria-hidden="true" /> Published {live && <Count n={live.counts.published} />}
            </FilterChip>
            <FilterChip href={href({ ready: 'missing' })} active={ready === 'missing'}>
              <CircleAlert aria-hidden="true" /> Missing info <Count n={data.missing_info} />
            </FilterChip>
            <FilterChip href={href({ careful: !careful })} active={careful}>
              <TriangleAlert aria-hidden="true" /> Check carefully
            </FilterChip>

            {data.sources.length > 0 && <span className="mx-1 h-6 w-px bg-teal/15" aria-hidden="true" />}
            {data.sources.length > 0 && (
              <FilterChip href={href({ source: '' })} active={!source}>
                Every source
              </FilterChip>
            )}
            {data.sources.map((s) => (
              <FilterChip key={s} href={href({ source: s })} active={source === s}>
                {s.toUpperCase()}
              </FilterChip>
            ))}
          </div>
          <div className="-mt-1 mb-4 flex justify-end">
            <ReviewSortMenu value={sort} />
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              icon={<CircleCheck />}
              title={source || careful || ready ? 'Nothing matches this filter' : 'The queue is empty'}
              text={
                data.waiting_extraction > 0
                  ? `${data.waiting_extraction} downloaded notices are waiting to be read by the extractor. They appear here as drafts once they are.`
                  : 'New drafts appear here as soon as the scrapers find official notifications.'
              }
            />
          ) : (
            <>
              <ReviewQueueClient
                items={data.items}
                total={data.total}
                sources={data.sources}
                currentSource={source}
                isCareful={careful}
              />
              <Pagination
                page={data.page}
                pages={data.pages}
                from={(data.page - 1) * data.page_size + 1}
                to={(data.page - 1) * data.page_size + data.items.length}
                of={data.matching}
                href={(p) => {
                  const q = toQuery({ ...state, page: p });
                  return q.size ? `/review?${q}` : '/review';
                }}
              />
            </>
          )}
        </>
      )}
    </>
  );
}

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: number; hint?: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-tea shadow-clay [&>svg]:size-5">{icon}</span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none tabular-nums">{value}</p>
        <p className="mt-1 truncate text-xs font-semibold text-teal/80">
          {label}
          {hint && <span className="font-normal"> · {hint}</span>}
        </p>
      </div>
    </Card>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'clay-press inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-clay [&>svg]:size-3.5',
        active ? 'bg-teal text-cream' : 'bg-cream hover:bg-tea/70',
      )}
    >
      {children}
    </Link>
  );
}

function Count({ n }: { n: number }) {
  return <span className="rounded-full bg-current/10 px-1.5 text-[10px] font-bold tabular-nums">{n}</span>;
}

/** "Showing 26–50 of 102" + Previous / page numbers / Next. Pages are links, so they prefetch. */
function Pagination({
  page,
  pages,
  from,
  to,
  of,
  href,
}: {
  page: number;
  pages: number;
  from: number;
  to: number;
  of: number;
  href: (page: number) => string;
}) {
  // Up to 5 numbers around the current page, plus first and last.
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  const link = 'grid h-8 min-w-8 place-items-center rounded-full px-2.5 text-xs font-semibold transition';
  return (
    <nav aria-label="Review queue pages" className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-teal/70">
        Showing <strong className="tabular-nums text-teal">{from}–{to}</strong> of{' '}
        <strong className="tabular-nums text-teal">{of}</strong>
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} className={cn(link, 'gap-1 bg-cream shadow-clay hover:bg-tea/70')} aria-label="Previous page">
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span className={cn(link, 'text-teal/30')} aria-hidden="true">
              <ChevronLeft className="size-3.5" />
            </span>
          )}
          {nums[0] > 1 && (
            <>
              <Link href={href(1)} className={cn(link, 'hover:bg-tea/70')}>1</Link>
              {nums[0] > 2 && <span className="px-1 text-teal/40">…</span>}
            </>
          )}
          {nums.map((n) => (
            <Link
              key={n}
              href={href(n)}
              aria-current={n === page ? 'page' : undefined}
              className={cn(link, n === page ? 'bg-teal text-cream' : 'hover:bg-tea/70')}
            >
              {n}
            </Link>
          ))}
          {nums[nums.length - 1] < pages && (
            <>
              {nums[nums.length - 1] < pages - 1 && <span className="px-1 text-teal/40">…</span>}
              <Link href={href(pages)} className={cn(link, 'hover:bg-tea/70')}>{pages}</Link>
            </>
          )}
          {page < pages ? (
            <Link href={href(page + 1)} className={cn(link, 'gap-1 bg-cream shadow-clay hover:bg-tea/70')} aria-label="Next page">
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span className={cn(link, 'text-teal/30')} aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
