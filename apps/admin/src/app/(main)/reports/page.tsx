import type { AdminReportListResponse } from '@applyfields/types';
import { buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import { Flag, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';
import { ReportsClient } from './reports-client';

export const metadata = { title: SECTIONS.reports.title };

export default async function ReportsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const status = typeof sp.status === 'string' && sp.status ? sp.status : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (page > 1) query.set('page', String(page));

  const data = await apiGet<AdminReportListResponse>(
    `/admin/community/reports${query.size ? `?${query}` : ''}`,
  );

  const buildUrl = (nextStatus?: string) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set('status', nextStatus);
    return params.size ? `/reports?${params}` : '/reports';
  };

  const allReports = data?.items ?? [];
  const pendingCount = allReports.filter((r) => r.status === 'pending').length;
  const resolvedCount = allReports.filter((r) => r.status === 'resolved').length;
  const rejectedCount = allReports.filter((r) => r.status === 'rejected' || r.status === 'closed').length;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Reports & Moderation Desk"
        description="Review user feedback on incorrect information, broken links, scam notices, and abusive community discussion comments. Take action directly with one click."
        icon={<Flag />}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-teal/10 pb-3">
        <Link
          href={buildUrl()}
          className={buttonClass({
            variant: !status ? 'primary' : 'ghost',
            size: 'sm',
            className: cn('gap-1.5 text-xs', !status && 'shadow-clay'),
          })}
        >
          <Flag className="size-3.5" /> All Reports
        </Link>
        <Link
          href={buildUrl('pending')}
          className={buttonClass({
            variant: status === 'pending' ? 'primary' : 'ghost',
            size: 'sm',
            className: cn('gap-1.5 text-xs', status === 'pending' && 'shadow-clay'),
          })}
        >
          <ShieldAlert className="size-3.5 text-amber-500" /> Pending Action
        </Link>
        <Link
          href={buildUrl('resolved')}
          className={buttonClass({
            variant: status === 'resolved' ? 'primary' : 'ghost',
            size: 'sm',
            className: cn('gap-1.5 text-xs', status === 'resolved' && 'shadow-clay'),
          })}
        >
          <ShieldCheck className="size-3.5 text-emerald-500" /> Resolved
        </Link>
      </div>

      {data === null ? (
        <ApiOffline />
      ) : (
        <div className="space-y-5">
          {/* Top KPI counters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Reports"
              count={data.total}
              active={!status}
              href={buildUrl()}
            />
            <StatCard
              label="Pending Review"
              count={pendingCount}
              active={status === 'pending'}
              href={buildUrl('pending')}
              tone="tea"
            />
            <StatCard
              label="Resolved"
              count={resolvedCount}
              active={status === 'resolved'}
              href={buildUrl('resolved')}
              tone="teal"
            />
            <StatCard
              label="Rejected / Closed"
              count={rejectedCount}
              active={status === 'rejected'}
              href={buildUrl('rejected')}
              tone="outline"
            />
          </div>

          {/* Interactive Moderation Client Component */}
          <ReportsClient
            initialItems={data.items}
            total={data.total}
            currentStatus={status}
          />
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
              tone === 'tea' && 'bg-amber-500',
              tone === 'outline' && 'border border-teal/40',
            )}
            aria-hidden="true"
          />
        )}
      </div>
    </Link>
  );
}
