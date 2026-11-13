'use client';

import type { BookingDetail, PartnerServiceDetail } from '@applyfields/types';
import { ArrowRight, Camera, Check, CreditCard, Layers, QrCode, Receipt, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createWalkIn, listPartnerBookings, listPartnerServices } from '@/lib/api';

const OTHER = 'other';
const token = (id: string) => `AF-${id.slice(0, 8).toUpperCase()}`;
const noteField = (note: string | null, key: string) =>
  note?.match(new RegExp(`${key}:\\s*([^;]+)`, 'i'))?.[1]?.trim() ?? '';
const isTodaysWalkIn = (b: BookingDetail) =>
  Boolean(b.user_note?.includes('Walk-in at counter')) &&
  new Date(b.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA');

/**
 * Walk-in counter. Each walk-in is saved as a real booking (POST /bookings/partner/walk-in):
 * in progress, already paid, so it appears in Bookings and — once completed — in Earnings.
 * Services come from the centre's own rate card; the operator confirms what was actually collected.
 */
export function CounterClient() {
  const router = useRouter();
  const [services, setServices] = useState<PartnerServiceDetail[] | null>(null);
  const [today, setToday] = useState<BookingDetail[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [citizenName, setCitizenName] = useState('');
  const [mobile, setMobile] = useState('');
  const [serviceId, setServiceId] = useState<string>('');
  const [otherName, setOtherName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<BookingDetail | null>(null);

  useEffect(() => {
    Promise.all([listPartnerServices(), listPartnerBookings()]).then(([svc, inbox]) => {
      if (svc.data) setServices(svc.data.filter((s) => s.is_active));
      else setLoadError(svc.error || 'Could not load your rate card.');
      if (inbox.data) setToday(inbox.data.items.filter(isTodaysWalkIn));
    });
  }, []);

  function pickService(id: string) {
    setServiceId(id);
    const svc = services?.find((s) => s.id === id);
    // Pre-fill with the centre's own charge; the operator adds any government fee collected.
    if (svc?.charge_paise != null) setAmount(String(svc.charge_paise / 100));
  }

  async function save(openScanner: boolean) {
    const phone = mobile.replace(/\D/g, '');
    const rupees = Number(amount);
    const svc = services?.find((s) => s.id === serviceId);
    const serviceName = serviceId === OTHER ? otherName.trim() : svc?.name ?? '';
    if (citizenName.trim().length < 2) return setFormError("Enter the citizen's full name.");
    if (phone && !/^[6-9]\d{9}$/.test(phone)) return setFormError('Enter a valid 10-digit mobile number, or leave it empty.');
    if (serviceName.length < 2) return setFormError('Pick a service, or choose Other and type it.');
    if (!amount.trim() || !Number.isFinite(rupees) || rupees < 0) return setFormError('Enter the amount collected (₹).');

    setSaving(true);
    setFormError(null);
    const res = await createWalkIn({
      citizen_name: citizenName.trim(),
      contact_phone: phone || undefined,
      partner_service_id: svc ? svc.id : undefined,
      service_name: serviceName,
      amount_paise: Math.round(rupees * 100),
      payment_mode: paymentMode,
    });
    setSaving(false);
    if (!res.data) return setFormError(res.error || 'Could not save the walk-in. Please try again.');

    const booking = res.data;
    setToday((prev) => [booking, ...prev]);
    setSaved(booking);
    setCitizenName('');
    setMobile('');
    setAmount('');
    setServiceId('');
    setOtherName('');
    if (openScanner) {
      router.push(
        `/scanner?token=${token(booking.id)}&name=${encodeURIComponent(citizenName.trim())}&service=${encodeURIComponent(serviceName)}`,
      );
    }
  }

  const input =
    'w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Walk-in counter</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
            Register citizens who come in person. Each walk-in is saved to your Bookings and counts in Earnings once completed.
          </p>
        </div>
        <Link
          href="/scanner"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
        >
          <Camera className="size-4 text-emerald-400" /> Open document scanner
        </Link>
      </div>

      {saved && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-300">
          <span>
            Saved <span className="font-mono">{token(saved.id)}</span> · ₹{((saved.final_paise ?? 0) / 100).toFixed(2)}. Complete it from Bookings when the work is done.
          </span>
          <Link href="/bookings" className="font-bold underline">Open Bookings</Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <User className="size-4 text-emerald-400" /> 1. Citizen
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-300">
                Full name <span className="text-rose-400">*</span>
                <input value={citizenName} onChange={(e) => setCitizenName(e.target.value)} className={`${input} mt-1`} />
              </label>
              <label className="text-xs font-bold text-slate-300">
                Mobile (optional)
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className={`${input} mt-1 font-mono`}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Layers className="size-4 text-emerald-400" /> 2. Service (your rate card)
            </h2>
            {loadError && <p className="text-xs text-amber-300">{loadError}</p>}
            {services && services.length === 0 && (
              <p className="text-xs text-slate-400">
                Your rate card is empty. <Link href="/services" className="font-bold text-emerald-400 underline">Add services</Link> or use Other.
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
              {[...(services ?? []), { id: OTHER, name: 'Other (type it)', charge_paise: null, charge_text: null } as const].map((s) => {
                const selected = serviceId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pickService(s.id)}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs transition ${
                      selected ? 'border-emerald-500 bg-emerald-950/30' : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-white line-clamp-2">{s.name}</span>
                    <span className="shrink-0 font-mono text-emerald-400">
                      {selected ? <Check className="size-3.5" /> : s.charge_paise != null ? `₹${s.charge_paise / 100}` : s.charge_text ?? ''}
                    </span>
                  </button>
                );
              })}
            </div>
            {serviceId === OTHER && (
              <input
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="What is the citizen here for?"
                aria-label="Service name"
                className={input}
              />
            )}
          </section>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Receipt className="size-4 text-emerald-400" /> 3. Payment
            </h2>
            <label className="block text-xs font-bold text-slate-300">
              Amount collected (₹) — your charge plus any government fee <span className="text-rose-400">*</span>
              <input
                type="number"
                min={0}
                step="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${input} mt-1 font-mono text-base`}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'upi'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={paymentMode === m}
                  onClick={() => setPaymentMode(m)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold border transition ${
                    paymentMode === m ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {m === 'cash' ? <CreditCard className="size-3.5" /> : <QrCode className="size-3.5" />}
                  {m === 'cash' ? 'Cash' : 'UPI'}
                </button>
              ))}
            </div>

            {formError && (
              <p role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                {formError}
              </p>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-60"
            >
              <Camera className="size-4" /> {saving ? 'Saving…' : 'Save & open scanner'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition disabled:opacity-60"
            >
              <ArrowRight className="size-4 text-emerald-400" /> Save walk-in
            </button>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300">Today&apos;s walk-ins</span>
              <span className="text-[10px] text-slate-500">
                {today.length} · ₹{(today.reduce((s, b) => s + (b.final_paise ?? 0), 0) / 100).toFixed(0)} collected
              </span>
            </div>
            {today.length === 0 && <p className="text-xs text-slate-500">No walk-ins yet today.</p>}
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {today.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 p-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-mono font-bold text-emerald-400">{token(b.id)}</span> · {noteField(b.user_note, 'Applicant')}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{b.service_name ?? noteField(b.user_note, 'Service')}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block font-mono font-bold text-emerald-400">₹{((b.final_paise ?? 0) / 100).toFixed(0)}</span>
                    <span className="text-[9px] font-bold uppercase text-slate-400">{b.status.replace('_', ' ')}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
