'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReviewListItem } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Command,
  FileClock,
  Inbox,
  Keyboard,
  Layers,
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

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
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
    const highConf = items.filter((d) => (d.confidence ?? 0) >= 0.9 && d.missing.length === 0);
    const ids = new Set(highConf.map((d) => d.id));
    setSelectedIds(ids);
    showToast(`Selected ${ids.size} high-confidence (>90%) ready drafts.`);
  };

  // Select all expired/stale notifications
  const handleSelectExpired = () => {
    const stale = items.filter((d) => d.needs_care || d.missing.length > 2);
    const ids = new Set(stale.map((d) => d.id));
    setSelectedIds(ids);
    showToast(`Selected ${ids.size} stale/incomplete drafts for cleanup.`);
  };

  // Select all drafts
  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((d) => d.id)));
    }
  };

  // Single Approve & Publish
  const handleApproveSingle = useCallback(
    async (item: ReviewListItem) => {
      if (item.missing.length > 0) {
        showToast(`Cannot publish "${item.title.slice(0, 30)}..." — ${item.missing.length} fields missing. Open details to edit.`, 'error');
        return;
      }
      startTransition(async () => {
        try {
          const res = await publishOpportunityAction(item.id);
          if (res.ok) {
            showToast(`Published: "${item.title.slice(0, 40)}..."`);
            router.refresh();
          } else {
            showToast(res.error || 'Failed to publish draft', 'error');
          }
        } catch {
          showToast('Failed to publish draft', 'error');
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

    if (!confirm(`Approve and publish all ${ids.length} selected opportunities to the live platform?`)) {
      return;
    }

    startTransition(async () => {
      let published = 0;
      for (const id of ids) {
        try {
          const res = await publishOpportunityAction(id);
          if (res.ok) published++;
        } catch {
          // continue
        }
      }
      setSelectedIds(new Set());
      showToast(`Batch published ${published} of ${ids.length} opportunities!`);
      router.refresh();
    });
  };

  // Batch Reject
  const handleBatchReject = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (!confirm(`Reject all ${ids.length} selected drafts?`)) {
      return;
    }

    startTransition(async () => {
      let rejected = 0;
      for (const id of ids) {
        try {
          const res = await setOpportunityStatusAction(id, 'archived', 'Batch rejected by staff review');
          if (res.ok) rejected++;
        } catch {
          // continue
        }
      }
      setSelectedIds(new Set());
      showToast(`Batch rejected ${rejected} opportunities.`);
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

      if (items.length === 0) return;

      const currentItem = items[focusedIndex];

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
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
            showToast(`Opened source document: "${currentItem.title.slice(0, 30)}..."`);
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
  }, [items, focusedIndex, router, handleApproveSingle]);

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

      {/* Hotkeys Bar & Batch Actions Tray */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-teal/15 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1 rounded-lg border border-teal/20 bg-canvas text-teal font-semibold hover:bg-teal/10 transition-colors"
          >
            {selectedIds.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
          </button>

          <button
            type="button"
            onClick={handleSelectHighConfidence}
            className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors"
          >
            Select High Confidence (&gt;90%)
          </button>

          <button
            type="button"
            onClick={handleSelectExpired}
            className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-semibold hover:bg-amber-100 transition-colors"
          >
            Select Stale / Incomplete
          </button>

          {selectedIds.size > 0 && (
            <span className="font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-md text-[11px]">
              {selectedIds.size} Selected
            </span>
          )}
        </div>

        {/* Hotkeys Quick Reference Pill */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-teal/70 font-mono">
            <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">J / K</span>
            <span>Navigate</span>
            <span className="text-teal/30">·</span>
            <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">A</span>
            <span>Approve</span>
            <span className="text-teal/30">·</span>
            <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">R</span>
            <span>Reject</span>
            <span className="text-teal/30">·</span>
            <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">V</span>
            <span>PDF</span>
            <span className="text-teal/30">·</span>
            <span className="rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal">X</span>
            <span>Select</span>
          </div>

          <button
            type="button"
            onClick={() => setShowHotkeysHelp(true)}
            className="p-1 rounded-lg text-teal/60 hover:text-teal hover:bg-teal/10 transition-colors"
            title="Keyboard shortcuts help"
          >
            <Keyboard className="size-4" />
          </button>
        </div>
      </div>

      {/* Drafts List Card */}
      <Card className="overflow-hidden p-0">
        {/* Table Header */}
        <div className="hidden grid-cols-[36px_minmax(0,1fr)_110px_120px_120px_130px_110px] gap-4 border-b border-teal/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-teal/70 lg:grid">
          <span />
          <span>Draft Details</span>
          <span>Source</span>
          <span>Confidence</span>
          <span>Found</span>
          <span>Readiness</span>
          <span className="text-right">Actions</span>
        </div>

        <ul className="divide-y divide-teal/10">
          {items.map((d, index) => {
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
                <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 lg:grid-cols-[36px_minmax(0,1fr)_110px_120px_120px_130px_110px]">
                  {/* Select Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(d.id)}
                      className="size-4 rounded border-teal/30 text-teal focus:ring-teal cursor-pointer"
                    />
                  </div>

                  {/* Title & Organization */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/review/${d.id}`}
                        className="truncate font-bold text-teal hover:underline text-sm"
                      >
                        {d.title}
                      </Link>
                      {isFocused && (
                        <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-mono font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-teal/80">
                      <span>{d.organization}</span>
                      <span>·</span>
                      <span>{TYPE_LABEL[d.type as keyof typeof TYPE_LABEL] ?? d.type}</span>
                      {d.needs_care && (
                        <Badge tone="celadon" className="text-[10px] py-0.2">
                          <AlertTriangle className="size-2.5 mr-1 inline" /> Check carefully
                        </Badge>
                      )}
                    </p>
                  </div>

                  {/* Source Key */}
                  <span className="text-xs font-semibold uppercase lg:text-sm">
                    <span className="text-teal/70 lg:hidden">Source: </span>
                    <span className="font-mono bg-teal/10 px-1.5 py-0.5 rounded text-[11px] text-teal">
                      {d.source_key ?? '—'}
                    </span>
                  </span>

                  {/* Confidence */}
                  <div>
                    <ConfidenceMeter value={d.confidence} />
                  </div>

                  {/* Found At */}
                  <span className="text-xs text-teal/80 lg:text-sm">
                    {formatFoundAt(d.found_at)}
                  </span>

                  {/* Readiness Badge */}
                  <div>
                    {isReady ? (
                      <Badge tone="teal" className="text-[11px]">
                        <CircleCheck className="size-3 mr-1 inline text-emerald-600" /> Ready
                      </Badge>
                    ) : (
                      <Badge tone="outline" className="bg-cream text-[11px]">
                        <CircleAlert className="size-3 mr-1 inline text-amber-600" /> {d.missing.length} missing
                      </Badge>
                    )}
                  </div>

                  {/* Quick Hotkey Action Buttons */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={!isReady || isPending}
                      onClick={() => handleApproveSingle(d)}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 transition-colors border border-emerald-200"
                      title="Quick Publish (Hotkey: A)"
                    >
                      <Send className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setRejectingItem(d)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition-colors border border-rose-200"
                      title="Quick Reject (Hotkey: R)"
                    >
                      <Trash2 className="size-3.5" />
                    </button>

                    <Link
                      href={`/review/${d.id}`}
                      className="p-1.5 rounded-lg text-teal/60 hover:text-teal hover:bg-teal/10 transition-colors"
                      title="Inspect Notice & PDF (Hotkey: Enter)"
                    >
                      <ArrowRight className="size-3.5" />
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
            <span>Approve &amp; Publish Batch</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleBatchReject}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-white/20 transition-colors"
          >
            <Trash2 className="size-3.5" />
            <span>Reject Selected</span>
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
          <div className="w-full max-w-md rounded-3xl border border-teal/20 bg-canvas p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal/10">
              <h3 className="text-sm font-bold text-teal">Reject Scraped Draft</h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="p-1 rounded-lg text-teal/60 hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-teal/80">
              Rejecting <strong className="text-teal">&ldquo;{rejectingItem.title}&rdquo;</strong> from publication queue.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-teal">
                Select Rejection Reason (Press 1–5 or Click)
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
                {isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotkeys Cheat Sheet Modal */}
      {showHotkeysHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-teal/20 bg-canvas p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal/10">
              <div className="flex items-center gap-2">
                <Keyboard className="size-5 text-teal" />
                <h3 className="text-base font-bold text-teal">Review Queue Hotkeys</h3>
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
                <span className="font-medium">Quick Approve &amp; Publish</span>
                <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">A</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-teal/5">
                <span className="font-medium">Quick Reject (Modal)</span>
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
                <span className="font-medium">Select All High Confidence (&gt;90%)</span>
                <span className="font-mono bg-teal/10 px-2 py-0.5 rounded font-bold">Shift + A</span>
              </div>
            </div>

            <div className="pt-3 border-t border-teal/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHotkeysHelp(false)}
                className="px-4 py-2 rounded-xl bg-teal text-white text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
