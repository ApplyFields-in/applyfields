'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Receipt,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export interface AdminDisputeItem {
  id: string;
  bookingToken: string;
  citizenName: string;
  citizenPhone: string;
  partnerName: string;
  partnerLocation: string;
  serviceTitle: string;
  bookingTotal: number;
  category: string;
  details: string;
  claimAmount: number;
  status: 'open' | 'refund_approved' | 'dismissed';
  openedAt: string;
  resolvedAt?: string;
  verdictNote?: string;
  escrowStatus: 'held' | 'debited_to_citizen' | 'released_to_partner';
}

const INITIAL_DISPUTES: AdminDisputeItem[] = [
  {
    id: 'DSP-8824',
    bookingToken: 'AF-HYD-8824',
    citizenName: 'Likhith Kumar',
    citizenPhone: '+91 98765 43210',
    partnerName: 'Sri Balaji Digital Seva & MeeSeva Hub',
    partnerLocation: 'Ameerpet, Hyderabad (TG)',
    serviceTitle: 'Telangana MeeSeva Income & Asset Certificate',
    bookingTotal: 120,
    category: 'Partner Overcharged Above Rate Card',
    details: 'Operator charged an extra Rs. 50 cash beyond the booked MeeSeva assistance fee on the portal.',
    claimAmount: 50,
    status: 'open',
    openedAt: '30 Oct 2026',
    escrowStatus: 'held',
  },
  {
    id: 'DSP-7102',
    bookingToken: 'AF-HYD-7102',
    citizenName: 'Ananya Sharma',
    citizenPhone: '+91 98112 33445',
    partnerName: 'Sri Sai MeeSeva & Digital Kiosk',
    partnerLocation: 'Gachibowli, Hyderabad (TG)',
    serviceTitle: 'SSC CGL 2026 Online Application Filing',
    bookingTotal: 210,
    category: 'Incorrect Application Details Submitted',
    details: 'Operator submitted incorrect graduation passing year on the official SSC portal, requiring a paid correction window.',
    claimAmount: 150,
    status: 'open',
    openedAt: '29 Oct 2026',
    escrowStatus: 'held',
  },
  {
    id: 'DSP-6540',
    bookingToken: 'AF-WGL-6540',
    citizenName: 'Rajesh Varma',
    citizenPhone: '+91 97001 22334',
    partnerName: 'City Xerox & MeeSeva Hub',
    partnerLocation: 'Hanamkonda, Warangal (TG)',
    serviceTitle: 'High-Quality Aadhaar PVC Smart Card Print',
    bookingTotal: 50,
    category: 'Severe Service Delay',
    details: 'Counter operator was absent during the booked morning slot; citizen had to wait 50 minutes.',
    claimAmount: 50,
    status: 'refund_approved',
    openedAt: '27 Oct 2026',
    resolvedAt: '28 Oct 2026',
    verdictNote: 'Service delay exceeding 45 minutes verified from desk timestamps. Full refund of Rs. 50 credited to citizen.',
    escrowStatus: 'debited_to_citizen',
  },
];

