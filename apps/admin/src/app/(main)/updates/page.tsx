import type { AdminUpdateList, OpportunityStatus } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import {
  Archive,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Megaphone,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { StatusBadge } from '@/components/opportunities-ui';
import { formatDay } from '@/components/review-ui';
import {
  QuickArchiveUpdateButton,
  QuickPublishUpdateButton,
  UpdateKindBadge,
} from '@/components/updates-ui';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.updates.title };

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? (sp.status as OpportunityStatus) : undefined;

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (status) query.set('status', status);

  const data = await apiGet<AdminUpdateList>(`/admin/updates${query.size ? `?${query}` : ''}`);

  const buildUrl = (next: { q?: string; status?: string }) => {
    const params = new URLSearchParams();
    const nextQ = next.q !== undefined ? next.q : q;
    const nextStatus = next.status !== undefined ? next.status : status;

    if (nextQ) params.set('q', nextQ);
    if (nextStatus) params.set('status', nextStatus);

    return params.size ? `/updates?${params}` : '/updates';
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Results & updates"
        description="Admit cards, exam dates, answer keys, and results. Review and publish to citizen portal."
        icon={<Megaphone />}
        actions={
          <Link href="/updates/new" className={buttonClass({ variant: 'primary', size: 'sm' })}>
            <Plus className="size-4" aria-hidden="true" /> New notice / update
          </Link>
        }
      />

      {data === null ? (
        <ApiOffline />
      ) : (
        <div className="space-y-5">
          {/* Top Counters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="All notices" count={data.total} active={!status} href={buildUrl({ status: '' })} />
            <StatCard
              label="Waiting review (Draft)"
              count={data.counts.draft}
              active={status === 'draft'}
              href={buildUrl({ status: 'draft' })}
              tone="celadon"
            />
            <StatCard
              label="Live / Published"
              count={data.counts.published}
              active={status === 'published'}
              href={buildUrl({ status: 'published' })}
              tone="teal"
            />
            <StatCard
              label="Archived"
              count={data.counts.archived}
              active={status === 'archived'}
              href={buildUrl({ status: 'archived' })}
              tone="outline"
            />
          </div>

          {/* Filter / Search Bar */}
          <Card className="p-3">
            <form action="/updates" method="GET" className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/70" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search updates by title or notice keywords..."
                  className="h-9 w-full rounded-full border border-teal/15 bg-canvas pl-9 pr-3 text-sm focus:border-teal focus:outline-none"
                />
              </div>

              {status && <input type="hidden" name="status" value={status} />}

              <button type="submit" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Filter
              </button>

              {(q || status) && (
                <Link href="/updates" className="text-xs font-semibold text-teal/70 hover:underline">
                  Clear filter
                </Link>
              )}
            </form>
          </Card>

          {data.items.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title={q || status ? 'No updates match your filter' : 'No updates found'}
              text="Scraped admit cards and results will appear here as drafts ready for review."
              action={
                <Link href="/updates/new" className={buttonClass({ variant: 'primary', size: 'sm' })}>
                  <Plus className="size-4" aria-hidden="true" /> Create notice
                </Link>
              }
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                      <th className="px-4 py-3">Notice / Update</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Linked Opportunity</th>
                      <th className="px-3 py-3">Notice Date</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal/10">
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-cream/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <Link href={`/updates/${item.id}`} className="font-bold hover:underline line-clamp-1">
                            {item.title}
                          </Link>
                          {item.source_url && (
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-teal/60 hover:underline"
                            >
                              Official source <ExternalLink className="size-3" aria-hidden="true" />
                            </a>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <UpdateKindBadge kind={item.kind} />
                        </td>
                        <td className="px-3 py-3.5 text-xs">
                          {item.parent ? (
                            <Link href={`/opportunities/${item.parent.id}`} className="font-medium hover:underline text-teal">
                              {item.parent.title}
                            </Link>
                          ) : (
                            <span className="text-teal/40">General</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-xs tabular-nums text-teal/80">
                          {item.date ? formatDay(item.date) : '—'}
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === 'draft' && <QuickPublishUpdateButton id={item.id} />}
                            {item.status !== 'archived' && <QuickArchiveUpdateButton id={item.id} />}
                            <Link
                              href={`/updates/${item.id}`}
                              className={buttonClass({ variant: 'secondary', size: 'sm' })}
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function StatCard({
  label,
  count,
  active,
  href,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  href: string;
  tone?: 'teal' | 'celadon' | 'tea' | 'outline';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col justify-between rounded-2xl border p-3.5 transition-all',
        active
          ? 'border-teal bg-teal/10 shadow-sm'
          : 'border-teal/10 bg-canvas hover:border-teal/25 hover:bg-cream/50',
      )}
    >
      <span className="text-xs font-semibold text-teal/70 group-hover:text-teal">{label}</span>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tabular-nums tracking-tight text-teal">
          {count.toLocaleString('en-IN')}
        </span>
        {tone && (
          <span
            className={cn(
              'size-2 rounded-full',
              tone === 'teal' && 'bg-teal',
              tone === 'celadon' && 'bg-celadon',
              tone === 'tea' && 'bg-teal/40',
              tone === 'outline' && 'border border-teal/40',
            )}
            aria-hidden="true"
          />
        )}
      </div>
    </Link>
  );
}
