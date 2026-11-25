'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReviewListItem } from '@applyfields/types';
import { Card, cn } from '@applyfields/ui';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Keyboard,
  Loader2,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { ConfidenceMeter, formatFoundAt, TYPE_LABEL } from '@/components/review-ui';
import { publishOpportunityAction, setOpportunityStatusAction } from '@/lib/actions';

interface ReviewQueueClientProps {
  items: ReviewListItem[];
  total: number;
  sources: string[];
  currentSource: string;
  isCareful: boolean;
}

const QUICK_REJECTION_REASONS = [
  'Duplicate of existing live opportunity',
  'Corrupted or unreadable notification PDF',
  'Commercial spam or non-official recruitment',
  'Application deadline expired prior to ingestion',
  'Eligibility criteria missing from source text',
];

/** Runs `task` for every id, 5 at a time (instead of one after another); returns the ids that succeeded. */
async function inBatches(ids: string[], task: (id: string) => Promise<boolean>): Promise<string[]> {
  const ok: string[] = [];
  for (let i = 0; i < ids.length; i += 5) {
    const chunk = ids.slice(i, i + 5);
    const results = await Promise.all(chunk.map((id) => task(id).catch(() => false)));
    chunk.forEach((id, k) => results[k] && ok.push(id));
  }
  return ok;
}

