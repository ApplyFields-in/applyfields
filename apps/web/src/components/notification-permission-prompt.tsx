'use client';

import { Bell, BellRing, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWebPush } from '@/lib/push/use-web-push';
import { useLanguage } from '@/lib/i18n/language-context';
import { showAppToast } from '@/components/toast-notification-provider';

const DISMISS_KEY = 'applyfields_push_prompt_dismissed_until';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function NotificationPermissionPrompt() {
  const { t } = useLanguage();
  const push = useWebPush();
  const [isOpen, setIsOpen] = useState(false);
  const [opportunityTitle, setOpportunityTitle] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only prompt if browser supports push and permission hasn't been decided yet
    if (!push.isSupported || push.permission !== 'default') {
      return;
    }

    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    // Listen for custom event triggered on high-intent actions (e.g., clicking "Save")
    const handleCustomTrigger = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.title) {
        setOpportunityTitle(detail.title);
      }
      setIsOpen(true);
    };

    window.addEventListener('show-push-permission-prompt', handleCustomTrigger);

    // If not previously dismissed, show gently after 8 seconds of engagement
    let timer: NodeJS.Timeout | null = null;
    if (!isDismissed) {
      timer = setTimeout(() => {
        if (push.permission === 'default' && !push.isSubscribed) {
          setIsOpen(true);
        }
      }, 8000);
    }

    return () => {
      window.removeEventListener('show-push-permission-prompt', handleCustomTrigger);
      if (timer) clearTimeout(timer);
    };
  }, [push.isSupported, push.permission, push.isSubscribed]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
    }
  };

  const handleEnable = async () => {
    try {
      setSubscribing(true);
      const res = await push.subscribe();
      if (res.ok) {
        showAppToast({
          message: t('push_enabled_success', 'Deadline alerts active! You will receive updates directly on this device.'),
          type: 'success',
        });
        setIsOpen(false);
      } else {
        if (Notification.permission === 'denied') {
          showAppToast({
            message: t('push_blocked_notice', 'Notifications are blocked in your browser settings. Unblock to receive alerts.'),
            type: 'remove',
          });
        }
        handleDismiss();
      }
    } catch (err) {
      console.warn('[NotificationPrompt] Failed to enable push:', err);
      handleDismiss();
    } finally {
      setSubscribing(false);
    }
  };

  if (!isOpen || !push.isSupported || push.permission !== 'default') {
    return null;
  }

  return (
    <aside
      aria-label="Notification Permission"
      className="fixed bottom-5 right-5 z-50 max-w-[420px] w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#0e7bf4]/20 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-all">
        {/* Soft decorative background glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-blue-100/60 blur-2xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0e7bf4] to-[#38bdf8] text-white shadow-md shadow-blue-500/20">
            <BellRing className="size-5 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0e7bf4] flex items-center gap-1">
                <Sparkles className="size-3" />
                {t('push_prompt_badge', 'Official Deadline Alerts')}
              </span>
            </div>
            <h3 className="text-base font-black tracking-tight text-[#082046]">
              {opportunityTitle
                ? t('push_prompt_title_saved', 'Never miss deadlines for saved items')
                : t('push_prompt_title', 'Never miss an application deadline')}
            </h3>
          </div>
        </div>

        {/* Description & Value Props */}
        <div className="mt-3 space-y-2.5 text-xs text-[#526987]">
          <p className="leading-relaxed">
            {opportunityTitle ? (
              <span>
                Get alerts before the closing date for <strong className="text-[#082046] font-semibold">“{opportunityTitle}”</strong> and instant notifications when admit cards or results release.
              </span>
            ) : (
              <span>
                Receive browser alerts for last-date countdowns (7d, 3d, 1d), exam schedules, and new results matching your profile.
              </span>
            )}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1 font-medium text-[11px] text-[#082046]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-teal" />
              <span>100% Free & Private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-teal" />
              <span>Zero spam emails</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            disabled={subscribing}
            onClick={handleEnable}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e7bf4] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/25 hover:bg-[#0c6cd7] active:scale-95 disabled:opacity-60 transition"
          >
            <Bell className="size-3.5" />
            {subscribing ? t('push_enabling', 'Activating…') : t('push_btn_allow', 'Allow Alerts')}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition active:scale-95"
          >
            {t('push_btn_later', 'Maybe later')}
          </button>
        </div>
      </div>
    </aside>
  );
}

