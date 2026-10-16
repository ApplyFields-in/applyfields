'use client';

import type { AdminBroadcastInput, ManualAlertInput } from '@applyfields/types';
import { buttonClass } from '@applyfields/ui';
import { RotateCw, Send, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { retryDeliveryAction, sendBroadcastAction, sendManualAlertAction } from '@/lib/actions';
import { Field, FormSection, TextArea, TextInput } from './review-ui';

export function RetryDeliveryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await retryDeliveryAction(id);
          if (res.ok) router.refresh();
          else alert(res.error ?? 'Could not retry');
        })
      }
      className={buttonClass({ variant: 'secondary', size: 'sm' })}
    >
      <RotateCw className="size-4" aria-hidden="true" /> {pending ? 'Retrying…' : 'Retry'}
    </button>
  );
}

/** Admins only: broadcast or manual alert (In-app + Web Push + Email). */
export function ManualAlertForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<'all' | 'subscribers' | 'savers' | 'user'>('subscribers');
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const who =
      kind === 'all'
        ? 'ALL registered candidates'
        : kind === 'subscribers'
          ? 'SUBSCRIBED candidates only (Instant Push)'
          : kind === 'savers'
            ? `everyone who saved “${target}”`
            : target;

    if (!confirm(`Send this notification to ${who}? It will dispatch Web Push and In-App alerts.`)) return;

    start(async () => {
      if (kind === 'all' || kind === 'subscribers') {
        const input: AdminBroadcastInput = {
          title,
          body: body || null,
          link: link || null,
          audience: { kind },
        };
        const res = await sendBroadcastAction(input);
        if (res.ok) {
          setMessage(`Broadcast sent to ${res.data!.notified} candidates (${res.data!.push_sent} push notifications).`);
          setTitle('');
          setBody('');
          setLink('');
          router.refresh();
        } else {
          setMessage(res.error ?? 'Could not broadcast');
        }
      } else {
        const input: ManualAlertInput = {
          title,
          body: body || null,
          link: link || null,
          audience: kind === 'savers' ? { kind, opportunity_slug: target.trim() } : { kind, email: target.trim() },
        };
        const res = await sendManualAlertAction(input);
        if (res.ok) {
          setMessage(`Sent to ${res.data!.notified} ${res.data!.notified === 1 ? 'person' : 'people'}.`);
          setTitle('');
          setBody('');
          setLink('');
          router.refresh();
        } else {
          setMessage(res.error ?? 'Could not send');
        }
      }
    });
  }

  return (
    <form onSubmit={submit}>
      <FormSection
        title="Broadcast & Notification Desk"
        note={<span className="text-xs text-teal/80">Staff Admin · Dispatches Web Push & In-App Alerts</span>}
      >
        <div className="grid gap-3">
          <Field label="Target Audience">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'all' | 'subscribers' | 'savers' | 'user')}
              className="h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
            >
              <option value="subscribers">⚡ Premium Subscribers Only (Instant Alert)</option>
              <option value="all">📢 All Registered Candidates</option>
              <option value="savers">⭐ Candidates who saved an Opportunity</option>
              <option value="user">👤 Individual Candidate (by email)</option>
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
              placeholder="e.g. 🚨 SSC CGL 2026 Notification Released!"
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
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass()}>
            <Send className="size-4" aria-hidden="true" /> {pending ? 'Broadcasting…' : 'Send Notification'}
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
