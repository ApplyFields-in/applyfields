import type { AdminPartnerListResponse } from '@applyfields/types';
import { buttonClass, PageHeader } from '@applyfields/ui';
import { Building2, GraduationCap, MapPin, MessageSquare, Store } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { CollegesDeskClient } from './colleges-desk-client';

export const metadata = {
  title: 'Colleges & Universities Desk · ApplyFields Internal',
};

export default async function CollegesDeskAdminPage({
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
  query.set('type', 'college');
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  if (page > 1) query.set('page', String(page));

  const data = await apiGet<AdminPartnerListResponse>(
    `/admin/partners?${query}`,
  );

  return (
    <>
      <PageHeader
        eyebrow="Institutional Approvals & Desk Verification"
        title="Colleges & Universities Desk"
        description="Inspect claimed college affiliations, verify AICTE/NAAC certificates, review Principal/Registrar authorization letters, and award official verified badges."
        icon={<GraduationCap />}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-teal/10 pb-3">
        <Link
          href="/partners"
          className={buttonClass({
            variant: 'ghost',
            size: 'sm',
            className: 'gap-1.5 text-xs text-teal/70 hover:text-teal',
          })}
        >
          <Store className="size-3.5" /> Partner Centers &amp; KYC
        </Link>
        <Link
          href="/partners/colleges"
          className={buttonClass({
            variant: 'primary',
            size: 'sm',
            className: 'gap-1.5 text-xs shadow-clay',
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

      {data === null ? (
        <CollegesDeskClient
          initialItems={[]}
          total={0}
          currentStatus={status}
          currentQuery={q}
        />
      ) : (
        <CollegesDeskClient
          initialItems={data.items}
          total={data.total}
          currentStatus={status}
          currentQuery={q}
        />
      )}
    </>
  );
}
