import type { AdminGovServiceList, OpportunityStatus } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Landmark,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { StatusBadge } from '@/components/opportunities-ui';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.services.title };

export default async function ServicesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? (sp.status as OpportunityStatus) : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  if (page > 1) query.set('page', String(page));

  const data = await apiGet<AdminGovServiceList>(`/admin/services${query.size ? `?${query}` : ''}`);

  const buildUrl = (next: { q?: string; status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextQ = next.q !== undefined ? next.q : q;
    const nextStatus = next.status !== undefined ? next.status : status;
    const nextPage = next.page !== undefined ? next.page : 1;

    if (nextQ) params.set('q', nextQ);
    if (nextStatus) params.set('status', nextStatus);
    if (nextPage > 1) params.set('page', String(nextPage));

    return params.size ? `/services?${params}` : '/services';
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Government Services"
        description="Create, verify and publish citizen services — PAN, passport, certificates, licenses with official links."
        icon={<Landmark />}
        actions={
          <Link href="/services/new" className={buttonClass({ variant: 'primary', size: 'sm' })}>
            <Plus className="size-4" aria-hidden="true" /> New service
          </Link>
        }
      />

      {data === null ? (
        <ApiOffline />
      ) : (
        <div className="space-y-5">
          {/* Top KPI counters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="All records" count={data.total} active={!status} href={buildUrl({ status: '' })} />
            <StatCard
              label="Live / Published"
              count={data.counts.published}
              active={status === 'published'}
              href={buildUrl({ status: 'published' })}
              tone="teal"
            />
            <StatCard
              label="Drafts"
              count={data.counts.draft}
              active={status === 'draft'}
              href={buildUrl({ status: 'draft' })}
              tone="celadon"
            />
            <StatCard
              label="Archived"
              count={data.counts.archived}
              active={status === 'archived'}
              href={buildUrl({ status: 'archived' })}
              tone="outline"
            />
          </div>

          {/* Search bar */}
          <Card className="p-3">
            <form action="/services" method="GET" className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/70"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search services by name, authority, slug..."
                  className="h-9 w-full rounded-full border border-teal/15 bg-canvas pl-9 pr-3 text-sm focus:border-teal focus:outline-none"
                />
              </div>

              {status && <input type="hidden" name="status" value={status} />}

              <button type="submit" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Search
              </button>

              {(q || status) && (
                <Link href="/services" className="text-xs font-semibold text-teal/70 hover:underline">
                  Clear filters
                </Link>
              )}
            </form>
          </Card>

          {/* List or Empty State */}
          {data.items.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title={q || status ? 'No services match your search' : 'No government services yet'}
              text="Create citizen services with draft → publish workflow to display them on the web portal."
              action={
                <Link href="/services/new" className={buttonClass({ variant: 'primary', size: 'sm' })}>
                  <Plus className="size-4" aria-hidden="true" /> Create service
                </Link>
              }
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                      <th className="px-4 py-3">Service Name</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Authority</th>
                      <th className="px-3 py-3">Jurisdiction</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal/10">
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-cream/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <Link href={`/services/${item.id}`} className="font-bold hover:underline line-clamp-1">
                            {item.name}
                          </Link>
                          <span className="font-mono text-xs text-teal/60">/services/{item.slug}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge tone="tea" className="text-[11px]">
                            {item.category || 'General'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-3 py-3.5 text-xs font-medium text-teal/80">
                          {item.authority_name || '—'}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-teal/70">
                          {item.state_codes?.join(', ') || 'ALL'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/services/${item.id}`}
                            className={buttonClass({ variant: 'secondary', size: 'sm' })}
                          >
                            Edit
                          </Link>
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
