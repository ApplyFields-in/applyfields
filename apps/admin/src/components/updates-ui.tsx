'use client';

import { useState, useTransition, useEffect } from 'react';
import type {
  AdminOpportunityList,
  AdminOpportunityListItem,
  AdminUpdateDetail,
  OpportunityStatus,
  UpdateInput,
  UpdateKind,
} from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Link as LinkIcon,
  Megaphone,
  Plus,
  RotateCw,
  Save,
  Search,
  Send,
  X,
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
import { apiGet } from '@/lib/api';
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
  const [linkedParent, setLinkedParent] = useState<{ id: string; title: string } | null>(
    initialData?.parent ? { id: initialData.parent.id, title: initialData.parent.title } : null,
  );
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url ?? '');

  // Opportunity Autocomplete search state
  const [searchOppQuery, setSearchOppQuery] = useState('');
  const [searchingOpp, setSearchingOpp] = useState(false);
  const [oppResults, setOppResults] = useState<AdminOpportunityListItem[]>([]);
  const [showManualUuid, setShowManualUuid] = useState(false);

  // Search opportunities as user types
  useEffect(() => {
    if (!searchOppQuery.trim() || searchOppQuery.trim().length < 2) {
      setOppResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setSearchingOpp(true);
      try {
        const res = await apiGet<AdminOpportunityList>(
          `/admin/opportunities?q=${encodeURIComponent(searchOppQuery.trim())}&limit=6`,
        );
        if (res?.items) {
          setOppResults(res.items.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to search opportunities:', err);
      } finally {
        setSearchingOpp(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchOppQuery]);

  const handleSelectOpportunity = (opp: AdminOpportunityListItem) => {
    setOpportunityId(opp.id);
    setLinkedParent({ id: opp.id, title: opp.title });
    setSearchOppQuery('');
    setOppResults([]);

    // If title is currently empty, offer intuitive auto-title
    if (!title.trim()) {
      setTitle(`${opp.title} — ${UPDATE_KIND_LABEL[kind]}`);
    }
  };

  const handleUnlinkOpportunity = () => {
    setOpportunityId('');
    setLinkedParent(null);
  };

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
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to results &amp; updates
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

            {/* Smart Linked Opportunity Picker */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-teal flex items-center justify-between">
                <span>Linked Job or Exam Opportunity</span>
                <button
                  type="button"
                  onClick={() => setShowManualUuid(!showManualUuid)}
                  className="text-[11px] font-normal text-teal/70 hover:underline"
                >
                  {showManualUuid ? 'Use Search Picker' : 'Enter Raw UUID'}
                </button>
              </label>

              {linkedParent ? (
                <div className="flex items-center justify-between rounded-xl border border-line bg-cream p-3 text-xs shadow-xs">
                  <div className="min-w-0 pr-3">
                    <span className="text-[10px] uppercase font-bold text-teal/60">Linked Opportunity</span>
                    <p className="font-bold text-teal truncate">{linkedParent.title}</p>
                    <code className="text-[10px] text-teal/50 font-mono">{linkedParent.id}</code>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlinkOpportunity}
                    className="shrink-0 rounded-lg border border-line/70 bg-canvas px-2.5 py-1 text-xs font-bold text-teal hover:bg-tea transition-colors"
                  >
                    Unlink
                  </button>
                </div>
              ) : showManualUuid ? (
                <TextInput
                  value={opportunityId}
                  onChange={(e) => setOpportunityId(e.target.value)}
                  placeholder="Paste Opportunity UUID..."
                />
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
                    <input
                      type="text"
                      value={searchOppQuery}
                      onChange={(e) => setSearchOppQuery(e.target.value)}
                      placeholder="Type job/exam title (e.g. SSC CGL, NEET, UPSC, Railway, IBPS)..."
                      className="h-10 w-full rounded-full border border-teal/15 bg-canvas pl-9 pr-4 text-xs font-medium text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
                    />
                    {searchingOpp && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-teal/60">
                        Searching...
                      </span>
                    )}
                  </div>

                  {oppResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-line bg-canvas p-1 shadow-2xl">
                      {oppResults.map((opp) => (
                        <button
                          key={opp.id}
                          type="button"
                          onClick={() => handleSelectOpportunity(opp)}
                          className="w-full text-left rounded-lg p-2.5 text-xs hover:bg-cream transition-colors flex items-center justify-between gap-2 border-b border-line/40 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-teal truncate">{opp.title}</p>
                            <p className="text-[11px] text-teal/60 truncate">
                              {opp.organization} · {opp.type}
                            </p>
                          </div>
                          <Badge tone={opp.status === 'published' ? 'teal' : 'celadon'} className="text-[10px] shrink-0">
                            {opp.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Field label="Official Notice Source URL" className="sm:col-span-2">
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

        {/* Citizen Broadcast Preview Box */}
        <div className="rounded-2xl border border-teal/20 bg-tea/30 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal">
            <Megaphone className="size-4 text-celadon" />
            <span>Citizen Portal Broadcast &amp; Push Notification Preview</span>
          </div>

          <div className="rounded-xl border border-line bg-canvas p-3.5 space-y-2 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <UpdateKindBadge kind={kind} />
              <span className="font-bold text-teal text-xs sm:text-sm">{title || 'Untitled Notice Preview'}</span>
            </div>

            {summary && (
              <p className="text-teal/80 text-xs leading-relaxed">
                {summary}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60 text-[11px] text-teal/60">
              <span>Recipient Audience: <strong>Citizens who saved this opportunity</strong></span>
              <span className="font-semibold text-teal">Instant Mobile Push &amp; In-App Notification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
