'use client';

import { openRazorpayCheckout } from '@applyfields/ui';
import { CheckCircle2, Crown } from 'lucide-react';
import { useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

export interface PlusStatus {
  plan: { name: string; price_paise: number; benefits: string[] } | null;
  active: boolean;
  auto_renew: boolean;
  ends_at: string | null;
}
interface PaymentsConfig {
  plus_enabled: boolean;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** GET /payments/plus + /payments/config, or null when signed out / API down. */
export async function loadPlus(): Promise<{ status: PlusStatus; enabled: boolean } | null> {
  const [status, config] = await Promise.all([apiGet<PlusStatus>('/payments/plus'), apiGet<PaymentsConfig>('/payments/config')]);
  return status ? { status, enabled: Boolean(config?.plus_enabled) } : null;
}

/** ApplyFields Plus: subscribe (Razorpay, ₹50/month) and cancel (stops renewal; Plus stays until the paid month ends). */
export function PlusCard({
  plus,
  enabled,
  onChange,
  prefill,
}: {
  plus: PlusStatus | null;
  enabled: boolean;
  onChange: (s: PlusStatus) => void;
  prefill?: { name?: string; email?: string };
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const price = (plus?.plan?.price_paise ?? 5000) / 100;
  const benefits = plus?.plan?.benefits ?? [];

  async function refresh() {
    const res = await loadPlus();
    if (res) onChange(res.status);
  }

  async function subscribe() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const start = await apiPost<{ key_id: string; subscription_id: string }>('/payments/plus/subscribe');
      if (!start.data) return setError(start.error || 'Could not start Plus. Please try again.');
      const result = await openRazorpayCheckout({
        key_id: start.data.key_id,
        subscription_id: start.data.subscription_id,
        description: `ApplyFields Plus · ₹${price}/month`,
        prefill,
      });
      if (!result) return; // closed the window
      const ok = await apiPost('/payments/verify', { kind: 'subscription', ...result });
      if (ok.error) setError('Payment received, but we could not confirm it yet. It will show here within a few minutes.');
      else setNote('Welcome to ApplyFields Plus!');
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!plus?.ends_at) return;
    if (!window.confirm(`Cancel ApplyFields Plus? You keep Plus until ${day(plus.ends_at)} and won't be charged again.`)) return;
    setBusy(true);
    setError(null);
    const res = await apiPost<PlusStatus>('/payments/plus/cancel');
    setBusy(false);
    if (!res.data) return setError(res.error || 'Could not cancel. Please try again.');
    onChange(res.data);
    setNote(`Cancelled. Plus stays active until ${day(plus.ends_at)}.`);
  }

  return (
    <div className="rounded-3xl border border-[#b8d7ff] bg-gradient-to-br from-[#EAF3FF] to-white p-7 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="size-6 text-[#0e7bf4]" />
            <h3 className="text-xl font-extrabold text-[#082046]">ApplyFields Plus</h3>
          </div>
          <p className="mt-1 text-xs text-[#536780]">Optional · ₹{price} / month · cancel any time</p>
        </div>
        {plus?.active && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            {plus.auto_renew ? 'Active' : `Until ${day(plus.ends_at!)}`}
          </span>
        )}
      </div>

      <p className="text-sm text-[#334a69]">
        Everything on ApplyFields stays free. Plus adds a few extras for people applying to many exams.
      </p>

      {benefits.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-xs font-semibold text-[#082046]">
              <CheckCircle2 className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {plus?.active && plus.ends_at && (
        <p className="text-xs text-[#435775]">
          {plus.auto_renew ? `Renews on ${day(plus.ends_at)}.` : `Cancelled. You won't be charged again; Plus ends on ${day(plus.ends_at)}.`}
        </p>
      )}

      {note && <p role="status" className="text-xs font-semibold text-emerald-700">{note}</p>}
      {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {!plus ? (
          <p className="text-xs text-[#536780]">Sign in to get Plus.</p>
        ) : plus.active && plus.auto_renew ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void cancel()}
            className="rounded-xl border border-[#c4d2e3] bg-white px-5 py-2.5 text-xs font-bold text-[#082046] hover:bg-[#F0F4F8] disabled:opacity-60"
          >
            {busy ? 'Please wait…' : 'Cancel Plus'}
          </button>
        ) : plus.active ? null : enabled ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void subscribe()}
            className="rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0c6fdc] disabled:opacity-60"
          >
            {busy ? 'Please wait…' : `Get Plus · ₹${price}/month`}
          </button>
        ) : (
          <p className="text-xs text-[#536780]">Plus opens soon: online payments are being set up.</p>
        )}
      </div>
    </div>
  );
}
