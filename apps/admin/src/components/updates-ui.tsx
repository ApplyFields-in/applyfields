'use client';

import { useState, useTransition } from 'react';
import type { AdminUpdateDetail, OpportunityStatus, UpdateInput, UpdateKind } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Megaphone,
  Plus,
  RotateCw,
  Save,
  Send,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUpdateAction,
  publishUpdateAction,
  saveUpdateAction,
  setUpdateStatusAction,
} from '@/lib/actions';
import { Field, FormSection, TextArea, TextInput } from './review-ui';
import { StatusBadge } from './opportunities-ui';

export const UPDATE_KIND_LABEL: Record<UpdateKind, string> = {
  admit_card: 'Admit Card',
  result: 'Result',
  answer_key: 'Answer Key',
  date_change: 'Date Change',
  correction_window: 'Correction Window',
  extension: 'Deadline Extension',
  counselling: 'Counselling Schedule',
  other: 'General Notice',
};

export function UpdateKindBadge({ kind }: { kind: UpdateKind }) {
  switch (kind) {
    case 'admit_card':
      return <Badge tone="celadon">Admit Card</Badge>;
    case 'result':
      return <Badge tone="teal">Result</Badge>;
    case 'answer_key':
      return <Badge tone="teal">Answer Key</Badge>;
    default:
      return <Badge tone="tea">{UPDATE_KIND_LABEL[kind] ?? kind}</Badge>;
  }
}

export function QuickPublishUpdateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePublish = () => {
    startTransition(async () => {
      const res = await publishUpdateAction(id);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error ?? 'Failed to publish update');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={isPending}
      className={buttonClass({ variant: 'accent', size: 'sm' })}
      title="Publish to citizen portal"
    >
      <Send className="size-3.5" aria-hidden="true" />
      {isPending ? 'Publishing...' : 'Publish'}
    </button>
  );
}

export function QuickArchiveUpdateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleArchive = () => {
    if (!confirm('Archive / dismiss this update?')) return;
    startTransition(async () => {
      const res = await setUpdateStatusAction(id, 'archived');
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error ?? 'Failed to archive update');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={isPending}
      className={buttonClass({ variant: 'secondary', size: 'sm' })}
      title="Archive this update"
    >
      <Archive className="size-3.5" aria-hidden="true" />
      Archive
    </button>
  );
}

interface UpdateFormProps {
  initialData?: AdminUpdateDetail | null;
  mode: 'create' | 'edit';
}

export function UpdateForm({ initialData, mode }: UpdateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [kind, setKind] = useState<UpdateKind>(initialData?.kind ?? 'admit_card');
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().slice(0, 10));
  const [url, setUrl] = useState(initialData?.url ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [opportunityId, setOpportunityId] = useState(initialData?.parent?.id ?? '');
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url ?? '');

  const buildPayload = (): UpdateInput => ({
    title: title.trim(),
    kind,
    date: date || null,
    url: url.trim() || null,
    summary: summary.trim() || null,
    opportunity_id: opportunityId.trim() || null,
    source_url: sourceUrl.trim() || null,
  });

  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const payload = buildPayload();
      if (mode === 'create') {
        const res = await createUpdateAction(payload);
        if (res.ok && res.data) {
          router.push(`/updates/${res.data.id}`);
        } else {
          setErrorMsg(res.error ?? 'Failed to create update');
        }
      } else if (initialData?.id) {
        const res = await saveUpdateAction(initialData.id, payload);
        if (res.ok) {
          setSuccessMsg('Update saved successfully');
          router.refresh();
        } else {
          setErrorMsg(res.error ?? 'Failed to save update');
        }
      }
    });
  };

  const handlePublish = () => {
    if (!initialData?.id) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await publishUpdateAction(initialData.id);
      if (res.ok) {
        setSuccessMsg('Update published live!');
        router.refresh();
      } else {
        setErrorMsg(res.error ?? 'Failed to publish update');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/updates" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to results & updates
        </Link>
        {initialData && (
          <div className="flex items-center gap-2">
            <StatusBadge status={initialData.status} />
          </div>
        )}
      </div>

      {errorMsg && (
        <Card tone="tea" className="flex items-start gap-3 p-4">
          <AlertCircle className="size-5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-bold text-red-900">Action failed</p>
            <p className="text-red-800">{errorMsg}</p>
          </div>
        </Card>
      )}

      {successMsg && (
        <Card tone="teal" className="flex items-start gap-3 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-celadon" aria-hidden="true" />
          <p className="text-sm font-bold text-cream">{successMsg}</p>
        </Card>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-base font-bold text-teal">
            {mode === 'create' ? 'Create new notice / update' : title || 'Edit update'}
          </h2>
          <p className="text-xs text-teal/70">
            {mode === 'create'
              ? 'Add an official admit card, answer key or result notice'
              : `Current status: ${initialData?.status.toUpperCase()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={buttonClass({ variant: 'primary', size: 'sm' })}
          >
            <Save className="size-4" aria-hidden="true" />
            {isPending ? 'Saving...' : mode === 'create' ? 'Create draft' : 'Save changes'}
          </button>

          {mode === 'edit' && initialData?.status === 'draft' && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className={buttonClass({ variant: 'accent', size: 'sm' })}
            >
              <Send className="size-4" aria-hidden="true" /> Publish to citizens
            </button>
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <FormSection title="Update Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *" className="sm:col-span-2">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SSC CGL 2026 Tier 1 Admit Card Released"
              />
            </Field>

            <Field label="Category / Kind">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as UpdateKind)}
                className="h-10 w-full rounded-full border border-teal/15 bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
              >
                {Object.entries(UPDATE_KIND_LABEL).map(([val, lbl]) => (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Effective / Release Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <Field label="Direct Download / View URL * (Admit card or result link)" className="sm:col-span-2">
              <TextInput
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://.../admit-card.pdf or official login portal"
              />
            </Field>

            <Field label="Linked Opportunity ID (UUID)">
              <TextInput
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
                placeholder="Optional: UUID of the parent job/exam"
              />
            </Field>

            <Field label="Official Notice Source URL">
              <TextInput
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://.../notice-board"
              />
            </Field>

            <Field label="Summary / Instructions for Citizens" className="sm:col-span-2">
              <TextArea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Candidates can download their admit card by entering registration number and date of birth."
              />
            </Field>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
