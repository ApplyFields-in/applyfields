'use client';

import type { ReviewSort } from '@applyfields/types';
import { ArrowUpDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: 'newest', label: 'Newest found' },
  { value: 'oldest', label: 'Oldest found' },
  { value: 'closing', label: 'Closing soonest' },
  { value: 'confidence', label: 'Lowest confidence first' },
];

/** Sort for the review queue; keeps the other filters, goes back to page 1. */
export function ReviewSortMenu({ value }: { value: ReviewSort }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-teal/70">
      <ArrowUpDown className="size-3.5" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Sort</span>
      <select
        value={value}
        onChange={(e) => {
          const q = new URLSearchParams(params.toString());
          if (e.target.value === 'newest') q.delete('sort');
          else q.set('sort', e.target.value);
          q.delete('page');
          router.push(q.size ? `/review?${q}` : '/review');
        }}
        className="h-8 rounded-full border border-teal/15 bg-cream px-3 text-xs font-semibold text-teal shadow-clay focus:outline-none focus:ring-2 focus:ring-teal/30"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
