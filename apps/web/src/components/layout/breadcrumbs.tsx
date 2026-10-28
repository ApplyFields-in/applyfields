'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`print:hidden flex flex-wrap items-center gap-1.5 text-xs text-[#536780] ${className}`}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-medium text-[#76562d] hover:text-[#082046] transition-colors"
        title="Home"
      >
        <Home className="size-3.5" />
        <span className="sr-only sm:not-sr-only sm:inline">Home</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <span key={idx} className="inline-flex items-center gap-1.5 min-w-0">
            <ChevronRight className="size-3 text-[#76562d]/50 shrink-0" aria-hidden="true" />
            {isLast || !item.href ? (
              <span
                className="truncate max-w-[200px] sm:max-w-[320px] md:max-w-[420px] font-bold text-[#082046]"
                aria-current={isLast ? 'page' : undefined}
                title={item.label}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="truncate max-w-[160px] sm:max-w-[220px] font-medium text-[#536780] hover:text-[#082046] transition-colors"
                title={item.label}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

