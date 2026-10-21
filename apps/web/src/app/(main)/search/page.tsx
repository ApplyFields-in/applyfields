import type { SearchResponse, SearchResult, SearchResultType } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, IconTile, PageHeader } from '@applyfields/ui';
import { CalendarDays, MapPin, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline, FilterBar, type ListSearchParams } from '@/components/opportunity';
import { SearchAnalyticsTracker } from '@/components/analytics-tracker';
import { apiGet } from '@/lib/api';
import { daysLeftLabel, formatDate, Highlight, RESULT_META, urgencyTone } from '@/lib/format';

export const metadata = { title: 'Search' };

/** FilterBar's pills set ?category=<label>; on this page they pick the result type. */
const TYPES: Record<string, SearchResultType> = {
  Jobs: 'govt_job',
  Exams: 'exam',
  Scholarships: 'scholarship',
  Admissions: 'admission',
  Services: 'service',
};
const SORTS: Record<string, string> = { relevance: 'Best match', deadline: 'Closing soonest' };
const EXAMPLES = ['SSC CGL', 'NEET', 'Telangana', 'scholarship', 'PAN card'];
const PARAMS = ['q', 'category', 'state', 'qualification', 'deadline', 'sort'] as const;

/** Universal search (founder doc §6): GET /api/v1/search across jobs, exams, scholarships, admissions and services. */
export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const raw = await searchParams;
  const sp: ListSearchParams = {};
  for (const k of PARAMS) {
    const v = raw[k];
    if (typeof v === 'string' && v.trim()) sp[k] = v.trim();
  }
  if (sp.sort && !SORTS[sp.sort]) delete sp.sort;
  const query = sp.q ?? '';
  const type = sp.category ? TYPES[sp.category] : undefined;

  await connection();
  const api = new URLSearchParams({ q: query });
  if (type) api.set('type', type);
  for (const k of ['state', 'qualification', 'deadline', 'sort'] as const) if (sp[k]) api.set(k, sp[k]);
  const data = query ? await apiGet<SearchResponse>(`/search?${api}`) : null;

  const sortHref = (sort: string) => `/search?${new URLSearchParams({ ...(sp as Record<string, string>), sort })}`;
  const currentSort = sp.sort ?? 'relevance';

  return (
    <>
      <SearchAnalyticsTracker query={query} totalResults={data?.total ?? 0} />
      <PageHeader
        eyebrow="Universal search"
        title={query ? `Results for “${query}”` : 'Search ApplyFields'}
        description="Jobs, exams, scholarships, admissions and government services — every result shows what type it is. Careers, courses and colleges join in v3."
        icon={<Search />}
      />

      <FilterBar
        basePath="/search"
        placeholder="Search by name, organisation or exam — typos are fine"
        categories={Object.keys(TYPES)}
        searchParams={sp}
      />

      {!query ? (
        <EmptyState
          icon={<Search />}
          title="What are you looking for?"
          text="Try one of these:"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((e) => (
                <Link key={e} href={`/search?q=${encodeURIComponent(e)}`} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                  {e}
                </Link>
              ))}
            </div>
          }
        />
      ) : data === null ? (
        <ApiOffline />
      ) : data.total === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={<Search />}
            title="No matches"
            text="Search covers published, open jobs, exams, scholarships, admissions and services. Try fewer words or the board name (SSC, APPSC), or clear the filters."
          />
          {data.related && data.related.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-cream p-4 shadow-clay">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal/70">
                <Sparkles className="size-3.5 text-teal" /> Try searching for
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {data.related.map((rel) => (
                  <Link
                    key={rel}
                    href={`/search?q=${encodeURIComponent(rel)}`}
                    className="clay-press rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-teal shadow-clay hover:bg-tea"
                  >
                    {rel}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {data.related && data.related.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-cream px-4 py-2.5 shadow-clay">
              <span className="flex items-center gap-1.5 text-xs font-bold text-teal/70">
                <Sparkles className="size-3.5 text-teal" /> Related searches:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.related.map((rel) => (
                  <Link
                    key={rel}
                    href={`/search?q=${encodeURIComponent(rel)}`}
                    className="clay-press rounded-full bg-tea/60 px-2.5 py-1 text-xs font-semibold text-teal hover:bg-tea"
                  >
                    {rel}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-teal">
              {data.total} {data.total === 1 ? 'result' : 'results'}
            </p>
            <nav aria-label="Sort results" className="flex gap-1.5">
              {Object.entries(SORTS).map(([value, label]) => (
                <Link
                  key={value}
                  href={sortHref(value)}
                  aria-current={currentSort === value ? 'true' : undefined}
                  className={cn(
                    'clay-press rounded-full px-3 py-1.5 text-xs font-semibold shadow-clay',
                    currentSort === value ? 'bg-teal text-cream' : 'bg-cream text-teal hover:bg-tea',
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data.items.map((item) => (
              <ResultCard key={item.url} item={item} query={query} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ResultCard({ item, query }: { item: SearchResult; query: string }) {
  const meta = RESULT_META[item.type];
  return (
    <Card interactive className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <IconTile tone={meta.tone}>{meta.icon}</IconTile>
        <div className="min-w-0 flex-1">
          {item.subtitle && <p className="truncate text-xs font-semibold text-teal/80">{item.subtitle}</p>}
          <Link href={item.url} className="mt-0.5 line-clamp-2 font-bold leading-snug text-teal hover:underline">
            <Highlight text={item.title} query={query} />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="cream">{meta.label}</Badge>
        <Badge tone="outline">
          <MapPin aria-hidden="true" /> {item.location}
        </Badge>
      </div>

      {item.type !== 'service' && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="flex items-center gap-1.5 text-xs text-teal/80">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {item.last_date ? `Last date ${formatDate(item.last_date)}` : 'Dates not announced'}
          </span>
          <Badge tone={urgencyTone(item.days_left)}>{daysLeftLabel(item.days_left)}</Badge>
        </div>
      )}
    </Card>
  );
}
