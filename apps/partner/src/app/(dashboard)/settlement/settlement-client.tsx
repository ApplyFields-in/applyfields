'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Download, Lock, Receipt, RefreshCw, Wallet, AlertCircle, UserCheck } from 'lucide-react';
import type { PartnerEarningsSummary } from '@applyfields/types';
import { usePartnerAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';

const rupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const ref = (id: string) => `AF-${id.slice(0, 4).toUpperCase()}`;

const PAYOUT_STYLE: Record<PartnerEarningsSummary['payouts'][number]['status'], string> = {
  paid: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
  pending: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
  processing: 'bg-sky-500/20 border-sky-500/30 text-sky-400',
  failed: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
};

export function SettlementClient() {
  const { activeRole, switchRole } = usePartnerAuth();
  const [data, setData] = useState<PartnerEarningsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await apiGet<PartnerEarningsSummary>('/partners/me/earnings');
    setData(res.data);
    setError(res.data ? null : res.error || 'Could not load earnings.');
    setLoading(false);
  };

  useEffect(() => {
    if (activeRole !== 'staff') void load();
  }, [activeRole]);

  if (activeRole === 'staff') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center space-y-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lock className="size-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Earnings are for the centre owner</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Counter staff can take walk-ins, scan documents and file applications. Earnings and payouts are visible to the owner account only.
        </p>
        <button
          type="button"
          onClick={() => switchRole('owner')}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
        >
          <UserCheck className="size-4 text-emerald-400" />
          <span>Switch to owner role</span>
        </button>
      </div>
    );
  }

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Period start', 'Period end', 'Gross (INR)', 'Commission (INR)', 'Net (INR)', 'Status', 'Paid on', 'Reference'],
      ...data.payouts.map((p) => [
        p.period_start,
        p.period_end,
        (p.gross_paise / 100).toFixed(2),
        (p.commission_paise / 100).toFixed(2),
        (p.net_paise / 100).toFixed(2),
        p.status,
        p.paid_at?.slice(0, 10) ?? '',
        p.reference ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `applyfields_payouts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Partner operations / <span className="text-emerald-400">Earnings & settlements</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl mt-1">Earnings</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
            From bookings you marked completed, and payouts recorded by ApplyFields.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data?.payouts.length}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition"
          >
            <Download className="size-3.5" />
            <span>Export payouts CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-300">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && <p className="text-sm text-slate-400">Loading earnings…</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={<CheckCircle2 className="size-4 text-emerald-400" />} label="Completed services" value={String(data.completed_count)} note="All time" />
            <Metric icon={<Receipt className="size-4 text-slate-400" />} label="Total earned" value={rupees(data.gross_paise)} note="Final amounts on completed bookings" />
            <Metric icon={<Wallet className="size-4 text-emerald-400" />} label="Paid to you" value={rupees(data.paid_paise)} note={`ApplyFields commission recorded: ${rupees(data.commission_paise)}`} accent />
            <Metric icon={<Clock className="size-4 text-amber-400" />} label="Payouts pending" value={rupees(data.pending_payout_paise)} note="Created, not yet paid" />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-xs text-slate-300 space-y-2">
            <p>
              <strong className="text-white">{rupees(data.unsettled_paise)}</strong> from completed bookings is not in any settlement yet
              {data.last_settled_until ? ` (after ${day(data.last_settled_until)}).` : ' (no settlement has been made yet).'}
            </p>
            {data.unpriced_count > 0 && (
              <p className="text-amber-300">
                {data.unpriced_count} completed booking{data.unpriced_count === 1 ? ' has' : 's have'} no final amount, so {data.unpriced_count === 1 ? 'it is' : 'they are'} not counted. Enter the amount when you complete a booking.
              </p>
            )}
            <p className="text-slate-500">The commission rate and settlement cycle are set by ApplyFields and shown on each payout.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Table
              title="Recent completed services"
              empty="No completed bookings yet."
              head={['Booking', 'Service', 'Completed', 'Amount']}
              rows={data.recent.map((r) => [
                <span key="r" className="font-mono font-bold text-emerald-400">{ref(r.id)}</span>,
                r.service_name ?? '—',
                day(r.completed_at),
                r.final_paise === null ? <span key="a" className="text-amber-400">Not entered</span> : rupees(r.final_paise),
              ])}
            />
            <Table
              title="Payout history"
              empty="No payouts yet. ApplyFields creates a payout for each settlement period."
              head={['Period', 'Net', 'Status', 'Reference']}
              rows={data.payouts.map((p) => [
                `${day(p.period_start)} – ${day(p.period_end)}`,
                rupees(p.net_paise),
                <span key="s" className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${PAYOUT_STYLE[p.status]}`}>{p.status}</span>,
                <span key="f" className="font-mono">{p.reference ?? '—'}</span>,
              ])}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ icon, label, value, note, accent }: { icon: React.ReactNode; label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 space-y-1 ${accent ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/80'}`}>
      <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
        <span>{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-black ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
      <span className="text-[11px] text-slate-500">{note}</span>
    </div>
  );
}

function Table({ title, head, rows, empty }: { title: string; head: string[]; rows: React.ReactNode[][]; empty: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
      <h3 className="p-4 border-b border-slate-800 text-sm font-bold text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="p-4 text-xs text-slate-400">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>{head.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} className="px-4 py-3">{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
