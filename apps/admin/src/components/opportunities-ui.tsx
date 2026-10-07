'use client';

import { useState, useTransition } from 'react';
import type { OpportunityStatus, OpportunityType } from '@applyfields/types';
import { Badge, buttonClass, cn } from '@applyfields/ui';
import { AlertCircle, CheckCircle2, Clock, Play, RotateCw, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { closeExpiredOpportunitiesAction } from '@/lib/actions';

export const STATUS_LABEL: Record<OpportunityStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
  archived: 'Archived',
};

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  switch (status) {
    case 'published':
      return <Badge tone="teal">Live</Badge>;
    case 'draft':
      return <Badge tone="celadon">Draft</Badge>;
    case 'closed':
      return <Badge tone="tea">Closed</Badge>;
    case 'archived':
      return <Badge tone="outline">Archived</Badge>;
    default:
      return <Badge tone="tea">{status}</Badge>;
  }
}

export function CloseExpiredButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const handleSweep = () => {
    setResult(null);
    startTransition(async () => {
      const res = await closeExpiredOpportunitiesAction();
      if (res.ok) {
        setResult(`Closed ${res.data?.closed ?? 0} expired job(s)`);
        router.refresh();
      } else {
        setResult(res.error ?? 'Sweep failed');
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs font-semibold text-teal/80 animate-fade-in">{result}</span>}
      <button
        type="button"
        onClick={handleSweep}
        disabled={isPending}
        className={buttonClass({ variant: 'secondary', size: 'sm' })}
        title="Check deadlines and close all jobs past their last date now"
      >
        <RotateCw className={cn('size-3.5', isPending && 'animate-spin')} aria-hidden="true" />
        {isPending ? 'Sweeping...' : 'Run auto-close'}
      </button>
    </div>
  );
}
