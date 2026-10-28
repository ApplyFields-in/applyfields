'use client';

import { useState } from 'react';
import type { CourseSummary } from '@applyfields/types';
import { cn, EmptyState } from '@applyfields/ui';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building,
  Clock,
  GraduationCap,
  LayoutGrid,
  List,
} from 'lucide-react';
import Link from 'next/link';
import { ZeroResultRecovery } from '@/components/zero-result-recovery';

const LEVEL_LABELS: Record<string, string> = {
  ug: 'Undergraduate (UG)',
  pg: 'Postgraduate (PG)',
  diploma: 'Diploma',
  certificate: 'Certificate',
  phd: 'Doctoral / Ph.D',
};

interface CoursesGridClientProps {
  courses: CourseSummary[];
  q: string;
  level: string;
}

export function CoursesGridClient({ courses, q, level }: CoursesGridClientProps) {
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-5">
      {/* Header Info & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-[#536780]">
        <div>
          Showing <strong className="text-[#082046] font-bold">{courses.length}</strong> verified degree programmes
        </div>

        <div className="flex items-center gap-3">
          {/* Grid vs List View Mode Toggle - Rectangular rounded-md */}
          <div className="flex items-center gap-1 rounded-md bg-[#ffffff] border border-[#dec9a5] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              aria-label="Grid View"
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-all',
                viewLayout === 'grid'
                  ? 'border border-[#dec9a5] bg-[#F4E8D1] text-[#082046] font-bold'
                  : 'text-[#536780] hover:text-[#082046] hover:bg-[#f8f5ef]',
              )}
            >
              <LayoutGrid className="size-3.5" />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              aria-label="List View"
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-all',
                viewLayout === 'list'
                  ? 'border border-[#dec9a5] bg-[#F4E8D1] text-[#082046] font-bold'
                  : 'text-[#536780] hover:text-[#082046] hover:bg-[#f8f5ef]',
              )}
            >
              <List className="size-3.5" />
              <span>List View</span>
            </button>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <ZeroResultRecovery
          title="No courses found"
          query={q}
          clearFiltersHref="/career/courses"
          allStreamsHref={level ? '/career/courses' : undefined}
          entityType="courses"
        />
      ) : viewLayout === 'list' ? (
        /* List Mode: Wide Full-Width Row Cards - Rectangular rounded-md matching Colleges */
        <div className="space-y-4">
          {courses.map((c) => {
            const levelText = LEVEL_LABELS[c.level] || c.level.toUpperCase();
            const durationYears = c.duration_months
              ? `${Math.round(c.duration_months / 12)} Yrs (${c.duration_months} Mos)`
              : null;

            return (
              <div
                key={c.id}
                className="group flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-md border border-[#dec9a5] bg-[#ffffff] transition-all hover:border-[#082046]/50 shadow-sm"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[11px] font-bold text-[#76562d]">
                      <GraduationCap className="size-3 text-[#76562d]" /> {levelText}
                    </span>
                    {c.stream && (
                      <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]">
                        {c.stream}
                      </span>
                    )}
                    {durationYears && (
                      <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#536780]">
                        <Clock className="size-3 text-[#76562d]" /> {durationYears}
                      </span>
                    )}
                    {c.min_qualification && (
                      <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#536780]">
                        Min. {c.min_qualification.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <Link href={`/career/courses/${c.slug}`}>
                    <h2 className="text-lg sm:text-xl font-bold text-[#082046] group-hover:text-[#0e7bf4] group-hover:underline line-clamp-1 transition-colors">
                      {c.name}
                    </h2>
                  </Link>

                  {/* Skills tags */}
                  {c.skills_developed && c.skills_developed.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {c.skills_developed.slice(0, 5).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="rounded border border-[#dec9a5]/70 bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#082046]"
                        >
                          {skill}
                        </span>
                      ))}
                      {c.skills_developed.length > 5 && (
                        <span className="text-[11px] font-semibold text-[#536780]">
                          +{c.skills_developed.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#dec9a5]/40">
                  <div className="flex items-center gap-3 text-xs text-[#536780] font-medium">
                    <span className="flex items-center gap-1">
                      <Building className="size-3.5 text-[#76562d]" /> {c.colleges_count || 0} Colleges
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="size-3.5 text-[#76562d]" /> {c.careers_count || 0} Careers
                    </span>
                  </div>

                  <Link
                    href={`/career/courses/${c.slug}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
                  >
                    View Details <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid Mode: 2-Column Responsive Card Grid - Rectangular rounded-md matching Colleges */
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((c) => {
            const levelText = LEVEL_LABELS[c.level] || c.level.toUpperCase();
            const durationYears = c.duration_months
              ? `${Math.round(c.duration_months / 12)} Yrs (${c.duration_months} Mos)`
              : null;

            return (
              <div
                key={c.id}
                className="group flex flex-col justify-between p-5 sm:p-6 rounded-md border border-[#dec9a5] bg-[#ffffff] transition-all hover:border-[#082046]/50 shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[11px] font-bold text-[#76562d]">
                      <GraduationCap className="size-3 text-[#76562d]" /> {levelText}
                    </span>
                    {c.stream && (
                      <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]">
                        {c.stream}
                      </span>
                    )}
                    {durationYears && (
                      <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#536780]">
                        <Clock className="size-3 text-[#76562d]" /> {durationYears}
                      </span>
                    )}
                  </div>

                  <Link href={`/career/courses/${c.slug}`}>
                    <h2 className="mt-3 text-lg font-bold text-[#082046] group-hover:text-[#0e7bf4] group-hover:underline line-clamp-2 transition-colors">
                      {c.name}
                    </h2>
                  </Link>

                  {c.min_qualification && (
                    <p className="mt-1.5 text-xs text-[#536780]">
                      Min. Entry Qualification: <strong className="text-[#082046]">{c.min_qualification.toUpperCase()}</strong>
                    </p>
                  )}

                  {/* Skills tags */}
                  {c.skills_developed && c.skills_developed.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.skills_developed.slice(0, 4).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="rounded border border-[#dec9a5]/70 bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#082046]"
                        >
                          {skill}
                        </span>
                      ))}
                      {c.skills_developed.length > 4 && (
                        <span className="text-[11px] font-semibold text-[#536780] self-center">
                          +{c.skills_developed.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#dec9a5]/40 pt-4">
                  <div className="flex items-center gap-3 text-xs text-[#536780] font-medium">
                    <span className="flex items-center gap-1">
                      <Building className="size-3.5 text-[#76562d]" /> {c.colleges_count || 0} Colleges
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="size-3.5 text-[#76562d]" /> {c.careers_count || 0} Careers
                    </span>
                  </div>

                  <Link
                    href={`/career/courses/${c.slug}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
                  >
                    View Details <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

