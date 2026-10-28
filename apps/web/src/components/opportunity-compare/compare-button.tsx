'use client';

import { useCompare, type CompareItem } from './compare-context';
import { GitCompare } from 'lucide-react';
import { cn } from '@applyfields/ui';

export function CompareToggleButton({
  item,
  variant = 'icon',
}: {
  item: CompareItem;
  variant?: 'icon' | 'pill';
}) {
  const { hasItem, toggleItem } = useCompare();
  const selected = hasItem(item.slug);

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={() => toggleItem(item)}
        aria-pressed={selected}
        title={selected ? 'Remove from comparison' : 'Add to side-by-side comparison'}
        className={cn(
          'clay-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-clay transition-all',
          selected
            ? 'bg-teal text-cream ring-2 ring-celadon/50'
            : 'bg-cream text-teal hover:bg-tea',
        )}
      >
        <GitCompare className="size-3.5" />
        <span>{selected ? 'Comparing' : 'Compare'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleItem(item)}
      aria-pressed={selected}
      title={selected ? 'Remove from comparison' : 'Compare side-by-side with another opportunity'}
      className={cn(
        'clay-press grid size-8 shrink-0 place-items-center rounded-full shadow-clay transition-all',
        selected
          ? 'bg-teal text-cream ring-2 ring-celadon/60'
          : 'bg-cream text-teal/80 hover:bg-tea hover:text-teal',
      )}
    >
      <GitCompare className="size-3.5" />
    </button>
  );
}
