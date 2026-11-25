'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { SuccessCheck } from './animated-icons';

const EVENT = 'applyfields-flash-toast';
const KEY = 'applyfields-flash-toast';

type Toast = { message: string; type?: 'success' | 'info' | 'error' };

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

/**
 * Mount once in the root layout.
 * catchErrors: also pop up any error no code handled (a failed server action, a crashed click handler).
 */
export function FlashToast({ catchErrors = false }: { catchErrors?: boolean }) {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!catchErrors) return;
    const show = (err: unknown) => {
      const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
      // Server-action network drops surface as "Failed to fetch"; say what that means.
      const text = /failed to fetch|network|load failed/i.test(msg)
        ? 'Connection lost: check your internet and try again.'
        : `Something went wrong${msg ? `: ${msg}` : ''}`;
      setToast({ message: text, type: 'error' });
    };
    const onRejection = (e: PromiseRejectionEvent) => show(e.reason);
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, [catchErrors]);

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
    // Errors stay longer: they usually need reading.
    const t = setTimeout(() => setToast(null), toast.type === 'error' ? 9000 : 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  const isError = toast.type === 'error';
  const Icon = isError ? TriangleAlert : toast.type === 'info' ? Info : CheckCircle2;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`print:hidden fixed bottom-6 left-1/2 z-[100] flex w-[92vw] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border p-3.5 shadow-xl ${isError ? 'border-[#fca5a5] bg-[#fef2f2]' : 'border-[#d6e2f0] bg-white'}`}
    >
      {Icon === CheckCircle2 ? (
        <SuccessCheck key={toast.message} size={20} className="shrink-0 text-[#15803d]" />
      ) : (
        <Icon className={`size-5 shrink-0 ${isError ? 'text-[#b91c1c]' : 'text-[#0e7bf4]'}`} aria-hidden="true" />
      )}
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
