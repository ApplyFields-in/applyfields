'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Award,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Compass,
  FlaskConical,
  Layers,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@applyfields/ui';

export interface CollegeCategoryOption {
  title: string;
  subtitle: string;
  href: string;
  streamKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const COLLEGE_CATEGORIES: CollegeCategoryOption[] = [
  {
    title: 'All Colleges in India',
    subtitle: '13,000+ Verified Universities, Institutes & Colleges',
    href: '/career/colleges',
    streamKey: '',
    icon: Building2,
  },
  {
    title: 'Top 50 Engineering Colleges',
    subtitle: 'NIRF Ranked Premier IITs, NITs, BITS & Top Tech Institutes',
    href: '/career/colleges?stream=top-50-engg',
    streamKey: 'top-50-engg',
    icon: Award,
  },
  {
    title: 'Management Colleges',
    subtitle: 'MBA, PGDM, Business Schools & Executive Management',
    href: '/career/colleges?stream=management',
    streamKey: 'management',
    icon: Briefcase,
  },
  {
    title: 'Polytechnic Colleges',
    subtitle: '3-Year Technical Education & Hands-on Engineering Diplomas',
    href: '/career/colleges?stream=polytechnic',
    streamKey: 'polytechnic',
    icon: Layers,
  },
  {
    title: 'Architecture & Town Planning',
    subtitle: 'B.Arch, Planning, Interior & Environmental Design Institutes',
    href: '/career/colleges?stream=architecture',
    streamKey: 'architecture',
    icon: Compass,
  },
  {
    title: 'Pharmacy Colleges',
    subtitle: 'B.Pharm, M.Pharm & Pharmaceutical Science Institutes',
    href: '/career/colleges?stream=pharmacy',
    streamKey: 'pharmacy',
    icon: FlaskConical,
  },
  {
    title: 'Medical Colleges',
    subtitle: 'MBBS, BDS & Allied Health Sciences (Dataset coming next)',
    href: '/career/colleges?stream=medical',
    streamKey: 'medical',
    icon: Stethoscope,
  },
];

export function CareerCollegesHoverMenu({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    // If clicked on mobile or touch device, toggle open
    if (!isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      className={cn('relative inline-block group', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button with Hover & Click Support - Rectangular rounded-md */}
      <Link
        href="/career/colleges"
        className={cn(
          'inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-semibold text-[#082046] transition-all duration-200 hover:bg-[#ffffff] hover:border-[#082046]/40 cursor-pointer',
          isOpen && 'bg-[#ffffff] border-[#082046] text-[#0e7bf4] shadow-sm',
        )}
        onClick={handleToggleClick}
      >
        <Building2 className="size-4 text-[#0e7bf4]" />
        <span>Colleges &amp; universities</span>
        <ChevronDown
          className={cn(
            'size-3.5 text-[#082046]/60 transition-transform duration-200',
            isOpen && 'rotate-180 text-[#0e7bf4]',
          )}
        />
      </Link>

      {/* Flyout Dropdown Menu - Rectangular rounded-md */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-[380px] sm:w-[420px] rounded-md border border-[#dec9a5] bg-[#fbf9f4] p-2.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-150 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2"
          role="menu"
          aria-label="Colleges and Universities in India"
        >
          <div className="px-3 py-2 border-b border-[#dec9a5]/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#76562d]">
              Browse Higher Education in India
            </p>
            <p className="text-xs font-semibold text-[#082046] mt-0.5">
              Select stream or explore premier ranked institutions
            </p>
          </div>

          <div className="space-y-1 pt-1.5 max-h-[460px] overflow-y-auto scrollbar-thin">
            {COLLEGE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;

              return (
                <Link
                  key={cat.streamKey || 'all'}
                  href={cat.href}
                  onClick={() => setIsOpen(false)}
                  className="group/item flex items-start justify-between gap-3 rounded-md p-2.5 transition-all duration-150 hover:bg-[#F4E8D1] border border-transparent hover:border-[#dec9a5]"
                  role="menuitem"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-8 rounded-md flex items-center justify-center shrink-0 border border-[#dec9a5] bg-[#ffffff] text-[#082046] group-hover/item:text-[#0e7bf4] group-hover/item:border-[#082046]/30 transition-colors">
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#082046] group-hover/item:text-[#0e7bf4] transition-colors leading-snug">
                        {cat.title}
                      </span>
                      <p className="text-[11px] text-[#536780] leading-tight mt-0.5 line-clamp-1">
                        {cat.subtitle}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="size-3.5 text-[#536780]/60 group-hover/item:text-[#0e7bf4] group-hover/item:translate-x-0.5 transition-all shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[#dec9a5]/50 px-2 flex items-center justify-between text-[11px] font-semibold text-[#536780]">
            <span>Direct Comparison Available</span>
            <Link
              href="/career/colleges/compare"
              onClick={() => setIsOpen(false)}
              className="text-[#0e7bf4] hover:underline flex items-center gap-1 font-bold"
            >
              Compare Colleges Tool &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
