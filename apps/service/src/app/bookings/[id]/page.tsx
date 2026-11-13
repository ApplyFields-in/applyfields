'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  Printer,
  Share2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ArrowLeft,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  getBookingById,
  getBookingSlipUrl,
  getBookingMessages,
  markBookingMessagesRead,
  sendBookingMessage,
} from '@/lib/api';

interface StoredBooking {
  id: string;
  token: string;
  candidateName: string;
  candidatePhone: string;
  slotDate: string;
  slotTime: string;
  status?: string;
  partner: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    title: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  total: number;
  intakeSummary?: string[];
  createdAt: string;
  officialAppNumber?: string | null;
  hasSlip?: boolean;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<StoredBooking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMsgText, setNewMsgText] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'citizen' | 'partner'; text: string; time: string }>>([
    {
      id: 'm1',
      sender: 'partner',
      text: 'Hello! Your appointment slot is confirmed. Please let us know if you have any questions before arriving.',
      time: '11:00 AM',
    },
  ]);

  // Live polling for booking messages when chat drawer is opened
  useEffect(() => {
    if (!isChatOpen || !booking?.id) return;
    let isMounted = true;

    async function fetchMessages() {
      try {
        const res = await getBookingMessages(booking!.id);
        if (res.data && res.data.length > 0 && isMounted) {
          const mapped = res.data.map((m) => ({
            id: m.id,
            sender: (m.sender_type === 'citizen' ? 'citizen' : 'partner') as 'citizen' | 'partner',
            text: m.message,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(mapped);
          markBookingMessagesRead(booking!.id, 'citizen').catch(() => {});
        }
      } catch (err) {
        console.warn('Could not load live messages:', err);
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isChatOpen, booking?.id]);

  async function handleSendCitizenMsg() {
    const text = newMsgText.trim();
    if (!text || !booking) return;

    const userMsg = {
      id: `c-${Date.now()}`,
      sender: 'citizen' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMsgText('');

    // Send to live Core API
    try {
      await sendBookingMessage(booking.id, {
        message: text,
        sender_type: 'citizen',
        sender_name: booking.candidateName || 'Citizen Applicant',
      });
    } catch (err) {
      console.warn('Could not send message to live API:', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadBooking() {
      if (typeof window === 'undefined' || !bookingId) return;

      // 1. First check localStorage for immediate cache
      let cached: StoredBooking | null = null;
      try {
        const raw = localStorage.getItem('applyfields_bookings_v1');
        if (raw) {
          const list: StoredBooking[] = JSON.parse(raw);
          const found = list.find((b) => b.id === bookingId || b.token === bookingId);
          if (found) {
            cached = found;
            if (mounted) setBooking(found);
          }
        }
      } catch {}

      // 2. If bookingId looks like a database UUID, fetch fresh details from API
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId);
      if (isUuid) {
        try {
          const res = await getBookingById(bookingId);
          if (mounted && res.data) {
            const apiBooking: StoredBooking = {
              id: res.data.id,
              token: `AF-${res.data.id.slice(0, 8).toUpperCase()}`,
              candidateName: cached?.candidateName || res.data.user_note?.match(/Applicant:\s*([^;]+)/)?.[1] || 'Citizen Applicant',
              candidatePhone: cached?.candidatePhone || '',
              slotDate: res.data.appointment_at
                ? new Date(res.data.appointment_at).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : cached?.slotDate || 'Time not set yet',
              slotTime: res.data.appointment_at
                ? new Date(res.data.appointment_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : cached?.slotTime || '',
              status: res.data.status,
              partner: {
                id: res.data.partner_id,
                name: res.data.partner_business_name,
                address: res.data.partner_address ?? '',
                city: '',
                district: '',
                phone: res.data.partner_phone || undefined,
                email: res.data.partner_email || undefined,
              },
              items: cached?.items || [
                {
                  title: res.data.service_name || 'Government / MeeSeva Facilitation Service',
                  price: (res.data.final_paise ?? res.data.quoted_paise ?? 0) / 100,
                  quantity: 1,
                  category: 'MeeSeva',
                },
              ],
              total: cached?.total ?? (res.data.final_paise ?? res.data.quoted_paise ?? 0) / 100,
              intakeSummary: cached?.intakeSummary,
              createdAt: res.data.created_at,
              officialAppNumber: res.data.official_app_number,
              hasSlip: res.data.has_acknowledgment_slip,
            };

            setBooking(apiBooking);
            return;
          }
        } catch (err) {
          console.warn('Could not fetch booking from API:', err);
        }
      }

      // 3. Neither cached nor found on the API: say so, never show a sample slip.
      if (!cached && mounted) setNotFound(true);
    }

    loadBooking();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  if (!booking && notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-[#526987] space-y-3">
        <p className="text-base font-bold text-[#082046]">We couldn&apos;t find this booking</p>
        <p className="text-sm">Check the link, or sign in to see your bookings.</p>
        <a href="/my-bookings" className="inline-block rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white">
          My bookings
        </a>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-[#526987]">
        <p className="text-sm">Loading appointment slip...</p>
      </div>
    );
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `ApplyFields Appointment Slip #${booking?.token}`,
        text: `My reserved appointment at ${booking?.partner.name} on ${booking?.slotDate} at ${booking?.slotTime}. Token #${booking?.token}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function createCalendarUrl() {
    const title = encodeURIComponent(`ApplyFields Center Appointment - ${booking?.partner.name}`);
    const details = encodeURIComponent(
      `Appointment Token: #${booking?.token}\nCenter: ${booking?.partner.name}\nAddress: ${booking?.partner.address}\nServices: ${booking?.items.map((i) => i.title).join(', ')}`,
    );
    const location = encodeURIComponent(`${booking?.partner.address}, ${booking?.partner.city}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-28">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526987] hover:text-[#082046] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Citizen Services
        </Link>
      </div>

      {/* Main Digital Appointment Token Slip */}
      <div className="cut-corner-card rounded-[32px] border border-white bg-white p-6 sm:p-8 space-y-6 shadow-clay-card">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#d5deea] pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className={`cut-corner-badge rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase ${
                booking.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                  : booking.status === 'in_progress'
                  ? 'bg-blue-100 text-[#0e7bf4] ring-1 ring-blue-300'
                  : booking.status === 'cancelled' || booking.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {booking.status === 'completed'
                  ? 'Service Completed & Delivered'
                  : booking.status === 'in_progress'
                  ? 'In Progress at Counter'
                  : booking.status === 'cancelled'
                  ? 'Booking Cancelled'
                  : booking.status === 'rejected'
                  ? 'Booking Declined'
                  : 'Confirmed & Slot Locked'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#082046] mt-0.5">
                Digital Appointment Token
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="cut-corner-btn inline-flex items-center gap-1.5 rounded-xl border border-[#d5deea] bg-white px-3 py-2 text-xs font-bold text-[#082046] hover:border-[#0e7bf4] shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5" /> {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="cut-corner-btn inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] shadow-clay-btn-azure"
            >
              <Printer className="h-3.5 w-3.5" /> Print Slip
            </button>
          </div>
        </div>

        {/* Big Token Number & QR Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center rounded-2xl border border-[#38bdf8]/40 bg-[#e0edfb] p-5">
          <div className="sm:col-span-2 space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0e7bf4]">
              Fast-Track Token Reference
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-[#082046] tracking-tight">
              #{booking.token}
            </div>
            <p className="text-xs text-[#526987] font-medium">
              Present this token or QR code at the center counter for zero-wait priority processing.
            </p>
          </div>

          {/* High-Res SVG QR Code */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white text-slate-950 shadow-sm border border-[#d5deea]">
            <div className="h-28 w-28 flex items-center justify-center p-1">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <rect width="100" height="100" fill="#ffffff" />
                <rect x="5" y="5" width="30" height="30" fill="#082046" />
                <rect x="10" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="15" width="10" height="10" fill="#082046" />
                
                <rect x="65" y="5" width="30" height="30" fill="#082046" />
                <rect x="70" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="75" y="15" width="10" height="10" fill="#082046" />

                <rect x="5" y="65" width="30" height="30" fill="#082046" />
                <rect x="10" y="70" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="75" width="10" height="10" fill="#082046" />
                
                <rect x="40" y="10" width="5" height="15" fill="#082046" />
                <rect x="50" y="25" width="10" height="5" fill="#082046" />
                <rect x="42" y="42" width="16" height="16" fill="#082046" />
                <rect x="65" y="45" width="8" height="8" fill="#082046" />
                <rect x="45" y="70" width="10" height="20" fill="#082046" />
                <rect x="70" y="70" width="20" height="10" fill="#082046" />
              </svg>
            </div>
            <span className="text-[9px] font-mono font-bold text-[#526987] mt-1 uppercase">
              Scan to Verify
            </span>
          </div>
        </div>

        {/* Filed on the official portal: application number + acknowledgment slip */}
        {booking.officialAppNumber && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Filed on the official portal
              </span>
              <div className="font-mono text-lg font-black text-[#082046] break-all">
                {booking.officialAppNumber}
              </div>
              <p className="text-[11px] text-emerald-900 font-medium">
                Official Application No. Keep it to track your application on the government portal.
              </p>
            </div>
            {booking.hasSlip && (
              <button
                type="button"
                onClick={async () => {
                  setSlipError(null);
                  const res = await getBookingSlipUrl(booking.id);
                  // Signed URL is sent as an attachment, so this downloads without leaving the page
                  // (window.open after an await gets popup-blocked).
                  if (res.data?.url) window.location.assign(res.data.url);
                  else setSlipError(res.error ?? 'Could not open the slip.');
                }}
                className="cut-corner-btn inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" /> Download Acknowledgment Slip
              </button>
            )}
            {slipError && <p className="text-[11px] font-bold text-rose-700">{slipError}</p>}
          </div>
        )}

        {/* Appointment Grid Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl bg-[#edf2f8] p-4 space-y-2 shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]">
            <span className="text-[#526987] font-bold uppercase text-[10px]">
              Appointment Schedule
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0e7bf4]" />
                <span className="font-black text-[#082046] text-sm">{booking.slotDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span className="font-mono font-black text-emerald-700">{booking.slotTime}</span>
              </div>
            </div>
            <div className="pt-2">
              <a
                href={createCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0e7bf4] hover:underline"
              >
                + Add to Google Calendar <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-[#edf2f8] p-4 space-y-2 shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]">
            <span className="text-[#526987] font-bold uppercase text-[10px]">
              Verified Partner Center
            </span>
            <div className="space-y-1">
              <div className="font-black text-[#082046] text-sm">{booking.partner.name}</div>
              <div className="flex items-start gap-1.5 text-[#526987] font-medium">
                <MapPin className="h-4 w-4 text-[#0e7bf4] shrink-0 mt-0.5" />
                <span>{[booking.partner.address, booking.partner.city].filter(Boolean).join(', ')}</span>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-3">
              {booking.partner.phone && (
                <a
                  href={`tel:${booking.partner.phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#082046] hover:text-[#0e7bf4]"
                >
                  <Phone className="h-3 w-3 text-emerald-600" /> Call Center
                </a>
              )}
              {booking.partner.email && (
                <a
                  href={`mailto:${booking.partner.email}?subject=${encodeURIComponent(`Appointment ${booking.token}`)}&body=${encodeURIComponent(`Hello, I have an appointment (token ${booking.token}) at your centre.`)}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#082046] hover:text-[#0e7bf4]"
                >
                  <Mail className="h-3 w-3 text-[#0e7bf4]" /> Email centre
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Booked Services Summary */}
        <div className="rounded-2xl bg-white border border-[#d5deea] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#d5deea] pb-2">
            <span className="text-xs font-black text-[#082046]">Booked Services &amp; Estimated Total</span>
            <span className="font-mono text-sm font-black text-[#0e7bf4]">₹{booking.total}</span>
          </div>
          <div className="space-y-1.5">
            {booking.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-[#526987] font-medium">
                <span>{it.quantity}x {it.title}</span>
                <span className="font-mono text-[#082046] font-bold">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Intake Checklist of Original Physical Documents to Bring */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
          <h3 className="text-xs font-black text-amber-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-700" />
            Checklist of Physical Documents to Bring:
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900 font-medium">
            <li>Original physical Aadhaar Card (mandatory for identity verification or biometric token)</li>
            <li>2 passport-sized photographs (if your booking includes new PAN application)</li>
            <li>Original educational or transfer certificates (if applying for community/income certificates)</li>
            <li>Mobile phone carrying the SIM registered for OTP authentication</li>
          </ul>
        </div>

        {/* Operator Chat Desk 1-Click Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#38bdf8]/40 bg-[#e0edfb] p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-[#082046] flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[#0e7bf4]" /> Direct Communication Desk
            </span>
            <p className="text-[11px] text-[#526987] font-medium">
              Need to ask about parking, exact shop landmarks, custom paper, or update your arrival time?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="cut-corner-btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] transition shrink-0 shadow-clay-btn-azure"
            >
              <MessageSquare className="h-4 w-4" /> Open Live Chat Desk
            </button>
            {booking.partner.email && (
              <a
                href={`mailto:${booking.partner.email}?subject=${encodeURIComponent(`Appointment ${booking.token}`)}&body=${encodeURIComponent(`Hello, I hold appointment token ${booking.token} for ${booking.slotDate} ${booking.slotTime}.`)}`}
                className="cut-corner-btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d5deea] bg-white px-3.5 py-2 text-xs font-bold text-[#082046] hover:bg-slate-50 transition shrink-0 shadow-sm"
                title="Email the centre"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            )}

          </div>
        </div>
      </div>

      {/* Citizen <-> Partner Live Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082046]/50 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white bg-white shadow-2xl flex flex-col h-[520px] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#d5deea] bg-[#F8FAFC] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-[#082046]">{booking.partner.name}</h3>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Operator Online
                  </span>
                </div>
                <p className="text-[11px] text-[#526987]">
                  Appointment Token: <strong className="text-[#0e7bf4] font-mono">#{booking.token}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="flex items-center text-[#526987] hover:text-[#082046] text-xs font-bold p-1 rounded-lg hover:bg-[#edf2f8]"
              >
                <X className="size-3.5 inline mr-1" />
                <span>Close</span>
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F0F4F8]">
              {messages.map((msg) => {
                const isCitizen = msg.sender === 'citizen';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCitizen ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-[#7896bc] mb-0.5 px-1 font-semibold">
                      {isCitizen ? 'You' : booking.partner.name} · {msg.time}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs max-w-xs leading-relaxed shadow-sm ${
                        isCitizen
                          ? 'bg-[#0e7bf4] text-white font-medium rounded-tr-sm shadow-clay-btn-azure'
                          : 'bg-white text-[#082046] border border-[#d5deea] rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-[#d5deea] bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask operator (e.g. Please print on glossy 100 GSM paper)..."
                value={newMsgText}
                onChange={(e) => setNewMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendCitizenMsg();
                  }
                }}
                className="flex-1 rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-medium shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
              />
              <button
                type="button"
                onClick={handleSendCitizenMsg}
                className="cut-corner-btn rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] transition shadow-clay-btn-azure"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
