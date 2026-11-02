'use client';

import { Bell, X } from 'lucide-react';
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
          message: t('push_enabled_success', 'Notifications active. You will receive updates directly on this device.'),
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
      className="fixed bottom-5 right-5 z-50 max-w-[380px] w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-6">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#082046]/5 text-[#082046]">
            <Bell className="size-4 text-[#082046]" />
          </div>

          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-[#082046]">
              {opportunityTitle
                ? t('push_prompt_title_saved', 'Deadline Alerts')
                : t('push_prompt_title', 'Application Notifications')}
            </h3>
            <p className="text-xs text-[#526987] leading-relaxed">
              {opportunityTitle ? (
                <span>
                  Get alerts before the closing date for <strong className="text-[#082046] font-semibold">{opportunityTitle}</strong> and updates on admit cards or results.
                </span>
              ) : (
                <span>
                  Receive updates for last dates, exam schedules, and new circulars matching your profile.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            disabled={subscribing}
            onClick={handleEnable}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#082046] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0e7bf4] active:scale-95 disabled:opacity-60 transition"
          >
            {subscribing ? t('push_enabling', 'Enabling…') : t('push_btn_allow', 'Allow Notifications')}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            {t('push_btn_later', 'Not now')}
          </button>
        </div>
      </div>
    </aside>
  );
}
