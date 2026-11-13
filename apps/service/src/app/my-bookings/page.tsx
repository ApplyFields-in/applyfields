'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Printer,
  Share2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Upload,
  RefreshCw,
  QrCode,
  FileText,
  Search,
  ChevronRight,
  Navigation,
  ArrowLeft,
  X,
} from 'lucide-react';
import type { BookingDetail, BookingDisputeStatus } from '@applyfields/types';
import { useAuth } from '@/lib/auth-context';
import { cancelBooking, fileBookingDispute, getMyBookings, sendBookingMessage } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';

export type BookingStage = 'booked' | 'verified_present' | 'in_filing' | 'defective' | 'completed' | 'cancelled';

export interface CitizenBookingItem {
  id: string;
  token: string;
  candidateName: string;
  candidatePhone: string;
  slotDate: string;
  slotTime: string;
  status: BookingStage;
  securityPin: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  counterName: string;
  partner: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    googleMapsUrl?: string;
  };
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  total: number;
  paymentMode: 'counter' | 'online';
  isPaid: boolean;
  defectReason?: string;
  correctionUploaded?: boolean;
  requiredDocuments: string[];
  portalRegNumber?: string;
  createdAt: string;
  partnerEmail?: string;
  dispute?: {
    id: string;
    reason: string;
    details: string;
    refundClaim: number;
    status: BookingDisputeStatus;
    adminNote?: string;
    openedAt: string;
  };
}

const DISPUTE_LABEL: Record<BookingDisputeStatus, string> = {
  open: 'Received, waiting for review',
  in_review: 'Being reviewed',
  resolved: 'Resolved',
  rejected: 'Not upheld',
  closed: 'Closed',
};

function toDisputeView(d: NonNullable<BookingDetail['disputes']>[number]): CitizenBookingItem['dispute'] {
  return {
    id: d.id.slice(0, 8).toUpperCase(),
    reason: d.reason,
    details: d.details,
    refundClaim: (d.claim_paise ?? 0) / 100,
    status: d.status,
    adminNote: d.resolution_note ?? undefined,
    openedAt: new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  };
}

