'use client';

import { useState, useTransition } from 'react';
import { buttonClass, Card, cn } from '@applyfields/ui';
import { CircleAlert, CircleCheck, Edit, Send, TriangleAlert, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publishOpportunityAction, setOpportunityStatusAction } from '@/lib/actions';

const QUICK_REJECTION_REASONS = [
  'Duplicate of existing live opportunity',
  'Corrupted or unreadable notification PDF',
  'Not an official government notification / Commercial spam',
  'Application deadline expired prior to ingestion',
  'Eligibility criteria missing from source text',
];

export function ReviewActions({ id, missing }: { id: string; missing: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const router = useRouter();
  const ready = missing.length === 0;

  const handlePublish = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await publishOpportunityAction(id);
      if (res.ok) {
        router.push('/review');
      } else {
        setErrorMsg(res.error ?? 'Cannot publish draft');
      }
    });
  };

  const handleConfirmReject = () => {
    const finalReason = rejectReason.trim() || 'Rejected during administrative review';
    setErrorMsg(null);
    startTransition(async () => {
      const res = await setOpportunityStatusAction(id, 'archived', finalReason);
      if (res.ok) {
        setShowRejectModal(false);
        router.push('/review');
      } else {
        setErrorMsg(res.error ?? 'Failed to reject draft');
      }
    });
  };

  return (
    <>
      <Card tone={ready ? 'teal' : 'surface'} className="p-5">
        <div className="flex items-start gap-3">
          {ready ? (
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-celadon" aria-hidden="true" />
          ) : (
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {ready
                ? 'Ready to publish'
                : `${missing.length} thing${missing.length === 1 ? '' : 's'} to fix before publishing`}
            </p>
            {ready ? (
              <p className="mt-1 text-sm text-cream/80">
                Every required field is present. Compare against the PDF on the left.
              </p>
            ) : (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {errorMsg && (
          <p className="mt-3 text-xs font-bold text-red-200">
            ⚠️ {errorMsg}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={!ready || isPending}
            className={buttonClass({ variant: ready ? 'accent' : 'primary', size: 'sm' })}
          >
            <Send aria-hidden="true" className="size-3.5" />
            {isPending ? 'Publishing...' : 'Publish to live portal'}
          </button>

          <Link
            href={`/opportunities/${id}`}
            className={buttonClass({ variant: ready ? 'inverse' : 'secondary', size: 'sm' })}
          >
            <Edit aria-hidden="true" className="size-3.5" /> Full editor
          </Link>

          <button
            type="button"
            onClick={() => {
              setRejectReason('');
              setShowRejectModal(true);
            }}
            disabled={isPending}
            className={buttonClass({ variant: ready ? 'inverse' : 'secondary', size: 'sm' })}
          >
            <X aria-hidden="true" className="size-3.5" /> Reject draft
          </button>
        </div>
      </Card>

      {/* Reject / Archive Modal Dialog */}
      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border border-line bg-canvas p-6 text-teal shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base text-red-600">
                <TriangleAlert className="size-5 shrink-0" />
                <h3>Reject &amp; Archive Draft</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-full p-1 text-teal/60 hover:bg-cream hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-teal/80 leading-relaxed">
              This draft will be removed from the active review queue and archived with an audit log reason.
            </p>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-teal">Select a reason or enter custom notes:</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REJECTION_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border',
                      rejectReason === preset
                        ? 'border-teal bg-teal text-cream'
                        : 'border-line/70 bg-cream text-teal/80 hover:bg-tea',
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejecting this draft..."
                rows={3}
                className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={isPending}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                {isPending ? 'Archiving...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
