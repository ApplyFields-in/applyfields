import type { InstitutionEnquiryListResponse } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Store,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';

export const metadata = { title: 'College Admission Inquiries · ApplyFields Internal' };

export default async function InstitutionEnquiriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; institutionId?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const status = typeof sp.status === 'string' ? sp.status : undefined;
  const institutionId = typeof sp.institutionId === 'string' ? sp.institutionId : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (institutionId) query.set('institutionId', institutionId);
  if (page > 1) query.set('page', String(page));

  const data = await apiGet<InstitutionEnquiryListResponse>(
    `/admin/institutions/enquiries${query.size ? `?${query}` : ''}`,
  );

  const buildUrl = (next: { status?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextStatus = next.status !== undefined ? next.status : status;
    const nextPage = next.page !== undefined ? next.page : 1;

    if (nextStatus) params.set('status', nextStatus);
    if (institutionId) params.set('institutionId', institutionId);
    if (nextPage > 1) params.set('page', String(nextPage));

    return params.size ? `/partners/enquiries?${params}` : '/partners/enquiries';
  };

  return (
    <>
      <PageHeader
        eyebrow="Admissions Oversight"
        title="College Admission Inquiries Desk"
        description="Monitor student admission inquiries submitted to colleges and universities. Audit counselor response times, cutoff communications, and desk resolution."
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
          href="/partners/enquiries"
          className={buttonClass({
            variant: 'primary',
            size: 'sm',
            className: 'gap-1.5 text-xs shadow-clay',
          })}
        >
          <GraduationCap className="size-3.5" /> College Admission Inquiries
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
        <ApiOffline />
      ) : (
        <div className="space-y-5">
          {/* Top KPI counters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Inquiries"
              count={data.total}
              active={!status}
              href={buildUrl({ status: '' })}
            />
            <StatCard
              label="Awaiting College Response"
              count={data.items.filter((e) => e.status === 'new').length}
              active={status === 'new'}
              href={buildUrl({ status: 'new' })}
              tone="tea"
            />
            <StatCard
              label="Responded by Desk"
              count={data.items.filter((e) => e.status === 'responded').length}
              active={status === 'responded'}
              href={buildUrl({ status: 'responded' })}
              tone="celadon"
            />
            <StatCard
              label="Closed Inquiries"
              count={data.items.filter((e) => e.status === 'closed').length}
              active={status === 'closed'}
              href={buildUrl({ status: 'closed' })}
              tone="outline"
            />
          </div>

          {/* Enquiries Table or Clean Empty State */}
          {data.items.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal/10 text-teal">
                <GraduationCap className="size-6" />
              </div>
              <h3 className="text-base font-bold text-teal">No student admission inquiries found</h3>
              <p className="text-xs text-teal/70 max-w-sm mx-auto">
                {status
                  ? 'No inquiries match the active status filter. Try clearing filters.'
                  : 'When students submit admission inquiries via verified college pages, real inquiries and desk response turnaround times will appear here.'}
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal/10 bg-canvas/40 text-xs font-semibold uppercase tracking-wider text-teal/70">
                      <th className="px-4 py-3">Inquiry &amp; Student</th>
                      <th className="px-3 py-3">Institution &amp; Program</th>
                      <th className="px-3 py-3">Student Message</th>
                      <th className="px-3 py-3">Desk Response</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Received Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal/10">
                    {data.items.map((enq) => (
                      <tr key={enq.id} className="hover:bg-cream/30 transition-colors text-xs">
                        {/* Student Info */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-teal flex items-center gap-1.5">
                            <User className="size-3.5 text-teal/50" />
                            {enq.name || 'Anonymous Student'}
                          </div>
                          <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-teal/70">
                            {enq.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="size-3 text-teal/50" /> {enq.phone}
                              </span>
                            )}
                            {enq.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="size-3 text-teal/50" /> {enq.email}
                              </span>
                            )}
                          </div>
                          <span className="mt-1 font-mono text-[10px] text-teal/50 block">
                            #{enq.id.slice(0, 8)}
                          </span>
                        </td>

                        {/* Institution Info */}
                        <td className="px-3 py-3.5">
                          <div className="font-semibold text-teal flex items-center gap-1">
                            <Building2 className="size-3.5 text-teal/50 shrink-0" />
                            <span className="truncate max-w-[180px]">{enq.institution_name}</span>
                          </div>
                          {enq.course_name ? (
                            <span className="mt-1 inline-block rounded-md bg-teal/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal truncate max-w-[180px]">
                              {enq.course_name}
                            </span>
                          ) : (
                            <span className="mt-1 text-[10px] text-teal/60 italic block">
                              General Admission Inquiry
                            </span>
                          )}
                        </td>

                        {/* Student Message */}
                        <td className="px-3 py-3.5 max-w-xs">
                          <p className="line-clamp-3 text-teal/80 leading-relaxed bg-canvas/60 rounded-xl p-2 border border-teal/10">
                            &ldquo;{enq.message}&rdquo;
                          </p>
                        </td>

                        {/* Desk Response */}
                        <td className="px-3 py-3.5 max-w-xs">
                          {enq.response ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 text-emerald-900 space-y-1">
                              <p className="line-clamp-3 leading-relaxed">&ldquo;{enq.response}&rdquo;</p>
                              {enq.responded_at && (
                                <span className="text-[10px] text-emerald-700/80 block">
                                  Responded: {new Date(enq.responded_at).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-teal/50 italic text-[11px]">Pending college response</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase',
                              enq.status === 'responded'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : enq.status === 'closed'
                                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                                  : 'bg-amber-100 text-amber-800 border-amber-200',
                            )}
                          >
                            {enq.status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-right font-mono text-[11px] text-teal/70 whitespace-nowrap">
                          {new Date(enq.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
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
  tone = 'surface',
}: {
  label: string;
  count: number;
  active: boolean;
  href: string;
  tone?: 'surface' | 'teal' | 'celadon' | 'tea' | 'outline';
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-2xl border p-4 transition-all',
        active
          ? 'border-teal bg-teal text-white shadow-card'
          : 'border-line/60 bg-cream/30 hover:border-teal/30 hover:bg-cream/50',
      )}
    >
      <span
        className={cn(
          'text-xs font-semibold',
          active ? 'text-white/80' : 'text-teal/70 group-hover:text-teal',
        )}
      >
        {label}
      </span>
      <p
        className={cn(
          'mt-1 text-2xl font-extrabold tracking-tight',
          active ? 'text-white' : 'text-teal',
        )}
      >
        {count}
      </p>
    </Link>
  );
}
