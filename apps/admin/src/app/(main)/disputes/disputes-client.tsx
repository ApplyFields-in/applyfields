'use client';

import type { AdminBookingDispute, BookingDispute, BookingDisputeStatus } from '@applyfields/types';
import { Badge, Card, EmptyState, buttonClass, cn } from '@applyfields/ui';
import { Building, CheckCircle2, Clock, Scale, Search, User, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiGetWithStatus, apiPatch } from '@/lib/api';

const STATUS_LABEL: Record<BookingDisputeStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
  rejected: 'Rejected',
  closed: 'Closed',
};
const STATUS_TONE: Record<BookingDisputeStatus, 'teal' | 'celadon' | 'tea' | 'outline'> = {
  open: 'teal',
  in_review: 'tea',
  resolved: 'celadon',
  rejected: 'outline',
  closed: 'outline',
};
const FILTERS: Array<BookingDisputeStatus | 'all'> = ['all', 'open', 'in_review', 'resolved', 'rejected'];

const rupees = (paise: number | null) => (paise == null ? '—' : `₹${(paise / 100).toLocaleString('en-IN')}`);
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const token = (bookingId: string) => `AF-${bookingId.slice(0, 8).toUpperCase()}`;

/** Citizen complaints about bookings (GET/PATCH /admin/bookings/disputes). Money is not moved here. */
export function DisputesClient() {
  const [items, setItems] = useState<AdminBookingDispute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingDisputeStatus | 'all'>('open');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminBookingDispute | null>(null);
  const [decision, setDecision] = useState<'in_review' | 'resolved' | 'rejected'>('resolved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiGetWithStatus<{ total: number; items: AdminBookingDispute[] }>('/admin/bookings/disputes');
    if (res.ok && res.data) {
      setItems(res.data.items);
      setError(null);
    } else {
      setItems([]);
      setError(res.status === 403 ? 'Your role cannot see disputes.' : 'Could not load disputes. Is the API running?');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch; state is set after the await
    void load();
  }, [load]);

  const term = search.trim().toLowerCase();
  const shown = (items ?? []).filter(
    (d) =>
      (filter === 'all' || d.status === filter) &&
      (!term ||
        [token(d.booking_id), d.citizen_name, d.citizen_phone, d.partner_business_name, d.service_name, d.reason, d.details]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))),
  );
  const count = (s: BookingDisputeStatus) => (items ?? []).filter((d) => d.status === s).length;

  async function submitDecision() {
    if (!selected || note.trim().length < 3) return;
    setSaving(true);
    setSaveError(null);
    const res = await apiPatch<BookingDispute>(`/admin/bookings/disputes/${selected.id}`, { status: decision, note: note.trim() });
    setSaving(false);
    if (!res.ok || !res.data) {
      setSaveError(res.error || 'Could not save the decision.');
      return;
    }
    const updated = res.data;
    setItems((prev) => (prev ?? []).map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
    setSelected(null);
    setNote('');
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold text-teal/70">Open</p>
          <p className="mt-1 text-2xl font-black text-teal">{items ? count('open') : '…'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-teal/70">In review</p>
          <p className="mt-1 text-2xl font-black text-teal">{items ? count('in_review') : '…'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-teal/70">Resolved</p>
          <p className="mt-1 text-2xl font-black text-teal">{items ? count('resolved') : '…'}</p>
        </Card>
      </div>

      <Card tone="tea" className="p-4 text-xs text-teal">
        Online payments aren&apos;t live yet, so this desk records decisions only. If you approve a refund, pay it
        by hand and say so in the note; the citizen gets the note as a notification.
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking, citizen, centre, reason…"
            aria-label="Search disputes"
            className="h-10 w-full rounded-full bg-cream pl-9 pr-4 text-sm shadow-pressed outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold shadow-clay',
                filter === f ? 'bg-teal text-cream' : 'bg-cream text-teal hover:bg-tea',
              )}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card tone="tea" className="p-4 text-sm font-semibold text-teal">
          {error}
        </Card>
      )}

      {items === null ? (
        <p className="text-sm text-teal/70">Loading disputes…</p>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<Scale />}
          title={items.length === 0 ? 'No disputes yet' : 'Nothing matches'}
          text={
            items.length === 0
              ? 'When a citizen raises a complaint from My Bookings on the services site, it appears here.'
              : 'Try another status or search.'
          }
        />
      ) : (
        <div className="grid gap-3">
          {shown.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
                    <span className="font-mono text-xs font-bold text-teal">{token(d.booking_id)}</span>
                    <span className="text-xs text-teal/70">{day(d.created_at)}</span>
                  </div>
                  <p className="mt-2 font-bold text-teal">{d.reason}</p>
                  <p className="mt-1 text-sm text-teal/90">{d.details}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-teal/80">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3.5" aria-hidden="true" />
                      {d.citizen_name || 'Citizen'} {d.citizen_phone ? `· ${d.citizen_phone}` : ''} {d.citizen_email ? `· ${d.citizen_email}` : ''}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building className="size-3.5" aria-hidden="true" />
                      {d.partner_business_name || 'Centre'} {d.service_name ? `· ${d.service_name}` : ''}
                    </span>
                    <span>Booking {rupees(d.booking_amount_paise)} · Asked back {rupees(d.claim_paise)}</span>
                  </div>
                  {d.resolution_note && (
                    <p className="mt-2 rounded-lg bg-tea/40 px-3 py-2 text-xs text-teal">
                      <strong>Decision note:</strong> {d.resolution_note}
                    </p>
                  )}
                </div>
                {(d.status === 'open' || d.status === 'in_review') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(d);
                      setDecision(d.status === 'open' ? 'in_review' : 'resolved');
                      setNote('');
                      setSaveError(null);
                    }}
                    className={buttonClass({ size: 'sm' })}
                  >
                    Decide
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="dispute-decide-title">
          <Card className="w-full max-w-lg p-5">
            <div className="flex items-center justify-between">
              <h2 id="dispute-decide-title" className="font-bold text-teal">
                Decide on {token(selected.booking_id)}
              </h2>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="rounded-full p-1 hover:bg-tea">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-teal/90">{selected.details}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(
                [
                  ['in_review', 'In review', Clock],
                  ['resolved', 'Resolve', CheckCircle2],
                  ['rejected', 'Reject', XCircle],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDecision(value)}
                  aria-pressed={decision === value}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-clay',
                    decision === value ? 'bg-teal text-cream' : 'bg-cream text-teal',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-xs font-semibold text-teal" htmlFor="dispute-note">
              Note to the citizen (they receive this)
            </label>
            <textarea
              id="dispute-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="e.g. We checked with the centre; ₹50 will be refunded to your UPI within 3 days."
              className="mt-1 w-full rounded-xl bg-cream p-3 text-sm shadow-pressed outline-none"
            />
            {saveError && (
              <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
                {saveError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || note.trim().length < 3}
                onClick={submitDecision}
                className={buttonClass({ size: 'sm' })}
              >
                {saving ? 'Saving…' : 'Save decision'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
