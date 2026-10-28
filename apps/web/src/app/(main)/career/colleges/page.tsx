import type { InstitutionListResponse, InstitutionSummary } from '@applyfields/types';
import { BookOpen, Briefcase, Building2, Columns, Route, Search, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';
import { CollegesGridClient } from './colleges-grid-client';
import { ActiveFilterTray, type ActiveFilterItem } from '@/components/active-filter-tray';

export const metadata = {
  title: 'Colleges & Universities Directory',
  description:
    'Explore premier universities and colleges across India with verified NIRF rankings, placement statistics, fees, and programs.',
};

interface CollegesPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    state?: string;
    page?: string;
    stream?: string;
    category?: string;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  institute: 'National Institute',
  university: 'University',
  college: 'College',
  autonomous: 'Autonomous College',
  deemed: 'Deemed University',
};

const STREAM_TABS = [
  { key: '', label: 'All Colleges' },
  { key: 'top-50-engg', label: 'Top 50 Engineering' },
  { key: 'medical', label: 'Top 50 Medical' },
  { key: 'management', label: 'Management' },
  { key: 'polytechnic', label: 'Polytechnic' },
  { key: 'architecture', label: 'Architecture & Town Planning' },
  { key: 'pharmacy', label: 'Pharmacy' },
];

export default async function CollegesPage({ searchParams }: CollegesPageProps) {
  const sp = await searchParams;
  const q = sp.q || '';
  const type = sp.type || '';
  const state = sp.state || '';
  const stream = (sp.stream || sp.category || '').toLowerCase();
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);

  await connection();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (type) queryParams.set('type', type);
  if (state) queryParams.set('state', state);
  if (stream) queryParams.set('stream', stream);
  queryParams.set('page', String(page));
  queryParams.set('limit', '20');

  const res = await apiGet<InstitutionListResponse | InstitutionSummary[]>(
    `/career/colleges?${queryParams.toString()}`,
  );

  let colleges: InstitutionSummary[] = Array.isArray(res) ? res : res?.items || [];
  let total = Array.isArray(res) ? res.length : res?.total || 0;
  let totalPages = Array.isArray(res) ? 1 : res?.total_pages || 1;

  // Fallback to verified top 50 colleges dataset if backend is offline or empty
  if (colleges.length === 0) {
    const { filterTop50Colleges } = await import('@/lib/top-50-colleges-data');
    const fallback = filterTop50Colleges(q, type, state, stream);
    if (fallback.length > 0) {
      const limit = 20;
      total = fallback.length;
      totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      colleges = fallback.slice(start, start + limit);
    }
  }

  // Determine dynamic heading information based on selected stream
  let eyebrow = 'Admissions & Campus Profiles';
  let title = 'Colleges & Universities in India';
  let description =
    'Verified directory of 13,000+ higher education institutions, fee structures, NIRF rankings, NBA accreditations, and placement packages.';

  if (stream === 'top-50-engg' || stream === 'top-50' || stream === 'engineering') {
    eyebrow = 'National Institutional Ranking Framework (NIRF 2024 / 2025)';
    title = 'Top 50 Engineering Colleges in India';
    description =
      'Explore official NIRF rankings, branch-specific cutoffs, fee matrices, and placement packages for India’s premier IITs, NITs, BITS, and technical institutes.';
  } else if (stream === 'management' || stream === 'mba') {
    eyebrow = 'Business Schools & Management Programmes';
    title = 'Management Colleges in India';
    description =
      'Explore accredited business schools, MBA/PGDM colleges, executive leadership programs, and corporate placement records across India.';
  } else if (stream === 'polytechnic' || stream === 'diploma') {
    eyebrow = 'Technical Education & Diplomas';
    title = 'Polytechnic Colleges in India';
    description =
      'Institutions offering 3-year technical engineering diplomas, practical lab skills, and state board certified vocational curricula.';
  } else if (stream === 'architecture') {
    eyebrow = 'Design, Planning & Architecture';
    title = 'Architecture & Town Planning Colleges';
    description =
      'Council of Architecture approved colleges offering B.Arch, Planning, Interior Architecture, and Sustainable Urban Design.';
  } else if (stream === 'pharmacy') {
    eyebrow = 'Pharmaceutical Sciences & Healthcare';
    title = 'Pharmacy Colleges in India';
    description =
      'PCI-approved colleges offering B.Pharm, M.Pharm, and pharmaceutical healthcare research credentials.';
  } else if (stream === 'medical' || stream === 'top-50-medical' || stream === 'top-50-med') {
    eyebrow = 'National Institutional Ranking Framework (NIRF Medical / NMC)';
    title = 'Top 50 Medical Colleges in India';
    description =
      'Explore official NIRF medical rankings, MBBS & MD/MS clinical specializations, NEET cutoffs, subsidized fee structures, and premier hospital residency stipends.';
  }

  return (
    <div>
      {/* Warm Yellowish Top Section matching Career Mode in Screenshot */}
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
        <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-8 pb-6 sm:pt-10 sm:pb-7 sm:px-6 lg:px-8">
          {/* Header Title Area - Clean Text Only, NO Badge/Icon beside title */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#76562d]">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-sm text-[#435775]">{description}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Link
                href="/career/colleges/compare?slugs=iit-madras,bits-pilani"
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition-colors shadow-sm"
              >
                <Columns className="size-4 text-[#0e7bf4]" /> Compare Colleges
              </Link>
            </div>
          </div>

          {/* Navigation Resources Links - Rectangular */}
          <nav aria-label="Career resources" className="flex flex-wrap items-center gap-2">
            <Link
              href="/career"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#082046] hover:bg-[#ffffff]"
            >
              <Briefcase className="size-4 text-[#0e7bf4]" /> Career Mode
            </Link>
            <Link
              href="/career/roadmaps"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#082046] hover:bg-[#ffffff]"
            >
              <Route className="size-4 text-[#0e7bf4]" /> Roadmaps
            </Link>
            <Link
              href="/career/courses"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#082046] hover:bg-[#ffffff]"
            >
              <BookOpen className="size-4 text-[#0e7bf4]" /> Courses
            </Link>
            <Link
              href="/career/colleges"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#082046] bg-[#082046] px-3.5 text-xs font-medium text-[#ffffff]"
            >
              <Building2 className="size-4 text-amber-300" /> Colleges &amp; universities
            </Link>
          </nav>

          {/* Stream Category Tabs - Rectangular rounded-md, NO badges beside titles */}
          <nav aria-label="College categories" className="flex gap-2 overflow-x-auto pt-1 scrollbar-none">
            {STREAM_TABS.map((tab) => {
              const isActive = stream === tab.key;
              const p = new URLSearchParams();
              if (tab.key) p.set('stream', tab.key);
              if (q) p.set('q', q);
              if (type) p.set('type', type);
              if (state) p.set('state', state);

              return (
                <Link
                  key={tab.key || 'all'}
                  href={`/career/colleges${p.size ? `?${p}` : ''}`}
                  className={`min-h-9 shrink-0 inline-flex items-center rounded-md border px-3.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-[#082046] bg-[#082046] text-[#ffffff]'
                      : 'border-[#dec9a5] bg-[#f8f5ef] text-[#243b5b] hover:bg-[#ffffff]'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Main Content Body with Soft Neutral Parchment Background */}
      <div className="bg-[#F2F1ED] min-h-screen">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 py-6 pb-12 sm:px-6 lg:px-8">
          {/* Medical Stream Banner */}
          {stream === 'medical' && (
            <div className="rounded-md border border-[#dec9a5] bg-[#F4E8D1] p-4 text-[#76562d] flex items-start gap-3">
              <Stethoscope className="size-5 shrink-0 text-[#0e7bf4] mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-[#082046]">Top 50 Medical Colleges in India (NIRF &amp; NMC Verified)</p>
                <p className="text-[#435775] leading-relaxed">
                  Showing India&apos;s premier medical institutions including AIIMS New Delhi, PGIMER, CMC Vellore, JIPMER, and top state government medical colleges with NEET-UG &amp; NEET-PG cutoff benchmarks, MBBS/MD seats, annual tuition, and residency stipends.
                </p>
              </div>
            </div>
          )}

          {/* Search & Filters Container - Rectangular rounded-md with warm yellowish styling */}
          <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-4 space-y-3">
            <form action="/career/colleges" method="GET" className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#76562d]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder={
                    stream === 'top-50-engg'
                      ? 'Search top 50 engineering colleges, IITs, NITs, cutoffs...'
                      : 'Search colleges by name, city, district, or ranking...'
                  }
                  className="h-9 w-full rounded-md border border-[#dec9a5] bg-[#ffffff] pl-9 pr-4 text-xs font-medium text-[#082046] placeholder:text-[#536780]/60 focus:border-[#082046] focus:outline-none"
                />
              </div>
              {stream && <input type="hidden" name="stream" value={stream} />}
              {type && <input type="hidden" name="type" value={type} />}
              {state && <input type="hidden" name="state" value={state} />}
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-4 text-xs font-bold text-[#082046] hover:bg-[#ffffff] transition-colors"
              >
                Search
              </button>
              {(q || type || state || stream) && (
                <Link
                  href={stream ? `/career/colleges?stream=${stream}` : '/career/colleges'}
                  className="inline-flex h-9 items-center rounded-md border border-transparent px-3 text-xs font-medium text-[#536780] hover:text-[#082046]"
                >
                  Reset
                </Link>
              )}
            </form>

            {/* Quick Filter Rectangular Boxes */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#dec9a5]/50 text-xs">
              <span className="text-[11px] font-semibold text-[#76562d]">Filter Type:</span>
              {['', 'institute', 'university', 'college'].map((tKey) => {
                const isActive = type === tKey;
                const p = new URLSearchParams();
                if (stream) p.set('stream', stream);
                if (q) p.set('q', q);
                if (tKey) p.set('type', tKey);
                if (state) p.set('state', state);
                return (
                  <Link
                    key={tKey || 'all'}
                    href={`/career/colleges${p.size ? `?${p}` : ''}`}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                      isActive
                        ? 'border-[#082046] bg-[#082046] text-[#ffffff]'
                        : 'border-[#dec9a5] bg-[#ffffff] text-[#243b5b] hover:bg-[#F4E8D1]'
                    }`}
                  >
                    {tKey ? TYPE_LABELS[tKey] || tKey : 'All Types'}
                  </Link>
                );
              })}

              <span className="ml-2 text-[11px] font-semibold text-[#76562d]">Top States:</span>
              {['AP', 'TS', 'TN', 'KA', 'MH', 'DL', 'UP'].map((stKey) => {
                const isActive = state === stKey;
                const p = new URLSearchParams();
                if (stream) p.set('stream', stream);
                if (q) p.set('q', q);
                if (type) p.set('type', type);
                if (!isActive) p.set('state', stKey);
                return (
                  <Link
                    key={stKey}
                    href={`/career/colleges${p.size ? `?${p}` : ''}`}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                      isActive
                        ? 'border-[#082046] bg-[#082046] text-[#ffffff]'
                        : 'border-[#dec9a5] bg-[#ffffff] text-[#243b5b] hover:bg-[#F4E8D1]'
                    }`}
                  >
                    {stKey}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Active Filter Chips & Dismissible Clear All Bar */}
          {(() => {
            const activeFilters: ActiveFilterItem[] = [];
            if (stream) {
              const tab = STREAM_TABS.find((t) => t.key === stream);
              const p = new URLSearchParams();
              if (q) p.set('q', q);
              if (type) p.set('type', type);
              if (state) p.set('state', state);
              activeFilters.push({
                key: 'stream',
                label: 'Category',
                displayValue: tab?.label || stream,
                removeHref: `/career/colleges${p.size ? `?${p}` : ''}`,
              });
            }
            if (type) {
              const p = new URLSearchParams();
              if (stream) p.set('stream', stream);
              if (q) p.set('q', q);
              if (state) p.set('state', state);
              activeFilters.push({
                key: 'type',
                label: 'Type',
                displayValue: TYPE_LABELS[type] || type,
                removeHref: `/career/colleges${p.size ? `?${p}` : ''}`,
              });
            }
            if (state) {
              const p = new URLSearchParams();
              if (stream) p.set('stream', stream);
              if (q) p.set('q', q);
              if (type) p.set('type', type);
              activeFilters.push({
                key: 'state',
                label: 'State',
                displayValue: state,
                removeHref: `/career/colleges${p.size ? `?${p}` : ''}`,
              });
            }
            if (q) {
              const p = new URLSearchParams();
              if (stream) p.set('stream', stream);
              if (type) p.set('type', type);
              if (state) p.set('state', state);
              activeFilters.push({
                key: 'q',
                label: 'Search',
                displayValue: `"${q}"`,
                removeHref: `/career/colleges${p.size ? `?${p}` : ''}`,
              });
            }

            return <ActiveFilterTray filters={activeFilters} clearAllHref="/career/colleges" totalResults={total} />;
          })()}

          {/* Paginated Colleges Grid with Rectangular Boxes & Yellowish Accents */}
          <CollegesGridClient
            colleges={colleges}
            total={total}
            page={page}
            limit={20}
            totalPages={totalPages}
            q={q}
            type={type}
            state={state}
            stream={stream}
          />
        </div>
      </div>
    </div>
  );
}
