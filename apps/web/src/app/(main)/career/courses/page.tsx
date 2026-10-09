import type { CourseSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building,
  Clock,
  GraduationCap,
  Layers,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';

export const metadata = {
  title: 'Courses & Degrees Directory',
  description: 'Explore undergraduate, postgraduate, and diploma degrees with eligibility criteria, skills developed, and career outcomes.',
};

interface CoursesPageProps {
  searchParams: Promise<{ q?: string; level?: string; stream?: string }>;
}

const LEVEL_LABELS: Record<string, string> = {
  ug: 'Undergraduate (UG)',
  pg: 'Postgraduate (PG)',
  diploma: 'Diploma',
  certificate: 'Certificate',
  phd: 'Doctoral / Ph.D',
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const sp = await searchParams;
  const q = sp.q || '';
  const level = sp.level || '';
  const stream = sp.stream || '';

  await connection();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (level) queryParams.set('level', level);
  if (stream) queryParams.set('stream', stream);

  const courses = await apiGet<CourseSummary[]>(
    `/career/courses${queryParams.size ? `?${queryParams}` : ''}`,
  );

  const list = courses || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Degree Qualifications"
          title="Courses & Degrees Explorer"
          description="Find official degrees and certifications, required 12th eligibility percentages, curriculum skills, and the exact careers they qualify you for."
          icon={<BookOpen />}
        />
        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/career/colleges"
            className={buttonClass({ variant: 'secondary', size: 'md', className: 'gap-2' })}
          >
            <Building className="size-4" /> Top Colleges
          </Link>
        </div>
      </div>

      {/* Level Filter Pills & Search */}
      <Card className="p-4 space-y-3">
        <form action="/career/courses" method="GET" className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search courses by degree name, skills, or stream..."
              className="h-10 w-full rounded-full border border-line bg-canvas pl-9 pr-4 text-xs font-medium text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
            />
          </div>
          {level && <input type="hidden" name="level" value={level} />}
          <button type="submit" className={buttonClass({ variant: 'primary', size: 'sm' })}>
            Search
          </button>
          {(q || level) && (
            <Link
              href="/career/courses"
              className={buttonClass({ variant: 'ghost', size: 'sm' })}
            >
              Clear
            </Link>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/60">
          <Link
            href="/career/courses"
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              !level ? 'bg-teal text-cream' : 'bg-cream text-teal hover:bg-tea',
            )}
          >
            All Levels
          </Link>
          {['ug', 'pg', 'diploma', 'certificate'].map((lvl) => (
            <Link
              key={lvl}
              href={`/career/courses?level=${lvl}`}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                level === lvl ? 'bg-teal text-cream' : 'bg-cream text-teal hover:bg-tea',
              )}
            >
              {LEVEL_LABELS[lvl] || lvl}
            </Link>
          ))}
        </div>
      </Card>

      {/* Courses List Grid */}
      {list.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="No courses found"
          text="Try adjusting your search criteria or explore other levels."
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
                    {LEVEL_LABELS[c.level] || c.level.toUpperCase()}
                  </Badge>
                  {c.duration_months && (
                    <span className="flex items-center gap-1 text-xs font-medium text-teal/70">
                      <Clock className="size-3 text-teal/60" />
                      {Math.round(c.duration_months / 12)} Years ({c.duration_months} Mos)
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-bold text-teal group-hover:underline">
                  {c.name}
                </h2>
                {c.stream && (
                  <p className="mt-0.5 text-xs font-semibold text-teal/70">{c.stream}</p>
                )}

                {/* Skills tags */}
                {c.skills_developed && c.skills_developed.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.skills_developed.slice(0, 4).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-teal/80 border border-line/60"
                      >
                        {skill}
                      </span>
                    ))}
                    {c.skills_developed.length > 4 && (
                      <span className="text-[11px] font-semibold text-teal/60 self-center">
                        +{c.skills_developed.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                <div className="flex items-center gap-3 text-xs text-teal/70 font-medium">
                  <span className="flex items-center gap-1">
                    <Building className="size-3.5 text-teal/60" /> {c.colleges_count || 0} Colleges
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="size-3.5 text-teal/60" /> {c.careers_count || 0} Careers
                  </span>
                </div>
                <Link
                  href={`/career/courses/${c.slug}`}
                  className={buttonClass({ variant: 'primary', size: 'sm', className: 'gap-1 shadow-clay' })}
                >
                  View Details <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
