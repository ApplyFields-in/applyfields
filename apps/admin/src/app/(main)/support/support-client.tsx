'use client';

import { Badge, Card, EmptyState, buttonClass, cn } from '@applyfields/ui';
import { LifeBuoy, Mail, Search, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiGetWithStatus, apiPatch } from '@/lib/api';

type Status = 'open' | 'in_review' | 'resolved' | 'rejected' | 'closed';
interface SupportTicket {
  id: string;
  ref: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  category: string | null;
  subject: string;
  message: string;
  status: Status;
  staff_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

const STATUS_LABEL: Record<Status, string> = { open: 'New', in_review: 'Replying', resolved: 'Resolved', rejected: 'Rejected', closed: 'Closed' };
const STATUS_TONE: Record<Status, 'teal' | 'celadon' | 'tea' | 'outline'> = { open: 'teal', in_review: 'tea', resolved: 'celadon', rejected: 'outline', closed: 'outline' };
const FILTERS: Array<Status | 'all'> = ['open', 'in_review', 'resolved', 'all'];
const day = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Help-page messages (GET/PATCH /admin/support). Replies go out by email from staff's own mailbox. */
export function SupportClient() {
  const [items, setItems] = useState<SupportTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | 'all'>('open');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiGetWithStatus<{ total: number; items: SupportTicket[] }>('/admin/support');
    if (res.ok && res.data) {
      setItems(res.data.items);
      setError(null);
    } else {
      setItems([]);
      setError(res.status === 403 ? 'Your role cannot see support messages.' : 'Could not load support messages. Is the API running?');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch; state is set after the await
    void load();
  }, [load]);

  async function setStatus(t: SupportTicket, status: 'in_review' | 'resolved' | 'closed') {
    setBusy(t.id);
    const res = await apiPatch<SupportTicket>(`/admin/support/${t.id}`, { status });
    setBusy(null);
    if (res.ok && res.data) {
      const updated = res.data;
      setItems((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
    } else setError(res.error || 'Could not update the message.');
  }

  const term = search.trim().toLowerCase();
  const shown = (items ?? []).filter(
    (t) =>
      (filter === 'all' || t.status === filter) &&
      (!term || [t.ref, t.name, t.email, t.phone, t.subject, t.message].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))),
  );
  const count = (s: Status) => (items ?? []).filter((t) => t.status === s).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, subject…"
            aria-label="Search support messages"
            className="h-10 w-full rounded-full bg-cream pl-9 pr-4 text-sm shadow-pressed outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn('rounded-full px-3 py-1.5 text-xs font-semibold shadow-clay', filter === f ? 'bg-teal text-cream' : 'bg-cream text-teal hover:bg-tea')}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
              {f !== 'all' && items ? ` (${count(f)})` : ''}
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
        <p className="text-sm text-teal/70">Loading messages…</p>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy />}
          title={items.length === 0 ? 'No messages yet' : 'Nothing matches'}
          text={items.length === 0 ? 'When a citizen uses Contact support on the Help page, it appears here.' : 'Try another status or search.'}
        />
      ) : (
        <div className="grid gap-3">
          {shown.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                <span className="font-mono text-xs font-bold text-teal">{t.ref}</span>
                {t.category && <span className="text-xs capitalize text-teal/70">{t.category}</span>}
                <span className="text-xs text-teal/70">{day(t.created_at)}</span>
              </div>
              <p className="mt-2 break-words font-bold text-teal">{t.subject}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-teal/90">{t.message}</p>
              <p className="mt-2 inline-flex flex-wrap items-center gap-1 break-all text-xs text-teal/80">
                <User className="size-3.5" aria-hidden="true" />
                {t.name || 'Citizen'} · {t.email}
                {t.phone ? ` · ${t.phone}` : ''}
                {t.user_id ? ' · signed in' : ' · not signed in'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.email && (
                  <a
                    href={`mailto:${t.email}?subject=${encodeURIComponent(`Re: ${t.subject} [${t.ref}]`)}`}
                    onClick={() => {
                      if (t.status === 'open') void setStatus(t, 'in_review');
                    }}
                    className={buttonClass({ size: 'sm' })}
                  >
                    <Mail className="size-4" aria-hidden="true" /> Reply by email
                  </a>
                )}
                {t.status !== 'resolved' && t.status !== 'closed' ? (
                  <button type="button" disabled={busy === t.id} onClick={() => setStatus(t, 'resolved')} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                    Mark resolved
                  </button>
                ) : (
                  <button type="button" disabled={busy === t.id} onClick={() => setStatus(t, 'in_review')} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                    Reopen
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
