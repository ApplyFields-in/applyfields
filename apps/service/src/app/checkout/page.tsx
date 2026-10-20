'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  User,
  Phone,
  FileCheck2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';

const AVAILABLE_SLOTS = [
  { id: 'slot-1', time: '09:30 AM – 10:00 AM', remainingCapacity: 2, isAvailable: true },
  { id: 'slot-2', time: '10:30 AM – 11:00 AM', remainingCapacity: 1, isAvailable: true },
  { id: 'slot-3', time: '11:30 AM – 12:00 PM', remainingCapacity: 0, isAvailable: false },
  { id: 'slot-4', time: '02:00 PM – 02:30 PM', remainingCapacity: 2, isAvailable: true },
  { id: 'slot-5', time: '03:00 PM – 03:30 PM', remainingCapacity: 2, isAvailable: true },
  { id: 'slot-6', time: '04:30 PM – 05:00 PM', remainingCapacity: 1, isAvailable: true },
  { id: 'slot-7', time: '05:30 PM – 06:00 PM', remainingCapacity: 2, isAvailable: true },
];

export default function CheckoutPage() {
  const { items, partner, subtotal, totalQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState('2026-10-19');
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM – 11:00 AM');
  const [candidateName, setCandidateName] = useState(user?.full_name || 'Arvind Kumar');
  const [candidatePhone, setCandidatePhone] = useState(user?.phone || '+91 98765 43210');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<'counter' | 'online'>('online');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    token: string;
    slotTime: string;
    slotDate: string;
    total: number;
  } | null>(null);

  if (items.length === 0 && !confirmedBooking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Your visit cart is empty</h2>
        <p className="text-xs text-slate-400">
          Please select services from a verified partner center before booking a slot.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
          >
            ← Explore Centers &amp; Services
          </Link>
        </div>
      </div>
    );
  }

  function handleConfirmBooking() {
    if (!candidateName.trim() || !candidatePhone.trim()) {
      alert('Please provide your name and contact mobile number.');
      return;
    }
    if (!selectedSlot) {
      alert('Please pick an appointment time slot.');
      return;
    }

    setIsSubmitting(true);
    const token = `AF-${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmedBooking({
        token,
        slotTime: selectedSlot,
        slotDate: selectedDate,
        total: subtotal,
      });
      clearCart();
    }, 600);
  }

  // Booking Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20 p-8 text-center space-y-5 shadow-2xl backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              Appointment Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-2">
              Slot Reserved Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Your appointment token has been dispatched to <strong className="text-white">{candidatePhone}</strong> via SMS &amp; WhatsApp.
            </p>
          </div>

          {/* Token Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-3 max-w-md mx-auto text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Booking Reference</span>
              <span className="font-mono text-lg font-black text-cyan-400">#{confirmedBooking.token}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Date:</span>
                <span className="font-bold text-white">{confirmedBooking.slotDate}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Reserved Window:</span>
                <span className="font-bold text-emerald-400 font-mono">{confirmedBooking.slotTime}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Center:</span>
                <span className="font-bold text-white">{partner?.name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Amount:</span>
                <span className="font-mono font-black text-cyan-300">₹{confirmedBooking.total}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            Please show this booking token to the center operator on arrival. You will bypass standard walk-in queues.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
            >
              Book Another Service
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
            >
              Print Appointment Slip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          ← Return to Services
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
          Reserve Appointment Window
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Lock in your reserved time slot at <strong className="text-cyan-400">{partner?.name}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Form & Slot Selector */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Candidate Details */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              1. Candidate &amp; Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Mobile Number (+91) *</label>
                <input
                  type="text"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold text-xs mb-1">
                Special Instructions for Center (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Please keep color photo glossy sheet ready / Urgently required for scholarship..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400 text-xs"
              />
            </div>
          </div>

          {/* Step 2: Date & Available Slots */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                2. Select Date &amp; Arrival Slot
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                Live Capacity Calculated
              </span>
            </div>

            {/* Date Quick Switch */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedDate('2026-10-19')}
                className={`rounded-xl px-4 py-2 font-bold transition ${
                  selectedDate === '2026-10-19'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Today (19 Oct)
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate('2026-10-20')}
                className={`rounded-xl px-4 py-2 font-bold transition ${
                  selectedDate === '2026-10-20'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tomorrow (20 Oct)
              </button>
            </div>

            {/* Discrete Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {AVAILABLE_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs transition ${
                    !slot.isAvailable
                      ? 'border-slate-800/40 bg-slate-950/20 opacity-40 cursor-not-allowed'
                      : selectedSlot === slot.time
                      ? 'border-cyan-500 bg-cyan-500/10 text-white ring-1 ring-cyan-500'
                      : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono font-bold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    {slot.time}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      slot.isAvailable ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {slot.isAvailable ? `${slot.remainingCapacity} slots open` : 'Full'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Payment Method */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              3. Payment Preference
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                  paymentMode === 'online'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <input
                  type="radio"
                  name="payMode"
                  checked={paymentMode === 'online'}
                  onChange={() => setPaymentMode('online')}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-white">Pay Online (Instant Confirmation)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    UPI (Google Pay, PhonePe, Paytm), Net Banking, Cards. Zero convenience surcharge.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                  paymentMode === 'counter'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <input
                  type="radio"
                  name="payMode"
                  checked={paymentMode === 'counter'}
                  onChange={() => setPaymentMode('counter')}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-white">Pay at Center Counter</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pay directly in cash or UPI QR at the kiosk counter after job completion.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Visit Summary
            </h3>

            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between items-start text-xs">
                  <div>
                    <p className="font-bold text-white">{it.title}</p>
                    <p className="text-[10px] text-slate-400">Qty: {it.quantity} × ₹{it.price}</p>
                  </div>
                  <span className="font-mono font-bold text-cyan-300">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({totalQuantity} items):</span>
                <span className="font-mono text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Center Booking Convenience:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>Total Amount:</span>
                <span className="font-mono text-cyan-300 text-base">₹{subtotal}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 py-3.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-xl shadow-cyan-500/20 active:scale-95"
            >
              <span>{isSubmitting ? 'Confirming...' : 'Confirm & Reserve Slot'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
