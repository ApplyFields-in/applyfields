import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

/* ------------------------------------------------------------------ Card */

const cardTones = {
  surface: 'bg-cream border border-cream',
  teal: 'bg-teal text-cream',
  sea: 'bg-sea text-cream',
  celadon: 'bg-celadon text-teal',
  tea: 'bg-tea text-teal',
} as const;

export type Tone = keyof typeof cardTones;

export function Card({
  tone = 'surface',
  interactive = false,
  className,
  children,
  ...rest
}: { tone?: Tone; interactive?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-card shadow-card', interactive && 'clay-lift', cardTones[tone], className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Badge */

const badgeTones = {
  celadon: 'bg-celadon text-teal shadow-clay',
  tea: 'bg-tea text-teal shadow-clay',
  teal: 'bg-teal text-cream shadow-clay',
  cream: 'bg-cream text-teal shadow-clay',
  outline: 'border border-teal/20 text-teal',
} as const;

export function Badge({
  tone = 'tea',
  className,
  children,
}: {
  tone?: keyof typeof badgeTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&>svg]:size-3.5 [&>svg]:shrink-0',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Progress */

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-teal/10 shadow-pressed', className)}
    >
      <div className="h-full rounded-full bg-sea shadow-clay transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ Avatar */

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-celadon text-xs font-bold text-teal shadow-clay ring-2 ring-cream',
        className,
      )}
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------ IconTile */

const tileTones = {
  teal: 'bg-teal text-cream',
  sea: 'bg-sea text-cream',
  celadon: 'bg-celadon text-teal',
  tea: 'bg-tea text-teal',
  cream: 'bg-cream text-teal border border-line',
} as const;

export function IconTile({
  tone = 'tea',
  className,
  children,
}: {
  tone?: keyof typeof tileTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-2xl shadow-clay [&>svg]:size-5',
        tileTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Headings */

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {icon && (
          <IconTile tone="teal" className="size-12 rounded-2xl [&>svg]:size-6">
            {icon}
          </IconTile>
        )}
        <div>
          {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal/80">{eyebrow}</div>}
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-teal/80">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ Empty state */

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl bg-canvas px-6 py-10 text-center shadow-pressed',
        className,
      )}
    >
      {icon && <IconTile tone="tea" className="mb-3 size-12 [&>svg]:size-6">{icon}</IconTile>}
      <p className="font-bold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-teal/80">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
