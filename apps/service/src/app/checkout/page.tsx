'use client';

import React, { useState, useEffect } from 'react';
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
  Layers,
} from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { DynamicIntakeForm, type CombinedIntakePayload } from '@/components/intake/DynamicIntakeForm';
import { SlotPicker, type TimeSlot } from '@/components/slot-picker';
import { createBooking, shareBookingDocuments } from '@/lib/api';
import { ShareLockerDocuments } from '@/components/share-locker-documents';
import { trackServiceEvent } from '@/lib/analytics/tracker';

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
  // No pre-picked time: the centre's real open times load in the picker.
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [candidateName, setCandidateName] = useState(user?.full_name || '');
  const [candidatePhone, setCandidatePhone] = useState(user?.phone || '');
  const [intakePayload, setIntakePayload] = useState<CombinedIntakePayload>({});
  const [sharedDocIds, setSharedDocIds] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<'counter' | 'online'>('counter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (partner?.id) {
      trackServiceEvent('booking_slot_start', {
        entity_type: 'partner',
        entity_id: partner.id,
        metadata: { partner_name: partner.name, total_items: items.length, subtotal },
      });
    }
  }, [partner?.id, partner?.name, items.length, subtotal]);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-clay-card text-[#7896bc]">
          <ShoppingBag className="h-8 w-8 text-[#0e7bf4]" />
        </div>
        <h2 className="text-xl font-black text-[#082046]">Your visit cart is empty</h2>
        <p className="text-xs text-[#526987] font-medium">
          Please select services from a verified partner center before booking a slot.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="cut-corner-btn inline-flex items-center gap-2 rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0c6fdc] shadow-clay-btn-azure"
          >
            ← Explore Centers &amp; Services
          </Link>
        </div>
      </div>
    );
  }

  async function handleConfirmBooking() {
    setSubmitError(null);
    if (!candidateName.trim() || !candidatePhone.trim()) {
      setSubmitError('Please enter your name and mobile number.');
      return;
    }
    if (!selectedSlot) {
      setSubmitError('Please pick a time slot.');
      return;
    }

    // Check if partner has a valid database UUID
    const isUuid = !!partner?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(partner.id);
    if (!isUuid || !partner) {
      setSubmitError('Please choose a centre from the list before booking.');
      return;
    }

    setIsSubmitting(true);
    let token = '';
    let bookingRecordId = '';
    const cleanPhone = candidatePhone.replace(/\s+/g, '');

    // Formulate ISO appointment timestamp
    let appointmentAt: string | undefined = undefined;
    try {
      if (selectedDate && selectedSlot.startTime) {
        appointmentAt = new Date(`${selectedDate}T${selectedSlot.startTime}:00`).toISOString();
      }
    } catch {}

    if (isUuid && partner) {
      try {
        const firstService = items[0];
        const serviceUuid = firstService?.serviceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(firstService.serviceId)
          ? firstService.serviceId
          : undefined;

        const bookingRes = await createBooking({
          partner_id: partner.id,
          partner_service_id: serviceUuid,
          appointment_at: appointmentAt,
          contact_phone: cleanPhone,
          user_note: `Applicant: ${candidateName.trim()}; Contact: ${cleanPhone}; Services: ${items.map((it) => `${it.quantity}x ${it.title}`).join(', ')}; Intake: ${JSON.stringify(intakePayload)}`,
        });

        if (bookingRes.data?.id) {
          bookingRecordId = bookingRes.data.id;
          token = `AF-${bookingRes.data.id.slice(0, 8).toUpperCase()}`;
        } else {
          setSubmitError(bookingRes.error || 'The centre could not take this booking. Please try another time.');
        }
      } catch {
        setSubmitError('We could not reach the server. Please check your internet and try again.');
      }
    }

    // Never show a "confirmed" booking that the centre didn't receive.
    if (!bookingRecordId) {
      setIsSubmitting(false);
      return;
    }

    const newBooking = {
      id: bookingRecordId,
      token,
      candidateName: candidateName.trim(),
      candidatePhone: cleanPhone,
      slotDate: selectedDate,
      slotTime: selectedSlot.time,
      partner,
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

    trackServiceEvent('booking_slot_completed', {
      entity_type: 'service',
      entity_id: bookingRecordId,
      metadata: { token, partner_id: partner?.id, total: subtotal },
    });

    clearCart();
    // The booking exists either way; a failed share shows on the booking page as "no documents shared".
    if (sharedDocIds.length) await shareBookingDocuments(bookingRecordId, sharedDocIds).catch(() => null);

    setIsSubmitting(false);
    router.push(`/bookings/${bookingRecordId}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526987] hover:text-[#082046] transition"
        >
          ← Return to Services
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#082046] tracking-tight mt-2">
          Reserve Appointment Window
        </h1>
        <p className="text-xs text-[#526987] mt-1 font-medium">
          Lock in your reserved time slot at <strong className="text-[#0e7bf4]">{partner?.name}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Intake & Slot Reservation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Candidate Contact Info */}
          <div className="cut-corner-card rounded-[28px] border border-white bg-white p-6 space-y-4 shadow-clay-card">
            <h2 className="text-sm font-black text-[#082046] flex items-center gap-2">
              <User className="h-4 w-4 text-[#0e7bf4]" />
              1. Candidate &amp; Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#526987] font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2.5 text-[#082046] outline-none focus:border-[#0e7bf4] font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
                />
              </div>

              <div>
                <label className="block text-[#526987] font-bold mb-1">Mobile Number (+91) *</label>
                <input
                  type="text"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2.5 text-[#082046] outline-none focus:border-[#0e7bf4] font-mono font-bold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Dynamic Service Requirement Intake */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#082046] flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#0e7bf4]" />
                2. Dynamic Service Requirements Intake
              </h2>
              <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#0e7bf4] border border-[#38bdf8]/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Auto-Configured for Cart
              </span>
            </div>

            <DynamicIntakeForm
              items={items}
              onChange={(payload) => setIntakePayload(payload)}
            />
            <ShareLockerDocuments signedIn={Boolean(user)} selected={sharedDocIds} onChange={setSharedDocIds} />
          </div>

          {/* Step 3: Slot Reservation Engine */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-[#082046] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0e7bf4]" />
              3. Partner Reserved Time Slot
            </h2>

            <SlotPicker
              selectedDate={selectedDate}
              selectedSlotId={selectedSlot?.id || null}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null); // a time from another day isn't valid
              }}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              partnerName={partner?.name}
              partnerId={partner?.id}
            />
          </div>
        </div>

        {/* Right Column: Order Summary & Confirmation Box */}
        <div className="space-y-6">
          <div className="cut-corner-card rounded-[28px] border border-white bg-white p-6 space-y-5 sticky top-24 shadow-clay-card">
            <h2 className="text-sm font-black text-[#082046] flex items-center gap-2 border-b border-[#d5deea] pb-3">
              <ShoppingBag className="h-4 w-4 text-[#0e7bf4]" />
              Order &amp; Slot Summary
            </h2>

            {/* Partner Details */}
            {partner && (
              <div className="rounded-2xl bg-[#edf2f8] p-3.5 space-y-1 shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#526987]">
                  Selected Center
                </span>
                <div className="text-xs font-black text-[#082046]">{partner.name}</div>
                <div className="flex items-start gap-1.5 text-[11px] text-[#526987] pt-0.5 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-[#0e7bf4] shrink-0 mt-0.5" />
                  <span>{partner.address}, {partner.city}</span>
                </div>
              </div>
            )}

            {/* Reserved Slot Pill */}
            <div className="rounded-2xl border border-[#38bdf8]/40 bg-[#e0edfb] p-3.5 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0e7bf4]">
                Reserved Appointment Window
              </span>
              <div className="text-xs font-bold text-[#082046] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#0e7bf4]" /> {selectedDate}
              </div>
              <div className="text-xs font-mono font-black text-emerald-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" /> {selectedSlot?.time}
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-2 border-t border-[#d5deea] pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526987]">
                Selected Services ({totalQuantity})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs">
                    <span className="text-[#082046] truncate max-w-[170px] font-semibold">{it.quantity}x {it.title}</span>
                    <span className="font-mono text-[#0e7bf4] font-black">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 border-t border-[#d5deea] pt-3 text-xs">
              <div className="flex justify-between text-[#526987] font-medium">
                <span>Services Subtotal:</span>
                <span className="font-mono font-black text-[#082046]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#526987] font-medium">
                <span>Counter Priority Reservation:</span>
                <span className="text-emerald-700 font-bold uppercase text-[10px]">Free</span>
              </div>
              <div className="flex justify-between border-t border-[#d5deea] pt-2 text-sm font-black text-[#082046]">
                <span>Estimated Total:</span>
                <span className="font-mono text-[#0e7bf4] text-base">₹{subtotal}</span>
              </div>
            </div>

            {/* Payment Choice */}
            <div className="space-y-2 border-t border-[#d5deea] pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526987]">
                Payment Option
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMode('counter')}
                  className={`p-2.5 rounded-xl border text-center transition font-bold ${
                    paymentMode === 'counter'
                      ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#0e7bf4] shadow-sm'
                      : 'border-[#d5deea] bg-white text-[#526987] hover:border-[#0e7bf4]'
                  }`}
                >
                  Pay at Counter
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('online')}
                  className={`p-2.5 rounded-xl border text-center transition font-bold ${
                    paymentMode === 'online'
                      ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#0e7bf4] shadow-sm'
                      : 'border-[#d5deea] bg-white text-[#526987] hover:border-[#0e7bf4]'
                  }`}
                >
                  Pay Online (UPI)
                </button>
              </div>
            </div>

            {submitError && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {submitError}
              </p>
            )}

            {/* Confirm Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className="cut-corner-btn w-full rounded-2xl bg-[#0e7bf4] py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#0c6fdc] active:scale-[0.99] transition shadow-clay-btn-azure disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Reserving Slot...'
              ) : (
                <>
                  Confirm &amp; Lock Slot <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-[10px] text-[#526987] justify-center font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Prices are set by the centre · Pay at the counter</span>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
