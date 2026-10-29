'use client';

import { useState, useEffect } from 'react';
import {
  FileCheck2,
  Clock,
  Phone,
  MessageSquare,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Printer,
  Download,
  AlertCircle,
  User,
  Filter,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { listPartnerBookings, updatePartnerBookingStatus } from '@/lib/api';

export type BookingStatus = 'scheduled' | 'arrived' | 'completed' | 'cancelled';


export interface BookingDocument {
  name: string;
  kind: 'pdf' | 'image';
  size: string;
  previewUrl: string;
}

export interface CitizenBooking {
  id: string;
  token: string;
  citizenName: string;
  citizenPhone: string;
  serviceTitle: string;
  serviceCategory: string;
  fee: number;
  paymentMode: 'online' | 'pay_at_counter';
  isPaid: boolean;
  slotDate: string; // YYYY-MM-DD
  slotTime: string; // e.g. "10:30 AM - 11:00 AM"
  status: BookingStatus;
  notes?: string;
  documents: BookingDocument[];
  createdAt: string;
}

const INITIAL_SAMPLE_BOOKINGS: CitizenBooking[] = [
  {
    id: 'bk-101',
    token: 'AF-8821',
    citizenName: 'K. Sai Ramesh',
    citizenPhone: '+91 98480 22338',
    serviceTitle: 'SSC CGL 2026 Online Form Filing Assistance',
    serviceCategory: 'Exam Application',
    fee: 150,
    paymentMode: 'online',
    isPaid: true,
    slotDate: '2026-10-19',
    slotTime: '10:30 AM – 11:00 AM',
    status: 'scheduled',
    notes: 'Needs live webcam photo capture and exam zone preference set to Hyderabad.',
    documents: [
      { name: '10th_Memo_Ramesh.pdf', kind: 'pdf', size: '142 KB', previewUrl: '/sample-doc-1.pdf' },
      { name: 'Degree_Provisional_Certificate.pdf', kind: 'pdf', size: '280 KB', previewUrl: '/sample-doc-2.pdf' },
      { name: 'Candidate_Signature_Scan.jpg', kind: 'image', size: '48 KB', previewUrl: '/sample-sig.jpg' },
    ],
    createdAt: '2026-10-19T08:15:00Z',
  },
  {
    id: 'bk-102',
    token: 'AF-8822',
    citizenName: 'B. Ananya Rao',
    citizenPhone: '+91 99891 44552',
    serviceTitle: 'High-Quality Aadhaar PVC Smart Card Print',
    serviceCategory: 'Aadhaar Services',
    fee: 50,
    paymentMode: 'online',
    isPaid: true,
    slotDate: '2026-10-19',
    slotTime: '11:15 AM – 11:45 AM',
    status: 'arrived',
    notes: 'Customer is waiting at counter #1.',
    documents: [
      { name: 'eAadhaar_Password_Protected.pdf', kind: 'pdf', size: '410 KB', previewUrl: '/sample-aadhaar.pdf' },
    ],
    createdAt: '2026-10-19T09:00:00Z',
  },
  {
    id: 'bk-103',
    token: 'AF-8823',
    citizenName: 'Mohammed Zeeshan',
    citizenPhone: '+91 97005 11223',
    serviceTitle: 'Integrated Income Certificate Application Filing',
    serviceCategory: 'MeeSeva / Revenue',
    fee: 100,
    paymentMode: 'pay_at_counter',
    isPaid: false,
    slotDate: '2026-10-19',
    slotTime: '02:00 PM – 02:30 PM',
    status: 'scheduled',
    notes: 'Urgent for state scholarship fee reimbursement deadline.',
    documents: [
      { name: 'White_Ration_Card_Scan.pdf', kind: 'pdf', size: '320 KB', previewUrl: '/sample-ration.pdf' },
      { name: 'Aadhaar_Front_Back.pdf', kind: 'pdf', size: '190 KB', previewUrl: '/sample-aadhaar-2.pdf' },
    ],
    createdAt: '2026-10-19T09:30:00Z',
  },
  {
    id: 'bk-104',
    token: 'AF-8824',
    citizenName: 'P. Sandhya Rani',
    citizenPhone: '+91 91212 99881',
    serviceTitle: 'Color Xerox & Spiral Project Binding (80 Pages)',
    serviceCategory: 'Xerox & Print Desk',
    fee: 120,
    paymentMode: 'online',
    isPaid: true,
    slotDate: '2026-10-19',
    slotTime: '04:00 PM – 04:30 PM',
    status: 'scheduled',
    notes: 'Color cover page with plastic glossy sheet binding.',
    documents: [
      { name: 'Final_Year_ECE_Project_Report.pdf', kind: 'pdf', size: '3.4 MB', previewUrl: '/sample-project.pdf' },
    ],
    createdAt: '2026-10-19T10:00:00Z',
  },
  {
    id: 'bk-105',
    token: 'AF-8799',
    citizenName: 'V. Naresh Kumar',
    citizenPhone: '+91 94401 77665',
    serviceTitle: 'New Physical NSDL PAN Card Application',
    serviceCategory: 'PAN Card Desk',
    fee: 150,
    paymentMode: 'online',
    isPaid: true,
    slotDate: '2026-10-18',
    slotTime: '03:00 PM – 03:30 PM',
    status: 'completed',
    notes: 'Application submitted successfully. Acknowledgment #PAN-9941 handed over.',
    documents: [
      { name: 'Aadhaar_Card_Naresh.pdf', kind: 'pdf', size: '210 KB', previewUrl: '/sample-pan-docs.pdf' },
    ],
    createdAt: '2026-10-18T11:00:00Z',
  },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<CitizenBooking[]>(INITIAL_SAMPLE_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed' | 'cancelled'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<BookingDocument | null>(null);
  const [viewingCitizen, setViewingCitizen] = useState<string>('');

  // Complete Receipt Modal
  const [completingBooking, setCompletingBooking] = useState<CitizenBooking | null>(null);
  const [completionAckNumber, setCompletionAckNumber] = useState('');

  // Split-Screen Form-Filling Assistant Modal
  const [fillingBooking, setFillingBooking] = useState<CitizenBooking | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copyField(fieldKey: string, val: string) {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(val);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1800);
    }
  }

  // Load live bookings from API on mount, with fallback to saved or sample bookings
  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await listPartnerBookings();
        if (res.data?.items && res.data.items.length > 0) {
          const mapped: CitizenBooking[] = res.data.items.map((b) => ({
            id: b.id,
            token: `AF-${b.id.slice(0, 4).toUpperCase()}`,
            citizenName:
              b.user_note?.split(';')[0]?.replace(/^(Name|Applicant):\s*/i, '').trim() ||
              'Citizen Applicant',
            citizenPhone: b.partner_phone || '—',
            serviceTitle: b.service_name || 'Citizen Application Service',
            serviceCategory: 'Assistance Filing',
            fee: (b.quoted_paise ?? b.final_paise ?? 10000) / 100,
            paymentMode: 'online',
            isPaid: b.status === 'completed' || b.status === 'accepted',
            slotDate: b.appointment_at ? b.appointment_at.slice(0, 10) : 'Today',
            slotTime: b.appointment_at
              ? new Date(b.appointment_at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Flexible',
            status: (b.status === 'in_progress'
              ? 'arrived'
              : b.status === 'accepted'
                ? 'scheduled'
                : b.status === 'new'
                  ? 'scheduled'
                  : b.status) as BookingStatus,
            notes: b.user_note || undefined,
            documents: [],
            createdAt: b.created_at,
          }));
          setBookings(mapped);
          return;
        }
      } catch {}

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('applyfields_partner_bookings_v1');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBookings(parsed);
            }
          } catch {}
        }
      }
    }

    loadBookings();
  }, []);

  function saveAndPersist(updated: CitizenBooking[]) {
    setBookings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('applyfields_partner_bookings_v1', JSON.stringify(updated));
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // 1-Click Action: Mark Arrived
  function handleMarkArrived(id: string) {
    const updated = bookings.map((b) => (b.id === id ? { ...b, status: 'arrived' as BookingStatus } : b));
    saveAndPersist(updated);
    updatePartnerBookingStatus(id, {
      status: 'in_progress',
      partner_note: 'Citizen arrived at counter',
    }).catch(() => {});
    showToast('Citizen marked as Arrived at counter!');
  }

  // 1-Click Action: Mark Completed
  function handleConfirmComplete() {
    if (!completingBooking) return;
    const updated = bookings.map((b) =>
      b.id === completingBooking.id
        ? {
            ...b,
            status: 'completed' as BookingStatus,
            notes: completionAckNumber
              ? `${b.notes || ''} [Govt Ack #: ${completionAckNumber.trim()}]`
              : b.notes,
          }
        : b
    );
    saveAndPersist(updated);
    updatePartnerBookingStatus(completingBooking.id, {
      status: 'completed',
      partner_note: completionAckNumber ? `Govt Ack #: ${completionAckNumber.trim()}` : 'Completed at desk',
    }).catch(() => {});
    setCompletingBooking(null);
    setCompletionAckNumber('');
    showToast('Job marked Completed! Citizen receipt ready.');
  }

  // 1-Click Action: Cancel
  function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this citizen appointment?')) return;
    const updated = bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b));
    saveAndPersist(updated);
    updatePartnerBookingStatus(id, {
      status: 'cancelled',
      cancelled_reason: 'Cancelled by partner operator',
    }).catch(() => {});
    showToast('Booking cancelled.');
  }


  // Filter Bookings
  const todayStr = '2026-10-19'; // or dynamically new Date().toISOString().split('T')[0]
  const filteredBookings = bookings.filter((b) => {
    // Tab filter
    if (activeTab === 'today') {
      if (b.slotDate !== todayStr || b.status === 'completed' || b.status === 'cancelled') return false;
    } else if (activeTab === 'upcoming') {
      if (b.slotDate <= todayStr || b.status === 'completed' || b.status === 'cancelled') return false;
    } else if (activeTab === 'completed') {
      if (b.status !== 'completed') return false;
    } else if (activeTab === 'cancelled') {
      if (b.status !== 'cancelled') return false;
    }

    // Search query
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.citizenName.toLowerCase().includes(q) ||
      b.citizenPhone.includes(q) ||
      b.token.toLowerCase().includes(q) ||
      b.serviceTitle.toLowerCase().includes(q);

    return matchesSearch;
  });

  const todayCount = bookings.filter(
    (b) => b.slotDate === todayStr && b.status !== 'completed' && b.status !== 'cancelled'
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-slate-900/95 px-5 py-3 text-sm font-semibold text-cyan-400 shadow-2xl shadow-cyan-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Citizen Booking &amp; Walk-in Execution Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bookings Execution Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time queue of scheduled appointments from <span className="text-cyan-400 font-mono">service.applyfields.in</span> with pre-filled forms and uploaded documents.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'today'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>Today&apos;s Reserved Visits</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              activeTab === 'today' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {todayCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'upcoming'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Upcoming Bookings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'completed'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Completed &amp; Delivered
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cancelled')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'cancelled'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Cancelled / No Show
        </button>
      </div>

      {/* Bookings Queue Cards */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'today'
              ? 'No more pending bookings scheduled for today. New reservations from citizens will appear automatically.'
              : 'No appointments listed under this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className={`rounded-3xl border p-6 transition-all ${
                booking.status === 'arrived'
                  ? 'border-emerald-500/50 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 ring-1 ring-emerald-500/30'
                  : booking.status === 'completed'
                  ? 'border-slate-800/70 bg-slate-950/60 opacity-80'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left: Time & Citizen Info */}
                <div className="space-y-3">
                  {/* Status & Slot Time Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
                      <Clock className="h-3.5 w-3.5" />
                      {booking.slotTime}
                    </span>

                    {booking.status === 'arrived' && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                        Arrived at Counter
                      </span>
                    )}

                    {booking.status === 'scheduled' && (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        Scheduled Visit
                      </span>
                    )}

                    {booking.status === 'completed' && (
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                        Completed
                      </span>
                    )}

                    {booking.status === 'cancelled' && (
                      <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-400">
                        Cancelled
                      </span>
                    )}

                    <span className="font-mono text-xs text-slate-500">#{booking.token}</span>
                  </div>

                  {/* Citizen Name & Phone */}
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <User className="h-4 w-4 text-cyan-400" />
                      {booking.citizenName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                      <span>{booking.citizenPhone}</span>
                      <a
                        href={`tel:${booking.citizenPhone}`}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans font-semibold"
                      >
                        <Phone className="h-3 w-3" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${booking.citizenPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-sans font-semibold"
                      >
                        <MessageSquare className="h-3 w-3" /> WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Booked Service & Payment Status */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-bold text-white">{booking.serviceTitle}</span>
                      <span className="font-mono font-black text-cyan-300 text-sm">₹{booking.fee}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Category: {booking.serviceCategory}</span>
                      <span
                        className={`font-semibold ${
                          booking.isPaid ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {booking.isPaid ? 'Paid Online' : 'Pay ₹' + booking.fee + ' at Center'}
                      </span>
                    </div>
                    {booking.notes && (
                      <p className="text-[11px] text-slate-400/90 pt-1 border-t border-slate-800/80 italic">
                        &quot;{booking.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Uploaded Files & Operator Actions */}
                <div className="space-y-4 lg:w-96 shrink-0">
                  {/* Uploaded Documents Box */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Attached Citizen Documents ({booking.documents.length})</span>
                      <span className="text-[10px] text-cyan-400 font-mono">1-Click Preview</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {booking.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/80 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-cyan-400 font-bold text-[10px] uppercase">
                              {doc.kind}
                            </span>
                            <span className="truncate text-slate-200 font-medium text-[11px]">
                              {doc.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingDoc(doc);
                                setViewingCitizen(booking.citizenName);
                              }}
                              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                              title="Preview Document"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Sending "${doc.name}" directly to connected counter printer...`);
                              }}
                              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 transition"
                              title="1-Click Print"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {booking.status !== 'arrived' && (
                        <button
                          type="button"
                          onClick={() => handleMarkArrived(booking.id)}
                          className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition text-center shadow-md shadow-emerald-500/20"
                        >
                          Mark Arrived
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setFillingBooking(booking)}
                        className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 transition text-center shadow-sm"
                        title="Open Split-Screen Form Assistant"
                      >
                        Form Assistant
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompletingBooking(booking)}
                        className="flex-1 rounded-xl bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition text-center shadow-md shadow-cyan-500/20"
                      >
                        Complete &amp; Receipt
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancel(booking.id)}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                        title="Cancel appointment"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-cyan-400" />
                  {viewingDoc.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uploaded by: <span className="text-white font-medium">{viewingCitizen}</span> · {viewingDoc.size}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                Close
              </button>
            </div>

            {/* Document Render Simulation */}
            <div className="h-80 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                <FileCheck2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{viewingDoc.name}</p>
                <p className="text-xs text-slate-400">
                  Verified UIDAI / Education Department format · Ready for 1-Click Print
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500 font-mono">Status: Verified clean scan</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => alert(`Printing ${viewingDoc.name}...`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-300"
                >
                  <Printer className="h-4 w-4" /> Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion & Acknowledgment Slip Modal */}
      {completingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Complete Booking &amp; Issue Receipt</h3>
              <p className="text-xs text-slate-300">
                Candidate: <strong className="text-white">{completingBooking.citizenName}</strong> · {completingBooking.serviceTitle}
              </p>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Official Portal Application / Acknowledgment Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SSC-2026-991204 or MeeSeva App ID..."
                  value={completionAckNumber}
                  onChange={(e) => setCompletionAckNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This will be sent to the citizen’s mobile / WhatsApp as proof of submission.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCompletingBooking(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
              >
                Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split-Screen Form-Filling Assistant Modal */}
      {fillingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-cyan-400/10 px-2.5 py-0.5 text-xs font-bold text-cyan-300 font-mono">
                    #{fillingBooking.token}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Split-Screen Form-Filling Assistant
                  </h3>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Vault 1-Click Copy Ready
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Citizen: <strong className="text-white">{fillingBooking.citizenName}</strong> · Service: {fillingBooking.serviceTitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = fillingBooking;
                    setFillingBooking(null);
                    setCompletingBooking(b);
                  }}
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-sm"
                >
                  Proceed to Complete &amp; Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setFillingBooking(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Split Screen Body */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
              {/* Left Column: Verified Profile & Document Vault (1-Click Copy) */}
              <div className="p-5 overflow-y-auto space-y-4 bg-slate-950/40">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Verified Candidate Vault &amp; Intake Data
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Click card to copy</span>
                </div>

                {/* 1-Click Copy Cards */}
                <div className="space-y-2">
                  {[
                    { label: 'Candidate Full Name', value: fillingBooking.citizenName, key: 'name' },
                    { label: 'Primary Contact Mobile', value: fillingBooking.citizenPhone, key: 'phone' },
                    { label: "Father's Full Name", value: 'Venkata Raman Kumar', key: 'father' },
                    { label: 'Date of Birth (DOB)', value: '1998-05-14', key: 'dob' },
                    { label: 'Gender', value: 'Male', key: 'gender' },
                    { label: 'Masked Aadhaar (UID)', value: 'XXXX-XXXX-8492', key: 'uid' },
                    { label: 'Domicile / Mandal', value: 'Serilingampally, Hyderabad, Telangana', key: 'domicile' },
                    { label: 'Special Instructions', value: fillingBooking.notes || 'None mentioned', key: 'notes' },
                  ].map((field) => {
                    const isCopied = copiedField === field.key;
                    return (
                      <div
                        key={field.key}
                        onClick={() => copyField(field.key, field.value)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isCopied
                            ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                            : 'border-slate-800 bg-slate-900/60 hover:border-cyan-400/60 hover:bg-slate-900'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            {field.label}
                          </span>
                          <span className="text-xs font-bold text-white font-mono block">
                            {field.value}
                          </span>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400 group-hover:text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Uploaded Documents List */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-cyan-400" /> Uploaded Document Scans ({fillingBooking.documents.length})
                  </span>
                  <div className="space-y-1.5">
                    {fillingBooking.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs"
                      >
                        <span className="text-slate-200 truncate max-w-[200px]">{doc.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingDoc(doc);
                              setViewingCitizen(fillingBooking.citizenName);
                            }}
                            className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-cyan-400 hover:bg-slate-700"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => alert(`Sending ${doc.name} to connected printer...`)}
                            className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            Print
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Official Government Portal Quick Launch */}
              <div className="p-5 overflow-y-auto space-y-4 bg-slate-900/30">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <ExternalLink className="h-4 w-4 text-cyan-400" />
                    Official Government Application Gateways
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Authorized Channels</span>
                </div>

                <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-3 text-[11px] text-slate-300 leading-relaxed">
                  <strong>Operator Directive:</strong> Use the 1-click copy cards on the left to paste student data into the official government portal. Complete application, pay government fee if needed, and paste the generated acknowledgment number to conclude the booking.
                </div>

                {/* Gateway Cards */}
                <div className="space-y-2.5">
                  {[
                    {
                      title: 'Staff Selection Commission (SSC)',
                      portalUrl: 'https://ssc.gov.in',
                      desc: 'Official candidate login & online application portal',
                      badge: 'Exam Applications',
                    },
                    {
                      title: 'MeeSeva Citizen Portal (Telangana / AP)',
                      portalUrl: 'https://meeseva.telangana.gov.in',
                      desc: 'Integrated Caste, Income, Residence & Revenue certificates',
                      badge: 'State Certificates',
                    },
                    {
                      title: 'UTIITSL PAN Card Services',
                      portalUrl: 'https://www.pan.utiitsl.com',
                      desc: 'Form 49A, e-PAN generation, and reprint lost card',
                      badge: 'Income Tax Dept',
                    },
                    {
                      title: 'UIDAI myAadhaar Portal',
                      portalUrl: 'https://myaadhaar.uidai.gov.in',
                      desc: 'Address update facilitation & PVC card order',
                      badge: 'UIDAI Official',
                    },
                    {
                      title: 'National Scholarship Portal (NSP)',
                      portalUrl: 'https://scholarships.gov.in',
                      desc: 'Pre-Matric, Post-Matric & Central Sector schemes',
                      badge: 'Scholarships',
                    },
                  ].map((gw, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{gw.title}</span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                          {gw.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{gw.desc}</p>
                      <div className="pt-1">
                        <a
                          href={gw.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-slate-700 hover:text-white transition"
                        >
                          Launch Official Portal <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
