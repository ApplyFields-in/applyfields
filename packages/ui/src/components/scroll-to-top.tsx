'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../cn';

/**
 * Universal ScrollToTop utility that smoothly scrolls window and any nested container to top.
 */
export function scrollToPageTop() {
  if (typeof window === 'undefined') return;

  // Window & document level
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (document.documentElement) {
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (document.body) {
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Any scrollable main tag or inner overflow container (like in dashboards)
  const main = document.querySelector('main');
  if (main) {
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const scrollables = document.querySelectorAll<HTMLElement>(
    '[data-scroll-container], .overflow-y-auto, .overflow-auto'
  );
  scrollables.forEach((el) => {
    try {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      el.scrollTop = 0;
    }
  });
}

/**
 * Floating Back-To-Top button that appears when the user scrolls down.
 * Compatible with all 4 portals (Web, Admin, Partner, Services).
 */
export function ScrollToTop({
  threshold = 240,
  className,
  showLabel = true,
}: {
  threshold?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const windowY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const mainY = document.querySelector('main')?.scrollTop || 0;
      const isPast = windowY > threshold || mainY > threshold;
      setVisible(isPast);
    };

    // Initial check
    checkScroll();

    // Listen to scroll events anywhere in window/document with capture: true
    window.addEventListener('scroll', checkScroll, { passive: true, capture: true });
    window.addEventListener('resize', checkScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScroll, true);
      window.removeEventListener('resize', checkScroll);
    };
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToPageTop}
      aria-label="Scroll back to top"
      title="Back to top"
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-[#082046]/90 px-3.5 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-[#0e7bf4] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#38bdf8] focus:ring-offset-2 active:scale-95 sm:bottom-8 sm:right-8',
        className
      )}
    >
      <ArrowUp className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
      {showLabel && <span className="tracking-wide">Back to Top</span>}
    </button>
  );
}

/**
 * Inline Click-To-Top button to be placed at the end of footers or pages.
 */
export function ScrollToTopButton({
  label = 'Back to top',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={scrollToPageTop}
      aria-label="Back to top of page"
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-full border border-current/20 px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:bg-white/10 active:scale-95',
        className
      )}
    >
      <span>{label}</span>
      <ArrowUp className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}
