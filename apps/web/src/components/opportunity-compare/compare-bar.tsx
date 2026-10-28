'use client';

import { useCompare } from './compare-context';
import Link from 'next/link';
import { ArrowRight, GitCompare, X, Trash2 } from 'lucide-react';
import { Badge } from '@applyfields/ui';
import { TYPE_META } from '@/lib/format';

export function CompareFloatingBar() {
  const { items, removeItem, clear } = useCompare();

  if (items.length === 0) return null;

  const compareUrl =
    items.length === 2
      ? `/compare?a=${encodeURIComponent(items[0].slug)}&b=${encodeURIComponent(items[1].slug)}`
      : `/compare?a=${encodeURIComponent(items[0].slug)}`;

  return (
    <aside aria-label="Opportunity comparison tray" className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-auto sm:min-w-[620px] max-w-3xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-tea/40 bg-teal/95 p-3 sm:px-4 sm:py-3 text-cream shadow-2xl backdrop-blur-md">
        {/* Left: Indicator & slots */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-celadon mr-1">
            <GitCompare className="size-4" />
            <span className="hidden sm:inline">Compare</span>
            <span>({items.length}/2)</span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial overflow-x-auto">
            {/* Slot 1 */}
            <div className="flex items-center gap-2 rounded-xl bg-cream/15 px-3 py-1.5 text-xs text-cream max-w-[190px] sm:max-w-[210px]">
              <span className="truncate font-semibold">{items[0].title}</span>
              <button
                type="button"
                onClick={() => removeItem(items[0].slug)}
                className="rounded-full p-0.5 hover:bg-cream/20 text-cream/70 hover:text-cream shrink-0"
                title="Remove"
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Slot 2 */}
            {items[1] ? (
              <div className="flex items-center gap-2 rounded-xl bg-cream/15 px-3 py-1.5 text-xs text-cream max-w-[190px] sm:max-w-[210px]">
                <span className="truncate font-semibold">{items[1].title}</span>
                <button
                  type="button"
                  onClick={() => removeItem(items[1].slug)}
                  className="rounded-full p-0.5 hover:bg-cream/20 text-cream/70 hover:text-cream shrink-0"
                  title="Remove"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center rounded-xl border border-dashed border-tea/30 px-3 py-1.5 text-xs text-cream/60 italic">
                + Select 2nd opportunity
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={clear}
            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-cream/70 hover:text-cream transition hover:bg-cream/10"
            title="Clear comparison"
          >
            Clear
          </button>

          <Link
            href={compareUrl}
            className={`clay-press inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-clay transition-all ${
              items.length === 2
                ? 'bg-celadon text-teal hover:bg-celadon/90 ring-2 ring-celadon/50'
                : 'bg-tea/40 text-cream hover:bg-tea/60'
            }`}
          >
            <span>{items.length === 2 ? 'Compare Now' : 'View (1/2)'}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
