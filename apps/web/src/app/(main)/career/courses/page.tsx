import type { CourseSummary } from '@applyfields/types';
import { BookOpen, Briefcase, Building2, Route, Search } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';
import { CareerCollegesHoverMenu } from '@/components/career-colleges-hover-menu';
import { CoursesGridClient } from './courses-grid-client';
import { ActiveFilterTray, type ActiveFilterItem } from '@/components/active-filter-tray';

export const metadata = {
  title: 'Courses & Degrees Directory',
  description:
    'Explore undergraduate, postgraduate, engineering, medical, and diploma degrees with eligibility criteria, curriculum skills, and career outcomes.',
};

interface CoursesPageProps {
  searchParams: Promise<{ q?: string; level?: string; stream?: string }>;
}

const LEVEL_LABELS: Record<string, string> = {
  ug: 'Undergraduate (UG)',
  pg: 'Postgraduate (PG)',
  diploma: 'Polytechnic Diploma',
  certificate: 'Certificate',
};

const STREAM_TABS = [
  { key: '', label: 'All Streams' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'medicine', label: 'Medical & Health' },
  { key: 'management', label: 'Management' },
  { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'polytechnic', label: 'Polytechnic' },
  { key: 'architecture', label: 'Architecture' },
];

const FALLBACK_COURSES: CourseSummary[] = [
  {
    id: 'c-mbbs',
    slug: 'mbbs',
    name: 'Bachelor of Medicine, Bachelor of Surgery (MBBS)',
    short_name: 'MBBS',
    level: 'ug',
    stream: 'Medicine',
    duration_months: 66,
    min_qualification: '12th',
    skills_developed: ['Clinical Diagnosis', 'Patient Care', 'Medical Ethics', 'Surgical Procedures', 'Pathology'],
    colleges_count: 50,
    careers_count: 8,
  },
  {
    id: 'c-md-medicine',
    slug: 'md-general-medicine',
    name: 'Doctor of Medicine (MD) in General Medicine',
    short_name: 'MD Medicine',
    level: 'pg',
    stream: 'Medicine',
    duration_months: 36,
    min_qualification: 'graduate',
    skills_developed: ['Internal Medicine', 'Critical Care', 'Differential Diagnosis', 'Pharmacology'],
    colleges_count: 45,
    careers_count: 6,
  },
  {
    id: 'c-ms-surgery',
    slug: 'ms-general-surgery',
    name: 'Master of Surgery (MS) in General Surgery',
    short_name: 'MS Surgery',
    level: 'pg',
    stream: 'Medicine',
    duration_months: 36,
    min_qualification: 'graduate',
    skills_developed: ['Surgical Operations', 'Trauma Resuscitation', 'Laparoscopy', 'Pre/Post-Operative Care'],
    colleges_count: 42,
    careers_count: 5,
  },
  {
    id: 'c-btech-cse',
    slug: 'btech-computer-science',
    name: 'B.Tech in Computer Science & Engineering (CSE)',
    short_name: 'B.Tech CSE',
    level: 'ug',
    stream: 'Engineering',
    duration_months: 48,
    min_qualification: '12th',
    skills_developed: ['Data Structures & Algorithms', 'System Architecture', 'Cloud Computing', 'AI / ML', 'Full Stack Development'],
    colleges_count: 50,
    careers_count: 14,
  },
  {
    id: 'c-btech-ece',
    slug: 'btech-ece',
    name: 'B.Tech in Electronics & Communication Engineering',
    short_name: 'B.Tech ECE',
    level: 'ug',
    stream: 'Engineering',
    duration_months: 48,
    min_qualification: '12th',
    skills_developed: ['VLSI Design', 'Embedded Systems', 'Signal Processing', 'Wireless Telecom', 'Microcontrollers'],
    colleges_count: 48,
    careers_count: 10,
  },
  {
    id: 'c-mba',
    slug: 'master-of-business-administration',
    name: 'Master of Business Administration (MBA)',
    short_name: 'MBA',
    level: 'pg',
    stream: 'Management',
    duration_months: 24,
    min_qualification: 'graduate',
    skills_developed: ['Strategic Management', 'Financial Modeling', 'Brand Marketing', 'Product Analytics', 'Operations'],
    colleges_count: 38,
    careers_count: 12,
  },
  {
    id: 'c-bpharm',
    slug: 'bachelor-of-pharmacy',
    name: 'Bachelor of Pharmacy (B.Pharm)',
    short_name: 'B.Pharm',
    level: 'ug',
    stream: 'Pharmacy',
    duration_months: 48,
    min_qualification: '12th',
    skills_developed: ['Medicinal Chemistry', 'Pharmaceutics', 'Drug Discovery', 'Pharmacology & Toxicology'],
    colleges_count: 32,
    careers_count: 7,
  },
  {
    id: 'c-barch',
    slug: 'bachelor-of-architecture',
    name: 'Bachelor of Architecture (B.Arch)',
    short_name: 'B.Arch',
    level: 'ug',
    stream: 'Architecture',
    duration_months: 60,
    min_qualification: '12th',
    skills_developed: ['Architectural Design', 'Urban Planning', 'Building Information Modeling (BIM)', 'Sustainable Structures'],
    colleges_count: 24,
    careers_count: 6,
  },
  {
    id: 'c-bsc-nursing',
    slug: 'bsc-nursing',
    name: 'Bachelor of Science in Nursing (B.Sc Nursing)',
    short_name: 'B.Sc Nursing',
    level: 'ug',
    stream: 'Nursing',
    duration_months: 48,
    min_qualification: '12th',
    skills_developed: ['Clinical Care', 'Emergency Trauma', 'Patient Safety', 'Health Informatics'],
    colleges_count: 36,
    careers_count: 6,
  },
  {
    id: 'c-poly-mech',
    slug: 'diploma-mechanical-engineering',
    name: 'Diploma in Mechanical Engineering',
    short_name: 'Diploma Mech',
    level: 'diploma',
    stream: 'Polytechnic',
    duration_months: 36,
    min_qualification: '10th',
    skills_developed: ['CAD Modeling', 'CNC Machining', 'Thermodynamics', 'Workshop Practice'],
    colleges_count: 28,
    careers_count: 5,
  },
];

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const sp = await searchParams;
  const q = sp.q || '';
  const level = (sp.level || '').toLowerCase();
  const stream = (sp.stream || '').toLowerCase();

  await connection();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (level) queryParams.set('level', level);
  if (stream) queryParams.set('stream', stream);

  const res = await apiGet<CourseSummary[]>(
    `/career/courses${queryParams.size ? `?${queryParams}` : ''}`,
  );

  let list = res || [];

  // Fallback to rich curated list if database is starting or empty
  if (list.length === 0) {
    list = FALLBACK_COURSES.filter((c) => {
      if (level && c.level !== level) return false;
      if (stream && !c.stream?.toLowerCase().includes(stream)) return false;
      if (q) {
        const query = q.toLowerCase();
        const mName = c.name.toLowerCase().includes(query);
        const mShort = c.short_name?.toLowerCase().includes(query);
        const mStream = c.stream?.toLowerCase().includes(query);
        const mSkills = (c.skills_developed || []).some((s) => s.toLowerCase().includes(query));
        if (!mName && !mShort && !mStream && !mSkills) return false;
      }
      return true;
    });
  }

  return (
    <div>
      {/* Warm Yellowish Top Section matching Career Mode & Colleges */}
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
        <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-8 pb-6 sm:pt-10 sm:pb-7 sm:px-6 lg:px-8">
          {/* Header Title Area */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#76562d]">
                Academic Qualifications &amp; Curricula
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl">
                Courses &amp; Degrees Explorer
              </h1>
              <p className="mt-1 text-sm text-[#435775]">
                Explore verified undergraduate, postgraduate, medical, engineering, and diploma degrees with eligibility cutoffs, curriculum skills, and career pathways.
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
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#082046] hover:bg-[#ffffff]"
            >
              <Route className="size-4 text-[#0e7bf4]" /> Roadmaps
            </Link>
            <Link
              href="/career/courses"
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#082046] bg-[#082046] px-3.5 text-xs font-semibold text-[#ffffff]"
            >
              <BookOpen className="size-4 text-[#ffffff]" /> Courses
            </Link>
            <CareerCollegesHoverMenu />
          </nav>

          {/* Degree Level Filter Tabs - Rectangular rounded-md matching Career Mode */}
          <nav aria-label="Course levels" className="flex gap-2 overflow-x-auto pt-1 scrollbar-none">
            <Link
              href={`/career/courses${stream ? `?stream=${encodeURIComponent(stream)}` : ''}${q ? `${stream ? '&' : '?'}q=${encodeURIComponent(q)}` : ''}`}
              className={`min-h-9 shrink-0 rounded-md border px-3.5 text-xs font-medium transition-colors flex items-center ${
                !level
                  ? 'border-[#082046] bg-[#082046] text-[#ffffff]'
                  : 'border-[#dec9a5] bg-[#f8f5ef] text-[#243b5b] hover:bg-[#ffffff]'
              }`}
            >
              All Degree Levels
            </Link>
            {Object.entries(LEVEL_LABELS).map(([lvlKey, lvlLabel]) => {
              const p = new URLSearchParams();
              p.set('level', lvlKey);
              if (stream) p.set('stream', stream);
              if (q) p.set('q', q);
              const isActive = level === lvlKey;
              return (
                <Link
                  key={lvlKey}
                  href={`/career/courses?${p.toString()}`}
                  className={`min-h-9 shrink-0 rounded-md border px-3.5 text-xs font-medium transition-colors flex items-center ${
                    isActive
                      ? 'border-[#082046] bg-[#082046] text-[#ffffff]'
                      : 'border-[#dec9a5] bg-[#f8f5ef] text-[#243b5b] hover:bg-[#ffffff]'
                  }`}
                >
                  {lvlLabel}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* Main Content Body - Soft Neutral Parchment Background matching Colleges & Career */}
      <div className="bg-[#F2F1ED] min-h-screen">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 py-6 pb-16 sm:px-6 lg:px-8">
          {/* Stream Filter Pills & Search Bar - Rectangular rounded-md */}
          <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-4 shadow-sm space-y-3">
            <form action="/career/courses" method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#76562d]" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search courses by degree name, specializations, or skills..."
                  className="h-10 w-full rounded-md border border-[#dec9a5] bg-[#f8f5ef] pl-9 pr-4 text-xs font-medium text-[#082046] placeholder:text-[#536780]/60 focus:border-[#082046] focus:bg-[#ffffff] focus:outline-none transition-colors"
                />
              </div>
              {level && <input type="hidden" name="level" value={level} />}
              {stream && <input type="hidden" name="stream" value={stream} />}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#082046] bg-[#082046] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#0c2e63] transition-colors"
                >
                  Search
                </button>
                {(q || level || stream) && (
                  <Link
                    href="/career/courses"
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-medium text-[#536780] hover:bg-[#ffffff] hover:text-[#082046] transition-colors"
                  >
                    Clear Filters
                  </Link>
                )}
              </div>
            </form>

            {/* Stream Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#dec9a5]/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#76562d] mr-1">
                Stream:
              </span>
              {STREAM_TABS.map((tab) => {
                const p = new URLSearchParams();
                if (tab.key) p.set('stream', tab.key);
                if (level) p.set('level', level);
                if (q) p.set('q', q);
                const isActive = stream === tab.key;
                return (
                  <Link
                    key={tab.key}
                    href={`/career/courses${p.size ? `?${p}` : ''}`}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-[#dec9a5] bg-[#F4E8D1] text-[#082046] font-bold'
                        : 'border-[#dec9a5]/70 bg-[#f8f5ef] text-[#536780] hover:bg-[#ffffff] hover:text-[#082046]'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Active Filter Chips & Dismissible Clear All Bar */}
          {(() => {
            const activeFilters: ActiveFilterItem[] = [];
            if (level) {
              const p = new URLSearchParams();
              if (stream) p.set('stream', stream);
              if (q) p.set('q', q);
              activeFilters.push({
                key: 'level',
                label: 'Level',
                displayValue: LEVEL_LABELS[level] || level.toUpperCase(),
                removeHref: `/career/courses${p.size ? `?${p}` : ''}`,
              });
            }
            if (stream) {
              const tab = STREAM_TABS.find((t) => t.key === stream);
              const p = new URLSearchParams();
              if (level) p.set('level', level);
              if (q) p.set('q', q);
              activeFilters.push({
                key: 'stream',
                label: 'Stream',
                displayValue: tab?.label || stream,
                removeHref: `/career/courses${p.size ? `?${p}` : ''}`,
              });
            }
            if (q) {
              const p = new URLSearchParams();
              if (level) p.set('level', level);
              if (stream) p.set('stream', stream);
              activeFilters.push({
                key: 'q',
                label: 'Search',
                displayValue: `"${q}"`,
                removeHref: `/career/courses${p.size ? `?${p}` : ''}`,
              });
            }

            return <ActiveFilterTray filters={activeFilters} clearAllHref="/career/courses" totalResults={list.length} />;
          })()}

          {/* Courses Cards Grid & List */}
          <CoursesGridClient courses={list} q={q} level={level} />
        </div>
      </div>
    </div>
  );
}
