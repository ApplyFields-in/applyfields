'use client';

import Link from 'next/link';
import { SearchX, RotateCcw, Compass, ArrowRight, Sparkles } from 'lucide-react';

interface PopularChip {
  label: string;
  href: string;
}

interface ZeroResultRecoveryProps {
  title?: string;
  query?: string;
  clearFiltersHref: string;
  allStreamsHref?: string;
  popularChips?: PopularChip[];
  entityType?: 'colleges' | 'courses' | 'roadmaps' | 'opportunities';
}

export function ZeroResultRecovery({
  title = 'No matches found',
  query,
  clearFiltersHref,
  allStreamsHref,
  popularChips,
  entityType = 'colleges',
}: ZeroResultRecoveryProps) {
  const defaultChips: Record<string, PopularChip[]> = {
    colleges: [
      { label: 'AIIMS New Delhi', href: '/career/colleges?q=AIIMS' },
      { label: 'IIT Madras', href: '/career/colleges?q=IIT+Madras' },
      { label: 'IIT Bombay', href: '/career/colleges?q=IIT+Bombay' },
      { label: 'CMC Vellore', href: '/career/colleges?q=CMC+Vellore' },
      { label: 'Top 50 Medical', href: '/career/colleges?stream=medical' },
      { label: 'Top 50 Engineering', href: '/career/colleges?stream=top-50-engg' },
    ],
    courses: [
      { label: 'MBBS', href: '/career/courses?q=MBBS' },
      { label: 'B.Tech CSE', href: '/career/courses?q=Computer+Science' },
      { label: 'MD General Medicine', href: '/career/courses?q=MD' },
      { label: 'MBA', href: '/career/courses?q=MBA' },
      { label: 'B.Pharm', href: '/career/courses?q=Pharmacy' },
    ],
    roadmaps: [
      { label: 'Medical Specialist', href: '/career/roadmaps?q=Medical' },
      { label: 'AI & Machine Learning', href: '/career/roadmaps?q=AI' },
      { label: 'Software Engineer', href: '/career/roadmaps?q=Software' },
      { label: 'Civil Services IAS', href: '/career/roadmaps?q=Civil' },
    ],
    opportunities: [
      { label: 'SSC CGL', href: '/jobs?q=SSC' },
      { label: 'UPSC Civil Services', href: '/exams?q=UPSC' },
      { label: 'State PSC', href: '/jobs?q=PSC' },
      { label: 'Engineering Jobs', href: '/jobs?q=Engineering' },
    ],
  };

  const chips = popularChips || defaultChips[entityType] || defaultChips.colleges;

  return (
    <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-8 text-center shadow-sm space-y-5">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#F4E8D1] text-[#76562d]">
        <SearchX className="size-6 text-[#76562d]" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base font-bold text-[#082046]">
          {query ? `No ${entityType} found matching "${query}"` : title}
        </h3>
        <p className="text-xs text-[#536780] leading-relaxed">
          We couldn&apos;t find any records matching your exact combination of search terms and filters. Try adjusting your query or exploring our verified benchmarks below.
        </p>
      </div>

      {/* Recovery Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {allStreamsHref && (
          <Link
            href={allStreamsHref}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#082046] bg-[#082046] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#0e7bf4] transition-colors shadow-sm"
          >
            <Compass className="size-3.5" /> Search Across All Streams
          </Link>
        )}
        <Link
          href={clearFiltersHref}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-4 text-xs font-semibold text-[#082046] hover:bg-[#F4E8D1] transition-colors shadow-sm"
        >
          <RotateCcw className="size-3.5 text-[#76562d]" /> Reset All Filters
        </Link>
      </div>

      {/* Popular Suggestions Quick Chips */}
      {chips.length > 0 && (
        <div className="pt-4 border-t border-[#dec9a5]/50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#76562d] mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="size-3 text-[#76562d]" /> Popular Categories &amp; Presets
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3 py-1 text-xs font-semibold text-[#082046] hover:border-[#082046] hover:bg-[#ffffff] transition-colors"
              >
                <span>{chip.label}</span>
                <ArrowRight className="size-3 text-[#76562d]" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

