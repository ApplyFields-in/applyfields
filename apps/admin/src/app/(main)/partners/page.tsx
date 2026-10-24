import type { AdminPartnerListResponse } from '@applyfields/types';
import { buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import { GraduationCap, Store, Search, ShieldCheck, MapPin, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';
import { getMockAdminPartners } from '@/lib/mock-data';
import { Badge } from '@applyfields/ui';
import { PartnersClient } from './partners-client';

export const metadata = { title: SECTIONS.partners.title };

export default async function PartnersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const status = typeof sp.status === 'string' ? sp.status : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  if (page > 1) query.set('page', String(page));

  const data = await apiGet<AdminPartnerListResponse>(
    `/admin/partners${query.size ? `?${query}` : ''}`,
  );

  const mockFallback = getMockAdminPartners({ q, status, page });
  const displayData = data && data.items.length > 0 ? data : mockFallback;
  const isMock = !data || data.items.length === 0;

  const buildUrl = (next: { q?: string; status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextQ = next.q !== undefined ? next.q : q;
    const nextStatus = next.status !== undefined ? next.status : status;
    const nextPage = next.page !== undefined ? next.page : 1;

    if (nextQ) params.set('q', nextQ);
    if (nextStatus) params.set('status', nextStatus);
    if (nextPage > 1) params.set('page', String(nextPage));

    return params.size ? `/partners?${params}` : '/partners';
  };

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="Partner Centers & Verification"
        description="Verify citizen assistance centers, MeeSeva kiosks, cyber points, and college desks. Approve rate cards and enable public directory listings."
        icon={<Store />}
        actions={
          isMock ? (
            <Badge tone="outline" className="border-amber-500/40 text-amber-800 bg-amber-500/10">
              Demo Mode
            </Badge>
          ) : undefined
        }
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-teal/10 pb-3">
        <Link
          href="/partners"
          className={buttonClass({
            variant: 'primary',
            size: 'sm',
            className: 'gap-1.5 text-xs shadow-clay',
          })}
        >
          <Store className="size-3.5" /> Partner Centers &amp; KYC
        </Link>
        <Link
          href="/partners/colleges"
          className={buttonClass({
            variant: 'ghost',
            size: 'sm',
            className: 'gap-1.5 text-xs text-teal/70 hover:text-teal',
          })}
        >
          <GraduationCap className="size-3.5" /> Colleges &amp; Universities Desk
        </Link>
        <Link
          href="/partners/enquiries"
          className={buttonClass({
            variant: 'ghost',
            size: 'sm',
            className: 'gap-1.5 text-xs text-teal/70 hover:text-teal',
          })}
        >
          <MessageSquare className="size-3.5" /> College Admission Inquiries
        </Link>
        <Link
          href="/partners/map"
          className={buttonClass({
            variant: 'ghost',
            size: 'sm',
            className: 'gap-1.5 text-xs text-teal/70 hover:text-teal font-semibold',
          })}
        >
          <MapPin className="size-3.5 text-cyan-600" /> Geographic Coverage Map
        </Link>
        <Link
          href="/assistance"
          className={buttonClass({
            variant: 'ghost',
            size: 'sm',
            className: 'gap-1.5 text-xs text-teal/70 hover:text-teal',
          })}
        >
          Assistance Bookings Network
        </Link>
      </div>

      <div className="space-y-5">
        {/* Top KPI counters */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="All Applications"
            count={displayData.total}
            active={!status}
            href={buildUrl({ status: '' })}
          />
          <StatCard
            label="Pending Review"
            count={displayData.items.filter((p) => p.verification_status === 'pending').length}
            active={status === 'pending'}
            href={buildUrl({ status: 'pending' })}
            tone="celadon"
          />
          <StatCard
            label="Verified & Listed"
            count={displayData.items.filter((p) => p.verification_status === 'verified' && p.is_listed).length}
            active={status === 'verified'}
            href={buildUrl({ status: 'verified' })}
            tone="teal"
          />
          <StatCard
            label="Rejected"
            count={displayData.items.filter((p) => p.verification_status === 'rejected').length}
            active={status === 'rejected'}
            href={buildUrl({ status: 'rejected' })}
            tone="outline"
          />
        </div>

        {/* Search bar */}
        <Card className="p-3">
          <form action="/partners" method="GET" className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/70"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by center name, owner, city, district, PIN or phone..."
                className="h-9 w-full rounded-full border border-teal/15 bg-canvas pl-9 pr-3 text-sm focus:border-teal focus:outline-none"
              />
            </div>

            {status && <input type="hidden" name="status" value={status} />}

            <button
              type="submit"
              className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal/90"
            >
              Search
            </button>

            {(q || status) && (
              <Link href="/partners" className="text-xs font-semibold text-teal/70 hover:underline">
                Clear filters
              </Link>
            )}
          </form>
        </Card>

        {/* Real Partners Table & Client Component */}
        <PartnersClient
          initialItems={displayData.items}
          total={displayData.total}
          currentStatus={status}
          currentQuery={q}
        />
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
