'use client';

import Link from 'next/link';
import { Filter, X, RotateCcw } from 'lucide-react';

export interface ActiveFilterItem {
  key: string;
  label: string;
  displayValue: string;
  removeHref: string;
}

interface ActiveFilterTrayProps {
  filters: ActiveFilterItem[];
  clearAllHref: string;
  totalResults?: number;
  className?: string;
}

export function ActiveFilterTray({
  filters,
  clearAllHref,
  totalResults,
  className = '',
}: ActiveFilterTrayProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <div
      aria-label="Active filters"
      className={`print:hidden flex flex-wrap items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-3 text-xs shadow-sm ${className}`}
    >
      <div className="flex items-center gap-1.5 font-bold text-[#76562d] shrink-0">
        <Filter className="size-3.5 text-[#76562d]" />
        <span>Filtered by:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {filters.map((filter) => (
          <Link
            key={filter.key}
            href={filter.removeHref}
            title={`Remove ${filter.label} filter: ${filter.displayValue}`}
            className="group inline-flex items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#ffffff] px-2.5 py-1 text-xs font-semibold text-[#082046] hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-colors shadow-2xs"
          >
            <span>
              <span className="text-[#536780] font-normal mr-1">{filter.label}:</span>
              {filter.displayValue}
            </span>
            <X className="size-3 text-[#536780] group-hover:text-red-600 transition-colors" />
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto pt-1 sm:pt-0">
        {totalResults !== undefined && (
          <span className="text-xs font-medium text-[#536780] mr-1 hidden sm:inline">
            ({totalResults} result{totalResults === 1 ? '' : 's'})
          </span>
        )}
        <Link
          href={clearAllHref}
          className="inline-flex items-center gap-1 font-bold text-[#76562d] hover:text-red-600 hover:underline transition-colors text-xs"
        >
          <RotateCcw className="size-3" />
          <span>Clear All</span>
        </Link>
      </div>
    </div>
  );
}

