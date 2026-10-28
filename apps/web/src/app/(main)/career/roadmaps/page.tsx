import type { RoadmapSummary } from '@applyfields/types';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Clock,
  Compass,
  Milestone,
  Route,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';
import { CareerCollegesHoverMenu } from '@/components/career-colleges-hover-menu';
import { ActiveFilterTray, type ActiveFilterItem } from '@/components/active-filter-tray';
import { ZeroResultRecovery } from '@/components/zero-result-recovery';

export const metadata = {
  title: 'Career Roadmaps & Milestones',
  description:
    'Step-by-step career milestones from high school through university, entrance cutoffs, skill building, and first jobs.',
};

interface RoadmapsPageProps {
  searchParams: Promise<{ q?: string; career?: string; stage?: string }>;
}

const STAGE_TABS = [
  { key: '', label: 'All Stages' },
  { key: 'school', label: '10th & 12th Standard' },
  { key: 'college', label: 'College & University' },
  { key: 'early_career', label: 'First Job & Career Launch' },
];

const FALLBACK_ROADMAPS: RoadmapSummary[] = [
  {
    id: 'rd-swe',
    slug: 'software-engineer',
    title: 'Software Engineer & Full-Stack Architect Pathway',
    career_id: 'cr-swe',
    career_slug: 'software-engineer',
    career_title: 'Software Engineer',
    for_stage: 'college',
    description:
      'From learning core programming foundations, Data Structures & Algorithms, Git, and Web Frameworks to landing premier campus placements and internships.',
    steps_count: 8,
    milestones_count: 4,
    estimated_duration_text: '4 Years (Degree Track)',
  },
  {
    id: 'rd-doctor',
    slug: 'medical-doctor',
    title: 'MBBS Doctor to Clinical Specialist Trajectory',
    career_id: 'cr-doctor',
    career_slug: 'doctor',
    career_title: 'Medical Doctor / Physician',
    for_stage: 'school',
    description:
      '12th PCB preparation, NEET-UG cracking, 5.5-year MBBS curriculum, hospital rotational internship, and clearing INI-CET / NEET-PG for MD/MS residency.',
    steps_count: 7,
    milestones_count: 4,
    estimated_duration_text: '5.5 Years + 3 Years PG',
  },
  {
    id: 'rd-data-scientist',
    slug: 'data-scientist',
    title: 'Data Scientist & Machine Learning Specialist',
    career_id: 'cr-ds',
    career_slug: 'data-scientist',
    career_title: 'Data Scientist',
    for_stage: 'college',
    description:
      'Mastering Python, Linear Algebra, Statistics, SQL, Pandas, Scikit-Learn, Deep Learning, and building end-to-end ML model pipelines in production.',
    steps_count: 6,
    milestones_count: 3,
    estimated_duration_text: '2 - 3 Years',
  },
  {
    id: 'rd-civil-service',
    slug: 'civil-services-ias',
    title: 'UPSC Civil Services (IAS / IPS) Trajectory',
    career_id: 'cr-upsc',
    career_slug: 'civil-services-officer',
    career_title: 'Civil Services Officer',
    for_stage: 'early_career',
    description:
      'Comprehensive syllabus mastery for UPSC CSE Prelims, GS Papers I-IV, Optional Subject specialization, Essay writing, and Personality Test interview prep.',
    steps_count: 6,
    milestones_count: 3,
    estimated_duration_text: '1.5 - 2 Years Preparation',
  },
];

