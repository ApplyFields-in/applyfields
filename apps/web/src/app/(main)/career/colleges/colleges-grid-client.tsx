'use client';

import { useState, useEffect } from 'react';
import type { InstitutionSummary } from '@applyfields/types';
import { cn, EmptyState } from '@applyfields/ui';
import {
  ArrowRight,
  Award,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns,
  LayoutGrid,
  List,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { SaveButton } from '@/components/save-button';

function getShortDescription(desc?: string | null): string {
  if (!desc) return 'Premier technical education and higher research institute in India.';
  const clean = desc
    .replace(/^(IIT|NIT|BITS|VIT|DTU|[A-Z\s]+)\s+Highlights\s+\d{4}/i, '')
    .replace(/^IIT Madras is known as an 'Institute of Eminence'\./i, 'Renowned Institute of Eminence.')
    .trim();
  if (clean.length <= 135) return clean;
  return clean.slice(0, 130).replace(/[\s,\.\-]+$/, '') + '...';
}

const TYPE_LABELS: Record<string, string> = {
  institute: 'National Institute',
  university: 'University',
  college: 'College',
  autonomous: 'Autonomous College',
  deemed: 'Deemed University',
};

interface CollegesGridClientProps {
  colleges: InstitutionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  q: string;
  type: string;
  state: string;
  stream?: string;
}

export function CollegesGridClient({
  colleges,
  total,
  page,
  limit,
  totalPages,
  q,
  type,
  state,
  stream = '',
}: CollegesGridClientProps) {
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Helper to build page URL preserving search and filter parameters
  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (stream) p.set('stream', stream);
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (state) p.set('state', state);
    if (targetPage > 1) p.set('page', String(targetPage));
    return `/career/colleges${p.size ? `?${p}` : ''}`;
  };

  // Generate pagination page numbers window
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');

      pages.push(totalPages);
    }
    return pages;
  };

  const startCount = (page - 1) * limit + 1;
  const endCount = Math.min(page * limit, total);

  return (
    <div className="space-y-5">
      {/* Header Info & Counts + Grid/List View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-[#536780]">
        <div>
          Showing <strong className="text-[#082046] font-bold">{total > 0 ? startCount : 0}</strong> to{' '}
          <strong className="text-[#082046] font-bold">{endCount}</strong> of{' '}
          <strong className="text-[#082046] font-bold">{total.toLocaleString()}</strong> institutions (20 per page)
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-[#536780]">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>

          {/* Grid vs List View Mode Toggle - Rectangular rounded-md */}
          <div className="flex items-center gap-1 rounded-md bg-[#ffffff] border border-[#dec9a5] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setViewLayout('grid');
                if (typeof window !== 'undefined') localStorage.setItem('applyfields_colleges_view', 'grid');
              }}
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
              onClick={() => {
                setViewLayout('list');
                if (typeof window !== 'undefined') localStorage.setItem('applyfields_colleges_view', 'list');
              }}
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

      {/* College Cards: Grid or List Mode (Rectangular rounded-md, No AI badges) */}
      {colleges.length === 0 ? (
        <EmptyState
          icon={<Building />}
          title="No institutions found"
          text="Try broadening your search term or clearing the filters above."
        />
      ) : viewLayout === 'list' ? (
        /* List Mode: Wide Full-Width Row Cards - Rectangular rounded-md */
        <div className="space-y-4">
          {colleges.map((c) => {
            const rankDisplay = c.accreditation?.nirf_rank_text || c.ranking_text || (c.accreditation?.nirf_rank ? `NIRF Rank #${c.accreditation.nirf_rank}` : null);
            const instituteType = c.accreditation?.institute_type_raw || TYPE_LABELS[c.type] || c.type;
            const establishedDisplay = c.accreditation?.established_text || (c.established_year ? `Estd. ${c.established_year}` : null);
            const locationDisplay = c.accreditation?.location_shown || [c.city, c.state_code].filter(Boolean).join(', ') || 'India';
            const descriptionSnippet = getShortDescription(c.description);

            return (
              <div
                key={c.id}
                className="group flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-md border border-[#dec9a5] bg-[#ffffff] transition-all hover:border-[#082046]/50 shadow-sm"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {rankDisplay && (
                      <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[11px] font-bold text-[#76562d]">
                        <Award className="size-3 text-[#76562d]" /> {rankDisplay}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]">
                      {instituteType}
                    </span>
                    {establishedDisplay && (
                      <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#536780]">
                        {establishedDisplay}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs font-medium text-[#536780]">
                      <MapPin className="size-3.5 text-[#76562d] shrink-0" /> {locationDisplay}
                    </span>
                  </div>

                  <Link href={`/career/colleges/${c.slug}`}>
                    <h2 className="text-lg sm:text-xl font-bold text-[#082046] group-hover:text-[#0e7bf4] group-hover:underline line-clamp-1 transition-colors">
                      {c.name}
                    </h2>
                  </Link>

                  <p className="text-xs text-[#536780] leading-relaxed line-clamp-2 max-w-3xl">
                    {descriptionSnippet}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#dec9a5]/40">
                  <SaveButton
                    itemType="institution"
                    slug={c.slug}
                    title={c.name}
                  />

                  <Link
                    href={`/career/colleges/compare?slugs=${c.slug}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition-colors"
                    title={`Compare ${c.name} with other colleges`}
                  >
                    <Columns className="size-3.5 text-[#0e7bf4]" /> Compare
                  </Link>

                  <Link
                    href={`/career/colleges/${c.slug}`}
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
        /* Grid Mode: 2-Column Responsive Card Grid - Rectangular rounded-md */
        <div className="grid gap-5 md:grid-cols-2">
          {colleges.map((c) => {
            const rankDisplay = c.accreditation?.nirf_rank_text || c.ranking_text || (c.accreditation?.nirf_rank ? `NIRF Rank #${c.accreditation.nirf_rank}` : null);
            const instituteType = c.accreditation?.institute_type_raw || TYPE_LABELS[c.type] || c.type;
            const establishedDisplay = c.accreditation?.established_text || (c.established_year ? `Estd. ${c.established_year}` : null);
            const locationDisplay = c.accreditation?.location_shown || [c.city, c.state_code].filter(Boolean).join(', ') || 'India';
            const descriptionSnippet = getShortDescription(c.description);

            return (
              <div
                key={c.id}
                className="group flex flex-col justify-between p-5 sm:p-6 rounded-md border border-[#dec9a5] bg-[#ffffff] transition-all hover:border-[#082046]/50 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rankDisplay && (
                        <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[11px] font-bold text-[#76562d]">
                          <Award className="size-3 text-[#76562d]" /> {rankDisplay}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]">
                        {instituteType}
                      </span>
                      {establishedDisplay && (
                        <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-medium text-[#536780]">
                          {establishedDisplay}
                        </span>
                      )}
                    </div>
                    {/* Save / Bookmark Button */}
                    <SaveButton
                      itemType="institution"
                      slug={c.slug}
                      title={c.name}
                    />
                  </div>

                  <Link href={`/career/colleges/${c.slug}`}>
                    <h2 className="mt-3 text-lg font-bold text-[#082046] group-hover:text-[#0e7bf4] group-hover:underline line-clamp-2 transition-colors">
                      {c.name}
                    </h2>
                  </Link>

                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#536780]">
                    <MapPin className="size-3.5 text-[#76562d] shrink-0" />
                    <span>{locationDisplay}</span>
                  </div>

                  {/* Description a little */}
                  <p className="mt-2.5 text-xs text-[#536780] leading-relaxed line-clamp-2">
                    {descriptionSnippet}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#dec9a5]/40 pt-4">
                  <Link
                    href={`/career/colleges/compare?slugs=${c.slug}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition-colors"
                    title={`Compare ${c.name} with other colleges`}
                  >
                    <Columns className="size-3.5 text-[#0e7bf4]" /> Compare
                  </Link>

                  <Link
                    href={`/career/colleges/${c.slug}`}
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

      {/* Pagination Bar - Rectangular rounded-md */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-4 shadow-sm">
          <div className="text-xs text-[#536780]">
            Showing <strong className="font-bold text-[#082046]">{startCount}</strong> to{' '}
            <strong className="font-bold text-[#082046]">{endCount}</strong> of{' '}
            <strong className="font-bold text-[#082046]">{total.toLocaleString()}</strong> colleges
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* First Page */}
            <Link
              href={buildPageUrl(1)}
              className={cn(
                'grid size-8 place-items-center rounded-md border border-[#dec9a5] bg-[#ffffff] text-[#082046] text-xs transition-colors hover:bg-[#F4E8D1]',
                page <= 1 && 'pointer-events-none opacity-40',
              )}
              aria-label="First page"
              title="First page"
            >
              <ChevronsLeft className="size-4" />
            </Link>

            {/* Previous Page */}
            <Link
              href={buildPageUrl(Math.max(1, page - 1))}
              className={cn(
                'grid size-8 place-items-center rounded-md border border-[#dec9a5] bg-[#ffffff] text-[#082046] text-xs transition-colors hover:bg-[#F4E8D1]',
                page <= 1 && 'pointer-events-none opacity-40',
              )}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Link>

            {/* Page Numbers */}
            {getPageNumbers().map((num, idx) => {
              if (num === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-xs font-bold text-[#76562d]">
                    ...
                  </span>
                );
              }
              const isCurrent = num === page;
              return (
                <Link
                  key={`page-${num}`}
                  href={buildPageUrl(num as number)}
                  className={cn(
                    'grid size-8 place-items-center rounded-md text-xs font-bold transition-all border',
                    isCurrent
                      ? 'border-[#082046] bg-[#082046] text-[#ffffff]'
                      : 'border-[#dec9a5] bg-[#ffffff] text-[#243b5b] hover:bg-[#F4E8D1]',
                  )}
                >
                  {num}
                </Link>
              );
            })}

            {/* Next Page */}
            <Link
              href={buildPageUrl(Math.min(totalPages, page + 1))}
              className={cn(
                'grid size-8 place-items-center rounded-md border border-[#dec9a5] bg-[#ffffff] text-[#082046] text-xs transition-colors hover:bg-[#F4E8D1]',
                page >= totalPages && 'pointer-events-none opacity-40',
              )}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </Link>

            {/* Last Page */}
            <Link
              href={buildPageUrl(totalPages)}
              className={cn(
                'grid size-8 place-items-center rounded-md border border-[#dec9a5] bg-[#ffffff] text-[#082046] text-xs transition-colors hover:bg-[#F4E8D1]',
                page >= totalPages && 'pointer-events-none opacity-40',
              )}
              aria-label="Last page"
              title="Last page"
            >
              <ChevronsRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