export function DisputesClient() {
  const [disputes, setDisputes] = useState<AdminDisputeItem[]>(INITIAL_DISPUTES);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'refund_approved' | 'dismissed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeItem | null>(null);
  const [verdictAction, setVerdictAction] = useState<'full_refund' | 'partial_refund' | 'dismiss'>('full_refund');
  const [refundAmount, setRefundAmount] = useState<number>(50);
  const [verdictNote, setVerdictNote] = useState('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  const filtered = disputes.filter((item) => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.id.toLowerCase().includes(term) ||
      item.bookingToken.toLowerCase().includes(term) ||
      item.citizenName.toLowerCase().includes(term) ||
      item.partnerName.toLowerCase().includes(term) ||
      item.serviceTitle.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });

  const openCount = disputes.filter((d) => d.status === 'open').length;
  const approvedCount = disputes.filter((d) => d.status === 'refund_approved').length;
  const totalRefundsPaise = disputes
    .filter((d) => d.status === 'refund_approved')
    .reduce((sum, d) => sum + d.claimAmount, 0);

  const handleOpenArbitration = (item: AdminDisputeItem) => {
    setSelectedDispute(item);
    setVerdictAction('full_refund');
    setRefundAmount(item.claimAmount);
    setVerdictNote(`Grievance investigated by moderation team. Claimed discrepancy verified on booking #${item.bookingToken}.`);
  };

  const handleExecuteArbitration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    const newStatus = verdictAction === 'dismiss' ? 'dismissed' : 'refund_approved';
    const updatedEscrow = verdictAction === 'dismiss' ? 'released_to_partner' : 'debited_to_citizen';

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === selectedDispute.id
          ? {
              ...d,
              status: newStatus,
              escrowStatus: updatedEscrow,
              claimAmount: verdictAction === 'dismiss' ? 0 : refundAmount,
              resolvedAt: 'Today',
              verdictNote: verdictNote.trim() || 'Reviewed by ApplyFields Arbitration Desk.',
            }
          : d,
      ),
    );

    setActionSuccessToast(
      verdictAction === 'dismiss'
        ? `Case #${selectedDispute.id} dismissed. Escrow funds released to partner.`
        : `Case #${selectedDispute.id} arbitrated. Refund of Rs. ${refundAmount} credited to ${selectedDispute.citizenName}.`,
    );
    setSelectedDispute(null);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-teal/20 bg-cream p-4 shadow-clay text-xs font-semibold text-teal flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-canvas p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal/60 block">Total Grievances</span>
          <p className="text-2xl font-black text-teal">{disputes.length}</p>
          <span className="text-[10px] text-teal/50">Filed across all centers</span>
        </div>

        <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Pending Arbitration</span>
          <p className="text-2xl font-black text-amber-900">{openCount}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Requires immediate ruling</span>
        </div>

        <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Total Refunds Issued</span>
          <p className="text-2xl font-black text-emerald-900">Rs. {totalRefundsPaise}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{approvedCount} cases approved</span>
        </div>

        <div className="rounded-2xl border border-line bg-canvas p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal/60 block">Escrow Dispute Rate</span>
          <p className="text-2xl font-black text-teal">0.8%</p>
          <span className="text-[10px] text-teal/50">SLA compliance 99.2%</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal/10 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === 'all'
                ? 'bg-teal text-cream shadow-clay'
                : 'bg-canvas border border-line text-teal/70 hover:text-teal'
            }`}
          >
            All Disputes ({disputes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('open')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === 'open'
                ? 'bg-teal text-cream shadow-clay'
                : 'bg-canvas border border-line text-teal/70 hover:text-teal'
            }`}
          >
            Pending Review ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('refund_approved')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === 'refund_approved'
                ? 'bg-teal text-cream shadow-clay'
                : 'bg-canvas border border-line text-teal/70 hover:text-teal'
            }`}
          >
            Refund Approved ({approvedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-teal/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search token, citizen, or kiosk..."
            className="h-9 w-full rounded-xl border border-line bg-canvas pl-8 pr-3 text-xs text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
          />
        </div>
      </div>

      {/* Disputes Table */}
      <div className="rounded-2xl border border-line bg-canvas overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-cream/60 text-[11px] font-bold uppercase tracking-wider text-teal/70">
              <tr>
                <th className="px-4 py-3">Case ID & Date</th>
                <th className="px-4 py-3">Booking Token</th>
                <th className="px-4 py-3">Citizen Info</th>
                <th className="px-4 py-3">Accused Center</th>
                <th className="px-4 py-3">Grievance Reason</th>
                <th className="px-4 py-3 text-right">Claim (Rs.)</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-teal">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-cream/40 transition">
                  <td className="px-4 py-3 font-mono">
                    <span className="font-bold text-teal block">{item.id}</span>
                    <span className="text-[10px] text-teal/50">{item.openedAt}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-celadon">
                    {item.bookingToken}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold block">{item.citizenName}</span>
                    <span className="text-[10px] text-teal/60 font-mono">{item.citizenPhone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold block">{item.partnerName}</span>
                    <span className="text-[10px] text-teal/60">{item.partnerLocation}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <span className="font-semibold block">{item.category}</span>
                    <p className="text-[11px] text-teal/70 truncate">{item.details}</p>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-right">
                    Rs. {item.claimAmount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.status === 'open'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : item.status === 'refund_approved'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.status === 'open' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenArbitration(item)}
                        className="rounded-xl bg-teal px-3 py-1.5 text-xs font-bold text-cream hover:bg-teal/90 transition shadow-sm"
                      >
                        Arbitrate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenArbitration(item)}
                        className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-teal hover:bg-cream transition"
                      >
                        View Ruling
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arbitration Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-canvas p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Scale className="size-5 text-teal" />
                <h3 className="text-base font-bold text-teal">Arbitrate Grievance #{selectedDispute.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="rounded-lg p-1 text-teal/50 hover:bg-cream hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Case Details Summary */}
            <div className="rounded-2xl border border-line bg-cream/40 p-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-teal">
                <span>Token: {selectedDispute.bookingToken}</span>
                <span>Original Fee: Rs. {selectedDispute.bookingTotal}</span>
              </div>
              <p><strong>Citizen:</strong> {selectedDispute.citizenName} ({selectedDispute.citizenPhone})</p>
              <p><strong>Partner Kiosk:</strong> {selectedDispute.partnerName} - {selectedDispute.partnerLocation}</p>
              <div className="pt-2 border-t border-line/60">
                <span className="font-bold text-teal/80 block uppercase text-[10px]">Citizen Grievance Statement:</span>
                <p className="text-teal font-medium mt-0.5">{selectedDispute.details}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteArbitration} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-teal mb-1">
                  Arbitration Ruling Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerdictAction('full_refund');
                      setRefundAmount(selectedDispute.claimAmount);
                    }}
                    className={`rounded-xl border p-2.5 text-center font-bold text-[11px] transition ${
                      verdictAction === 'full_refund'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                        : 'border-line bg-canvas text-teal/70'
                    }`}
                  >
                    Full Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerdictAction('partial_refund');
                      setRefundAmount(Math.round(selectedDispute.claimAmount / 2));
                    }}
                    className={`rounded-xl border p-2.5 text-center font-bold text-[11px] transition ${
                      verdictAction === 'partial_refund'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-sm'
                        : 'border-line bg-canvas text-teal/70'
                    }`}
                  >
                    Partial Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerdictAction('dismiss');
                      setRefundAmount(0);
                    }}
                    className={`rounded-xl border p-2.5 text-center font-bold text-[11px] transition ${
                      verdictAction === 'dismiss'
                        ? 'border-slate-600 bg-slate-100 text-slate-900 shadow-sm'
                        : 'border-line bg-canvas text-teal/70'
                    }`}
                  >
                    Dismiss Case
                  </button>
                </div>
              </div>

              {verdictAction !== 'dismiss' && (
                <div>
                  <label className="block text-xs font-bold text-teal mb-1">
                    Refund Amount to Debit from Partner Escrow (INR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedDispute.bookingTotal}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-xs font-mono font-bold text-teal focus:border-teal focus:outline-none"
                  />
                  <span className="text-[10px] text-teal/60 mt-0.5 block">
                    Debited directly from partner wallet and credited to citizen's original payment method.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-teal mb-1">
                  Official Moderator Ruling Note (Dispatched to Citizen & Partner)
                </label>
                <textarea
                  rows={3}
                  value={verdictNote}
                  onChange={(e) => setVerdictNote(e.target.value)}
                  placeholder="Explain the factual basis for this ruling and SLA obligations..."
                  required
                  className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-teal/70 hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal px-5 py-2 text-xs font-bold text-cream hover:bg-teal/90 transition shadow-clay"
                >
                  Execute Binding Ruling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

