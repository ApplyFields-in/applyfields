import type { InstitutionListResponse, InstitutionSummary } from '@applyfields/types';
import { buttonClass, Card, PageHeader } from '@applyfields/ui';
import { Building, Columns, Search } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';
import { CollegesGridClient } from './colleges-grid-client';

export const metadata = {
  title: 'Colleges & Universities Directory',
  description:
    'Explore premier universities and colleges across India with verified NIRF rankings, placement statistics, fees, and programs.',
};

interface CollegesPageProps {
  searchParams: Promise<{ q?: string; type?: string; state?: string; page?: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  institute: 'National Institute',
  university: 'University',
  college: 'College',
  autonomous: 'Autonomous College',
  deemed: 'Deemed University',
};

export default async function CollegesPage({ searchParams }: CollegesPageProps) {
  const sp = await searchParams;
  const q = sp.q || '';
  const type = sp.type || '';
  const state = sp.state || '';
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);

  await connection();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (type) queryParams.set('type', type);
  if (state) queryParams.set('state', state);
  queryParams.set('page', String(page));
  queryParams.set('limit', '20');

  const res = await apiGet<InstitutionListResponse | InstitutionSummary[]>(
    `/career/colleges?${queryParams.toString()}`,
  );

  const colleges: InstitutionSummary[] = Array.isArray(res) ? res : res?.items || [];
  const total = Array.isArray(res) ? res.length : res?.total || 0;
  const totalPages = Array.isArray(res) ? 1 : res?.total_pages || 1;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Admissions & Campus Profiles"
          title="Colleges & Universities"
          description="Verified directory of 13,000+ higher education institutions, fee structures, NIRF rankings, NBA accreditations, and placement packages."
          icon={<Building />}
        />
        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/career/colleges/compare?slugs=iit-madras,bits-pilani"
            className={buttonClass({ variant: 'primary', size: 'md', className: 'gap-2 shadow-clay' })}
          >
            <Columns className="size-4" /> Compare Colleges
          </Link>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <Card className="p-4 space-y-3">
        <form action="/career/colleges" method="GET" className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search colleges by name, city, district, or ranking..."
              className="h-10 w-full rounded-full border border-line bg-canvas pl-9 pr-4 text-xs font-medium text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
            />
          </div>
          {type && <input type="hidden" name="type" value={type} />}
          {state && <input type="hidden" name="state" value={state} />}
          <button type="submit" className={buttonClass({ variant: 'primary', size: 'sm' })}>
            Search
          </button>
          {(q || type || state) && (
            <Link
              href="/career/colleges"
              className={buttonClass({ variant: 'ghost', size: 'sm' })}
            >
              Clear
            </Link>
          )}
        </form>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line/40 text-xs">
          <span className="text-[11px] font-semibold text-teal/60">Filter Type:</span>
          {['', 'institute', 'university', 'college'].map((tKey) => {
            const isActive = type === tKey;
            const p = new URLSearchParams();
            if (q) p.set('q', q);
            if (tKey) p.set('type', tKey);
            if (state) p.set('state', state);
            return (
              <Link
                key={tKey || 'all'}
                href={`/career/colleges${p.size ? `?${p}` : ''}`}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-teal text-cream shadow-sm'
                    : 'bg-canvas text-teal/70 hover:bg-tea/30 border border-line/60'
                }`}
              >
                {tKey ? TYPE_LABELS[tKey] || tKey : 'All Types'}
              </Link>
            );
          })}

          <span className="ml-2 text-[11px] font-semibold text-teal/60">Top States:</span>
          {['AP', 'TS', 'TN', 'KA', 'MH', 'DL', 'UP'].map((stKey) => {
            const isActive = state === stKey;
            const p = new URLSearchParams();
            if (q) p.set('q', q);
            if (type) p.set('type', type);
            if (!isActive) p.set('state', stKey);
            return (
              <Link
                key={stKey}
                href={`/career/colleges${p.size ? `?${p}` : ''}`}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-tea text-teal border border-teal/40 font-bold'
                    : 'bg-canvas text-teal/70 hover:bg-tea/20 border border-line/60'
                }`}
              >
                {stKey}
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Paginated Colleges Grid with Save and Interactive Comparison Dock */}
      <CollegesGridClient
        colleges={colleges}
        total={total}
        page={page}
        limit={20}
        totalPages={totalPages}
        q={q}
        type={type}
        state={state}
      />
    </div>
  );
}
