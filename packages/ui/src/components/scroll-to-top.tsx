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
  threshold = 200,
  className,
  showLabel = true,
}: {
  threshold?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkScroll = () => {
      const windowY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const mainEl = document.querySelector('main');
      const mainY = mainEl?.scrollTop || 0;
      const currentScroll = Math.max(windowY, mainY);

      const docHeight = Math.max(
        (document.documentElement.scrollHeight || 0) - (window.innerHeight || 0),
        (mainEl?.scrollHeight || 0) - (mainEl?.clientHeight || 0)
      );

      const p = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((currentScroll / docHeight) * 100))) : 0;
      setProgress(p);
      setVisible(currentScroll > threshold);
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

  // Circumference for r=16: 2 * Math.PI * 16 ≈ 100.53
  const strokeDashoffset = 100.53 - (100.53 * progress) / 100;

  return (
    <button
      type="button"
      onClick={scrollToPageTop}
      aria-label={`Scroll back to top (${progress}% completed)`}
      title={`Back to top (${progress}% scrolled)`}
      className={cn(
        'group fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-full border border-white/25 bg-[#082046]/95 p-1.5 pr-4 text-xs font-bold text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-[#0e7bf4] hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-[#38bdf8] focus:ring-offset-2 active:scale-95 sm:bottom-8 sm:left-8',
        className
      )}
    >
      {/* Circular Progress Ring */}
      <div className="relative grid size-8 place-items-center">
        <svg className="size-8 -rotate-90 transform" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-white/20"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray={100.53}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-150 ease-out"
          />
        </svg>
        <ArrowUp className="absolute size-3.5 text-white transition-transform duration-200 group-hover:-translate-y-0.5" />
      </div>

      <div className="flex flex-col items-start text-left leading-none">
        {showLabel && <span className="text-[11px] font-semibold text-white/90">Top</span>}
        <span className="text-[9px] font-mono font-bold text-[#38bdf8]">{progress}%</span>
      </div>
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
