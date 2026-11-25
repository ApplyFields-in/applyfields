'use client';

import type { AdminBroadcastInput, ScheduledBroadcastItem } from '@applyfields/types';
import { buttonClass } from '@applyfields/ui';
import { RotateCw, Send, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelScheduledAction, retryDeliveryAction, sendBroadcastAction } from '@/lib/actions';
import { Field, FormSection, TextArea, TextInput } from './review-ui';

export function RetryDeliveryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await retryDeliveryAction(id);
            if (res.ok) router.refresh();
            else setError(res.error ?? 'Could not retry');
          })
        }
        className={buttonClass({ variant: 'secondary', size: 'sm' })}
      >
        <RotateCw className="size-4" aria-hidden="true" /> {pending ? 'Retrying…' : 'Retry'}
      </button>
      {error && (
        <span role="alert" className="text-xs font-semibold text-teal">
          {error}
        </span>
      )}
    </span>
  );
}

const istTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

type Kind = 'all' | 'subscribers' | 'partners' | 'staff' | 'savers' | 'user';

/** Starting points for special notifications; the admin edits the text before sending. */
const TEMPLATES = [
  { label: 'Festival greeting', title: 'Happy Sankranti from ApplyFields 🎉', body: 'Wishing you and your family a joyful festival. New jobs and exams keep coming — we will remind you before every last date.' },
  { label: 'App update', title: 'ApplyFields just got better', body: 'Update the app to get the latest features and fixes.' },
  { label: 'Maintenance', title: 'Short maintenance tonight', body: 'ApplyFields may be unavailable for a few minutes tonight. Your data is safe.' },
];

/** Admins only: broadcast or manual alert (in-app, plus phone & browser push unless "in-app only"). */
export function ManualAlertForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<Kind>('all');
  const [delivery, setDelivery] = useState<'push' | 'in_app'>('push');
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sendAt, setSendAt] = useState(''); // datetime-local, read as India time
  const [message, setMessage] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const who =
      kind === 'all'
        ? 'EVERY account (citizens, partners, staff)'
        : kind === 'subscribers'
          ? 'Plus subscribers only'
          : kind === 'partners'
            ? 'every partner centre and college'
            : kind === 'staff'
              ? 'every staff member'
              : kind === 'savers'
            ? `everyone who saved “${target}”`
            : target;

    const how = delivery === 'push' ? 'in-app + phone/browser push' : 'in-app only';
    const when = sendAt ? `on ${sendAt.replace('T', ' at ')} IST` : 'now';
    const after = sendAt ? ' You can cancel it until then.' : " It can't be recalled.";
    if (!confirm(`Send this notification to ${who} (${how}) ${when}?${after}`)) return;

    start(async () => {
      const input: AdminBroadcastInput = {
        title,
        body: body || null,
        link: link || null,
        audience:
          kind === 'savers'
            ? { kind, opportunity_slug: target.trim() }
            : kind === 'user'
              ? { kind, email: target.trim() }
              : { kind },
        ...(delivery === 'in_app' && { channels: ['in_app' as const] }),
        ...(sendAt && { send_at: `${sendAt}:00+05:30` }),
      };
      const res = await sendBroadcastAction(input);
      if (res.ok) {
        setMessage(
          res.data!.scheduled_for
            ? `Scheduled for ${istTime(res.data!.scheduled_for)}.`
            : `Sent to ${res.data!.notified} people (${res.data!.push_sent} phones/browsers).`,
        );
        setSendAt('');
        setTitle('');
        setBody('');
        setLink('');
        router.refresh();
      } else {
        setMessage(res.error ?? 'Could not send');
      }
    });
  }

  return (
    <form onSubmit={submit}>
      <FormSection
        title="Broadcast & special notifications"
        note={<span className="text-xs text-teal/80">Celebrations, updates, alerts · in-app and phone/browser push</span>}
      >
        <div className="grid gap-3">
          <Field label="Start from a template (optional)">
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTitle(t.title);
                    setBody(t.body);
                  }}
                  className="clay-press rounded-full bg-cream px-3 py-1.5 text-xs font-semibold shadow-clay"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Who gets it">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              className="h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
            >
              <option value="all">Everyone (citizens, partners, staff)</option>
              <option value="subscribers">Plus subscribers</option>
              <option value="partners">Partners (centres & colleges)</option>
              <option value="staff">Staff</option>
              <option value="savers">People who saved a job or exam</option>
              <option value="user">One person (by email)</option>
            </select>
          </Field>

          <Field label="How">
            <select
              value={delivery}
              onChange={(e) => setDelivery(e.target.value as 'push' | 'in_app')}
              className="h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
            >
              <option value="push">In-app + phone & browser push</option>
              <option value="in_app">In-app only (no push)</option>
            </select>
          </Field>

          {kind === 'savers' && (
            <Field label="Job or Exam Slug">
              <TextInput
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="ssc-cgl-2026"
              />
            </Field>
          )}

          {kind === 'user' && (
            <Field label="Candidate Email">
              <TextInput
                required
                type="email"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="candidate@example.com"
              />
            </Field>
          )}

          <Field label="Notification Title">
            <TextInput
              required
              minLength={3}
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SSC CGL 2026 Official Notification Released"
            />
          </Field>

          <Field label="Message Body (optional)">
            <TextArea
              maxLength={1000}
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Brief summary or instructions..."
            />
          </Field>

          <Field label="Deep Link URL (optional)">
            <TextInput
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/jobs/ssc-cgl-2026"
            />
          </Field>

          <Field label="Send later (optional, India time)">
            <TextInput type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass()}>
            <Send className="size-4" aria-hidden="true" /> {pending ? 'Saving…' : sendAt ? 'Schedule' : 'Send now'}
          </button>
          {message && (
            <p role="status" className="text-sm font-semibold text-teal">
              {message}
            </p>
          )}
        </div>
      </FormSection>
    </form>
  );
}

