'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookmarkCheck, CheckCircle2, ChevronRight, X } from 'lucide-react';

export interface ToastPayload {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  type?: 'success' | 'info' | 'remove';
}

export function ToastNotificationProvider() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (customEvent.detail) {
        setToast(customEvent.detail);
      }
    };

    window.addEventListener('applyfields-toast', handleToast);
    return () => {
      window.removeEventListener('applyfields-toast', handleToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <aside
      aria-live="polite"
      className="print:hidden fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[#dec9a5] bg-[#ffffff] p-3.5 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#F4E8D1] text-[#76562d]">
            {toast.type === 'remove' ? (
              <CheckCircle2 className="size-4 text-[#536780]" />
            ) : (
              <BookmarkCheck className="size-4 text-[#082046]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#082046] truncate">
              {toast.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toast.actionHref && (
            <Link
              href={toast.actionHref}
              onClick={() => setToast(null)}
              className="inline-flex items-center gap-1 rounded bg-[#082046] px-2.5 py-1 text-xs font-bold text-[#ffffff] hover:bg-[#0e7bf4] transition-colors"
            >
              <span>{toast.actionLabel || 'View Saved'}</span>
              <ChevronRight className="size-3" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="rounded p-1 text-[#536780] hover:text-[#082046] transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Global helper to dispatch a toast event from anywhere */
export function showAppToast(payload: string | ToastPayload) {
  if (typeof window !== 'undefined') {
    const detail: ToastPayload = typeof payload === 'string' ? { message: payload } : payload;
    window.dispatchEvent(new CustomEvent('applyfields-toast', { detail }));
  }
}

