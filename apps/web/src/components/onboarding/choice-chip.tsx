'use client';

import { Check, type LucideIcon } from 'lucide-react';

/** A selectable option on the setup screens: icon + label, check mark when picked. */
export function ChoiceChip({
  icon: Icon,
  label,
  hint,
  selected,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
        selected ? 'border-sea bg-sea/5 shadow-[0_10px_24px_-16px_var(--color-sea)]' : 'border-line bg-cream hover:border-sea/40'
      }`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${selected ? 'bg-sea text-cream' : 'bg-tea text-sea'}`}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-teal">{label}</span>
        {hint && <span className="block text-xs text-teal/55">{hint}</span>}
      </span>
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${selected ? 'border-sea bg-sea text-cream' : 'border-line'}`}
        aria-hidden="true"
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
