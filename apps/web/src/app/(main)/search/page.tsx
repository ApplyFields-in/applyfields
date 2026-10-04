import type { OpportunityList } from '@applyfields/types';
import { Badge, BuildStatus, buttonClass, EmptyState, PageHeader } from '@applyfields/ui';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline, OpportunityCardView } from '@/components/opportunity';
import { apiGet } from '@/lib/api';

export const metadata = { title: 'Search' };

const TABS = ['All', 'Jobs', 'Exams', 'Scholarships', 'Services', 'Admissions', 'Careers', 'Courses', 'Colleges'];
const EXAMPLES = ['SSC CGL', 'NEET', 'Telangana', 'scholarship', 'police'];

/** Universal search (founder doc §6) — today it searches the sample opportunities via GET /api/v1/opportunities?q= */
export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.trim() : '';
  await connection();
  const data = query ? await apiGet<OpportunityList>(`/opportunities?q=${encodeURIComponent(query)}`) : null;

  return (
    <>
      <PageHeader
        eyebrow="Universal search"
        title={query ? `Results for “${query}”` : 'Search ApplyFields'}
        description="Jobs, exams, scholarships, services, admissions, careers, courses and colleges — every result shows what type it is."
        icon={<Search />}
        actions={<BuildStatus owner="Harsha" when="Week 6" />}
      />

      <form action="/search" role="search" className="mb-4 flex items-center gap-2 rounded-full border border-line bg-cream p-1.5 pl-4 shadow-card">
        <Search className="size-5 shrink-0 text-teal/80" aria-hidden="true" />
        <input
          name="q"
          type="search"
          defaultValue={query}
          aria-label="Search ApplyFields"
          placeholder="Search by name, organisation, state or qualification…"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-teal/80"
        />
        <button type="submit" className={buttonClass()}>
          Search
        </button>
      </form>

      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t, i) => (
          <span
            key={t}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${i === 0 ? 'bg-teal text-cream' : 'bg-cream ring-1 ring-line'}`}
          >
            {t}
          </span>
        ))}
      </div>

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
        <EmptyState icon={<Search />} title="No matches yet" text="The search only covers sample jobs, exams, scholarships and admissions for now." />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{data.total} results</p>
            {data.sample && <Badge tone="celadon">Sample data from the API</Badge>}
          </div>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data.items.map((item) => (
              <OpportunityCardView key={item.slug} item={item} />
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-teal/80">
        Services, careers, courses and colleges join the search in Week 6, with suggestions while you type.
      </p>
    </>
  );
}
