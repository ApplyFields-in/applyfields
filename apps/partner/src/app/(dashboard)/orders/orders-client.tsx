'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Printer,
  FileText,
  RotateCw,
  QrCode,
  ShieldCheck,
  Send,
  Eye,
  Camera,
  ArrowRight,
  User,
  Building,
  Check,
  X,
  Download,
  AlertCircle,
} from 'lucide-react';
import {
  PartnerOrder,
  PartnerOrderStatus,
  SAMPLE_PARTNER_ORDERS,
} from '@/lib/orders-data';

const STATUS_CONFIG: Record<
  PartnerOrderStatus,
  { label: string; tone: string; dotColor: string }
> = {
  dispatched: {
    label: 'Dispatched to Desk',
    tone: 'bg-slate-800 text-slate-300 border-slate-700',
    dotColor: 'bg-slate-400',
  },
  in_filing: {
    label: 'In Filing by Back-Office',
    tone: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    dotColor: 'bg-blue-400',
  },
  otp_pending: {
    label: 'ACTION: Citizen OTP Needed',
    tone: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse',
    dotColor: 'bg-purple-400',
  },
  defective: {
    label: 'Defect: Needs Re-scan',
    tone: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    dotColor: 'bg-rose-500',
  },
  completed: {
    label: 'Completed & Sealed',
    tone: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
  },
};

