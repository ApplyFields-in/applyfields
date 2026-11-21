'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

const EVENT = 'applyfields-flash-toast';
const KEY = 'applyfields-flash-toast';

type Toast = { message: string; type?: 'success' | 'info' };

/** Show a short popup ("Logged in successfully"). Survives a page change, so call it right before router.push. */
export function flashToast(message: string, type: Toast['type'] = 'success') {
  const detail: Toast = { message, type };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(detail));
  } catch {
    // storage blocked: the live event still works
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail }));
}

/** Mount once in the root layout. */
export function FlashToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      try {
        sessionStorage.removeItem(KEY);
      } catch {
        // ignore
      }
      setToast((e as CustomEvent<Toast>).detail);
    };
    window.addEventListener(EVENT, onToast);
    try {
      const saved = sessionStorage.getItem(KEY);
      if (saved) window.dispatchEvent(new CustomEvent(EVENT, { detail: JSON.parse(saved) as Toast }));
    } catch {
      // storage blocked or bad JSON: skip
    }
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  const Icon = toast.type === 'info' ? Info : CheckCircle2;

  return (
    <div
      role="status"
      aria-live="polite"
      className="print:hidden fixed bottom-6 left-1/2 z-[100] flex w-[92vw] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border border-[#d6e2f0] bg-white p-3.5 shadow-xl"
    >
      <Icon className={`size-5 shrink-0 ${toast.type === 'info' ? 'text-[#0e7bf4]' : 'text-[#15803d]'}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm font-semibold text-[#082046]">{toast.message}</p>
      <button
        type="button"
        onClick={() => setToast(null)}
        className="rounded p-1 text-[#536780] hover:text-[#082046]"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