export function ReviewQueueClient({
  items,
  total,
  sources,
  currentSource,
  isCareful,
}: ReviewQueueClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Navigation & Focus
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [showHotkeysHelp, setShowHotkeysHelp] = useState<boolean>(false);

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Quick Reject Modal
  const [rejectingItem, setRejectingItem] = useState<ReviewListItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(QUICK_REJECTION_REASONS[0]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Rows published/rejected here disappear at once; the server refresh catches up in the background.
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  // Published here: kept on screen in a "Just published" strip so the click visibly did something.
  const [justPublished, setJustPublished] = useState<ReviewListItem[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const visible = items.filter((d) => !removed.has(d.id));
  const hide = (ids: string[]) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), type === 'error' ? 9000 : 5000);
  };

  // Toggle selection for an item
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all high-confidence drafts (>90%)
  const handleSelectHighConfidence = () => {
    const highConf = visible.filter((d) => (d.confidence ?? 0) >= 0.9 && d.missing.length === 0);
    const ids = new Set(highConf.map((d) => d.id));
    setSelectedIds(ids);
    showToast(`Selected ${ids.size} ready drafts with 90%+ confidence.`);
  };

  // Select all drafts
  const handleSelectAll = () => {
    if (selectedIds.size === visible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((d) => d.id)));
    }
  };

  // Single Approve & Publish
  const handleApproveSingle = useCallback(
    async (item: ReviewListItem) => {
      if (item.missing.length > 0) {
        showToast(`Cannot publish "${item.title.slice(0, 30)}..." — ${item.missing.length} fields missing. Open details to edit.`, 'error');
        return;
      }
      setPublishingId(item.id);
      startTransition(async () => {
        try {
          const res = await publishOpportunityAction(item.id);
          if (res.ok) {
            hide([item.id]);
            setJustPublished((prev) => [item, ...prev]);
            showToast(`Published: "${item.title.slice(0, 40)}..."`);
            router.refresh();
          } else {
            showToast(`Not published: ${res.error || 'unknown error'}`, 'error');
          }
        } catch {
          showToast('Failed to publish draft', 'error');
        } finally {
          setPublishingId(null);
        }
      });
    },
    [router]
  );

  // Single Reject
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    startTransition(async () => {
      try {
        const res = await setOpportunityStatusAction(rejectingItem.id, 'archived', rejectionReason);
        if (res.ok) {
          hide([rejectingItem.id]);
          showToast(`Rejected: "${rejectingItem.title.slice(0, 30)}..."`);
          setRejectingItem(null);
          router.refresh();
        } else {
          showToast(res.error || 'Failed to reject draft', 'error');
        }
      } catch {
        showToast('Failed to reject draft', 'error');
      }
    });
  };

  // Batch Approve
  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (!confirm(`Publish ${ids.length} selected draft${ids.length > 1 ? 's' : ''} to the live site? Drafts with missing information are skipped.`)) {
      return;
    }

    startTransition(async () => {
      const done = await inBatches(ids, async (id) => (await publishOpportunityAction(id)).ok);
      const published = done.length;
      hide(done);
      setJustPublished((prev) => [...items.filter((d) => done.includes(d.id)), ...prev]);
      setSelectedIds(new Set());
      showToast(
        published === ids.length
          ? `Published ${published} draft${published > 1 ? 's' : ''}.`
          : `Published ${published} of ${ids.length}. The rest need information first.`,
        published === ids.length ? 'success' : 'error',
      );
      router.refresh();
    });
  };

  // Batch Reject
  const handleBatchReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (!confirm(`Reject ${ids.length} selected draft${ids.length > 1 ? 's' : ''}? They will not go live.`)) {
      return;
    }

    startTransition(async () => {
      const done = await inBatches(ids, async (id) =>
        (await setOpportunityStatusAction(id, 'archived', 'Batch rejected by staff review')).ok,
      );
      const rejected = done.length;
      hide(done);
      setSelectedIds(new Set());
      showToast(`Rejected ${rejected} draft${rejected === 1 ? '' : 's'}.`);
      router.refresh();
    });
  };

  // Keyboard Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      // Ctrl/Cmd/Alt combos belong to the browser (Ctrl+A used to publish a draft, Ctrl+R to open Reject).
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // A dialog is open: its own keys only (A used to publish the row behind the Reject box).
      if (rejectingItem || showHotkeysHelp) {
        if (e.key === 'Escape') setShowHotkeysHelp(false);
        return;
      }

      if (visible.length === 0) return;

      const currentItem = visible[Math.min(focusedIndex, visible.length - 1)];

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < visible.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' || e.key === 'o') {
        if (currentItem) {
          router.push(`/review/${currentItem.id}`);
        }
      } else if (e.key === 'x') {
        e.preventDefault();
        if (currentItem) handleToggleSelect(currentItem.id);
      } else if (e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        if (currentItem) handleApproveSingle(currentItem);
      } else if (e.key === 'r') {
        e.preventDefault();
        if (currentItem) setRejectingItem(currentItem);
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        if (currentItem) {
          if (currentItem.source_url) {
            window.open(currentItem.source_url, '_blank');

          } else {
            router.push(`/review/${currentItem.id}`);
          }
        }
      } else if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleSelectHighConfidence();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHotkeysHelp((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, focusedIndex, router, handleApproveSingle, rejectingItem, showHotkeysHelp]);

  // Rejection modal numerical shortcuts (1-5) and Escape
  useEffect(() => {
    if (!rejectingItem) return;
    const handleModalKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= QUICK_REJECTION_REASONS.length) {
        e.preventDefault();
        setRejectionReason(QUICK_REJECTION_REASONS[num - 1]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setRejectingItem(null);
      }
    };
    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [rejectingItem]);

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl p-4 text-xs font-bold shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
              : 'bg-rose-950 text-rose-200 border-rose-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="size-4 text-emerald-400" />
          ) : (
            <CircleAlert className="size-4 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Selection + shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/15 bg-white px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-teal">
            <input
              type="checkbox"
              checked={selectedIds.size > 0 && selectedIds.size === visible.length}
              onChange={handleSelectAll}
              className="size-4 rounded border-teal/30 text-teal focus:ring-teal"
            />
            Select all on this page
          </label>
          <button
            type="button"
            onClick={handleSelectHighConfidence}
            className="font-semibold text-teal/70 underline-offset-2 hover:text-teal hover:underline"
          >
            Select ready drafts (90%+ confidence)
          </button>
          {selectedIds.size > 0 && <span className="font-bold text-teal">{selectedIds.size} selected</span>}
        </div>
        <button
          type="button"
          onClick={() => setShowHotkeysHelp(true)}
          className="inline-flex items-center gap-1.5 font-semibold text-teal/60 hover:text-teal"
        >
          <Keyboard className="size-4" aria-hidden="true" /> Keyboard shortcuts <kbd className="rounded bg-teal/10 px-1 font-mono">?</kbd>
        </button>
      </div>

      {justPublished.length > 0 && (
        <Card className="overflow-hidden border-emerald-200 p-0">
          <p className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
            Just published ({justPublished.length}), now live on the site
          </p>
          <ul className="divide-y divide-emerald-100">
            {justPublished.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <span className="min-w-0 truncate text-sm font-semibold text-teal">{d.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    <CircleCheck className="size-3" aria-hidden="true" /> Published
                  </span>
                  <Link href={`/opportunities/${d.id}`} className="text-xs font-semibold text-teal/70 hover:text-teal">
                    View <ArrowRight className="inline size-3" aria-hidden="true" />
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Drafts List Card */}
      <Card className="overflow-hidden p-0">
        {/* Table Header */}
        <div className="hidden gap-4 border-b border-teal/10 bg-paper/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-teal/60 lg:grid lg:grid-cols-[28px_minmax(0,1fr)_110px_120px_minmax(150px,190px)_auto]">
          <span />
          <span>Draft</span>
          <span>Found</span>
          <span>Confidence</span>
          <span>Readiness</span>
          <span className="text-right">Actions</span>
        </div>

        <ul className="divide-y divide-teal/10">
          {visible.map((d, index) => {
            const isFocused = focusedIndex === index;
            const isSelected = selectedIds.has(d.id);
            const isReady = d.missing.length === 0;

            return (
              <li
                key={d.id}
                onClick={() => setFocusedIndex(index)}
                className={`transition-colors ${
                  isFocused ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : isSelected ? 'bg-teal/5' : 'hover:bg-cream/40'
                }`}
              >
                <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-5 py-3.5 lg:grid-cols-[28px_minmax(0,1fr)_110px_120px_minmax(150px,190px)_auto]">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(d.id)}
                    aria-label={`Select ${d.title}`}
                    className="size-4 cursor-pointer rounded border-teal/30 text-teal focus:ring-teal"
                  />

                  {/* Title, then organisation · type · source · care flag */}
                  <div className="min-w-0">
                    <Link href={`/review/${d.id}`} className="line-clamp-2 text-sm font-bold leading-snug text-teal hover:underline">
                      {d.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-teal/70">
                      <span>{d.organization}</span>
                      <span aria-hidden="true">·</span>
                      <span>{TYPE_LABEL[d.type as keyof typeof TYPE_LABEL] ?? d.type}</span>
                      {d.source_key && (
                        <span className="rounded bg-teal/8 px-1.5 py-px font-mono text-[10px] font-bold uppercase text-teal/80">
                          {d.source_key}
                        </span>
                      )}
                      {d.needs_care && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-px text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
                          <AlertTriangle className="size-2.5" aria-hidden="true" /> Check carefully
                        </span>
                      )}
                    </p>
                  </div>

                  <span className="col-start-2 text-xs text-teal/70 lg:col-start-auto">
                    <span className="lg:hidden">Found </span>
                    {formatFoundAt(d.found_at)}
                  </span>

                  <div className="col-start-2 lg:col-start-auto">
                    {d.confidence === null ? (
                      <span className="text-xs text-teal/50">Not scored</span>
                    ) : (
                      <ConfidenceMeter value={d.confidence} />
                    )}
                  </div>

                  {/* Readiness: say WHAT is missing, not just how many */}
                  <div className="col-start-2 min-w-0 lg:col-start-auto" title={isReady ? 'Ready to publish' : d.missing.join('\n')}>
                    {isReady ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                        <CircleCheck className="size-3" aria-hidden="true" /> Ready to publish
                      </span>
                    ) : d.missing[0].startsWith('Last date passed') ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 ring-1 ring-rose-200">
                        <CircleAlert className="size-3" aria-hidden="true" /> Expired · last date {d.last_date}
                      </span>
                    ) : (
                      <span className="flex min-w-0 items-start gap-1 text-[11px] font-medium text-amber-900">
                        <CircleAlert className="mt-px size-3 shrink-0 text-amber-600" aria-hidden="true" />
                        <span className="min-w-0">
                          Missing: {d.missing[0].replace(/ \(.*\)$/, '').toLowerCase()}
                          {d.missing.length > 1 && <span className="text-teal/50"> +{d.missing.length - 1} more</span>}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="col-start-2 flex items-center gap-1.5 lg:col-start-auto lg:justify-end">
                    <button
                      type="button"
                      disabled={!isReady || isPending}
                      onClick={() => handleApproveSingle(d)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-600/30"
                      title={isReady ? 'Publish (A)' : `Can't publish yet. Missing: ${d.missing.join(', ')}`}
                    >
                      {publishingId === d.id ? (
                        <>
                          <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Publishing…
                        </>
                      ) : (
                        <>
                          <Send className="size-3" aria-hidden="true" /> Publish
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setRejectingItem(d)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-40"
                      title="Reject (R)"
                    >
                      <Trash2 className="size-3" aria-hidden="true" /> Reject
                    </button>
                    <Link
                      href={`/review/${d.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-teal/70 transition hover:bg-teal/10 hover:text-teal"
                      title="Open draft and PDF (Enter)"
                    >
                      Open <ArrowRight className="size-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Floating Batch Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-teal/20 bg-teal p-3.5 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
          <span className="text-xs font-bold pl-2">
            {selectedIds.size} draft{selectedIds.size > 1 ? 's' : ''} selected
          </span>

          <div className="h-4 w-px bg-white/20" />

          <button
            type="button"
            disabled={isPending}
            onClick={handleBatchApprove}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            <span>Publish {selectedIds.size}</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleBatchReject}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-white/20 transition-colors"
          >
            <Trash2 className="size-3.5" />
            <span>Reject {selectedIds.size}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-lg text-white/60 hover:text-white transition-colors"
            title="Clear selection"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div role="dialog" aria-modal="true" aria-labelledby="reject-title" className="w-full max-w-md rounded-3xl border border-teal/20 bg-canvas p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal/10">
              <h3 id="reject-title" className="text-sm font-bold text-teal">Reject draft</h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="p-1 rounded-lg text-teal/60 hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-teal/80">
              <strong className="text-teal">&ldquo;{rejectingItem.title}&rdquo;</strong> will not go live.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-teal">
                Reason (press 1–5 or click)
              </label>
              <div className="space-y-1.5">
                {QUICK_REJECTION_REASONS.map((reason, idx) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReason(reason)}
                    className={cn(
                      'w-full text-left p-2 rounded-xl border text-xs flex items-center gap-2.5 transition',
                      rejectionReason === reason
                        ? 'border-rose-500 bg-rose-50 font-bold text-rose-950 ring-1 ring-rose-500/30'
                        : 'border-teal/15 bg-white text-teal hover:border-teal/40',
                    )}
                  >
                    <span className="grid size-5 place-items-center rounded bg-slate-900 text-white font-mono text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{reason}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-teal/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-teal/70 hover:bg-teal/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-sm"
              >
                {isPending ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotkeys Cheat Sheet Modal */}
      {showHotkeysHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div role="dialog" aria-modal="true" aria-labelledby="keys-title" className="w-full max-w-md rounded-3xl border border-teal/20 bg-canvas p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal/10">
              <div className="flex items-center gap-2">
                <Keyboard className="size-5 text-teal" />
                <h3 id="keys-title" className="text-base font-bold text-teal">Keyboard shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHotkeysHelp(false)}
                className="p-1 rounded-lg text-teal/60 hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-teal">
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Navigate Down / Up</span>
                <span className="font-mono bg-teal/10 px-2 py-0.5 rounded font-bold">J / K or Down / Up</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Open Focused Draft</span>
                <span className="font-mono bg-teal/10 px-2 py-0.5 rounded font-bold">Enter or O</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Select / Deselect Draft</span>
                <span className="font-mono bg-teal/10 px-2 py-0.5 rounded font-bold">X</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Publish the highlighted draft</span>
                <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">A</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Reject the highlighted draft</span>
                <span className="font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">R</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Select Rejection Preset</span>
                <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">1 – 5</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Open Source PDF / Link</span>
                <span className="font-mono bg-teal/10 px-2 py-0.5 rounded font-bold">V</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-medium">Select ready drafts (90%+)</span>
                <span className="font-mono bg-teal/10 px-2 py-0.5 rounded font-bold">Shift + A</span>
              </div>
            </div>

            <div className="pt-3 border-t border-teal/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHotkeysHelp(false)}
                className="px-4 py-2 rounded-xl bg-teal text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
