'use client';

import type { ManualAlertInput } from '@applyfields/types';
import { buttonClass } from '@applyfields/ui';
import { RotateCw, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { retryDeliveryAction, sendManualAlertAction } from '@/lib/actions';
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

/** Admins only: a manual alert to everyone who saved a job, or to one user. */
export function ManualAlertForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<'savers' | 'user'>('savers');
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: ManualAlertInput = {
      title,
      body: body || null,
      link: link || null,
      audience: kind === 'savers' ? { kind, opportunity_slug: target.trim() } : { kind, email: target.trim() },
    };
    const who = kind === 'savers' ? `everyone who saved “${target}”` : target;
    if (!confirm(`Send this alert to ${who}? It goes in-app and by email and can't be undone.`)) return;
    start(async () => {
      const res = await sendManualAlertAction(input);
      if (res.ok) {
        setMessage(`Sent to ${res.data!.notified} ${res.data!.notified === 1 ? 'person' : 'people'}.`);
        setTitle('');
        setBody('');
        setLink('');
        router.refresh();
      } else setMessage(res.error ?? 'Could not send');
    });
  }

  return (
    <form onSubmit={submit}>
      <FormSection title="Send a manual alert" note={<span className="text-xs text-teal/80">Admins only · in-app, plus email where allowed</span>}>
        <div className="grid gap-3">
          <Field label="Send to">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'savers' | 'user')}
              className="h-10 w-full rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
            >
              <option value="savers">Everyone who saved a job/exam</option>
              <option value="user">One user (by email)</option>
            </select>
          </Field>
          <Field label={kind === 'savers' ? 'Job or exam slug' : 'User email'}>
            <TextInput
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={kind === 'savers' ? 'ssc-cgl-2026' : 'name@example.com'}
            />
          </Field>
          <Field label="Title">
            <TextInput required minLength={3} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Message (optional)">
            <TextArea maxLength={1000} rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <Field label="Link on the website (optional)">
            <TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="/jobs/ssc-cgl-2026" />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={buttonClass()}>
            <Send className="size-4" aria-hidden="true" /> {pending ? 'Sending…' : 'Send alert'}
          </button>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </div>
      </FormSection>
    </form>
  );
}