const AUDIENCE_LABEL: Record<ScheduledBroadcastItem['audience'], string> = {
  all: 'Everyone',
  subscribers: 'Plus subscribers',
  partners: 'Partners',
  staff: 'Staff',
  savers: 'Saved a job',
  user: 'One person',
};

/** Scheduled broadcasts: upcoming ones can be cancelled until they start sending. */
export function ScheduledBroadcasts({ items }: { items: ScheduledBroadcastItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (items.length === 0) return null;

  function cancel(b: ScheduledBroadcastItem) {
    if (!confirm(`Cancel “${b.title}”?`)) return;
    start(async () => {
      setError(null);
      const res = await cancelScheduledAction(b.id);
      if (res.ok) router.refresh();
      else setError(res.error ?? 'Could not cancel');
    });
  }

  return (
    <FormSection title="Scheduled" note={<span className="text-xs text-teal/80">Sent within a minute of the time</span>}>
      <ul className="grid gap-2">
        {items.map((b) => (
          <li key={b.id} className="flex items-start justify-between gap-3 rounded-xl bg-cream p-3 text-sm shadow-pressed">
            <div className="min-w-0">
              <p className="font-semibold">{b.title}</p>
              <p className="text-xs text-teal/80">
                {istTime(b.send_at)} · {AUDIENCE_LABEL[b.audience]} · {b.in_app_only ? 'in-app only' : 'in-app + push'} ·{' '}
                {b.status}
                {b.notified !== null && ` · ${b.notified} notified`}
              </p>
              {b.last_error && <p className="text-xs text-teal/80">Error: {b.last_error}</p>}
            </div>
            {b.status === 'scheduled' && (
              <button
                type="button"
                disabled={pending}
                onClick={() => cancel(b)}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                Cancel
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-teal">
          {error}
        </p>
      )}
    </FormSection>
  );
}
