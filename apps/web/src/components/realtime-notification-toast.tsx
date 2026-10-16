'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ExternalLink, X } from 'lucide-react';
import type { NotificationItem } from '@applyfields/types';
import { useNotificationStream } from '@/lib/push/use-notification-stream';

export function RealtimeNotificationToast() {
  // Activate SSE connection stream
  useNotificationStream();

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);

        // Auto-dismiss after 8 seconds
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 8000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('applyfields-notification', handleNotification);
    return () => {
      window.removeEventListener('applyfields-notification', handleNotification);
    };
  }, []);

  if (!activeToast) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-sea/20 bg-cream/95 p-4 shadow-clay backdrop-blur-md dark:bg-dark-surface">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal text-cream">
            <Bell className="size-4 animate-bounce" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal/80 dark:text-teal/60">
                New Alert
              </span>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="text-teal/60 hover:text-teal"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-1 text-sm font-bold text-teal dark:text-cream line-clamp-2">
              {activeToast.title}
            </p>

            {activeToast.body && (
              <p className="mt-0.5 text-xs text-teal/70 dark:text-cream/70 line-clamp-2">
                {activeToast.body}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-2 pt-1 border-t border-line/50">
              <span className="text-[10px] text-teal/50">Just now</span>
              {activeToast.link && (
                <Link
                  href={activeToast.link}
                  onClick={() => setActiveToast(null)}
                  className="flex items-center gap-1 text-xs font-semibold text-sea hover:underline"
                >
                  View Details <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
