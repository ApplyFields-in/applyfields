import type { BookingListResponse } from '@applyfields/types';
import { Card, cn, PageHeader } from '@applyfields/ui';
import { HandHelping, Search } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';
import { AssistanceClient } from './assistance-client';

export const metadata = { title: SECTIONS.assistance.title };

export default async function AssistanceAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ partnerId?: string; status?: string; page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const status = typeof sp.status === 'string' ? sp.status : undefined;
  const partnerId = typeof sp.partnerId === 'string' ? sp.partnerId : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (partnerId) query.set('partnerId', partnerId);
  if (page > 1) query.set('page', String(page));

  const data = await apiGet<BookingListResponse>(
    `/admin/bookings${query.size ? `?${query}` : ''}`,
  );

  const buildUrl = (next: { status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextStatus = next.status !== undefined ? next.status : status;
    const nextPage = next.page !== undefined ? next.page : 1;

    if (nextStatus) params.set('status', nextStatus);
    if (partnerId) params.set('partnerId', partnerId);
    if (nextPage > 1) params.set('page', String(nextPage));

    return params.size ? `/assistance?${params}` : '/assistance';
  };

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="Assistance Network Bookings"
        description="Monitor citizen assistance requests, partner center response times, service quote fees, and fulfillment lifecycle."
        icon={<HandHelping />}
      />

      {data === null ? (
        <ApiOffline />
      ) : (
        <div className="space-y-5">
          {/* Top KPI counters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="All Requests"
              count={data.total}
              active={!status}
              href={buildUrl({ status: '' })}
            />
            <StatCard
              label="New / Awaiting Desk"
              count={data.items.filter((b) => b.status === 'new').length}
              active={status === 'new'}
              href={buildUrl({ status: 'new' })}
              tone="celadon"
            />
            <StatCard
              label="In Progress"
              count={data.items.filter((b) => b.status === 'accepted' || b.status === 'in_progress').length}
              active={status === 'in_progress'}
              href={buildUrl({ status: 'in_progress' })}
              tone="teal"
            />
            <StatCard
              label="Completed"
              count={data.items.filter((b) => b.status === 'completed').length}
              active={status === 'completed'}
              href={buildUrl({ status: 'completed' })}
              tone="teal"
            />
          </div>

          {/* Filter status row */}
          <div className="flex items-center gap-2">
            {['', 'new', 'accepted', 'in_progress', 'completed', 'cancelled'].map((st) => (
              <Link
                key={st}
                href={buildUrl({ status: st })}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition',
                  (!status && !st) || status === st
                    ? 'bg-teal text-white'
                    : 'bg-canvas text-teal/70 hover:bg-cream',
                )}
              >
                {st ? st.replace('_', ' ').toUpperCase() : 'ALL'}
              </Link>
            ))}
          </div>

          {/* Real Assistance Bookings Table */}
          <AssistanceClient
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
