import type { ReviewList } from '@applyfields/types';
import { Badge, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import { ArrowRight, CircleAlert, CircleCheck, FileClock, Inbox, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { ConfidenceMeter, formatFoundAt, TYPE_LABEL } from '@/components/review-ui';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.review.title };

/** Review queue — drafts from the scrapers, newest first. Data: GET /api/v1/admin/review */
export default async function Page({ searchParams }: PageProps<'/review'>) {
  await connection();
  const sp = await searchParams;
  const source = typeof sp.source === 'string' ? sp.source : '';
  const careful = sp.careful === '1';

  const query = new URLSearchParams();
  if (source) query.set('source', source);
  if (careful) query.set('careful', '1');
  const data = await apiGet<ReviewList>(`/admin/review${query.size ? `?${query}` : ''}`);

  const href = (next: { source?: string; careful?: boolean }) => {
    const q = new URLSearchParams();
    const s = next.source ?? source;
    const c = next.careful ?? careful;
    if (s) q.set('source', s);
    if (c) q.set('careful', '1');
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
        <ApiOffline />
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
            <FilterChip href={href({ careful: false })} active={!careful}>
              All drafts
            </FilterChip>
            <FilterChip href={href({ careful: true })} active={careful}>
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

          {data.items.length === 0 ? (
            <EmptyState
              icon={<CircleCheck />}
              title={source || careful ? 'Nothing matches this filter' : 'The queue is empty'}
              text={
                data.waiting_extraction > 0
                  ? `${data.waiting_extraction} downloaded notices are waiting to be read by the extractor. They appear here as drafts once they are.`
                  : 'New drafts appear here as soon as the scrapers find official notifications.'
              }
            />
          ) : (
            <Card className="overflow-hidden p-0">
              {/* Header row (desktop) */}
              <div className="hidden grid-cols-[minmax(0,1fr)_110px_120px_120px_130px_24px] gap-4 border-b border-teal/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-teal/70 lg:grid">
                <span>Draft</span>
                <span>Source</span>
                <span>Confidence</span>
                <span>Found</span>
                <span>Publish check</span>
                <span />
              </div>
              <ul className="divide-y divide-teal/10">
                {data.items.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/review/${d.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-tea/40 lg:grid-cols-[minmax(0,1fr)_110px_120px_120px_130px_24px]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">{d.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-teal/80">
                          {d.organization} · {TYPE_LABEL[d.type]}
                          {d.needs_care && (
                            <Badge tone="celadon" className="text-[11px]">
                              <TriangleAlert aria-hidden="true" /> Check carefully
                            </Badge>
                          )}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-teal/60 lg:order-last" aria-hidden="true" />
                      <span className="text-xs font-semibold uppercase lg:text-sm">
                        <span className="text-teal/70 lg:hidden">Source </span>
                        {d.source_key ?? '—'}
                      </span>
                      <ConfidenceMeter value={d.confidence} />
                      <span className="text-xs text-teal/80 lg:text-sm">{formatFoundAt(d.found_at)}</span>
                      <span>
                        {d.missing.length === 0 ? (
                          <Badge tone="teal">
                            <CircleCheck aria-hidden="true" /> Ready
                          </Badge>
                        ) : (
                          <Badge tone="outline" className="bg-cream">
                            <CircleAlert aria-hidden="true" /> {d.missing.length} missing
                          </Badge>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
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
