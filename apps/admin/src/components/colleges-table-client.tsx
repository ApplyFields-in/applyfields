'use client';

import { useState, useTransition } from 'react';
import type { InstitutionSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState } from '@applyfields/ui';
import {
  AlertCircle,
  Award,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  ExternalLink,
  MapPin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteCollegeAction } from '@/lib/actions';
import { CollegeFormModal } from './college-form-modal';

interface CollegesTableClientProps {
  colleges: InstitutionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  q: string;
  type: string;
  state: string;
}

const TYPE_LABELS: Record<string, string> = {
  institute: 'Institute',
  university: 'University',
  college: 'College',
  autonomous: 'Autonomous',
  deemed: 'Deemed',
  school: 'School',
  training_centre: 'Training Centre',
};

export function CollegesTableClient({
  colleges,
  total,
  page,
  limit,
  totalPages,
  q,
  type,
  state,
}: CollegesTableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<InstitutionSummary | null>(null);

  const openCreateModal = () => {
    setSelectedCollege(null);
    setIsModalOpen(true);
  };

  const openEditModal = (college: InstitutionSummary) => {
    setSelectedCollege(college);
    setIsModalOpen(true);
  };

  const handleDelete = (college: InstitutionSummary) => {
    const confirmText = `Are you sure you want to permanently delete "${college.name}"? This action cannot be undone.`;
    if (!window.confirm(confirmText)) return;

    startTransition(async () => {
      const res = await deleteCollegeAction(college.id);
      if (res.ok) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete college.');
      }
    });
  };

  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (state) p.set('state', state);
    if (targetPage > 1) p.set('page', String(targetPage));
    return `/colleges${p.size ? `?${p}` : ''}`;
  };

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
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form action="/colleges" method="GET" className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by college name, city, state, or ranking..."
                className="h-10 w-full rounded-full border border-line bg-canvas pl-9 pr-4 text-xs font-medium text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
              />
            </div>
            {type && <input type="hidden" name="type" value={type} />}
            {state && <input type="hidden" name="state" value={state} />}
            <button type="submit" className={buttonClass({ variant: 'primary', size: 'sm' })}>
              Search
            </button>
            {(q || type || state) && (
              <Link href="/colleges" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
                Clear
              </Link>
            )}
          </form>

          <button
            type="button"
            onClick={openCreateModal}
            className={buttonClass({
              variant: 'primary',
              size: 'sm',
              className: 'gap-1.5 shadow-clay shrink-0',
            })}
          >
            <Plus className="size-4" /> Add College
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line/40 text-xs">
          <span className="text-[11px] font-semibold text-teal/60">Type:</span>
          {['', 'institute', 'university', 'college'].map((tKey) => {
            const isActive = type === tKey;
            const p = new URLSearchParams();
            if (q) p.set('q', q);
            if (tKey) p.set('type', tKey);
            if (state) p.set('state', state);
            return (
              <Link
                key={tKey || 'all'}
                href={`/colleges${p.size ? `?${p}` : ''}`}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-teal text-cream shadow-sm'
                    : 'bg-canvas text-teal/70 hover:bg-tea/30 border border-line/60'
                }`}
              >
                {tKey ? TYPE_LABELS[tKey] || tKey : 'All Types'}
              </Link>
            );
          })}

          <span className="ml-2 text-[11px] font-semibold text-teal/60">State:</span>
          {['AP', 'TS', 'TN', 'KA', 'MH', 'DL', 'UP'].map((stKey) => {
            const isActive = state === stKey;
            const p = new URLSearchParams();
            if (q) p.set('q', q);
            if (type) p.set('type', type);
            if (!isActive) p.set('state', stKey);
            return (
              <Link
                key={stKey}
                href={`/colleges${p.size ? `?${p}` : ''}`}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-tea text-teal border border-teal/40 font-bold'
                    : 'bg-canvas text-teal/70 hover:bg-tea/20 border border-line/60'
                }`}
              >
                {stKey}
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Counter summary */}
      <div className="flex items-center justify-between px-1 text-xs text-teal/70">
        <div>
          Showing <strong>{total > 0 ? startCount : 0}</strong> to{' '}
          <strong>{endCount}</strong> of <strong>{total.toLocaleString()}</strong> institutions
        </div>
        <div>20 per page · Page {page} of {totalPages}</div>
      </div>

      {/* Institutions Table */}
      {colleges.length === 0 ? (
        <EmptyState
          icon={<Building />}
          title="No institutions found"
          text="Try adjusting your search query or filters."
        />
      ) : (
        <Card className="overflow-hidden p-0 border border-line/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line/60 bg-cream/40 text-[11px] font-bold uppercase tracking-wider text-teal/80">
                <tr>
                  <th className="px-4 py-3">College & Identity</th>
                  <th className="px-3 py-3">Type / Ownership</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Ranking / Accreditation</th>
                  <th className="px-3 py-3">Fees & Placements</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-medium">
                {colleges.map((c) => (
                  <tr key={c.id} className="hover:bg-tea/10 transition-colors">
                    {/* College & Identity */}
                    <td className="px-4 py-3.5 max-w-[280px]">
                      <div className="font-bold text-teal line-clamp-2" title={c.name}>
                        {c.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-teal/60">
                        {c.short_name && <span className="font-semibold">{c.short_name} ·</span>}
                        <span className="font-mono text-[10px] text-teal/50">/{c.slug}</span>
                      </div>
                    </td>

                    {/* Type / Ownership */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge tone="teal" className="text-[10px] uppercase">
                          {TYPE_LABELS[c.type] || c.type}
                        </Badge>
                        <span className="text-[11px] text-teal/70">
                          {c.ownership === 'government' ? 'Government' : c.ownership || 'Private'}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-teal/80">
                        <MapPin className="size-3 text-teal/50 shrink-0" />
                        <span>{c.city || c.district || '—'}</span>
                        {c.state_code && (
                          <span className="font-bold text-teal">({c.state_code})</span>
                        )}
                      </div>
                    </td>

                    {/* Ranking */}
                    <td className="px-3 py-3.5 max-w-[200px]">
                      {c.ranking_text ? (
                        <span title={c.ranking_text} className="inline-block max-w-full">
                          <Badge tone="tea" className="text-[10px] font-bold line-clamp-1 gap-1">
                            <Award className="size-3 shrink-0" />
                            <span className="truncate">{c.ranking_text}</span>
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-[11px] text-teal/40 italic">Not Ranked</span>
                      )}
                    </td>

                    {/* Fees & Placements */}
                    <td className="px-3 py-3.5 max-w-[200px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-teal/60">Fee:</span>
                          {c.fees_text ? (
                            <span className="font-bold text-teal truncate text-[11px]">{c.fees_text}</span>
                          ) : (
                            <Badge tone="tea" className="text-[9px] font-semibold">Missing</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-teal/60">Pkg:</span>
                          <span className="text-[11px] text-teal/80 truncate">
                            {c.placement_stats?.avg_package || 'Data not given'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className={buttonClass({
                            variant: 'secondary',
                            size: 'sm',
                            className: 'h-8 px-2.5 text-xs gap-1',
                          })}
                          title="Edit college or fill missing fields"
                        >
                          <Edit3 className="size-3.5 text-teal" />
                          Edit
                        </button>

                        <a
                          href={`http://localhost:3000/career/colleges/${c.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonClass({
                            variant: 'ghost',
                            size: 'sm',
                            className: 'h-8 w-8 p-0 text-teal/70 hover:text-teal',
                          })}
                          title="View on Citizen Portal"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={isPending}
                          className={buttonClass({
                            variant: 'ghost',
                            size: 'sm',
                            className: 'h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700',
                          })}
                          title="Delete college"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-line/60 bg-cream/30 p-4 shadow-sm">
          <div className="text-xs text-teal/70">
            Showing <strong className="font-bold text-teal">{startCount}</strong> to{' '}
            <strong className="font-bold text-teal">{endCount}</strong> of{' '}
            <strong className="font-bold text-teal">{total.toLocaleString()}</strong> institutions
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* College Add / Edit Modal */}
      {isModalOpen && (
        <CollegeFormModal
          isOpen={isModalOpen}
          college={selectedCollege}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCollege(null);
          }}
        />
      )}
    </div>
  );
}
