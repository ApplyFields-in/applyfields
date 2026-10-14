'use client';

import { useState } from 'react';
import type { InstitutionSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState } from '@applyfields/ui';
import {
  ArrowRight,
  Award,
  Building,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { SaveButton } from '@/components/save-button';

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
}: CollegesGridClientProps) {
  const [selectedColleges, setSelectedColleges] = useState<
    Array<{ slug: string; name: string; short_name: string | null }>
  >([]);

  const toggleCompare = (college: InstitutionSummary) => {
    const isSelected = selectedColleges.some((c) => c.slug === college.slug);
    if (isSelected) {
      setSelectedColleges(selectedColleges.filter((c) => c.slug !== college.slug));
    } else {
      if (selectedColleges.length >= 4) {
        alert('You can compare up to 4 colleges at a time.');
        return;
      }
      setSelectedColleges([
        ...selectedColleges,
        { slug: college.slug, name: college.name, short_name: college.short_name },
      ]);
    }
  };

  const isCompared = (slug: string) => selectedColleges.some((c) => c.slug === slug);

  // Helper to build page URL preserving search and filter parameters
  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
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
    <div className="space-y-6">
      {/* Header Info & Counts */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-teal/70">
        <div>
          Showing <strong className="text-teal font-bold">{total > 0 ? startCount : 0}</strong> to{' '}
          <strong className="text-teal font-bold">{endCount}</strong> of{' '}
          <strong className="text-teal font-bold">{total.toLocaleString()}</strong> institutions (20 per page)
        </div>
        <div className="text-[11px] text-teal/60">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>
      </div>

      {/* College Cards Grid */}
      {colleges.length === 0 ? (
        <EmptyState
          icon={<Building />}
          title="No institutions found"
          text="Try broadening your search term or clearing the filters above."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {colleges.map((c) => {
            const compared = isCompared(c.slug);
            return (
              <Card
                key={c.id}
                className={cn(
                  'group flex flex-col justify-between p-6 transition-all hover:border-teal/40 hover:shadow-clay',
                  compared && 'border-teal ring-2 ring-teal/20 bg-teal/[0.02]',
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="teal" className="text-[11px]">
                        {TYPE_LABELS[c.type] || c.type}
                      </Badge>
                      {c.ranking_text && (
                        <Badge tone="tea" className="gap-1 text-[11px] font-bold">
                          <Award className="size-3" /> {c.ranking_text}
                        </Badge>
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
                    <h2 className="mt-3 text-lg font-bold text-teal group-hover:underline line-clamp-2">
                      {c.name}
                    </h2>
                  </Link>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-teal/70">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-teal/50" /> {c.city || c.district || 'India'}
                      {c.state_code ? `, ${c.state_code}` : ''}
                    </span>
                    {c.ownership && (
                      <span>
                        · {c.ownership === 'government' ? 'Government' : c.ownership.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Placement & Tuition Fee Highlights */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-tea/30 p-3 text-xs">
                    <div>
                      <span className="text-[11px] text-teal/70 font-medium">Placement Avg</span>
                      <p className="font-bold text-teal mt-0.5 truncate">
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
                    {/* Add to compare toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCompare(c)}
                      className={buttonClass({
                        variant: compared ? 'primary' : 'secondary',
                        size: 'sm',
                        className: cn(
                          'text-xs gap-1 transition-all',
                          compared && 'bg-teal text-cream font-bold',
                        ),
                      })}
                      title={compared ? 'Click to remove from compare' : 'Add to compare tray'}
                    >
                      {compared ? (
                        <>
                          <Check className="size-3.5" /> Comparing
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5" /> Compare
                        </>
                      )}
                    </button>

                    <Link
                      href={`/career/colleges/${c.slug}`}
                      className={buttonClass({
                        variant: 'primary',
                        size: 'sm',
                        className: 'gap-1 shadow-clay text-xs',
                      })}
                    >
                      View Details <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-line/60 bg-cream/30 p-4 shadow-sm">
          <div className="text-xs text-teal/70">
            Showing <strong className="font-bold text-teal">{startCount}</strong> to{' '}
            <strong className="font-bold text-teal">{endCount}</strong> of{' '}
            <strong className="font-bold text-teal">{total.toLocaleString()}</strong> colleges
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* First Page */}
            <Link
              href={buildPageUrl(1)}
              className={buttonClass({
                variant: 'ghost',
                size: 'sm',
                className: cn('size-8 p-0', page <= 1 && 'pointer-events-none opacity-40'),
              })}
              aria-label="First page"
              title="First page"
            >
              <ChevronsLeft className="size-4" />
            </Link>

            {/* Previous Page */}
            <Link
              href={buildPageUrl(Math.max(1, page - 1))}
              className={buttonClass({
                variant: 'ghost',
                size: 'sm',
                className: cn('size-8 p-0', page <= 1 && 'pointer-events-none opacity-40'),
              })}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Link>

            {/* Page Numbers */}
            {getPageNumbers().map((num, idx) => {
              if (num === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-xs font-bold text-teal/50">
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
                    'grid size-8 place-items-center rounded-xl text-xs font-bold transition-all',
                    isCurrent
                      ? 'bg-teal text-cream shadow-sm scale-105'
                      : 'bg-canvas text-teal/80 hover:bg-tea/40 border border-line/60',
                  )}
                >
                  {num}
                </Link>
              );
            })}

            {/* Next Page */}
            <Link
              href={buildPageUrl(Math.min(totalPages, page + 1))}
              className={buttonClass({
                variant: 'ghost',
                size: 'sm',
                className: cn('size-8 p-0', page >= totalPages && 'pointer-events-none opacity-40'),
              })}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </Link>

            {/* Last Page */}
            <Link
              href={buildPageUrl(totalPages)}
              className={buttonClass({
                variant: 'ghost',
                size: 'sm',
                className: cn('size-8 p-0', page >= totalPages && 'pointer-events-none opacity-40'),
              })}
              aria-label="Last page"
              title="Last page"
            >
              <ChevronsRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Floating Compare Dock */}
      {selectedColleges.length > 0 && (
        <aside
          aria-label="College Comparison Tray"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[94%] max-w-3xl animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-teal/40 bg-teal/95 p-3.5 text-cream shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 overflow-x-auto max-w-full w-full sm:w-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <Columns className="size-4 text-tea" />
                <span className="text-xs font-bold">
                  Compare ({selectedColleges.length}/4):
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                {selectedColleges.map((c) => (
                  <span
                    key={c.slug}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cream/15 px-2.5 py-1 text-[11px] font-semibold text-cream border border-cream/20 shrink-0"
                  >
                    <span className="max-w-[130px] truncate">{c.short_name || c.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleCompare(c as InstitutionSummary)}
                      className="hover:text-amber-300 transition-colors"
                      title={`Remove ${c.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setSelectedColleges([])}
                className="text-xs font-semibold text-cream/70 hover:text-cream px-2 py-1"
              >
                Clear
              </button>

              <Link
                href={`/career/colleges/compare?slugs=${selectedColleges.map((c) => c.slug).join(',')}`}
                className={buttonClass({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'bg-tea text-teal font-extrabold hover:bg-tea/90 shadow-clay text-xs gap-1.5',
                })}
              >
                <Columns className="size-3.5" />
                Compare Now
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
