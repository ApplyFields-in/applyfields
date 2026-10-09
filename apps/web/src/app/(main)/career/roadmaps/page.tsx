import type { RoadmapSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Layers,
  Milestone,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { apiGet } from '@/lib/api';

export const metadata = {
  title: 'Career Roadmaps & Milestones',
  description: 'Step-by-step career milestones from high school through university, skill building, and first jobs.',
};

interface RoadmapsPageProps {
  searchParams: Promise<{ q?: string; career?: string }>;
}

export default async function RoadmapsPage({ searchParams }: RoadmapsPageProps) {
  const sp = await searchParams;
  const q = sp.q || '';
  const career = sp.career || '';

  await connection();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (career) queryParams.set('career', career);

  const roadmaps = await apiGet<RoadmapSummary[]>(
    `/career/roadmaps${queryParams.size ? `?${queryParams}` : ''}`,
  );

  const list = roadmaps || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Milestone Tracking"
          title="Career Roadmaps"
          description="Actionable, stage-by-stage trajectories with milestone checklists, recommended degrees, entrance exams, and hands-on projects."
          icon={<Compass />}
        />
        <div className="shrink-0">
          <Link
            href="/career"
            className={buttonClass({ variant: 'secondary', size: 'md', className: 'gap-2' })}
          >
            <GraduationCap className="size-4" /> All Careers
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-3">
        <form action="/career/roadmaps" method="GET" className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search roadmaps by career title or keyword..."
              className="h-10 w-full rounded-full border border-line bg-canvas pl-9 pr-4 text-xs font-medium text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
            />
          </div>
          <button type="submit" className={buttonClass({ variant: 'primary', size: 'sm' })}>
            Search
          </button>
          {q && (
            <Link
              href="/career/roadmaps"
              className={buttonClass({ variant: 'ghost', size: 'sm' })}
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      {/* Roadmaps Grid */}
      {list.length === 0 ? (
        <EmptyState
          icon={<Compass />}
          title="No roadmaps found"
          text="Try clearing your search or explore our careers directory."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((r) => (
            <Card
              key={r.id}
              className="group flex flex-col justify-between p-6 transition-all hover:border-teal/40 hover:shadow-clay"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="teal" className="text-[11px]">
                    {r.for_stage || 'All Stages'}
                  </Badge>
                  {r.career_title && (
                    <span className="text-xs font-semibold text-teal/70">
                      {r.career_title}
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-bold text-teal group-hover:underline">
                  {r.title}
                </h2>

                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-teal/80">
                  {r.description}
                </p>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-tea/40 p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-teal">
                    <Milestone className="size-3.5 text-teal/70" />
                    <span>{r.milestones_count} Core Milestones</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-teal">
                    <Clock className="size-3.5 text-teal/70" />
                    <span>{r.estimated_duration_text || 'Self-paced'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                <span className="text-xs font-semibold text-teal/70">
                  {r.steps_count} Steps Total
                </span>
                <Link
                  href={`/career/roadmaps/${r.slug}`}
                  className={buttonClass({
                    variant: 'primary',
                    size: 'sm',
                    className: 'gap-1 shadow-clay',
                  })}
                >
                  Open Roadmap <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
