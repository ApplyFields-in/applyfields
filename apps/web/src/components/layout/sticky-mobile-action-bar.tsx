'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SaveButton } from '@/components/save-button';
import { ShareModal } from '@/components/share/share-modal';

export interface StickyMobileActionBarProps {
  title: string;
  badgeText?: string;
  primaryCtaLabel?: string;
  primaryCtaHref: string;
  isExternal?: boolean;
  slug: string;
  itemType: 'opportunity' | 'institution';
  category?: string;
  scrollThreshold?: number;
}

export function StickyMobileActionBar({
  title,
  badgeText,
  primaryCtaLabel = 'Apply Online',
  primaryCtaHref,
  isExternal = false,
  slug,
  itemType,
  category = 'Details',
  scrollThreshold = 280,
}: StickyMobileActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setIsVisible(window.scrollY > scrollThreshold);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollThreshold]);

  if (!isVisible) return null;

  return (
    <div className="print:hidden sm:hidden fixed bottom-16 inset-x-0 z-30 px-3 pb-2 pt-1 transition-all duration-300 pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-lg border border-[#dec9a5] bg-[#ffffff]/98 backdrop-blur-md p-2.5 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#082046] truncate">{title}</p>
          {badgeText && (
            <span className="text-[10px] font-semibold text-[#76562d] block truncate">
              {badgeText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ShareModal
            variant="icon"
            title={title}
            category={category}
            buttonClassName="size-8"
          />

          <SaveButton
            itemType={itemType}
            slug={slug}
            title={title}
          />

          {isExternal ? (
            <a
              href={primaryCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#082046] px-3 text-xs font-bold text-[#ffffff] hover:bg-[#0c2e63] transition-colors shadow-sm"
            >
              <span>{primaryCtaLabel}</span>
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <Link
              href={primaryCtaHref}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#082046] px-3 text-xs font-bold text-[#ffffff] hover:bg-[#0c2e63] transition-colors shadow-sm"
            >
              <span>{primaryCtaLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

