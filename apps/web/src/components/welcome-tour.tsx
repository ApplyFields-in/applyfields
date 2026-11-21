'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { getStoredConsent } from '@/lib/cookies/use-cookie-consent';
import { ONBOARDED_KEY, currentUserId, isOnboarded } from '@/components/onboarding/onboarded';

/**
 * First-visit tour for signed-in users on Home. Each step points at an element marked
 * data-tour="<key>" (navbar or mobile bottom bar). If that element is hidden on this screen
 * size, the step shows as a centred card instead. Starts only after the cookie banner is answered
 * and first-sign-in setup is finished or skipped. Skipping or finishing hides it for good
 * for that account on this browser. ponytail: remembered per browser+account (localStorage); move to the user profile
 * if it should follow people across devices.
 */
const DONE_KEY = 'applyfields-tour-done';

const STEPS: { target?: string; title: string; body: string }[] = [
  {
    title: 'Welcome to ApplyFields 👋',
    body: 'Jobs, exams, scholarships, admissions and government services, all in one place. Take a quick 1-minute tour?',
  },
  {
    target: 'apply',
    title: 'Apply',
    body: 'Government jobs, exams, scholarships and admissions with deadlines, eligibility and the official apply link.',
  },
  {
    target: 'career',
    title: 'Career',
    body: 'Explore careers, follow step-by-step roadmaps, compare colleges and ask the AI career guide.',
  },
  {
    target: 'services',
    title: 'Services',
    body: 'Need help with PAN, Aadhaar, MeeSeva or a printout? Book a nearby centre here.',
  },
  {
    target: 'search',
    title: 'Search everything',
    body: 'Find any job, exam, college or update in one search. Tip: press Ctrl + K anywhere.',
  },
  {
    target: 'notifications',
    title: 'Never miss a deadline',
    body: 'Reminders before last dates, plus new results and updates for what you saved.',
  },
  {
    target: 'profile',
    title: 'Complete your profile',
    body: 'Add your education and details once. We use them to show only what you are eligible for.',
  },
];

type Box = { top: number; left: number; width: number; height: number };

/** First visible element for this step (the navbar and the mobile bar can both carry the same key). */
function findTarget(key?: string): HTMLElement | null {
  if (!key) return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

export function WelcomeTour() {
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Start once: signed in, on Home, never finished/skipped on this browser.
  useEffect(() => {
    if (pathname !== '/') return;
    let pending = false;
    try {
      pending = !!currentUserId() && localStorage.getItem(DONE_KEY) !== currentUserId();
    } catch {
      return;
    }
    if (!pending) return;
    // Wait for the cookie banner and for first-sign-in setup (/welcome) so nothing overlaps.
    let t: ReturnType<typeof setTimeout> | undefined;
    const ready = () => {
      try {
        return !!getStoredConsent() && isOnboarded();
      } catch {
        return false;
      }
    };
    const check = () => {
      if (ready() && t === undefined) t = setTimeout(() => setStep(0), 800); // let the page settle first
    };
    check();
    window.addEventListener('cookie-consent-changed', check);
    window.addEventListener(ONBOARDED_KEY, check);
    return () => {
      clearTimeout(t);
      window.removeEventListener('cookie-consent-changed', check);
      window.removeEventListener(ONBOARDED_KEY, check);
    };
  }, [pathname]);

  const close = useCallback(() => {
    try {
      localStorage.setItem(DONE_KEY, currentUserId() ?? '');
    } catch {
      // storage blocked: the tour may show again next time
    }
    setStep(null);
  }, []);

  // Measure the highlighted element; follow scroll and resize.
  useLayoutEffect(() => {
    if (step === null) return;
    const el = findTarget(STEPS[step].target);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const measure = () => {
      const r = el?.getBoundingClientRect();
      setBox(r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  useEffect(() => {
    if (step === null) return;
    nextRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setStep((s) => (s !== null && s < STEPS.length - 1 ? s + 1 : s));
      if (e.key === 'ArrowLeft') setStep((s) => (s ? s - 1 : s));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, close]);

  if (step === null) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const PAD = 6;
  const CARD_W = 320;

  // Card goes below the target, or above it when the target sits low (mobile bottom bar).
  let cardStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  if (box) {
    const vw = window.innerWidth;
    const left = Math.min(Math.max(12, box.left + box.width / 2 - CARD_W / 2), vw - CARD_W - 12);
    const below = box.top + box.height < window.innerHeight * 0.6;
    cardStyle = below
      ? { top: box.top + box.height + PAD + 12, left }
      : { bottom: window.innerHeight - box.top + PAD + 12, left };
  }

  return (
    <div className="print:hidden fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Dim layer: a cut-out around the target, or a plain backdrop for centred steps */}
      {box ? (
        <div
          className="pointer-events-none fixed rounded-2xl ring-2 ring-[#0e7bf4] transition-all duration-300"
          style={{
            top: box.top - PAD,
            left: box.left - PAD,
            width: box.width + PAD * 2,
            height: box.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(8, 32, 70, 0.55)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[#082046]/55" />
      )}

      <div
        className="fixed w-[min(320px,calc(100vw-24px))] rounded-2xl bg-white p-5 shadow-2xl"
        style={cardStyle}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 rounded-full p-1 text-[#536780] hover:bg-slate-100 hover:text-[#082046]"
          aria-label="Skip tour"
        >
          <X className="size-4" />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0e7bf4]">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 pr-6 text-base font-extrabold text-[#082046]">
          {s.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#435775]">{s.body}</p>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-[#0e7bf4]' : 'w-1.5 bg-[#c4d2e3]'}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={close} className="text-xs font-semibold text-[#536780] hover:text-[#082046] hover:underline">
            Skip tour
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="rounded-full border border-[#c4d2e3] px-4 py-2 text-xs font-bold text-[#082046] hover:bg-slate-50"
              >
                Back
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? close() : setStep(step + 1))}
              className="rounded-full bg-[#082046] px-4 py-2 text-xs font-bold text-white hover:bg-[#0e7bf4]"
            >
              {step === 0 ? 'Start tour' : last ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
