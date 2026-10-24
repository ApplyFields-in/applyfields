import type { AdminOpportunityList, OpportunityStatus, OpportunityType } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { CloseExpiredButton, StatusBadge } from '@/components/opportunities-ui';
import { formatDay, TYPE_LABEL } from '@/components/review-ui';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';
import { MOCK_ADMIN_OPPORTUNITIES } from '@/lib/mock-data';

export const metadata = { title: SECTIONS.opportunities.title };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? (sp.status as OpportunityStatus) : undefined;
  const type = typeof sp.type === 'string' ? (sp.type as OpportunityType) : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  if (type) query.set('type', type);
  if (page > 1) query.set('page', String(page));

  const data = await apiGet<AdminOpportunityList>(`/admin/opportunities${query.size ? `?${query}` : ''}`);

  const displayData = data && data.items.length > 0 ? data : (() => {
    let list = [...MOCK_ADMIN_OPPORTUNITIES.items];
    if (status) {
      list = list.filter((item) => item.status === status);
    }
    if (type) {
      list = list.filter((item) => item.type === type);
    }
    if (q) {
      const qLower = q.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(qLower) ||
          item.slug.toLowerCase().includes(qLower) ||
          item.organization.toLowerCase().includes(qLower),
      );
    }
    return {
      total: list.length,
      page: 1,
      page_size: 20,
      counts: MOCK_ADMIN_OPPORTUNITIES.counts,
      items: list,
    };
  })();
  const isMock = !data || data.items.length === 0;

  const buildUrl = (next: { q?: string; status?: string; type?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextQ = next.q !== undefined ? next.q : q;
    const nextStatus = next.status !== undefined ? next.status : status;
    const nextType = next.type !== undefined ? next.type : type;
    const nextPage = next.page !== undefined ? next.page : 1;

    if (nextQ) params.set('q', nextQ);
    if (nextStatus) params.set('status', nextStatus);
    if (nextType) params.set('type', nextType);
    if (nextPage > 1) params.set('page', String(nextPage));

    return params.size ? `/opportunities?${params}` : '/opportunities';
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Opportunities"
        description="Every opportunity in any status. Edit live jobs, unpublish, close, or create manually."
        icon={<Briefcase />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isMock && (
              <Badge tone="outline" className="border-amber-500/40 text-amber-800 bg-amber-500/10">
                Demo Mode
              </Badge>
            )}
            <CloseExpiredButton />
            <Link href="/opportunities/new" className={buttonClass({ variant: 'primary', size: 'sm' })}>
              <Plus className="size-4" aria-hidden="true" /> New opportunity
            </Link>
          </div>
        }
      />

      <div className="space-y-5">
        {/* Top KPI counters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="All records" count={displayData.total} active={!status} href={buildUrl({ status: '' })} />
          <StatCard label="Live / Published" count={displayData.counts.published} active={status === 'published'} href={buildUrl({ status: 'published' })} tone="teal" />
          <StatCard label="Drafts" count={displayData.counts.draft} active={status === 'draft'} href={buildUrl({ status: 'draft' })} tone="celadon" />
          <StatCard label="Closed" count={displayData.counts.closed} active={status === 'closed'} href={buildUrl({ status: 'closed' })} tone="tea" />
          <StatCard label="Archived" count={displayData.counts.archived} active={status === 'archived'} href={buildUrl({ status: 'archived' })} tone="outline" />
        </div>

          {/* Search and Filters Bar */}
          <Card className="p-3">
            <form action="/opportunities" method="GET" className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/70" aria-hidden="true" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by title, department, slug..."
                  className="h-9 w-full rounded-full border border-teal/15 bg-canvas pl-9 pr-3 text-sm focus:border-teal focus:outline-none"
                />
              </div>

              {/* Status hidden input to preserve when searching */}
              {status && <input type="hidden" name="status" value={status} />}

              {/* Type filter */}
              <select
                name="type"
                defaultValue={type ?? ''}
                className="h-9 rounded-full border border-teal/15 bg-canvas px-3 text-xs font-semibold focus:border-teal focus:outline-none"
              >
                <option value="">All opportunity types</option>
                <option value="govt_job">Government Jobs</option>
                <option value="exam">Exams</option>
                <option value="scholarship">Scholarships</option>
                <option value="admission">Admissions</option>
              </select>

              <button type="submit" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Filter
              </button>

              {(q || status || type) && (
                <Link href="/opportunities" className="text-xs font-semibold text-teal/70 hover:underline">
                  Clear filters
                </Link>
              )}
            </form>
          </Card>

          {/* List or Empty State */}
          {displayData.items.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title={q || status || type ? 'No opportunities match your filter' : 'No opportunities found'}
              text="You can create opportunities manually from official notifications or review incoming scraper drafts."
              action={
                <Link href="/opportunities/new" className={buttonClass({ variant: 'primary', size: 'sm' })}>
                  <Plus className="size-4" aria-hidden="true" /> Create opportunity
                </Link>
              }
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                      <th className="px-4 py-3">Opportunity</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Organisation</th>
                      <th className="px-3 py-3">Last date</th>
                      <th className="px-3 py-3">Version</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal/10">
                    {displayData.items.map((item) => (
                      <tr key={item.id} className="hover:bg-cream/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <Link href={`/opportunities/${item.id}`} className="font-bold hover:underline line-clamp-1">
                            {item.title}
                          </Link>
                          <span className="font-mono text-xs text-teal/60">{item.slug}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge tone="teal" className="text-[11px]">
                            {TYPE_LABEL[item.type] ?? item.type}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-3 py-3.5 text-xs font-medium text-teal/80">
                          {item.organization}
                        </td>
                        <td className="px-3 py-3.5 text-xs tabular-nums text-teal/80">
                          {item.application_end ? (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="size-3 text-teal/60" aria-hidden="true" />
                              {formatDay(item.application_end)}
                            </span>
                          ) : (
                            <span className="text-teal/40">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 font-mono text-xs text-teal/70">v{item.version}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/opportunities/${item.id}`}
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

              {/* Pagination footer */}
              {displayData.total > displayData.page_size && (
                <div className="flex items-center justify-between border-t border-teal/10 px-4 py-3 text-xs text-teal/80">
                  <span>
                    Showing {(displayData.page - 1) * displayData.page_size + 1} to{' '}
                    {Math.min(displayData.page * displayData.page_size, displayData.total)} of {displayData.total}
                  </span>
                  <div className="flex items-center gap-1">
                    {displayData.page > 1 && (
                      <Link
                        href={buildUrl({ page: displayData.page - 1 })}
                        className={buttonClass({ variant: 'secondary', size: 'sm' })}
                      >
                        <ChevronLeft className="size-3.5" aria-hidden="true" /> Previous
                      </Link>
                    )}
                    {displayData.page * displayData.page_size < displayData.total && (
                      <Link
                        href={buildUrl({ page: displayData.page + 1 })}
                        className={buttonClass({ variant: 'secondary', size: 'sm' })}
                      >
                        Next <ChevronRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
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