export function OrdersClient() {
  const [orders, setOrders] = useState<PartnerOrder[]>(SAMPLE_PARTNER_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Live OTP State
  const otpOrder = useMemo(() => orders.find((o) => o.status === 'otp_pending'), [orders]);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(94);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpSentSuccess, setOtpSentSuccess] = useState<boolean>(false);

  // Printable Acknowledgement Slip Modal
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<PartnerOrder | null>(null);

  // Timer countdown for active OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpOrder && otpSecondsLeft > 0 && !otpSentSuccess) {
      interval = setInterval(() => {
        setOtpSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpOrder, otpSecondsLeft, otpSentSuccess]);

  // Handle OTP Submission from Kiosk
  const handleVerifyOtp = () => {
    if (enteredOtp.length === 6 && otpOrder) {
      setOtpSentSuccess(true);
      setTimeout(() => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === otpOrder.id
              ? {
                  ...o,
                  status: 'completed',
                  filingDetails: {
                    ...o.filingDetails,
                    portalRegNumber: 'UPSC-CSE-2026-981049',
                    completedAt: new Date().toISOString(),
                  },
                }
              : o
          )
        );
        setOtpSentSuccess(false);
      }, 800);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          order.citizenName.toLowerCase().includes(q) ||
          order.token.toLowerCase().includes(q) ||
          order.serviceTitle.toLowerCase().includes(q) ||
          order.mobile.includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-slate-100">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Kiosk Partner Operations</span>
            <span>/</span>
            <span className="text-emerald-400">Orders Pipeline &amp; OTP Relay</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl mt-1">
            Application Dispatch &amp; Tracking Board
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
            Monitor real-time filing progress at the central Service Desk, relay citizen OTPs, and print official slips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/counter"
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-750 transition"
          >
            New Walk-In Intake
          </Link>
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'kanban' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kanban Board
            </button>
          </div>
        </div>
      </div>

      {/* MODULE 4: LIVE CITIZEN OTP RELAY FLASH BANNER (If Active) */}
      {otpOrder && (
        <div className="rounded-2xl border-2 border-purple-500/70 bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/80 p-5 shadow-2xl shadow-purple-950/50 space-y-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white font-mono font-black text-lg animate-pulse">
                {otpSecondsLeft}s
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-purple-300 border border-purple-500/30">
                    Live Portal Submission Alert
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">{otpOrder.token}</span>
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Citizen OTP Required: {otpOrder.citizenName}
                </h2>
                <p className="text-xs text-slate-300">
                  {otpOrder.assignedOperator} is submitting {otpOrder.serviceTitle} on the official portal. Request the 6-digit SMS code received on <strong className="font-mono text-white">{otpOrder.mobile}</strong>.
                </p>
              </div>
            </div>

            {/* OTP Input & Relay Form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP"
                className="w-36 rounded-xl border border-purple-400/60 bg-slate-950 px-3 py-2 text-center font-mono text-base font-bold tracking-widest text-purple-200 focus:border-purple-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={enteredOtp.length !== 6 || otpSentSuccess}
                className="rounded-xl bg-purple-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-purple-400 disabled:opacity-50 transition shadow-lg shadow-purple-500/20"
              >
                {otpSentSuccess ? 'Transmitting to Desk...' : 'Relay OTP to Desk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token, citizen name, phone, or recruitment service..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Filing Statuses ({orders.length})</option>
              <option value="in_filing">In Filing by Back-Office</option>
              <option value="otp_pending">ACTION: OTP Needed</option>
              <option value="defective">Defective: Needs Re-scan</option>
              <option value="completed">Completed &amp; Sealed</option>
              <option value="dispatched">Dispatched to Desk</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Token &amp; Time</th>
                  <th className="px-4 py-3.5">Citizen Particulars</th>
                  <th className="px-4 py-3.5">Service &amp; Target Portal</th>
                  <th className="px-4 py-3.5">Assigned Operator</th>
                  <th className="px-4 py-3.5">Pipeline Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No matching orders found in queue.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusMeta = STATUS_CONFIG[order.status];
                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition">
                        {/* Token & Time */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-emerald-400">{order.token}</span>
                          <p className="text-[10px] text-slate-500">{order.createdAt}</p>
                        </td>

                        {/* Citizen Name & Phone */}
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-white">{order.citizenName}</p>
                          <p className="font-mono text-[11px] text-slate-400">{order.mobile}</p>
                        </td>

                        {/* Service Title */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="font-bold text-slate-200 truncate">{order.serviceTitle}</p>
                          <p className="text-[10px] text-slate-500 truncate">{order.targetPortalName}</p>
                        </td>

                        {/* Operator */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-300">
                          {order.assignedOperator ? (
                            <span className="text-[11px] font-medium">{order.assignedOperator}</span>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Pending Assignment</span>
                          )}
                        </td>

                        {/* Pipeline Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.tone}`}
                          >
                            <span className={`size-1.5 rounded-full ${statusMeta.dotColor}`} />
                            {statusMeta.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {order.status === 'completed' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptOrder(order)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition"
                            >
                              <Printer className="size-3.5" />
                              <span>Print A4 Slip</span>
                            </button>
                          ) : order.status === 'defective' ? (
                            <Link
                              href={`/scanner?token=${order.token}&name=${encodeURIComponent(order.citizenName)}&service=${encodeURIComponent(order.serviceTitle)}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition"
                            >
                              <Camera className="size-3.5" />
                              <span>Rescan Asset</span>
                            </Link>
                          ) : (
                            <span className="text-[11px] text-slate-500">Live in Desk</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { id: 'in_filing', title: 'In Filing at Desk', count: orders.filter((o) => o.status === 'in_filing').length },
            { id: 'otp_pending', title: 'Action: OTP Needed', count: orders.filter((o) => o.status === 'otp_pending').length },
            { id: 'defective', title: 'Defective (Re-upload)', count: orders.filter((o) => o.status === 'defective').length },
            { id: 'completed', title: 'Completed & Sealed', count: orders.filter((o) => o.status === 'completed').length },
          ].map((col) => {
            const colOrders = orders.filter((o) => o.status === col.id);
            return (
              <div key={col.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{col.title}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-slate-300">
                    {col.count}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-400">{order.token}</span>
                        <span className="text-[10px] text-slate-500">{order.createdAt}</span>
                      </div>
                      <p className="font-bold text-white">{order.citizenName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{order.serviceTitle}</p>

                      {order.filingDetails?.defectReason && (
                        <p className="rounded bg-rose-950/40 border border-rose-900/50 p-2 text-[10px] text-rose-300">
                          {order.filingDetails.defectReason}
                        </p>
                      )}

                      {order.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500/20 py-1.5 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30"
                        >
                          <Printer className="size-3" />
                          <span>Print Slip</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRINTABLE A4 CITIZEN ACKNOWLEDGEMENT SLIP MODAL */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Official Citizen Acknowledgement Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* A4 Paper Preview Container */}
            <div className="rounded-2xl border border-slate-700 bg-white p-6 text-slate-950 space-y-4 font-sans text-xs shadow-inner">
              {/* Slip Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">ApplyFields Kiosk Service</h2>
                  <p className="text-[10px] font-semibold text-slate-600">Government Recruitment &amp; MeeSeva Citizen Slip</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-900">{selectedReceiptOrder.token}</span>
                  <p className="text-[10px] text-slate-500">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Grid Particulars */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Candidate Name</span>
                  <strong className="text-sm font-bold text-slate-900">{selectedReceiptOrder.citizenName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Mobile Number</span>
                  <strong className="text-sm font-bold text-slate-900">{selectedReceiptOrder.mobile}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Service Applied</span>
                  <span className="font-bold text-slate-900">{selectedReceiptOrder.serviceTitle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Official Registration / Roll No</span>
                  <strong className="font-mono text-sm font-black text-emerald-700">
                    {selectedReceiptOrder.filingDetails?.portalRegNumber || 'SSC-CGL-24009182410'}
                  </strong>
                </div>
              </div>

              {/* Fee Receipt Details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <div className="flex justify-between text-slate-700">
                  <span>Total Counter Fees Paid:</span>
                  <strong className="font-mono">₹{selectedReceiptOrder.feesCollected}.00</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Payment Mode:</span>
                  <span className="font-bold">{selectedReceiptOrder.paymentMode} In Hand</span>
                </div>
              </div>

              {/* Kiosk Stamp & QR Code */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-900">Sri Balaji MeeSeva &amp; Xerox Centre</p>
                  <p className="text-[10px] text-slate-500">Center Code: TS-HYD-0419 · Ameerpet, Hyderabad</p>
                  <p className="text-[9px] text-emerald-700 font-bold">Digitally Sealed by ApplyFields Platform</p>
                </div>
                <div className="flex flex-col items-center">
                  <QrCode className="size-12 text-slate-900" />
                  <span className="text-[8px] font-mono text-slate-500">Scan to Verify</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-750"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Printer className="size-4" />
                <span>Print Official A4 Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
