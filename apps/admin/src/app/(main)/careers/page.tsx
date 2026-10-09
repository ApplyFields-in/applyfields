import type { AdminCareerList, OpportunityStatus } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import {
  BookOpen,
  Building,
  CheckCircle2,
  Compass,
  ExternalLink,
  Eye,
  Layers,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { StatusBadge } from '@/components/opportunities-ui';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.careers.title };

export default async function CareersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? sp.status : undefined;

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (status) query.set('status', status);

  const data = await apiGet<AdminCareerList>(`/admin/careers${query.size ? `?${query}` : ''}`);

  const buildUrl = (next: { q?: string; status?: string }) => {
    const params = new URLSearchParams();
    const nextQ = next.q !== undefined ? next.q : q;
    const nextStatus = next.status !== undefined ? next.status : status;

    if (nextQ) params.set('q', nextQ);
    if (nextStatus) params.set('status', nextStatus);

    return params.size ? `/careers?${params}` : '/careers';
  };

  return (
    <>
      <PageHeader
        eyebrow="Content Management (v3)"
        title="Career & Education Content"
        description="Curate career profiles, roadmap steps, milestones, courses, and college data."
        icon={<Compass />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="http://localhost:3000/career/roadmaps"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              <Compass className="size-3.5 mr-1" aria-hidden="true" /> Roadmaps
            </a>
            <a
              href="http://localhost:3000/career/courses"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              <BookOpen className="size-3.5 mr-1" aria-hidden="true" /> Courses
            </a>
            <a
              href="http://localhost:3000/career/colleges"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: 'secondary', size: 'sm' })}
            >
              <Building className="size-3.5 mr-1" aria-hidden="true" /> Colleges
            </a>
            <a
              href="http://localhost:3000/career"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: 'primary', size: 'sm' })}
            >
              <ExternalLink className="size-3.5 mr-1" aria-hidden="true" /> Live Portal
            </a>
          </div>
        }
      />

      {data === null ? (
        <ApiOffline />
      ) : (
        <div className="space-y-5">
          {/* Top KPI counters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="All careers" count={data.total} active={!status} href={buildUrl({ status: '' })} />
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
            <form action="/careers" method="GET" className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/70"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search careers by title, slug, category..."
                  className="h-9 w-full rounded-full border border-teal/15 bg-canvas pl-9 pr-3 text-sm focus:border-teal focus:outline-none"
                />
              </div>

              {status && <input type="hidden" name="status" value={status} />}

              <button type="submit" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Search
              </button>

              {(q || status) && (
                <Link href="/careers" className="text-xs font-semibold text-teal/70 hover:underline">
                  Clear filters
                </Link>
              )}
            </form>
          </Card>

          {/* List or Empty State */}
          {data.items.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title={q || status ? 'No careers match your search' : 'No careers yet'}
              text="Create and publish careers with step-by-step pathways and suggested learning platforms, books, and videos."
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                      <th className="px-4 py-3">Career Title</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Learning Resources</th>
                      <th className="px-3 py-3">Views</th>
                      <th className="px-4 py-3 text-right">Live View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal/10">
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-cream/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-teal line-clamp-1">
                            {item.title}
                          </span>
                          <span className="font-mono text-xs text-teal/60">/career/{item.slug}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge tone="tea" className="text-[11px]">
                            {item.category_name}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusBadge status={item.status as OpportunityStatus} />
                        </td>
                        <td className="px-3 py-3.5 text-xs font-medium text-teal/80">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-teal">
                            <BookOpen className="size-3 text-teal/70" />
                            {item.resources_count} items (platforms, books, videos)
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-teal/70">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="size-3 text-teal/50" />
                            {item.views_count.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <a
                            href={`http://localhost:3000/career/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonClass({ variant: 'secondary', size: 'sm' })}
                          >
                            <ExternalLink className="size-3.5 mr-1" /> View
                          </a>
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
