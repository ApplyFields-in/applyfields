'use client';

import { useState, useTransition } from 'react';
import { buttonClass, Card, cn } from '@applyfields/ui';
import { CircleAlert, CircleCheck, Edit, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publishOpportunityAction, setOpportunityStatusAction } from '@/lib/actions';

export function ReviewActions({ id, missing }: { id: string; missing: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  const handleReject = () => {
    const reason = prompt('Reason for rejecting / archiving this draft:');
    if (!reason) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await setOpportunityStatusAction(id, 'archived', reason);
      if (res.ok) {
        router.push('/review');
      } else {
        setErrorMsg(res.error ?? 'Failed to reject draft');
      }
    });
  };

  return (
    <Card tone={ready ? 'teal' : 'surface'} className="p-5">
      <div className="flex items-start gap-3">
        {ready ? (
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-celadon" aria-hidden="true" />
        ) : (
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {ready ? 'Ready to publish' : `${missing.length} thing${missing.length === 1 ? '' : 's'} to fix before publishing`}
          </p>
          {ready ? (
            <p className="mt-1 text-sm text-cream/80">Every required field is present. Compare against the PDF on the left.</p>
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
          <Send aria-hidden="true" />
          {isPending ? 'Publishing...' : 'Publish'}
        </button>

        <Link
          href={`/opportunities/${id}`}
          className={buttonClass({ variant: ready ? 'inverse' : 'secondary', size: 'sm' })}
        >
          <Edit aria-hidden="true" /> Full editor
        </Link>

        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className={buttonClass({ variant: ready ? 'inverse' : 'secondary', size: 'sm' })}
        >
          <X aria-hidden="true" /> Reject draft
        </button>
      </div>
    </Card>
  );
}
