import type { OpportunityCard, OpportunityList, OpportunityType } from '@applyfields/types';
import { Badge, BuildStatus, Card, EmptyState, IconTile, PageHeader, SectionTitle } from '@applyfields/ui';
import { Bookmark, CalendarDays, ChevronDown, CircleCheck, GraduationCap, MapPin, Search, Users, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { API_URL, apiGet } from '@/lib/api';
import { daysLeftLabel, formatDate, TYPE_META, urgencyTone } from '@/lib/format';

/* ------------------------------------------------------------------ one card */

export function OpportunityCardView({ item }: { item: OpportunityCard }) {
  const meta = TYPE_META[item.type];
  return (
    <Card interactive className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <IconTile tone={meta.tone}>{meta.icon}</IconTile>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-teal/80">{item.organization}</p>
          <Link href={`${meta.base}/${item.slug}`} className="mt-0.5 line-clamp-2 font-bold leading-snug hover:underline">
            {item.title}
          </Link>
        </div>
        <Link
          href="/login"
          aria-label={`Save ${item.title}`}
          className="clay-press grid size-8 shrink-0 place-items-center rounded-full bg-cream shadow-clay hover:bg-tea"
        >
          <Bookmark className="size-4" />
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="outline">
          <MapPin aria-hidden="true" /> {item.location}
        </Badge>
        <Badge tone="outline">
          <GraduationCap aria-hidden="true" /> {item.qualification}
        </Badge>
        {item.vacancies !== null && (
          <Badge tone="outline">
            <Users aria-hidden="true" /> {item.vacancies.toLocaleString('en-IN')} posts
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="flex items-center gap-1.5 text-xs text-teal/80">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {item.last_date ? `Last date ${formatDate(item.last_date)}` : 'Dates not announced'}
        </span>
        <Badge tone={urgencyTone(item.days_left)}>{daysLeftLabel(item.days_left)}</Badge>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ API offline */

export function ApiOffline() {
  return (
    <Card tone="tea" className="flex items-start gap-3 p-5">
      <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">Can’t reach the API</p>
        <p className="mt-1 text-sm">
          The website reads its data from <code className="font-mono">{API_URL}</code>. Start the API with{' '}
          <code className="font-mono font-semibold">pnpm dev:api</code> (or <code className="font-mono font-semibold">pnpm dev</code> to run
          everything).
        </p>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ filters (look only) */

export function FilterBar({ placeholder, categories }: { placeholder: string; categories: string[] }) {
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row">
        <form action="/search" role="search" className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/80" aria-hidden="true" />
          <input
            name="q"
            type="search"
            aria-label={placeholder}
            placeholder={placeholder}
            className="h-11 w-full rounded-full bg-cream pl-10 pr-4 text-sm shadow-pressed outline-none transition-shadow placeholder:text-teal/80 focus:shadow-clay"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          {['State', 'Qualification', 'Category', 'Last date', 'Eligible for me'].map((f) => (
            <button
              key={f}
              type="button"
              aria-disabled="true"
              title="Filters arrive with this page's build"
              className="clay-press inline-flex h-11 cursor-not-allowed items-center gap-1.5 rounded-full bg-cream px-4 text-sm font-semibold shadow-clay"
            >
              {f} <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 pt-1">
        <span className="shrink-0 rounded-full bg-teal px-3.5 py-1.5 text-xs font-semibold text-cream shadow-clay">All</span>
        {categories.map((c) => (
          <span key={c} className="shrink-0 rounded-full bg-cream px-3.5 py-1.5 text-xs font-semibold shadow-clay">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ list page */

export async function OpportunityListPage({
  type,
  title,
  description,
  icon,
  owner,
  when,
  categories,
  features,
}: {
  type: OpportunityType;
  title: string;
  description: string;
  icon: ReactNode;
  owner: string;
  when: string;
  categories: string[];
  features: string[];
}) {
  await connection();
  const data = await apiGet<OpportunityList>(`/opportunities?type=${type}`);
  const meta = TYPE_META[type];

  return (
    <>
      <PageHeader eyebrow="Apply mode" title={title} description={description} icon={icon} actions={<BuildStatus owner={owner} when={when} />} />
      <FilterBar placeholder={`Search ${meta.plural}…`} categories={categories} />

      {data === null ? (
        <ApiOffline />
      ) : data.total === 0 ? (
        <EmptyState icon={meta.icon} title={`No open ${meta.plural} yet`} text="Every notification is checked against the official source before it appears here — new ones show up as soon as our team publishes them." />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              {data.total} {meta.plural} · closing soonest first
            </p>
            {data.sample && <Badge tone="celadon">Sample data from the API</Badge>}
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data.items.map((item) => (
              <OpportunityCardView key={item.slug} item={item} />
            ))}
          </div>
        </>
      )}

      <Card className="mt-6 p-5">
        <SectionTitle title="Coming to this page" />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
