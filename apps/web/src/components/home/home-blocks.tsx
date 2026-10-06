import type { HomeStat, OpportunityCard, UpdateItem } from '@applyfields/types';
import { Avatar, Badge, buttonClass, Card, cn, EmptyState, ProgressBar, SectionTitle } from '@applyfields/ui';
import { ArrowRight, Bookmark, CircleCheck, Circle, Clock, HandHelping, Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatDate, TYPE_META, UPDATE_LABEL } from '@/lib/format';

/* ------------------------------------------------------------------ hero */

export function Hero({ popular }: { popular: string[] }) {
  return (
    <Card tone="teal" className="relative overflow-hidden p-6 sm:p-8">
      <div aria-hidden="true" className="absolute -right-16 -top-20 size-64 rounded-full bg-sea/50" />
      <div aria-hidden="true" className="absolute -bottom-24 right-28 size-48 rounded-full bg-celadon/25" />
      <div aria-hidden="true" className="absolute right-10 top-10 hidden size-16 rotate-12 rounded-2xl bg-cream/15 md:block" />

      <div className="relative max-w-2xl">
        <Badge tone="celadon">Every opportunity. One place.</Badge>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
          Find it, understand it, apply with confidence.
        </h1>
        <p className="mt-2 text-cream/85">
          Government jobs, exams, scholarships, admissions and services — explained simply and checked against your
          profile.
        </p>

        <form action="/search" role="search" className="mt-5 flex items-center gap-2 rounded-full bg-cream p-1.5 pl-4 shadow-pressed">
          <Search className="size-5 shrink-0 text-teal/80" aria-hidden="true" />
          <input
            name="q"
            type="search"
            aria-label="Search ApplyFields"
            placeholder="Try “SSC CGL”, “NEET” or “income certificate”"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-teal outline-none placeholder:text-teal/80"
          />
          <button type="submit" className={buttonClass()}>
            Search
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-cream/85">Popular:</span>
          {popular.map((q) => (
            <Link
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              className="clay-press rounded-full bg-cream/10 px-3 py-1 font-medium text-cream shadow-clay hover:bg-cream/20"
            >
              {q}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ stats */

const BARS = [40, 65, 50, 80, 60, 95, 70];

export function StatsRow({ stats }: { stats: HomeStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {stats.map((s, i) => (
        <Card key={s.key} interactive className="p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-teal/80">{s.label}</p>
            <div aria-hidden="true" className="flex h-7 items-end gap-0.5">
              {BARS.map((h, j) => (
                <span
                  key={j}
                  className={cn('w-1 rounded-full', j === BARS.length - 1 ? 'bg-sea' : 'bg-celadon')}
                  style={{ height: `${(h * (0.6 + ((i + j) % 4) * 0.12)) | 0}%` }}
                />
              ))}
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{s.value.toLocaleString('en-IN')}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold">
            <TrendingUp className="size-3.5 text-sea" aria-hidden="true" /> {s.hint}
          </p>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ closing soon */

export function ClosingSoon({ items }: { items: OpportunityCard[] }) {
  return (
    <Card tone="teal" className="p-5">
      <SectionTitle
        title={
          <span className="flex items-center gap-2">
            <Clock className="size-4 text-celadon" aria-hidden="true" /> Closing soon
          </span>
        }
        action={
          <Link href="/jobs" className="text-xs font-semibold text-celadon hover:underline">
            All deadlines
          </Link>
        }
      />
      {items.length === 0 && <p className="text-sm text-cream/80">Nothing closes in the next 12 days.</p>}
      <ul className="space-y-2">
        {items.map((o) => (
          <li key={o.slug}>
            <Link
              href={`${TYPE_META[o.type].base}/${o.slug}`}
              className="clay-press flex items-center gap-3 rounded-3xl bg-cream/10 p-3 shadow-clay hover:bg-cream/15"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-center text-teal shadow-clay">
                <span className="text-base font-extrabold leading-none">{o.days_left}</span>
                <span className="sr-only"> days left</span>
                <span aria-hidden="true" className="-mt-2 text-[9px] font-bold uppercase">days</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{o.title}</p>
                <p className="truncate text-xs text-cream/80">
                  {o.organization} · {TYPE_META[o.type].label}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-celadon" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ updates */

export function LatestUpdates({ items }: { items: UpdateItem[] }) {
  return (
    <Card className="p-5">
      <SectionTitle
        title="Results & updates"
        action={
          <Link href="/updates" className="text-xs font-semibold hover:underline">
            See all
          </Link>
        }
      />
      {items.length === 0 && <p className="text-sm text-teal/80">No results or admit cards published yet.</p>}
      <ul className="divide-y divide-teal/10">
        {items.map((u) => (
          <li key={u.id} className="py-2.5">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={u.kind === 'result' || u.kind === 'admit_card' ? 'celadon' : 'tea'}>{UPDATE_LABEL[u.kind]}</Badge>
              <span className="text-xs text-teal/80">{formatDate(u.date)}</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold">{u.organization}</p>
            <p className="text-xs text-teal/80">{u.title}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ calendar */

const pad = (n: number) => String(n).padStart(2, '0');

export function DeadlineCalendar({ deadlines }: { deadlines: OpportunityCard[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startPad = (new Date(year, month, 1).getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const byDate = new Map<string, OpportunityCard[]>();
  for (const d of deadlines) {
    if (d.last_date) byDate.set(d.last_date, [...(byDate.get(d.last_date) ?? []), d]);
  }
  const cells: (number | null)[] = [...Array(startPad).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <Card className="p-5">
      <SectionTitle
        title="Deadline calendar"
        action={<Badge tone="tea">{now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Badge>}
      />
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="py-1 font-bold text-teal/80">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`pad-${i}`} />;
          const key = `${year}-${pad(month + 1)}-${pad(day)}`;
          const due = byDate.get(key);
          const isToday = day === now.getDate();
          return (
            <span
              key={key}
              title={due?.map((d) => d.title).join(', ')}
              className={cn(
                'relative grid aspect-square place-items-center rounded-full text-[13px] font-semibold',
                due ? 'bg-teal text-cream shadow-clay' : 'text-teal',
                isToday && !due && 'ring-2 ring-sea',
              )}
            >
              {day}
              {due && <span className="absolute bottom-1 size-1 rounded-full bg-celadon" aria-hidden="true" />}
            </span>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-teal/80">
        <span className="size-3 rounded-full bg-teal" aria-hidden="true" /> Last date ·
        <span className="size-3 rounded-full ring-2 ring-sea" aria-hidden="true" /> Today
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ side cards */

export function ProfileStrength() {
  const steps = ['Personal details', 'Education', 'Category & state', 'Career interests'];
  return (
    <Card tone="celadon" className="p-5">
      <p className="text-sm font-bold">Your eligibility profile</p>
      <p className="mt-0.5 text-xs">Fill it once — we check every opportunity against it.</p>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={0} label="Profile completed" />
        <span className="text-sm font-extrabold">0%</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-2 text-sm">
            <Circle className="size-4" aria-hidden="true" /> {s}
          </li>
        ))}
      </ul>
      <Link href="/register" className={buttonClass({ className: 'mt-4 w-full' })}>
        Create free profile
      </Link>
    </Card>
  );
}

export function SavedPreview() {
  return (
    <Card className="p-5">
      <SectionTitle title="Saved items" />
      <EmptyState
        icon={<Bookmark />}
        title="Nothing saved yet"
        text="Save jobs, exams and scholarships to get reminders before the last date."
        action={
          <Link href="/login" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            Log in to save
          </Link>
        }
        className="py-6"
      />
    </Card>
  );
}

export function AssistancePromo() {
  return (
    <Card tone="tea" className="p-5">
      <HandHelping className="size-6" aria-hidden="true" />
      <p className="mt-2 font-bold">Need help applying?</p>
      <p className="mt-0.5 text-sm">Verified MeeSeva, CSC and browsing centres near you — see the charges before you pay.</p>
      <div className="mt-3 flex -space-x-2">
        {['MeeSeva', 'CSC Centre', 'Sai Browsing', 'Typing Point'].map((n) => (
          <Avatar key={n} name={n} />
        ))}
      </div>
      <Link href="/assistance" className={buttonClass({ variant: 'primary', size: 'sm', className: 'mt-4' })}>
        Find a centre <ArrowRight aria-hidden="true" />
      </Link>
    </Card>
  );
}

export function TrustNote() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card bg-canvas px-5 py-4 text-sm shadow-pressed">
      {['Official links only', 'Never invents fees or eligibility', 'Shows when info was last verified', 'Your documents stay private'].map((t) => (
        <span key={t} className="flex items-center gap-2 font-semibold">
          <CircleCheck className="size-4 text-sea" aria-hidden="true" /> {t}
        </span>
      ))}
    </div>
  );
}

