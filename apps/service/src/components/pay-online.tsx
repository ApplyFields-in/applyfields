'use client';

import { openRazorpayCheckout } from '@applyfields/ui';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface BookingPayment {
  enabled: boolean;
  payable: boolean;
  charge_paise: number;
  fee_paise: number;
  total_paise: number;
  status: 'unpaid' | 'created' | 'paid' | 'refunded' | 'failed';
  refunded_paise: number;
  paid_at: string | null;
}

const rs = (p: number) => `₹${(p / 100).toLocaleString('en-IN')}`;

/**
 * Pay a booking online (Razorpay). The amount comes from the API (centre's charge + ApplyFields' convenience fee),
 * shown in full before paying. Renders nothing for someone else's booking or when payments are off.
 */
export function PayOnline({ bookingId }: { bookingId: string }) {
  const [info, setInfo] = useState<BookingPayment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => apiGet<BookingPayment>(`/payments/bookings/${bookingId}`).then((r) => setInfo(r.data));
  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the booking changes
  }, [bookingId]);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const order = await apiPost<{ key_id: string; order_id: string; amount_paise: number }>(`/payments/bookings/${bookingId}/order`);
      if (!order.data) return setError(order.error || 'Could not start the payment.');
      const result = await openRazorpayCheckout({
        key_id: order.data.key_id,
        order_id: order.data.order_id,
        amount_paise: order.data.amount_paise,
        description: `Booking AF-${bookingId.slice(0, 8).toUpperCase()}`,
      });
      if (!result) return;
      const ok = await apiPost('/payments/verify', { kind: 'order', ...result });
      if (ok.error) setError('Payment received, but not confirmed yet. Refresh in a minute.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!info) return null;
  if (info.status === 'paid' || info.status === 'refunded') {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
        <CheckCircle2 className="h-4 w-4" />
        {info.status === 'refunded'
          ? `Refunded ${rs(info.refunded_paise)} to your original payment method.`
          : `Paid online ${rs(info.total_paise)}${info.refunded_paise ? ` · ${rs(info.refunded_paise)} refunded` : ''}. Nothing more to pay at the centre for this booking.`}
      </div>
    );
  }
  if (!info.enabled || !info.payable) return null;

  return (
    <div className="rounded-2xl border border-[#d5deea] bg-white p-4 space-y-3 shadow-sm">
      <span className="text-xs font-black text-[#082046]">Pay online (optional)</span>
      <dl className="space-y-1 text-xs text-[#526987]">
        <div className="flex justify-between"><dt>Centre&apos;s charge</dt><dd className="font-mono font-bold text-[#082046]">{rs(info.charge_paise)}</dd></div>
        {info.fee_paise > 0 && (
          <div className="flex justify-between"><dt>ApplyFields convenience fee</dt><dd className="font-mono font-bold text-[#082046]">{rs(info.fee_paise)}</dd></div>
        )}
        <div className="flex justify-between border-t border-[#d5deea] pt-1 font-black text-[#082046]"><dt>Total</dt><dd className="font-mono">{rs(info.total_paise)}</dd></div>
      </dl>
      <p className="text-[11px] text-[#526987]">Or pay at the centre. If the booking is cancelled, an online payment is refunded in full.</p>
      {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void pay()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e7bf4] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0c6fdc] disabled:opacity-60"
      >
        <CreditCard className="h-4 w-4" /> {busy ? 'Please wait…' : `Pay ${rs(info.total_paise)} online`}
      </button>
    </div>
  );
}
