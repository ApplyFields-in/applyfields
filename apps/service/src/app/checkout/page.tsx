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
  Layers,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { DynamicIntakeForm, type CombinedIntakePayload } from '@/components/intake/DynamicIntakeForm';
import { SlotPicker, type TimeSlot } from '@/components/slot-picker';

export default function CheckoutPage() {
  const { items, partner, subtotal, totalQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Selected date & slot
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>({
    id: 'slot-m3',
    time: '10:00 AM – 10:30 AM',
    startTime: '10:00',
    endTime: '10:30',
    period: 'morning',
    remainingCapacity: 3,
    totalCapacity: 3,
    isAvailable: true,
  });

  const [candidateName, setCandidateName] = useState(user?.full_name || 'Arvind V. Kumar');
  const [candidatePhone, setCandidatePhone] = useState(user?.phone || '+91 98765 43210');
  const [intakePayload, setIntakePayload] = useState<CombinedIntakePayload>({});
  const [paymentMode, setPaymentMode] = useState<'counter' | 'online'>('counter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
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
      alert('Please select an appointment time slot.');
      return;
    }

    setIsSubmitting(true);
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const token = `AF-HYD-${randomSuffix}`;

    const newBooking = {
      id: token,
      token,
      candidateName,
      candidatePhone,
      slotDate: selectedDate,
      slotTime: selectedSlot.time,
      partner: partner || {
        id: 'partner-1',
        name: 'Sri Sai MeeSeva & Digital Kiosk',
        address: 'Shop #4, Opp. Municipal Corporation, Gachibowli Main Rd',
        city: 'Hyderabad',
        district: 'Rangareddy',
        phone: '+91 98480 22334',
      },
      items: items.map((it) => ({
        title: it.title,
        price: it.price,
        quantity: it.quantity,
        category: it.category,
      })),
      total: subtotal,
      intakeData: intakePayload,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        const existingRaw = localStorage.getItem('applyfields_bookings_v1');
        const list = existingRaw ? JSON.parse(existingRaw) : [];
        list.unshift(newBooking);
        localStorage.setItem('applyfields_bookings_v1', JSON.stringify(list));
      } catch {}
    }

    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      router.push(`/bookings/${token}`);
    }, 600);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
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
        {/* Left Column: Intake & Slot Reservation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Candidate Contact Info */}
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
          </div>

          {/* Step 2: Dynamic Service Requirement Intake */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-cyan-400" />
                2. Dynamic Service Requirements Intake
              </h2>
              <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Auto-Configured for Cart
              </span>
            </div>

            <DynamicIntakeForm
              items={items}
              onChange={(payload) => setIntakePayload(payload)}
            />
          </div>

          {/* Step 3: Slot Reservation Engine */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              3. Partner Reserved Time Slot
            </h2>

            <SlotPicker
              selectedDate={selectedDate}
              selectedSlotId={selectedSlot?.id || null}
              onSelectDate={(date) => setSelectedDate(date)}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              partnerName={partner?.name}
            />
          </div>
        </div>

        {/* Right Column: Order Summary & Confirmation Box */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 space-y-5 sticky top-24 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShoppingBag className="h-4 w-4 text-cyan-400" />
              Order &amp; Slot Summary
            </h2>

            {/* Partner Details */}
            {partner && (
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Selected Center
                </span>
                <div className="text-xs font-bold text-white">{partner.name}</div>
                <div className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{partner.address}, {partner.city}</span>
                </div>
              </div>
            )}

            {/* Reserved Slot Pill */}
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Reserved Appointment Window
              </span>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" /> {selectedDate}
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-400" /> {selectedSlot?.time}
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Selected Services ({totalQuantity})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[170px]">{it.quantity}x {it.title}</span>
                    <span className="font-mono text-white font-medium">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Services Subtotal:</span>
                <span className="font-mono text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Counter Priority Reservation:</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px]">Free</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-extrabold text-white">
                <span>Estimated Total:</span>
                <span className="font-mono text-cyan-300">₹{subtotal}</span>
              </div>
            </div>

            {/* Payment Choice */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Payment Option
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMode('counter')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    paymentMode === 'counter'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Pay at Counter
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    paymentMode === 'online'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Pay Online (UPI)
                </button>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 hover:opacity-90 active:scale-[0.99] transition shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Reserving Slot...'
              ) : (
                <>
                  Confirm &amp; Lock Slot <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Official pricing verified · Guaranteed zero-wait counter token</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
