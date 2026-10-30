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
import { useAuth } from '@/lib/auth-context';
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
}

const DEFAULT_SEED_BOOKINGS: CitizenBookingItem[] = [
  {
    id: 'bk-8821',
    token: 'AF-HYD-8821',
    candidateName: 'Likhith Kumar',
    candidatePhone: '+91 98765 43210',
    slotDate: 'Today',
    slotTime: '10:30 AM - 11:00 AM',
    status: 'in_filing',
    securityPin: '4819',
    queuePosition: 2,
    estimatedWaitMinutes: 11,
    counterName: 'Counter 2 (Govt Recruitment Desk)',
    partner: {
      id: 'partner-1',
      name: 'Sri Sai MeeSeva & Digital Kiosk',
      address: 'Shop #4, Opp. Municipal Corporation, Gachibowli Main Rd',
      city: 'Hyderabad',
      district: 'Rangareddy',
      phone: '+91 98480 22334',
      googleMapsUrl: 'https://maps.google.com/?q=Gachibowli+Hyderabad',
    },
    items: [
      { title: 'SSC CGL 2026 Online Form Filing Assistance', price: 150, quantity: 1, category: 'Exam Application' },
      { title: 'Passport Photo Instant Crop & Print (Set of 8)', price: 60, quantity: 1, category: 'Photo & Printing' },
    ],
    total: 210,
    paymentMode: 'online',
    isPaid: true,
    requiredDocuments: ['Aadhaar Card (Original)', 'Degree Provisional Memo', 'Recent Passport Size Photo'],
    createdAt: '2026-10-30T09:15:00Z',
  },
  {
    id: 'bk-8824',
    token: 'AF-HYD-8824',
    candidateName: 'Likhith Kumar',
    candidatePhone: '+91 98765 43210',
    slotDate: 'Today',
    slotTime: '11:45 AM - 12:15 PM',
    status: 'defective',
    securityPin: '7302',
    queuePosition: 4,
    estimatedWaitMinutes: 24,
    counterName: 'Counter 1 (Revenue & MeeSeva Desk)',
    defectReason: 'Candidate signature scan is blurred and below 200 DPI requirement. Please upload a crisp black-ink signature scan.',
    partner: {
      id: 'partner-2',
      name: 'Sri Balaji Digital Seva & MeeSeva Hub',
      address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042, Ameerpet',
      city: 'Hyderabad',
      district: 'Hyderabad',
      phone: '+91 98480 12345',
      googleMapsUrl: 'https://maps.google.com/?q=Ameerpet+Metro+Hyderabad',
    },
    items: [
      { title: 'Telangana MeeSeva Income & Asset Certificate', price: 120, quantity: 1, category: 'MeeSeva Services' },
    ],
    total: 120,
    paymentMode: 'counter',
    isPaid: false,
    requiredDocuments: ['Ration Card / Food Security Card', 'Salary Slip / Income Affidavit', 'Applicant Signature Scan'],
    createdAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 'bk-7910',
    token: 'AF-HYD-7910',
    candidateName: 'Likhith Kumar',
    candidatePhone: '+91 98765 43210',
    slotDate: 'Yesterday',
    slotTime: '04:00 PM - 04:30 PM',
    status: 'completed',
    securityPin: '1920',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    counterName: 'Counter 3 (Card Printing Desk)',
    portalRegNumber: 'UIDAI-PVC-991823',
    partner: {
      id: 'partner-3',
      name: 'City Xerox & MeeSeva Hub',
      address: 'Near Old Bus Stand, Hanamkonda Main Road',
      city: 'Warangal',
      district: 'Warangal Urban',
      phone: '+91 98491 55667',
      googleMapsUrl: 'https://maps.google.com/?q=Warangal+Old+Bus+Stand',
    },
    items: [
      { title: 'High-Quality Aadhaar PVC Smart Card Print', price: 50, quantity: 1, category: 'Aadhaar Services' },
    ],
    total: 50,
    paymentMode: 'online',
    isPaid: true,
    requiredDocuments: ['Aadhaar Number / OTP or Virtual ID'],
    createdAt: '2026-10-29T15:30:00Z',
  },
];

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
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState(false);

  // Load from localStorage or initialize defaults
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem('applyfields_bookings_v1');
      if (raw) {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length > 0) {
          // Merge stored bookings with seed bookings ensuring unique tokens
          const storedTokens = new Set(stored.map((b: any) => b.token || b.id));
          const complementary = DEFAULT_SEED_BOOKINGS.filter((seed) => !storedTokens.has(seed.token));

          const mappedStored: CitizenBookingItem[] = stored.map((b: any, idx: number) => ({
            id: b.id || `bk-${idx}`,
            token: b.token || `AF-HYD-${7000 + idx}`,
            candidateName: b.candidateName || user?.full_name || 'Citizen User',
            candidatePhone: b.candidatePhone || user?.phone || '+91 98765 43210',
            slotDate: b.slotDate || 'Upcoming',
            slotTime: b.slotTime || '10:00 AM - 10:30 AM',
            status: (b.status as BookingStage) || 'in_filing',
            securityPin: b.securityPin || `${Math.floor(1000 + Math.random() * 9000)}`,
            queuePosition: typeof b.queuePosition === 'number' ? b.queuePosition : 1,
            estimatedWaitMinutes: typeof b.estimatedWaitMinutes === 'number' ? b.estimatedWaitMinutes : 8,
            counterName: b.counterName || 'Counter 1 (General Assistance)',
            partner: b.partner || DEFAULT_SEED_BOOKINGS[0].partner,
            items: b.items || [{ title: 'Citizen Government Service', price: b.total || 100, quantity: 1, category: 'Service' }],
            total: b.total || 100,
            paymentMode: b.paymentMode || 'counter',
            isPaid: b.isPaid ?? true,
            defectReason: b.defectReason,
            correctionUploaded: b.correctionUploaded ?? false,
            requiredDocuments: b.requiredDocuments || ['Aadhaar Card (Original)', 'Application Forms'],
            portalRegNumber: b.portalRegNumber,
            createdAt: b.createdAt || new Date().toISOString(),
          }));

          setBookings([...mappedStored, ...complementary]);
          return;
        }
      }
    } catch {}

    setBookings(DEFAULT_SEED_BOOKINGS);
  }, [user]);

  // Copy token helper
  function handleCopyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  // 1-Click WhatsApp Share formatted message (NO EMOJIS)
  function handleWhatsAppShare(b: CitizenBookingItem) {
    const textLines = [
      'ApplyFields Appointment Token Slip',
      `Token Number: ${b.token}`,
      `Security Presence PIN: ${b.securityPin}`,
      `Candidate: ${b.candidateName}`,
      `Slot: ${b.slotDate} (${b.slotTime})`,
      `Center: ${b.partner.name}`,
      `Address: ${b.partner.address}, ${b.partner.city}`,
      `Services: ${b.items.map((i) => i.title).join(', ')}`,
      `Total Fee: INR ${b.total}.00 (${b.isPaid ? 'Paid' : 'Pay at Counter'})`,
      `Required Documents: ${b.requiredDocuments.join(', ')}`,
      `Google Maps: ${b.partner.googleMapsUrl || 'https://maps.google.com'}`,
      `Digital Slip URL: https://service.applyfields.in/bookings/${b.id}`,
    ];

    const message = encodeURIComponent(textLines.join('\n'));
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  // Defect Loop: Upload replacement document
  function handleResolveCorrection(e: React.FormEvent) {
    e.preventDefault();
    if (!correctingBooking || !uploadFileName) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === correctingBooking.id
          ? {
              ...b,
              status: 'in_filing',
              defectReason: undefined,
              correctionUploaded: true,
            }
          : b
      )
    );

    setUploadSuccessMessage(true);
    setTimeout(() => {
      setUploadSuccessMessage(false);
      setCorrectingBooking(null);
      setUploadFileName('');
    }, 1200);
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
                </div>

                {/* Queue Position & Timing Estimator */}
                {!isCompleted && (
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
                          setUploadFileName('');
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
                    {/* 1-Click WhatsApp Share */}
                    <button
                      type="button"
                      onClick={() => handleWhatsAppShare(b)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                      title="Share token slip details on WhatsApp"
                    >
                      <Share2 className="h-3.5 w-3.5 text-[#0e7bf4]" />
                      <span>{t('shareWhatsApp')}</span>
                    </button>

                    {/* Chat with Center */}
                    <Link
                      href={`/bookings/${b.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#0e7bf4]" />
                      <span>Chat with Desk</span>
                    </Link>

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
                <h3 className="text-base font-bold text-[#082046]">Upload Corrected Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setCorrectingBooking(null)}
                className="rounded-xl p-1 text-slate-400 hover:text-[#082046]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 space-y-1">
              <span className="font-bold block uppercase text-[10px] text-rose-800">Operator Correction Request</span>
              <p className="leading-relaxed">{correctingBooking.defectReason}</p>
            </div>

            {uploadSuccessMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-xs font-bold text-emerald-800 space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-sm">Replacement Document Uploaded Successfully</p>
                <p className="text-emerald-700 font-normal">
                  Transmitted directly to operator workstation. Your application status is now back in filing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResolveCorrection} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-[#082046] mb-1.5">
                    Select Replacement Document (PDF, JPEG, or PNG)
                  </label>
                  <div className="relative rounded-2xl border-2 border-dashed border-[#d5deea] bg-slate-50/80 p-6 text-center hover:border-[#0e7bf4] transition cursor-pointer">
                    <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#082046]">
                      {uploadFileName ? uploadFileName : 'Click to browse or drop file here'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Max 2MB - 200+ DPI recommended
                    </p>
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadFileName(file.name);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
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
                    disabled={!uploadFileName}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c2f66] disabled:opacity-50 transition"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Submit to Operator</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
