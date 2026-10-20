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
  Printer,
  Share2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface StoredBooking {
  id: string;
  token: string;
  candidateName: string;
  candidatePhone: string;
  slotDate: string;
  slotTime: string;
  partner: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    phone?: string;
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
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<StoredBooking | null>(null);
  const [copied, setCopied] = useState(false);
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

  function handleSendCitizenMsg() {
    if (!newMsgText.trim()) return;
    const userMsg = {
      id: `c-${Date.now()}`,
      sender: 'citizen' as const,
      text: newMsgText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMsgText('');

    // Simulate instant operator reply after 1 second
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `p-${Date.now()}`,
          sender: 'partner' as const,
          text: 'Operator received: "Noted! We have updated your counter instructions and your documents are ready."',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && bookingId) {
      const raw = localStorage.getItem('applyfields_bookings_v1');
      if (raw) {
        try {
          const list: StoredBooking[] = JSON.parse(raw);
          const found = list.find((b) => b.id === bookingId || b.token === bookingId);
          if (found) {
            setBooking(found);
            return;
          }
        } catch {}
      }

      // Fallback default demo booking if accessed directly
      setBooking({
        id: bookingId,
        token: bookingId.startsWith('AF-') ? bookingId : `AF-HYD-${bookingId.slice(0, 5).toUpperCase()}`,
        candidateName: 'Arvind V. Kumar',
        candidatePhone: '+91 98765 43210',
        slotDate: '2026-10-22',
        slotTime: '11:00 AM – 11:30 AM',
        partner: {
          id: 'partner-1',
          name: 'Sri Sai MeeSeva & Digital Kiosk',
          address: 'Shop #4, Opp. Municipal Corporation, Gachibowli Main Rd',
          city: 'Hyderabad',
          district: 'Rangareddy',
          phone: '+91 98480 22334',
        },
        items: [
          { title: 'PAN Card New Application (Form 49A)', price: 107, quantity: 1, category: 'PAN Services' },
          { title: 'Aadhaar Biometric Facilitation Slot', price: 50, quantity: 1, category: 'Aadhaar Services' },
        ],
        total: 157,
        intakeSummary: [
          'Applicant: Arvind V. Kumar (Aadhaar Verified)',
          'Father: Venkata Raman Kumar',
          'DOB: 1998-05-14 · Gender: Male',
          'Document Vault: 1-Click Linked',
        ],
        createdAt: new Date().toISOString(),
      });
    }
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-slate-400">
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6 pb-28">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Citizen Services
        </Link>
      </div>

      {/* Main Digital Appointment Token Slip */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-300">
                Confirmed &amp; Slot Locked
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Digital Appointment Token
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700"
            >
              <Share2 className="h-3.5 w-3.5" /> {copied ? 'Link Copied!' : 'Share'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
            >
              <Printer className="h-3.5 w-3.5" /> Print Slip
            </button>
          </div>
        </div>

        {/* Big Token Number & QR Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5">
          <div className="sm:col-span-2 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              Fast-Track Token Reference
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-tight">
              #{booking.token}
            </div>
            <p className="text-xs text-slate-300">
              Present this token or QR code at the center counter for zero-wait priority processing.
            </p>
          </div>

          {/* Simulated High-Res SVG QR Code */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-950 shadow-md">
            <div className="h-28 w-28 flex items-center justify-center border border-slate-300 p-1">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <rect width="100" height="100" fill="#ffffff" />
                {/* QR corner patterns */}
                <rect x="5" y="5" width="30" height="30" fill="#020617" />
                <rect x="10" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="15" width="10" height="10" fill="#020617" />
                
                <rect x="65" y="5" width="30" height="30" fill="#020617" />
                <rect x="70" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="75" y="15" width="10" height="10" fill="#020617" />

                <rect x="5" y="65" width="30" height="30" fill="#020617" />
                <rect x="10" y="70" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="75" width="10" height="10" fill="#020617" />
                {/* Random bit matrix decoration */}
                <rect x="40" y="10" width="5" height="15" fill="#020617" />
                <rect x="50" y="25" width="10" height="5" fill="#020617" />
                <rect x="42" y="42" width="16" height="16" fill="#020617" />
                <rect x="65" y="45" width="8" height="8" fill="#020617" />
                <rect x="45" y="70" width="10" height="20" fill="#020617" />
                <rect x="70" y="70" width="20" height="10" fill="#020617" />
              </svg>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-600 mt-1 uppercase">
              Scan to Verify
            </span>
          </div>
        </div>

        {/* Appointment Grid Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">
              Appointment Schedule
            </span>
            <div className="space-y-1 text-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">{booking.slotDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="font-mono font-bold text-emerald-300">{booking.slotTime}</span>
              </div>
            </div>
            <div className="pt-2">
              <a
                href={createCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
              >
                + Add to Google Calendar <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">
              Verified Partner Center
            </span>
            <div className="space-y-1">
              <div className="font-bold text-white text-sm">{booking.partner.name}</div>
              <div className="flex items-start gap-1.5 text-slate-300">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{booking.partner.address}, {booking.partner.city}</span>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-3">
              {booking.partner.phone && (
                <a
                  href={`tel:${booking.partner.phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                >
                  <Phone className="h-3 w-3 text-emerald-400" /> Call Center
                </a>
              )}
              <a
                href={`https://wa.me/919848022334?text=Hello%2C%20I%20have%20an%20appointment%20token%20%23${booking.token}%20at%20your%20center`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <MessageSquare className="h-3 w-3" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Booked Services Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-white">Booked Services &amp; Estimated Total</span>
            <span className="font-mono text-sm font-black text-cyan-300">₹{booking.total}</span>
          </div>
          <div className="space-y-1.5">
            {booking.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                <span>{it.quantity}x {it.title}</span>
                <span className="font-mono text-slate-400">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Intake Checklist of Original Physical Documents to Bring */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            Checklist of Physical Documents to Bring:
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
            <li>Original physical Aadhaar Card (mandatory for identity verification or biometric token)</li>
            <li>2 passport-sized photographs (if your booking includes new PAN application)</li>
            <li>Original educational or transfer certificates (if applying for community/income certificates)</li>
            <li>Mobile phone carrying the SIM registered for OTP authentication</li>
          </ul>
        </div>

        {/* Operator Chat Desk 1-Click Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-cyan-800/40 bg-cyan-950/20 p-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Direct Communication Desk
            </span>
            <p className="text-[11px] text-slate-400">
              Need to ask about parking, exact shop landmarks, custom paper, or update your arrival time?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shrink-0 shadow-md shadow-cyan-500/20"
            >
              <MessageSquare className="h-4 w-4" /> Open Live Chat Desk
            </button>
            <a
              href={`https://wa.me/919848022334?text=Hello%20Operator%2C%20I%20hold%20appointment%20token%20%23${booking.token}%20for%20${booking.slotDate}%20at%20${booking.slotTime}.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition shrink-0"
              title="Chat on WhatsApp"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Citizen <-> Partner Live Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col h-[520px] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">{booking.partner.name}</h3>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Operator Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Appointment Token: <strong className="text-cyan-400 font-mono">#{booking.token}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
              {messages.map((msg) => {
                const isCitizen = msg.sender === 'citizen';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCitizen ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-500 mb-0.5 px-1">
                      {isCitizen ? 'You' : booking.partner.name} · {msg.time}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs max-w-xs leading-relaxed shadow-sm ${
                        isCitizen
                          ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-sm'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
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
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
              <button
                type="button"
                onClick={handleSendCitizenMsg}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
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