/** A real booking from GET /bookings/my in this page's shape. PIN/queue are not tracked by the API, so they stay empty and hidden. */
function fromApi(b: BookingDetail): CitizenBookingItem {
  const at = b.appointment_at ? new Date(b.appointment_at) : null;
  const total = (b.final_paise ?? b.quoted_paise ?? 0) / 100;
  const stage: BookingStage =
    b.status === 'completed'
      ? 'completed'
      : b.status === 'cancelled' || b.status === 'rejected'
        ? 'cancelled'
        : b.status === 'in_progress'
          ? 'in_filing'
          : 'booked';
  return {
    id: b.id,
    token: `AF-${b.id.slice(0, 8).toUpperCase()}`,
    candidateName: '',
    candidatePhone: '',
    slotDate: at ? at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not scheduled',
    slotTime: at ? at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
    status: stage,
    securityPin: '',
    queuePosition: -1,
    estimatedWaitMinutes: 0,
    counterName: '',
    partner: {
      id: b.partner_id,
      name: b.partner_business_name,
      address: b.partner_address ?? '',
      city: '',
      district: '',
      phone: b.partner_phone ?? '',
    },
    items: [{ title: b.service_name ?? 'Service request', price: total, quantity: 1, category: 'Service' }],
    total,
    paymentMode: 'counter',
    isPaid: false,
    requiredDocuments: [],
    portalRegNumber: b.official_app_number ?? undefined,
    createdAt: b.created_at,
    partnerEmail: b.partner_email ?? undefined,
    dispute: b.disputes?.[0] ? toDisputeView(b.disputes[0]) : undefined,
  };
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState<CitizenBookingItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'defective'>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedSlipBooking, setSelectedSlipBooking] = useState<CitizenBookingItem | null>(null);
  const [slipPrintFormat, setSlipPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [correctingBooking, setCorrectingBooking] = useState<CitizenBookingItem | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Dispute & Refund Arbitration
  const [disputingBooking, setDisputingBooking] = useState<CitizenBookingItem | null>(null);
  const [disputeReason, setDisputeReason] = useState('Partner Overcharged Above Rate Card');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeClaimAmount, setDisputeClaimAmount] = useState<number>(0);
  const [disputeSuccessToast, setDisputeSuccessToast] = useState<string | null>(null);

  // The signed-in user's real bookings only; none = the empty state.
  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setBookings([]));
      return;
    }
    getMyBookings()
      .then((res) => setBookings((res.data?.items ?? []).map(fromApi)))
      .catch(() => setBookings([]));
  }, [user]);

  // Copy token helper
  function handleCopyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  // Email the booking details (to yourself or anyone): opens the user's own mail app.
  function handleEmailShare(b: CitizenBookingItem) {
    const lines = [
      'ApplyFields appointment',
      `Token: ${b.token}`,
      `Time: ${b.slotDate}${b.slotTime ? ` (${b.slotTime})` : ''}`,
      `Centre: ${b.partner.name}`,
      b.partner.address ? `Address: ${b.partner.address}` : '',
      `Services: ${b.items.map((i) => i.title).join(', ')}`,
      `Fee: INR ${b.total} (${b.isPaid ? 'Paid' : 'Pay at the counter'})`,
      `Slip: https://service.applyfields.in/bookings/${b.id}`,
    ].filter(Boolean);
    window.location.href = `mailto:?subject=${encodeURIComponent(`ApplyFields appointment ${b.token}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }

  // Cancel a booking that hasn't started yet (POST /bookings/:id/cancel).
  async function handleCancel(b: CitizenBookingItem) {
    if (!window.confirm(`Cancel booking ${b.token} at ${b.partner.name}?`)) return;
    setActionError(null);
    setBusyId(b.id);
    const res = await cancelBooking(b.id, 'Cancelled by citizen');
    setBusyId(null);
    if (!res.data) {
      setActionError(res.error || 'Could not cancel. Please contact the centre.');
      return;
    }
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: 'cancelled' } : x)));
  }

  // Corrections go to the centre's operator as a chat message on this booking.
  async function handleResolveCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!correctingBooking || correctionText.trim().length < 3) return;
    setActionError(null);
    const res = await sendBookingMessage(correctingBooking.id, {
      message: `Correction from the applicant: ${correctionText.trim()}`,
      sender_type: 'citizen',
      sender_name: user?.full_name || 'Applicant',
    });
    if (!res.data) {
      setActionError(res.error || 'Could not send your correction. Please try again.');
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === correctingBooking.id ? { ...b, correctionUploaded: true } : b)));
    setUploadSuccessMessage(true);
    setTimeout(() => {
      setUploadSuccessMessage(false);
      setCorrectingBooking(null);
      setCorrectionText('');
    }, 1500);
  }

  // Complaint → ApplyFields disputes desk (POST /bookings/:id/dispute).
  async function handleFileDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputingBooking || disputeDetails.trim().length < 10) return;
    setActionError(null);
    const claim = disputeClaimAmount || disputingBooking.total;
    const res = await fileBookingDispute(disputingBooking.id, {
      reason: disputeReason,
      details: disputeDetails.trim(),
      claim_paise: claim > 0 ? Math.round(claim * 100) : undefined,
    });
    if (!res.data) {
      setActionError(res.error || 'Could not send your complaint. Please try again.');
      return;
    }
    const view = toDisputeView(res.data);
    setBookings((prev) => prev.map((b) => (b.id === disputingBooking.id ? { ...b, dispute: view } : b)));
    setDisputeSuccessToast(`Complaint received (ref ${view?.id}). Our team will review it and notify you.`);
    setDisputingBooking(null);
    setDisputeDetails('');
    setTimeout(() => setDisputeSuccessToast(null), 6000);
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeTab === 'active' && (b.status === 'completed' || b.status === 'cancelled')) return false;
      if (activeTab === 'completed' && b.status !== 'completed') return false;
      if (activeTab === 'defective' && b.status !== 'defective') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.token.toLowerCase().includes(q) ||
          b.partner.name.toLowerCase().includes(q) ||
          b.items.some((it) => it.title.toLowerCase().includes(q)) ||
          b.partner.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, activeTab, searchQuery]);

  const activeCount = useMemo(() => bookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length, [bookings]);
  const defectCount = useMemo(() => bookings.filter((b) => b.status === 'defective').length, [bookings]);
  const completedCount = useMemo(() => bookings.filter((b) => b.status === 'completed').length, [bookings]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-28 text-[#082046]">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#d5deea] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-[#0e7bf4] transition">
              Citizen Services
            </Link>
            <span>/</span>
            <span className="text-[#0e7bf4]">My Bookings &amp; Digital Slips</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#082046] mt-1">
            {t('myBookings')} &amp; Token Desk
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Track live queue positions, view your 4-digit security PIN, download slips, and resolve document corrections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-[#d5deea] bg-white px-4 py-2 text-xs font-bold text-[#082046] shadow-sm hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Book New Service</span>
          </Link>
        </div>
      </div>

      {/* DEFECT ALERT BANNER (If Any Action Required) */}
      {defectCount > 0 && (
        <div className="rounded-3xl border border-rose-300 bg-rose-50/90 p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="rounded bg-rose-200/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-900 border border-rose-300">
                  Action Required: Document Correction
                </span>
                <h3 className="text-sm font-bold text-rose-950 mt-1">
                  Operator requested a replacement scan for {defectCount} application{defectCount > 1 ? 's' : ''}.
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  Upload the corrected file online to avoid visiting the center again.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('defective')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 transition shadow-sm"
            >
              <span>View Needs Correction</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-[#d5deea] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'all' ? 'bg-[#082046] text-white shadow-sm' : 'text-slate-600 hover:text-[#082046]'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'active' ? 'bg-[#082046] text-white shadow-sm' : 'text-slate-600 hover:text-[#082046]'
            }`}
          >
            Active Appointments ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'completed' ? 'bg-[#082046] text-white shadow-sm' : 'text-slate-600 hover:text-[#082046]'
            }`}
          >
            Completed ({completedCount})
          </button>
          {defectCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('defective')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'defective' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Needs Correction ({defectCount})</span>
            </button>
          )}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search token, center, service..."
            className="h-10 w-full rounded-2xl border border-[#d5deea] bg-white pl-9 pr-3 text-xs font-semibold text-[#082046] placeholder-slate-400 focus:border-[#0e7bf4] focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-white bg-white p-12 text-center shadow-clay-card space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0e7bf4]">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#082046]">No Bookings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any bookings in this section. Browse verified centers to reserve a zero-wait appointment.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] transition"
            >
              <span>Explore Centers</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isCompleted = b.status === 'completed';
            const isDefective = b.status === 'defective';
            const isInProgress = b.status === 'in_filing' || b.status === 'verified_present';

            return (
              <div
                key={b.id}
                className={`rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                  isDefective
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isCompleted
                    ? 'border-emerald-200'
                    : 'border-[#d5deea]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black text-[#082046]">{b.token}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyToken(b.token)}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition"
                        title="Copy Token"
                      >
                        {copiedToken === b.token ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedToken === b.token ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Status Badge */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Sealed &amp; Completed</span>
                        </span>
                      ) : isDefective ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 uppercase animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Correction Required</span>
                        </span>
                      ) : b.correctionUploaded ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 uppercase">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Correction Uploaded</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 uppercase">
                          <Clock className="h-3 w-3" />
                          <span>Active: {b.slotDate}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-[#082046]">
                      {b.items.map((i) => i.title).join(', ')}
                    </h2>
                  </div>

                  {/* Security PIN Display Card */}
                  {b.securityPin && (
                  <div className="flex items-center gap-3 bg-[#F0F4F8] border border-[#d5deea] rounded-2xl px-3.5 py-2">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {t('counterPin')}
                      </span>
                      <span className="font-mono text-base font-black tracking-widest text-[#082046]">
                        {b.securityPin}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-300" />
                    <div className="text-[10px] text-slate-500 font-medium max-w-[110px] leading-tight">
                      Show at counter to verify presence
                    </div>
                  </div>
                  )}
                </div>

                {/* Queue Position & Timing Estimator */}
                {!isCompleted && b.queuePosition >= 0 && (
                  <div className="my-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0e7bf4] text-white font-mono font-bold text-xs">
                        {b.queuePosition}
                      </div>
                      <div>
                        <p className="font-bold text-[#082046]">
                          {b.queuePosition === 0 ? 'Now Serving at Counter' : `${b.queuePosition} people ahead in queue`} - {b.counterName}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Scheduled Slot: {b.slotDate} ({b.slotTime})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#0e7bf4]" />
                      <span className="text-xs font-bold text-[#082046]">
                        Estimated Wait: {b.estimatedWaitMinutes > 0 ? `~${b.estimatedWaitMinutes} minutes` : 'Immediate'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4-Stage Stepper Progress */}
                <div className="my-4 py-2 border-y border-slate-100">
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="space-y-1">
                      <div className="mx-auto h-2 w-full rounded-full bg-emerald-500" />
                      <span className="font-bold text-emerald-800">1. Booked</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`mx-auto h-2 w-full rounded-full ${isInProgress || isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <span className={`font-bold ${isInProgress || isCompleted ? 'text-emerald-800' : 'text-slate-400'}`}>
                        2. PIN Verified
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className={`mx-auto h-2 w-full rounded-full ${isInProgress || isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <span className={`font-bold ${isInProgress || isCompleted ? 'text-emerald-800' : 'text-slate-400'}`}>
                        3. In Filing
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className={`mx-auto h-2 w-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      <span className={`font-bold ${isCompleted ? 'text-emerald-800' : 'text-slate-400'}`}>
                        4. Slip Sealed
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-WAY DEFECT LOOP BOX (If Operator Flagged Defect) */}
                {isDefective && (
                  <div className="my-4 rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                          Correction Note From Center Operator
                        </h4>
                        <p className="text-xs text-rose-800 leading-relaxed font-medium">
                          {b.defectReason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectingBooking(b);
                          setCorrectionText('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 transition shadow-sm"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload Replacement Document</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Completed Details */}
                {isCompleted && b.portalRegNumber && (
                  <div className="my-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 uppercase">Official Portal Registration Number</span>
                      <strong className="font-mono text-sm font-black text-emerald-950">{b.portalRegNumber}</strong>
                    </div>
                    <span className="rounded-md bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      Digitally Verified
                    </span>
                  </div>
                )}

                {/* Dispute / Grievance Status Banner */}
                {b.dispute && (
                  <div className={`my-3 rounded-2xl border p-3.5 text-xs space-y-1.5 ${
                    b.dispute.status === 'open' || b.dispute.status === 'in_review'
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : b.dispute.status === 'resolved'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold uppercase tracking-wider text-[10px]">
                        Complaint {b.dispute.id} · {DISPUTE_LABEL[b.dispute.status]}
                      </span>
                      {b.dispute.refundClaim > 0 && (
                        <span className="font-mono font-bold">Asked back: INR {b.dispute.refundClaim}</span>
                      )}
                    </div>
                    <p className="font-medium text-slate-700">{b.dispute.reason}: {b.dispute.details}</p>
                    {b.dispute.adminNote && (
                      <p className="pt-1 text-[11px] border-t border-slate-200 text-slate-700">
                        <strong>ApplyFields reply:</strong> {b.dispute.adminNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Center & Required Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#082046]">
                      <MapPin className="h-3.5 w-3.5 text-[#0e7bf4]" />
                      <span>{b.partner.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5">
                      {b.partner.address}, {b.partner.city}
                    </p>
                    <div className="pl-5 pt-1 flex items-center gap-3">
                      <a
                        href={b.partner.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(b.partner.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4] hover:underline"
                      >
                        <Navigation className="h-3 w-3" />
                        <span>Open Directions in Maps</span>
                      </a>
                      <span className="text-slate-300">-</span>
                      <a
                        href={`tel:${b.partner.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#082046]"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{b.partner.phone}</span>
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Documents To Bring
                    </span>
                    <ul className="space-y-0.5 text-[11px] text-slate-600">
                      {b.requiredDocuments.map((doc, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    Total Fee: <strong className="font-mono text-[#082046]">INR {b.total}.00</strong> ({b.paymentMode === 'online' ? 'Paid Online' : 'Pay at Counter'})
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Email the details (opens the user's mail app) */}
                    <button
                      type="button"
                      onClick={() => handleEmailShare(b)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                      title="Email these booking details"
                    >
                      <Share2 className="h-3.5 w-3.5 text-[#0e7bf4]" />
                      <span>Email details</span>
                    </button>

                    {b.partnerEmail && (
                      <a
                        href={`mailto:${b.partnerEmail}?subject=${encodeURIComponent(`Appointment ${b.token}`)}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#0e7bf4]" />
                        <span>Email centre</span>
                      </a>
                    )}

                    {/* Correction → message to the centre (active bookings only) */}
                    {b.status !== 'completed' && b.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCorrectingBooking(b);
                          setCorrectionText('');
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#0e7bf4]" />
                        <span>Send a correction</span>
                      </button>
                    )}

                    {/* Cancel (only before the centre starts work) */}
                    {b.status === 'booked' && (
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => void handleCancel(b)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>{busyId === b.id ? 'Cancelling…' : 'Cancel booking'}</span>
                      </button>
                    )}

                    {/* Chat with Center */}
                    <Link
                      href={`/bookings/${b.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#0e7bf4]" />
                      <span>Chat with Desk</span>
                    </Link>

                    {/* Raise Grievance / Dispute Button */}
                    {(!b.dispute || ['resolved', 'rejected', 'closed'].includes(b.dispute.status)) && b.status !== 'booked' && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisputingBooking(b);
                          setDisputeReason('Partner Overcharged Above Rate Card');
                          setDisputeDetails('');
                          setDisputeClaimAmount(b.total);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                      >
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                        <span>Report a problem</span>
                      </button>
                    )}

                    {/* View Digital Token Slip */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSlipBooking(b);
                        setSlipPrintFormat('a4');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0c2f66] transition shadow-sm"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>{t('downloadSlip')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: OFFICIAL TOKEN SLIP MODAL (Supports A4 & Thermal 80mm ESC/POS) */}
      {selectedSlipBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white bg-white p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0e7bf4]" />
                <h3 className="text-base font-bold text-[#082046]">Official Appointment &amp; Token Slip</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSlipPrintFormat('a4')}
                    className={`rounded-lg px-2.5 py-1 transition ${slipPrintFormat === 'a4' ? 'bg-white text-[#082046] shadow-sm' : 'text-slate-500'}`}
                  >
                    A4 Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlipPrintFormat('thermal')}
                    className={`rounded-lg px-2.5 py-1 transition ${slipPrintFormat === 'thermal' ? 'bg-white text-[#082046] shadow-sm' : 'text-slate-500'}`}
                  >
                    80mm Thermal
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlipBooking(null)}
                  className="rounded-xl p-1 text-slate-400 hover:text-[#082046]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Slip Paper Body */}
            {slipPrintFormat === 'a4' ? (
              <div className="rounded-2xl border border-slate-200 bg-[#FAFBFD] p-6 text-slate-900 space-y-4 font-sans text-xs">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-[#082046] pb-3">
                  <div>
                    <h2 className="text-base font-black uppercase text-[#082046]">ApplyFields Citizen Services</h2>
                    <p className="text-[10px] text-slate-500">Government Applications &amp; MeeSeva Booking Portal</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-black text-[#082046]">{selectedSlipBooking.token}</span>
                    <p className="text-[10px] text-slate-500">{new Date(selectedSlipBooking.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Candidate Name</span>
                    <strong className="text-sm font-bold text-slate-900">{selectedSlipBooking.candidateName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Security Presence PIN</span>
                    <strong className="font-mono text-base font-black text-[#0e7bf4]">{selectedSlipBooking.securityPin}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Slot Time</span>
                    <strong className="text-xs font-bold text-slate-900">{selectedSlipBooking.slotDate} ({selectedSlipBooking.slotTime})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Center Name</span>
                    <strong className="text-xs font-bold text-slate-900">{selectedSlipBooking.partner.name}</strong>
                  </div>
                </div>

                {/* Services Table */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                  <div className="font-bold text-[#082046] border-b border-slate-100 pb-1">Services Booked</div>
                  {selectedSlipBooking.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{it.quantity}x {it.title}</span>
                      <span className="font-mono font-bold">INR {it.price}.00</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 pt-1 flex justify-between font-bold text-[#082046]">
                    <span>Total Amount:</span>
                    <span className="font-mono">INR {selectedSlipBooking.total}.00</span>
                  </div>
                </div>

                {/* Footer Seal & QR */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <div className="space-y-0.5 text-[10px] text-slate-500">
                    <p className="font-bold text-[#082046]">{selectedSlipBooking.partner.address}</p>
                    <p>Customer Support: support@applyfields.in - Phone: {selectedSlipBooking.partner.phone}</p>
                    <p className="text-emerald-700 font-bold">Digitally Sealed Token Slip</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <QrCode className="h-12 w-12 text-[#082046]" />
                    <span className="text-[8px] font-mono text-slate-400">Scan at Kiosk</span>
                  </div>
                </div>
              </div>
            ) : (
              /* 80mm Thermal Slip Layout */
              <div className="mx-auto max-w-[340px] rounded-2xl border border-slate-300 bg-white p-4 font-mono text-[11px] text-slate-950 space-y-2 shadow-sm">
                <div className="text-center border-b border-dashed border-slate-400 pb-2">
                  <p className="text-sm font-black uppercase tracking-tight">APPLYFIELDS KIOSK</p>
                  <p className="text-[10px] text-slate-600">{selectedSlipBooking.partner.name}</p>
                  <p className="text-[9px] text-slate-500">{selectedSlipBooking.partner.address}</p>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 py-1">
                  <span>TOKEN:</span>
                  <strong className="text-xs font-black">{selectedSlipBooking.token}</strong>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 py-1">
                  <span>PRESENCE PIN:</span>
                  <strong className="text-sm font-black">{selectedSlipBooking.securityPin}</strong>
                </div>

                <div className="space-y-0.5 border-b border-dashed border-slate-300 py-1">
                  <div className="flex justify-between">
                    <span>NAME:</span>
                    <span className="font-bold">{selectedSlipBooking.candidateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SLOT:</span>
                    <span>{selectedSlipBooking.slotDate} {selectedSlipBooking.slotTime}</span>
                  </div>
                </div>

                <div className="space-y-0.5 border-b border-dashed border-slate-300 py-1">
                  {selectedSlipBooking.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="truncate max-w-[200px]">{it.title}</span>
                      <span>{it.price}.00</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black pt-1">
                    <span>TOTAL:</span>
                    <span>INR {selectedSlipBooking.total}.00</span>
                  </div>
                </div>

                <div className="text-center pt-1 space-y-1">
                  <QrCode className="h-10 w-10 mx-auto text-slate-900" />
                  <p className="text-[8px] text-slate-500 uppercase">Present this slip at Counter 1 or 2</p>
                  <p className="text-[8px] text-slate-400">service.applyfields.in</p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedSlipBooking(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c2f66] transition shadow-sm"
              >
                <Printer className="h-4 w-4" />
                <span>Print {slipPrintFormat === 'a4' ? 'A4 Slip' : '80mm Thermal Slip'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 2-WAY DEFECT LOOP REPLACEMENT UPLOAD */}
      {correctingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white bg-white p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-[#082046]">Send a correction to the centre</h3>
              </div>
              <button
                type="button"
                onClick={() => setCorrectingBooking(null)}
                className="rounded-xl p-1 text-slate-400 hover:text-[#082046]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {correctingBooking.defectReason && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 space-y-1">
                <span className="font-bold block uppercase text-[10px] text-rose-800">What the centre asked for</span>
                <p className="leading-relaxed">{correctingBooking.defectReason}</p>
              </div>
            )}

            {uploadSuccessMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-xs font-bold text-emerald-800 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-sm">Sent to {correctingBooking.partner.name}</p>
                <p className="text-emerald-700 font-normal">
                  The operator sees it in your booking chat. Open the booking to follow up or attach a document.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResolveCorrection} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="correction-text" className="block text-xs font-bold text-[#082046] mb-1.5">
                    What should the centre correct?
                  </label>
                  <textarea
                    id="correction-text"
                    rows={4}
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    placeholder="e.g. My father's name is spelled wrong: it should be 'Venkata Rao', not 'Venkat Rao'."
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0e7bf4] focus:outline-none"
                  />
                  {actionError && (
                    <p role="alert" className="mt-1 text-[11px] font-semibold text-red-700">
                      {actionError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setCorrectingBooking(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={correctionText.trim().length < 3}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c2f66] disabled:opacity-50 transition"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Send to centre</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* MODAL 3: GRIEVANCE & REFUND DISPUTE MODAL */}
      {disputingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white bg-white p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-[#082046]">Report a problem with this booking</h3>
              </div>
              <button
                type="button"
                onClick={() => setDisputingBooking(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-bold text-[#082046]">
                <span>Token: {disputingBooking.token}</span>
                <span>Center: {disputingBooking.partner.name}</span>
              </div>
              <p>Booking Fee Paid: INR {disputingBooking.total}.00 ({disputingBooking.paymentMode})</p>
            </div>

            <form onSubmit={handleFileDispute} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#082046] mb-1">
                  Reason for Grievance
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#0e7bf4] focus:outline-none"
                >
                  <option value="Partner Overcharged Above Rate Card">Partner Overcharged Above Rate Card</option>
                  <option value="Severe Service Delay / Slot Not Honored">Severe Service Delay / Slot Not Honored</option>
                  <option value="Incorrect Application Details Submitted to Government Portal">Incorrect Application Details Submitted to Government Portal</option>
                  <option value="Center Closed / Staff Unresponsive">Center Closed / Staff Unresponsive</option>
                  <option value="Other Discrepancy">Other Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046] mb-1">
                  Details & Evidence
                </label>
                <textarea
                  rows={3}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="Describe exactly what happened at the counter, unauthorized extra charges, or filing errors..."
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0e7bf4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046] mb-1">
                  Amount you want back (INR, optional)
                </label>
                <input
                  type="number"
                  min={0}
                  max={disputingBooking.total || undefined}
                  value={disputeClaimAmount || disputingBooking.total}
                  onChange={(e) => setDisputeClaimAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Leave 0 if you aren&apos;t asking for money back.
                </span>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 space-y-0.5">
                <p className="font-bold">What happens next</p>
                <p>
                  The ApplyFields team checks with the centre and replies to you with a notification. Any refund is
                  arranged by our team.
                </p>
              </div>
              {actionError && (
                <p role="alert" className="text-[11px] font-semibold text-red-700">
                  {actionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setDisputingBooking(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputeDetails.trim().length < 10}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
                >
                  <span>Send complaint</span>

                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grievance Filed Success Toast */}
      {disputeSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{disputeSuccessToast}</span>
        </div>
      )}
    </div>
  );
}
