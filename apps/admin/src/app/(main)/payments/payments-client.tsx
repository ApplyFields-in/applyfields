'use client';

import { Badge, Card, EmptyState, buttonClass } from '@applyfields/ui';
import { Banknote, CreditCard, Store, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiGetWithStatus, apiPatch, apiPost } from '@/lib/api';

type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
interface Payout {
  id: string;
  partner_name: string;
  period_start: string;
  period_end: string;
  gross_paise: number;
  commission_paise: number;
  net_paise: number;
  status: PayoutStatus;
  paid_at: string | null;
  reference: string | null;
}
interface OnlinePayment {
  id: string;
  purpose: string;
  amount_paise: number;
  status: string;
  refunded_amount_paise: number;
  razorpay_payment_id: string | null;
  partner_name: string | null;
  created_at: string;
}
interface PaymentsData {
  online: { items: OnlinePayment[]; by_status: { status: string; count: number; amount_paise: number }[] };
  counter: { completed_bookings: number; amount_paise: number };
  payouts: Payout[];
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const PAYOUT_TONE: Record<PayoutStatus, 'teal' | 'celadon' | 'tea' | 'outline'> = {
  pending: 'tea',
  processing: 'tea',
  paid: 'celadon',
  failed: 'teal',
};

/** Real money only (GET /admin/payments). Nothing here is sample data. */
export function PaymentsClient() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<Payout | null>(null);
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await apiGetWithStatus<PaymentsData>('/admin/payments');
    if (res.ok && res.data) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.status === 403 ? 'Only admins can see payments.' : 'Could not load payments. Is the API running and up to date?');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch; state is set after the await
    void load();
  }, [load]);

  // New payout: gross is computed by the API from the centre's completed bookings in the period.
  const [creating, setCreating] = useState(false);
  const [partners, setPartners] = useState<{ id: string; business_name: string }[]>([]);
  const [draft, setDraft] = useState({ partner_id: '', period_start: '', period_end: '', commission_percent: '0' });
  const [createError, setCreateError] = useState<string | null>(null);

  async function openCreate() {
    setCreating(true);
    setCreateError(null);
    if (partners.length) return;
    // ponytail: first 100 partners in a <select>; add search when the network outgrows it.
    const res = await apiGetWithStatus<{ items: { id: string; business_name: string }[] }>('/admin/partners?limit=100');
    if (res.ok && res.data) setPartners(res.data.items);
    else setCreateError('Could not load partners.');
  }

  async function createPayout() {
    const pct = Number(draft.commission_percent);
    if (!draft.partner_id || !draft.period_start || !draft.period_end) return setCreateError('Pick a partner and both dates.');
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return setCreateError('Commission must be 0–100%.');
    setSaving(true);
    const res = await apiPost<{ net_paise: number; bookings: number }>('/admin/payments/payouts', { ...draft, commission_percent: pct });
    setSaving(false);
    if (!res.ok || !res.data) return setCreateError(res.error || 'Could not create the payout.');
    setCreating(false);
    setDraft({ partner_id: '', period_start: '', period_end: '', commission_percent: '0' });
    void load();
  }

  async function markPaid() {
    if (!paying || !reference.trim()) return;
    setSaving(true);
    const res = await apiPatch(`/admin/payments/payouts/${paying.id}`, { status: 'paid', reference: reference.trim() });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'Could not mark the payout as paid.');
      return;
    }
    setPaying(null);
    setReference('');
    void load();
  }

  if (error && !data) {
    return (
      <Card tone="tea" className="p-4 text-sm font-semibold text-teal">
        {error}
      </Card>
    );
  }
  if (!data) return <p className="text-sm text-teal/70">Loading payments…</p>;

  const onlinePaid = data.online.by_status.find((s) => s.status === 'paid');
  const pendingPayouts = data.payouts.filter((p) => p.status === 'pending' || p.status === 'processing');

  return (
    <div className="space-y-6">
      {error && (
        <Card tone="tea" className="p-3 text-xs font-semibold text-teal">
          {error}
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal/70">
            <Store className="size-3.5" aria-hidden="true" /> Paid at centres (completed bookings)
          </p>
          <p className="mt-1 text-2xl font-black text-teal">{rupees(data.counter.amount_paise)}</p>
          <p className="text-xs text-teal/70">{data.counter.completed_bookings} bookings, cash/UPI at the counter</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal/70">
            <Wallet className="size-3.5" aria-hidden="true" /> Payouts waiting
          </p>
          <p className="mt-1 text-2xl font-black text-teal">
            {rupees(pendingPayouts.reduce((s, p) => s + p.net_paise, 0))}
          </p>
          <p className="text-xs text-teal/70">{pendingPayouts.length} payout{pendingPayouts.length === 1 ? '' : 's'} to send</p>
        </Card>
        <Card className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-teal/70">
            <CreditCard className="size-3.5" aria-hidden="true" /> Online payments
          </p>
          <p className="mt-1 text-2xl font-black text-teal">{rupees(onlinePaid?.amount_paise ?? 0)}</p>
          <p className="text-xs text-teal/70">
            {data.online.items.length ? `${onlinePaid?.count ?? 0} paid` : 'Starts when Razorpay is connected'}
          </p>
        </Card>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-bold text-teal">Partner payouts</h2>
          <button type="button" onClick={openCreate} className={buttonClass({ size: 'sm' })}>
            New payout
          </button>
        </div>
        {data.payouts.length === 0 ? (
          <EmptyState
            icon={<Banknote />}
            title="No payouts yet"
            text="Use New payout to settle a centre's completed bookings for a period."
          />
        ) : (
          <div className="overflow-x-auto rounded-card shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-tea/40 text-xs text-teal">
                <tr>
                  <th className="p-3">Partner</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Gross</th>
                  <th className="p-3 text-right">Commission</th>
                  <th className="p-3 text-right">Net to pay</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="bg-cream text-teal">
                {data.payouts.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="p-3 font-semibold">{p.partner_name}</td>
                    <td className="p-3 text-xs">
                      {day(p.period_start)} – {day(p.period_end)}
                    </td>
                    <td className="p-3 text-right">{rupees(p.gross_paise)}</td>
                    <td className="p-3 text-right">{rupees(p.commission_paise)}</td>
                    <td className="p-3 text-right font-bold">{rupees(p.net_paise)}</td>
                    <td className="p-3">
                      <Badge tone={PAYOUT_TONE[p.status]}>{p.status}</Badge>
                      {p.reference && <p className="mt-1 text-[11px] text-teal/70">Ref {p.reference}</p>}
                    </td>
                    <td className="p-3 text-right">
                      {p.status !== 'paid' && (
                        <button type="button" onClick={() => setPaying(p)} className={buttonClass({ size: 'sm' })}>
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-bold text-teal">Online payments</h2>
        {data.online.items.length === 0 ? (
          <EmptyState
            icon={<CreditCard />}
            title="No online payments yet"
            text="Subscriptions and convenience fees will show here after Razorpay is connected (needs company KYC)."
          />
        ) : (
          <div className="overflow-x-auto rounded-card shadow-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-tea/40 text-xs text-teal">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Partner</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="bg-cream text-teal">
                {data.online.items.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="p-3 text-xs">{day(p.created_at)}</td>
                    <td className="p-3">{p.purpose.replace(/_/g, ' ')}</td>
                    <td className="p-3">{p.partner_name ?? '—'}</td>
                    <td className="p-3 text-right font-semibold">{rupees(p.amount_paise)}</td>
                    <td className="p-3">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="new-payout-title">
          <Card className="w-full max-w-md space-y-3 p-5">
            <h2 id="new-payout-title" className="font-bold text-teal">New payout</h2>
            <p className="text-xs text-teal/80">
              Gross = the centre&apos;s completed, priced bookings in the period (India time). Net = gross − commission.
            </p>
            <label className="block text-xs font-semibold text-teal">
              Partner
              <select
                value={draft.partner_id}
                onChange={(e) => setDraft({ ...draft, partner_id: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
              >
                <option value="">Choose…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.business_name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-semibold text-teal">
                From
                <input
                  type="date"
                  value={draft.period_start}
                  onChange={(e) => setDraft({ ...draft, period_start: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
                />
              </label>
              <label className="block text-xs font-semibold text-teal">
                To
                <input
                  type="date"
                  value={draft.period_end}
                  onChange={(e) => setDraft({ ...draft, period_end: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
                />
              </label>
            </div>
            <label className="block text-xs font-semibold text-teal">
              Commission %
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={draft.commission_percent}
                onChange={(e) => setDraft({ ...draft, commission_percent: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
              />
            </label>
            {createError && (
              <Card tone="tea" className="p-2 text-xs font-semibold text-teal" role="alert">
                {createError}
              </Card>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setCreating(false)} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Cancel
              </button>
              <button type="button" disabled={saving} onClick={createPayout} className={buttonClass({ size: 'sm' })}>
                {saving ? 'Creating…' : 'Create payout'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="payout-title">
          <Card className="w-full max-w-md p-5">
            <h2 id="payout-title" className="font-bold text-teal">
              Mark {rupees(paying.net_paise)} to {paying.partner_name} as paid
            </h2>
            <p className="mt-1 text-xs text-teal/80">Send the bank/UPI transfer first, then enter its reference number here.</p>
            <label htmlFor="payout-ref" className="mt-3 block text-xs font-semibold text-teal">
              Transfer reference (UTR / UPI ref)
            </label>
            <input
              id="payout-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPaying(null)} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Cancel
              </button>
              <button type="button" disabled={saving || !reference.trim()} onClick={markPaid} className={buttonClass({ size: 'sm' })}>
                {saving ? 'Saving…' : 'Mark paid'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