export default async function RoadmapsPage({ searchParams }: RoadmapsPageProps) {
  const sp = await searchParams;
  const q = sp.q || '';
  const career = sp.career || '';
  const stage = (sp.stage || '').toLowerCase();

  await connection();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (career) queryParams.set('career', career);

  const res = await apiGet<RoadmapSummary[]>(
    `/career/roadmaps${queryParams.size ? `?${queryParams}` : ''}`,
  );

  let list = res || [];

  // Use rich fallback roadmaps if API is offline or returns empty
  if (list.length === 0) {
    list = FALLBACK_ROADMAPS.filter((r) => {
      if (stage && r.for_stage !== stage) return false;
      if (career && r.career_slug !== career) return false;
      if (q) {
        const query = q.toLowerCase();
        const mTitle = r.title.toLowerCase().includes(query);
        const mDesc = (r.description || '').toLowerCase().includes(query);
        const mCareer = (r.career_title || '').toLowerCase().includes(query);
        if (!mTitle && !mDesc && !mCareer) return false;
      }
      return true;
    });
  }

  return (
    <div>
      {/* Warm Yellowish Top Section matching Career Mode, Colleges & Courses */}
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
        <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-8 pb-6 sm:pt-10 sm:pb-7 sm:px-6 lg:px-8">
          {/* Header Title Area */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#76562d]">
                Milestone Tracking &amp; Trajectories
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl">
                Career Roadmaps
              </h1>
              <p className="mt-1 text-sm text-[#435775]">
                Actionable, stage-by-stage trajectories with milestone checklists, recommended degrees, entrance exam cutoffs, and project benchmarks.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Link
                href="/career/colleges"
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition-colors shadow-sm"
              >
                <Building2 className="size-4 text-[#0e7bf4]" /> Colleges &amp; Universities
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
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#082046] bg-[#082046] px-3.5 text-xs font-semibold text-[#ffffff]"
            >
              <Route className="size-4 text-[#ffffff]" /> Roadmaps
            </Link>
            <Link
              href="/career/courses"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#082046] hover:bg-[#ffffff]"
            >
              <BookOpen className="size-4 text-[#0e7bf4]" /> Courses
            </Link>
            <CareerCollegesHoverMenu />
          </nav>

          {/* Target Stage Filter Tabs */}
          <nav aria-label="Roadmap stages" className="flex gap-2 overflow-x-auto pt-1 scrollbar-none">
            {STAGE_TABS.map((tab) => {
              const p = new URLSearchParams();
              if (tab.key) p.set('stage', tab.key);
              if (q) p.set('q', q);
              if (career) p.set('career', career);
              const isActive = stage === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={`/career/roadmaps${p.size ? `?${p}` : ''}`}
                  className={`min-h-9 shrink-0 rounded-md border px-3.5 text-xs font-medium transition-colors flex items-center ${
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

      {/* Main Content Body - Soft Neutral Parchment Background */}
      <div className="bg-[#F2F1ED] min-h-screen">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 py-6 pb-16 sm:px-6 lg:px-8">
          {/* Search Box - Rectangular rounded-md */}
          <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-4 shadow-sm">
            <form action="/career/roadmaps" method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#76562d]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search roadmaps by career specialization, skills, or target role..."
                  className="h-10 w-full rounded-md border border-[#dec9a5] bg-[#f8f5ef] pl-9 pr-4 text-xs font-medium text-[#082046] placeholder:text-[#536780]/60 focus:border-[#082046] focus:bg-[#ffffff] focus:outline-none transition-colors"
                />
              </div>
              {stage && <input type="hidden" name="stage" value={stage} />}
              {career && <input type="hidden" name="career" value={career} />}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#082046] bg-[#082046] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#0c2e63] transition-colors"
                >
                  Search
                </button>
                {(q || stage || career) && (
                  <Link
                    href="/career/roadmaps"
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#536780] hover:bg-[#ffffff] hover:text-[#082046] transition-colors"
                  >
                    Clear Filters
                  </Link>
                )}
              </div>
            </form>
          </div>

          {/* Active Filter Chips & Dismissible Clear All Bar */}
          {(() => {
            const activeFilters: ActiveFilterItem[] = [];
            if (stage) {
              const tab = STAGE_TABS.find((t) => t.key === stage);
              const p = new URLSearchParams();
              if (q) p.set('q', q);
              if (career) p.set('career', career);
              activeFilters.push({
                key: 'stage',
                label: 'Stage',
                displayValue: tab?.label || stage.toUpperCase(),
                removeHref: `/career/roadmaps${p.size ? `?${p}` : ''}`,
              });
            }
            if (q) {
              const p = new URLSearchParams();
              if (stage) p.set('stage', stage);
              if (career) p.set('career', career);
              activeFilters.push({
                key: 'q',
                label: 'Search',
                displayValue: `"${q}"`,
                removeHref: `/career/roadmaps${p.size ? `?${p}` : ''}`,
              });
            }

            return <ActiveFilterTray filters={activeFilters} clearAllHref="/career/roadmaps" totalResults={list.length} />;
          })()}

          {/* Roadmaps Grid - Rectangular rounded-md */}
          {list.length === 0 ? (
            <ZeroResultRecovery
              title="No roadmaps found"
              query={q}
              clearFiltersHref="/career/roadmaps"
              allStreamsHref={stage ? '/career/roadmaps' : undefined}
              entityType="roadmaps"
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {list.map((r) => (
                <div
                  key={r.id}
                  className="group flex flex-col justify-between p-5 sm:p-6 rounded-md border border-[#dec9a5] bg-[#ffffff] transition-all hover:border-[#082046]/50 shadow-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[11px] font-bold text-[#76562d]">
                        <Compass className="size-3 text-[#76562d]" /> {r.for_stage ? r.for_stage.toUpperCase() : 'ALL STAGES'}
                      </span>
                      {r.career_title && (
                        <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]">
                          {r.career_title}
                        </span>
                      )}
                    </div>

                    <Link href={`/career/roadmaps/${r.slug}`}>
                      <h2 className="mt-3 text-lg font-bold text-[#082046] group-hover:text-[#0e7bf4] group-hover:underline line-clamp-2 transition-colors">
                        {r.title}
                      </h2>
                    </Link>

                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#536780]">
                      {r.description}
                    </p>

                    {/* Milestone Highlights Box */}
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-[#dec9a5]/70 bg-[#f8f5ef] p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-[#082046]">
                        <Milestone className="size-3.5 text-[#76562d]" />
                        <span>{r.milestones_count} Core Milestones</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-[#082046]">
                        <Clock className="size-3.5 text-[#76562d]" />
                        <span>{r.estimated_duration_text || 'Self-paced'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#dec9a5]/40 pt-4">
                    <span className="text-xs font-semibold text-[#536780]">
                      {r.steps_count} Action Steps
                    </span>
                    <Link
                      href={`/career/roadmaps/${r.slug}`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
                    >
                      Open Roadmap <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
