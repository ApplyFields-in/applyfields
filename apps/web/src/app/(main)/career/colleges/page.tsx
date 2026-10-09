import type { InstitutionSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, EmptyState, PageHeader } from '@applyfields/ui';
import {
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  Columns,
  GraduationCap,
  MapPin,
  Search,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';

export const metadata = {
  title: 'Colleges & Universities Directory',
  description: 'Explore premier universities and colleges across India with verified NIRF rankings, placement statistics, fees, and programs.',
};

interface CollegesPageProps {
  searchParams: Promise<{ q?: string; type?: string; state?: string }>;
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

  await connection();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (type) queryParams.set('type', type);
  if (state) queryParams.set('state', state);

  const colleges = await apiGet<InstitutionSummary[]>(
    `/career/colleges${queryParams.size ? `?${queryParams}` : ''}`,
  );

  const list = colleges || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Admissions & Campus Profiles"
          title="Colleges & Universities"
          description="Verified profiles of India's premier higher education institutions, fee structures, NIRF rankings, and placement packages."
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

      {/* Search & Compare Teaser Bar */}
      <Card className="p-4 space-y-3">
        <form action="/career/colleges" method="GET" className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search colleges by name, city, or ranking..."
              className="h-10 w-full rounded-full border border-line bg-canvas pl-9 pr-4 text-xs font-medium text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
            />
          </div>
          <button type="submit" className={buttonClass({ variant: 'primary', size: 'sm' })}>
            Search
          </button>
          {q && (
            <Link
              href="/career/colleges"
              className={buttonClass({ variant: 'ghost', size: 'sm' })}
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      {/* Colleges Grid */}
      {list.length === 0 ? (
        <EmptyState
          icon={<Building />}
          title="No institutions found"
          text="Try broadening your search term or clear filters."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((c) => (
            <Card
              key={c.id}
              className="group flex flex-col justify-between p-6 transition-all hover:border-teal/40 hover:shadow-clay"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="teal" className="text-[11px]">
                    {TYPE_LABELS[c.type] || c.type}
                  </Badge>
                  {c.ranking_text && (
                    <Badge tone="tea" className="gap-1 text-[11px] font-bold">
                      <Award className="size-3" /> {c.ranking_text}
                    </Badge>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-bold text-teal group-hover:underline">
                  {c.name}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs font-medium text-teal/70">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-teal/50" /> {c.city}, {c.state_code}
                  </span>
                  {c.ownership && (
                    <span>· {c.ownership === 'government' ? 'Government / Central' : c.ownership.toUpperCase()}</span>
                  )}
                </div>

                {/* Placement & Fees highlights */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-tea/30 p-3 text-xs">
                  <div>
                    <span className="text-[11px] text-teal/70 font-medium">Placement Avg</span>
                    <p className="font-bold text-teal mt-0.5">
                      {c.placement_stats?.avg_package || 'Industry standard'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-teal/70 font-medium">Annual Tuition Fee</span>
                    <p className="font-bold text-teal mt-0.5 truncate" title={c.fees_text || ''}>
                      {c.fees_text || 'Subsidized'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                <span className="text-xs font-semibold text-teal/70">
                  {c.courses_count || 0} Programs Offered
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/career/colleges/compare?slugs=${c.slug}`}
                    className={buttonClass({ variant: 'secondary', size: 'sm', className: 'text-xs' })}
                  >
                    Compare
                  </Link>
                  <Link
                    href={`/career/colleges/${c.slug}`}
                    className={buttonClass({ variant: 'primary', size: 'sm', className: 'gap-1 shadow-clay' })}
                  >
                    View College <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
