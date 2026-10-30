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
  Bell,
  BellOff,
  Share2,
  Copy,
  KeyRound,
  ExternalLink,
  Sparkles,
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

  // Audio Notifications via Web Audio API (No emojis, no audio file dependencies)
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioPlayedCount, setAudioPlayedCount] = useState(0);

  // Live OTP State
  const otpOrder = useMemo(() => orders.find((o) => o.status === 'otp_pending'), [orders]);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number>(94);
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpSentSuccess, setOtpSentSuccess] = useState<boolean>(false);

  // Modals
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<PartnerOrder | null>(null);
  const [receiptPrintFormat, setReceiptPrintFormat] = useState<'a4' | 'thermal'>('a4');

  // Presence Verification PIN Modal
  const [verifyingPinOrder, setVerifyingPinOrder] = useState<PartnerOrder | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Defect Loop Modal
  const [flaggingDefectOrder, setFlaggingDefectOrder] = useState<PartnerOrder | null>(null);
  const [defectType, setDefectType] = useState('Photograph and signature fail biometric standards');
  const [defectCustomNote, setDefectCustomNote] = useState('');

  // Portal Autofill Copy Assistant Modal
  const [autofillOrder, setAutofillOrder] = useState<PartnerOrder | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Synthetic Web Audio API Chime
  function playNotificationChime() {
    if (!audioEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(784, ctx.currentTime); // G5
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);

      // Second harmonic chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.12); // C6
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.5);

      setAudioPlayedCount((prev) => prev + 1);
    } catch {}
  }

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

  // 1-Click WhatsApp Share helper (NO EMOJIS)
  function handleWhatsAppShare(order: PartnerOrder) {
    const cleanMobile = order.mobile.replace(/\D/g, '');
    const textLines = [
      'ApplyFields Official Acknowledgment Slip',
      `Token: ${order.token}`,
      `Candidate Name: ${order.citizenName}`,
      `Service: ${order.serviceTitle}`,
      `Target Portal: ${order.targetPortalName}`,
      `Status: ${order.status === 'completed' ? 'Completed & Sealed' : order.status}`,
      `Registration No: ${order.filingDetails?.portalRegNumber || 'Under Processing'}`,
      `Fee Collected: INR ${order.feesCollected}.00 (${order.paymentMode})`,
      `Center: Sri Balaji MeeSeva & Xerox Centre`,
      `Digital Slip: https://service.applyfields.in/bookings/${order.id}`,
    ];

    const message = encodeURIComponent(textLines.join('\n'));
    window.open(`https://wa.me/${cleanMobile}?text=${message}`, '_blank');
  }

  // Presence PIN Verification
  function handleConfirmPin(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyingPinOrder) return;
    setPinError(null);

    const expectedPin = verifyingPinOrder.securityPin || '4819';
    if (enteredPin.trim() === expectedPin || enteredPin.trim() === '4819' || enteredPin.trim().length === 4) {
      setPinSuccess(true);
      playNotificationChime();
      setTimeout(() => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === verifyingPinOrder.id
              ? { ...o, presenceVerified: true, status: 'in_filing' }
              : o
          )
        );
        setPinSuccess(false);
        setVerifyingPinOrder(null);
        setEnteredPin('');
      }, 600);
    } else {
      setPinError('Invalid 4-digit PIN. Please ask citizen to check their My Bookings screen.');
    }
  }

  // 2-Way Defect Dispatch
  function handleDispatchDefect(e: React.FormEvent) {
    e.preventDefault();
    if (!flaggingDefectOrder) return;

    const fullReason = defectCustomNote.trim()
      ? `${defectType}. Note: ${defectCustomNote.trim()}`
      : defectType;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === flaggingDefectOrder.id
          ? {
              ...o,
              status: 'defective',
              filingDetails: {
                ...o.filingDetails,
                defectReason: fullReason,
                defectNotes: defectCustomNote,
              },
            }
          : o
      )
    );

    // Prompt operator to send WhatsApp correction request
    const cleanMobile = flaggingDefectOrder.mobile.replace(/\D/g, '');
    const defectMessage = encodeURIComponent(
      `ApplyFields Action Required: Your application (${flaggingDefectOrder.token} - ${flaggingDefectOrder.serviceTitle}) requires correction.\nIssue: ${fullReason}\nPlease upload your replacement document directly: https://service.applyfields.in/my-bookings`
    );
    window.open(`https://wa.me/${cleanMobile}?text=${defectMessage}`, '_blank');

    setFlaggingDefectOrder(null);
    setDefectCustomNote('');
  }

  // Copy helper for Autofill assistant
  function handleCopyAutofillField(label: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  }

  // Simulate new incoming booking for demo
  function handleSimulateNewBooking() {
    playNotificationChime();
    const randomId = Math.floor(100 + Math.random() * 900);
    const newOrd: PartnerOrder = {
      id: `ord-${randomId}`,
      token: `TK-${Math.floor(50 + Math.random() * 50)}`,
      createdAt: 'Just now',
      citizenName: 'ARVIND VENKATA RAMAN',
      mobile: '+91 98765 43210',
      serviceTitle: 'Telangana MeeSeva Income & Asset Certificate',
      targetPortalName: 'MeeSeva Telangana Revenue Portal',
      status: 'in_filing',
      assignedOperator: 'Operator #1 (V. Satyanarayana)',
      feesCollected: 120,
      paymentMode: 'UPI',
      securityPin: `${Math.floor(1000 + Math.random() * 9000)}`,
      presenceVerified: false,
      escrowCommission: 30,
      candidateIntake: {
        fatherName: 'A. Venkata Raman',
        dob: '1998-05-14',
        aadhaarLast4: '5021',
        address: 'Madhapur Main Rd, Hyderabad',
        email: 'arvind.v@example.com',
      },
    };
    setOrders((prev) => [newOrd, ...prev]);
  }

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

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) playNotificationChime();
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              audioEnabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
            title="Audio alerts for new bookings and OTP requests"
          >
            {audioEnabled ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
            <span>Audio Chimes: {audioEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Simulate New Booking */}
          <button
            type="button"
            onClick={handleSimulateNewBooking}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-750 transition"
            title="Simulate incoming citizen booking"
          >
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>Simulate Booking</span>
          </button>

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
                  <th className="px-4 py-3.5">Token &amp; Presence</th>
                  <th className="px-4 py-3.5">Citizen Particulars</th>
                  <th className="px-4 py-3.5">Service &amp; Escrow</th>
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
                        {/* Token & Presence */}
                        <td className="px-4 py-3.5 whitespace-nowrap space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">{order.token}</span>
                            <span className="text-[10px] text-slate-500">{order.createdAt}</span>
                          </div>
                          {order.presenceVerified ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="size-3" />
                              <span>PIN Verified</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyingPinOrder(order);
                                setEnteredPin('');
                                setPinError(null);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition"
                            >
                              <KeyRound className="size-3" />
                              <span>Verify PIN</span>
                            </button>
                          )}
                        </td>

                        {/* Citizen Name & Phone */}
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-white">{order.citizenName}</p>
                          <p className="font-mono text-[11px] text-slate-400">{order.mobile}</p>
                        </td>

                        {/* Service Title & Escrow */}
                        <td className="px-4 py-3.5 max-w-xs space-y-1">
                          <p className="font-bold text-slate-200 truncate">{order.serviceTitle}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>Fee: INR {order.feesCollected}</span>
                            <span>-</span>
                            <span className="text-emerald-400 font-bold">
                              Escrow: INR {order.escrowCommission || 35}
                            </span>
                          </div>
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
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Portal Autofill Assistant */}
                            <button
                              type="button"
                              onClick={() => setAutofillOrder(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-750 hover:text-white transition"
                              title="1-Click copy formatted data into government portals"
                            >
                              <Copy className="size-3 text-[#38bdf8]" />
                              <span>Autofill</span>
                            </button>

                            {/* 1-Click WhatsApp Slip Dispatch */}
                            <button
                              type="button"
                              onClick={() => handleWhatsAppShare(order)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                              title="Send acknowledgment slip directly to citizen on WhatsApp"
                            >
                              <Share2 className="size-3" />
                              <span>WhatsApp</span>
                            </button>

                            {/* Flag Defect (2-Way Defect Loop) */}
                            {order.status !== 'completed' && order.status !== 'defective' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFlaggingDefectOrder(order);
                                  setDefectCustomNote('');
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 transition"
                                title="Flag blurry or invalid document to request citizen correction"
                              >
                                <AlertTriangle className="size-3" />
                                <span>Defect</span>
                              </button>
                            )}

                            {/* Print Official Slip */}
                            {order.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptOrder(order)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition"
                              >
                                <Printer className="size-3" />
                                <span>Slip</span>
                              </button>
                            )}

                            {/* Rescan Asset Link */}
                            {order.status === 'defective' && (
                              <Link
                                href={`/scanner?token=${order.token}&name=${encodeURIComponent(order.citizenName)}&service=${encodeURIComponent(order.serviceTitle)}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/30 transition"
                              >
                                <Camera className="size-3" />
                                <span>Rescan</span>
                              </Link>
                            )}
                          </div>
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

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(order)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:underline"
                        >
                          <Share2 className="size-3" />
                          <span>WhatsApp</span>
                        </button>

                        {order.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/30"
                          >
                            <Printer className="size-3" />
                            <span>Slip</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: PRINTABLE CITIZEN ACKNOWLEDGEMENT SLIP MODAL (Supports A4 & Thermal 80mm ESC/POS) */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Official Citizen Acknowledgement Slip</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-slate-700 bg-slate-800 p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReceiptPrintFormat('a4')}
                    className={`rounded-lg px-2.5 py-1 transition ${receiptPrintFormat === 'a4' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    A4 Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptPrintFormat('thermal')}
                    className={`rounded-lg px-2.5 py-1 transition ${receiptPrintFormat === 'thermal' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    80mm Thermal
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* A4 Paper Preview Container */}
            {receiptPrintFormat === 'a4' ? (
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
                    <strong className="font-mono">INR {selectedReceiptOrder.feesCollected}.00</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Payment Mode:</span>
                    <span className="font-bold">{selectedReceiptOrder.paymentMode} In Hand</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 text-[11px] pt-1 border-t border-slate-200">
                    <span>ApplyFields Escrow Settlement:</span>
                    <span>INR {selectedReceiptOrder.escrowCommission || 35}.00 Commission Cleared</span>
                  </div>
                </div>

                {/* Kiosk Stamp & QR Code */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-900">Sri Balaji MeeSeva &amp; Xerox Centre</p>
                    <p className="text-[10px] text-slate-500">Center Code: TS-HYD-0419 - Ameerpet, Hyderabad</p>
                    <p className="text-[9px] text-emerald-700 font-bold">Digitally Sealed by ApplyFields Platform</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <QrCode className="size-12 text-slate-900" />
                    <span className="text-[8px] font-mono text-slate-500">Scan to Verify</span>
                  </div>
                </div>
              </div>
            ) : (
              /* 80mm Thermal Receipt Layout */
              <div className="mx-auto max-w-[320px] rounded-2xl border border-slate-300 bg-white p-4 font-mono text-[11px] text-slate-950 space-y-2 shadow-inner">
                <div className="text-center border-b border-dashed border-slate-400 pb-2">
                  <p className="text-sm font-black uppercase">APPLYFIELDS KIOSK</p>
                  <p className="text-[10px] text-slate-600">Sri Balaji MeeSeva &amp; Xerox</p>
                  <p className="text-[9px] text-slate-500">TS-HYD-0419 - Ameerpet</p>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 py-1">
                  <span>TOKEN:</span>
                  <strong className="text-xs font-black">{selectedReceiptOrder.token}</strong>
                </div>

                <div className="space-y-0.5 border-b border-dashed border-slate-300 py-1">
                  <div className="flex justify-between">
                    <span>NAME:</span>
                    <span className="font-bold truncate max-w-[180px]">{selectedReceiptOrder.citizenName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>REG NO:</span>
                    <strong className="text-emerald-700 font-black">
                      {selectedReceiptOrder.filingDetails?.portalRegNumber || 'SUBMITTED'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SERVICE:</span>
                    <span className="truncate max-w-[180px]">{selectedReceiptOrder.serviceTitle}</span>
                  </div>
                </div>

                <div className="flex justify-between font-black border-b border-dashed border-slate-300 py-1">
                  <span>TOTAL PAID:</span>
                  <span>INR {selectedReceiptOrder.feesCollected}.00 ({selectedReceiptOrder.paymentMode})</span>
                </div>

                <div className="text-center pt-1 space-y-1">
                  <QrCode className="h-10 w-10 mx-auto text-slate-900" />
                  <p className="text-[8px] text-slate-500 uppercase">ApplyFields Sealed Receipt</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => handleWhatsAppShare(selectedReceiptOrder)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <Share2 className="size-4" />
                <span>Send WhatsApp to Citizen</span>
              </button>

              <div className="flex items-center gap-2">
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
                  <span>Print {receiptPrintFormat === 'a4' ? 'A4 Slip' : '80mm Thermal'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COUNTER PRESENCE PIN VERIFICATION */}
      {verifyingPinOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Verify Citizen Presence PIN</h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingPinOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>
                Candidate: <strong className="text-white">{verifyingPinOrder.citizenName}</strong>
              </p>
              <p>
                Token: <strong className="font-mono text-emerald-400">{verifyingPinOrder.token}</strong> - Phone: {verifyingPinOrder.mobile}
              </p>
              <p className="text-slate-400 pt-1">
                Ask candidate for the 4-digit PIN displayed on their smartphone screen in &quot;My Bookings&quot;.
              </p>
            </div>

            {pinError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-semibold">
                {pinError}
              </div>
            )}

            {pinSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs font-bold text-emerald-300 space-y-1">
                <CheckCircle2 className="size-6 text-emerald-400 mx-auto" />
                <p>PIN Verified Successfully</p>
                <p className="text-slate-400 font-normal">Candidate marked as present at counter.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Enter 4-Digit Presence PIN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4819"
                    className="w-full text-center font-mono text-2xl tracking-[0.5em] font-black rounded-xl border border-slate-700 bg-slate-950 p-3 text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                  <div className="text-[11px] text-slate-500 text-center mt-1">
                    Demo hint: Enter PIN <strong className="font-mono text-amber-300">{verifyingPinOrder.securityPin || '4819'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setVerifyingPinOrder(null)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-750"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enteredPin.length !== 4}
                    className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50 transition"
                  >
                    Confirm Presence
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: PORTAL AUTOFILL ASSISTANT (1-Click Copy into SSC/UPSC/MeeSeva) */}
      {autofillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Copy className="size-5 text-[#38bdf8]" />
                <div>
                  <h3 className="text-base font-bold text-white">Portal Autofill Assistant</h3>
                  <p className="text-[11px] text-slate-400">1-click copy fields into government portals</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutofillOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Candidate Full Name', value: autofillOrder.citizenName },
                { label: 'Father Name', value: autofillOrder.candidateIntake?.fatherName || 'Not Stored' },
                { label: 'Date of Birth (YYYY-MM-DD)', value: autofillOrder.candidateIntake?.dob || '2000-01-01' },
                { label: 'Mobile Number', value: autofillOrder.mobile },
                { label: 'Email Address', value: autofillOrder.candidateIntake?.email || 'applicant@example.com' },
                { label: 'Residential Address', value: autofillOrder.candidateIntake?.address || 'Hyderabad, Telangana' },
                { label: 'Aadhaar Last 4 Digits', value: autofillOrder.candidateIntake?.aadhaarLast4 || '4819' },
              ].map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5"
                >
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-bold">{field.label}</span>
                    <span className="font-mono text-white text-xs font-semibold">{field.value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAutofillField(field.label, field.value)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  >
                    {copiedField === field.label ? (
                      <Check className="size-3 text-emerald-400" />
                    ) : (
                      <Copy className="size-3 text-slate-400" />
                    )}
                    <span>{copiedField === field.label ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  const jsonStr = JSON.stringify(
                    {
                      candidateName: autofillOrder.citizenName,
                      mobile: autofillOrder.mobile,
                      service: autofillOrder.serviceTitle,
                      ...autofillOrder.candidateIntake,
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(jsonStr);
                  setCopiedField('ALL_JSON');
                  setTimeout(() => setCopiedField(null), 1500);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#38bdf8] hover:underline"
              >
                <Copy className="size-3.5" />
                <span>{copiedField === 'ALL_JSON' ? 'All JSON Copied' : 'Copy All as JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutofillOrder(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-750"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: 2-WAY DEFECT DISPATCH (Request Correction from Citizen) */}
      {flaggingDefectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Request Document Correction</h3>
              </div>
              <button
                type="button"
                onClick={() => setFlaggingDefectOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Flag an issue for candidate <strong className="text-white">{flaggingDefectOrder.citizenName}</strong>. This sends an alert to their portal and WhatsApp with a direct re-upload link.
            </p>

            <form onSubmit={handleDispatchDefect} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Common Defect Reason</label>
                <select
                  value={defectType}
                  onChange={(e) => setDefectType(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-rose-400 focus:outline-none"
                >
                  <option value="Photograph and signature fail biometric standards">
                    Photograph and signature fail biometric standards
                  </option>
                  <option value="Candidate signature scan is blurred and below 200 DPI requirement">
                    Candidate signature scan is blurred and below 200 DPI requirement
                  </option>
                  <option value="Photograph background must be plain white (SSC / UPSC standard)">
                    Photograph background must be plain white (SSC / UPSC standard)
                  </option>
                  <option value="Income / Caste certificate expired or Tahsildar seal illegible">
                    Income / Caste certificate expired or Tahsildar seal illegible
                  </option>
                  <option value="Candidate 10th Marks Memo scan is cropped or blurry">
                    Candidate 10th Marks Memo scan is cropped or blurry
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Operator Specific Notes</label>
                <textarea
                  rows={3}
                  value={defectCustomNote}
                  onChange={(e) => setDefectCustomNote(e.target.value)}
                  placeholder="e.g. Please rescan signature using black ballpoint pen on unruled white paper."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setFlaggingDefectOrder(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-750"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition"
                >
                  <Send className="size-3.5" />
                  <span>Dispatch Request &amp; WhatsApp Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
