'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Globe, Check, AlertCircle, Sparkles, Volume2, X } from 'lucide-react';
import { useWebPush } from '@/lib/push/use-web-push';
import { useLanguage } from '@/lib/i18n/language-context';
import { showAppToast } from '@/components/toast-notification-provider';
import { apiPut } from '@/lib/api';

const IN_APP_STORAGE_KEY = 'applyfields_inapp_notifications_enabled';
const BOARD_DISMISS_KEY = 'applyfields_notif_board_dismissed';

interface NotificationAllowBoardProps {
  dismissible?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export function NotificationAllowBoard({
  dismissible = true,
  className = '',
  onDismiss,
}: NotificationAllowBoardProps) {
  const { t } = useLanguage();
  const push = useWebPush();
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedInApp = localStorage.getItem(IN_APP_STORAGE_KEY);
    if (storedInApp !== null) {
      setInAppEnabled(storedInApp === 'true');
    }
    const isDismissed = sessionStorage.getItem(BOARD_DISMISS_KEY) === 'true';
    setDismissed(isDismissed);
  }, []);

  if (dismissed && dismissible) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BOARD_DISMISS_KEY, 'true');
    }
    onDismiss?.();
  };

  const handleToggleWebPush = async () => {
    if (!push.isSupported) {
      showAppToast({
        message: 'Browser push notifications are not supported on this device/browser.',
        type: 'remove',
      });
      return;
    }

    if (push.permission === 'denied') {
      showAppToast({
        message: 'Notifications are blocked in your browser settings. Unblock in site settings to receive alerts.',
        type: 'remove',
      });
      return;
    }

    try {
      setSubscribing(true);
      if (push.isSubscribed) {
        const res = await push.unsubscribe();
        if (res.ok) {
          void apiPut('/notifications/preferences', { push_enabled: false }).catch(() => null);
          showAppToast({
            message: 'Web push notifications turned off on this device.',
            type: 'remove',
          });
        }
      } else {
        const res = await push.subscribe();
        if (res.ok) {
          void apiPut('/notifications/preferences', { push_enabled: true }).catch(() => null);
          showAppToast({
            message: 'Web push notifications active! You will receive alerts on this device.',
            type: 'success',
          });
        } else {
          showAppToast({
            message: res.error || 'Failed to activate web push notifications.',
            type: 'remove',
          });
        }
      }
    } catch (err: any) {
      showAppToast({
        message: err.message || 'An unexpected error occurred.',
        type: 'remove',
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleToggleInApp = () => {
    const next = !inAppEnabled;
    setInAppEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(IN_APP_STORAGE_KEY, String(next));
      window.dispatchEvent(new CustomEvent('inapp-notifications-toggled', { detail: { enabled: next } }));
    }
    showAppToast({
      message: next ? 'In-app notification banners enabled.' : 'In-app notification banners muted.',
      type: next ? 'success' : 'remove',
    });
  };

  const handleSendTestAlert = () => {
    // 1. Trigger in-app toast
    showAppToast({
      message: '🔔 Test Alert: Your ApplyFields notifications are configured and working!',
      type: 'success',
    });

    // 2. Trigger native browser notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('ApplyFields Live Alert', {
          body: 'Your device is ready to receive instant updates for application deadlines, admit cards, and results.',
          icon: '/logo-mark.png',
        });
      } catch {
        // Some mobile browsers require notification via service worker registration
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('ApplyFields Live Alert', {
              body: 'Your device is ready to receive instant updates for application deadlines, admit cards, and results.',
              icon: '/logo-mark.png',
            });
          }).catch(() => null);
        }
      }
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 shadow-sm backdrop-blur-sm transition-all ${className}`}
      role="region"
      aria-label="Notification Controls Board"
    >
      {/* Board Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#082046]/5 text-[#082046]">
            <Bell className="size-4.5 text-[#082046]" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#082046]">
              {t('push_prompt_title', 'Notification Controls')}
            </h3>
            <p className="text-xs text-[#526987]">
              {t('settings_notif_push_desc', 'Stay informed with instant deadline countdowns, admit card releases, and results.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Send Test Notification Button */}
          <button
            type="button"
            onClick={handleSendTestAlert}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            title="Send a sample alert to verify notification delivery"
          >
            <Volume2 className="size-3 text-[#0e7bf4]" />
            <span>Test Alert</span>
          </button>

          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Dismiss notification board"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Control Tiles Grid */}
      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
        {/* Card 1: Web Push Notifications */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5 transition-all hover:border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#082046]">
                <Globe className="size-3.5 text-[#0e7bf4]" />
                Web Push Alerts
              </span>
              {/* Status Badge */}
              {!push.isSupported ? (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Unsupported
                </span>
              ) : push.permission === 'denied' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                  <AlertCircle className="size-2.5" /> Blocked
                </span>
              ) : push.isSubscribed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <Check className="size-2.5" /> Active
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Off
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#526987] leading-relaxed">
              {push.permission === 'denied'
                ? 'Notifications are blocked in your browser. Click the lock/tune icon in the address bar to unblock.'
                : 'Direct browser & device notifications even when ApplyFields is closed in background.'}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400">
              {push.isSubscribed ? 'Device connected' : 'Ready to enable'}
            </span>
            <button
              type="button"
              disabled={subscribing || !push.isSupported}
              onClick={handleToggleWebPush}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 disabled:opacity-60 ${
                push.isSubscribed
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  : 'bg-[#082046] text-white hover:bg-[#0e7bf4]'
              }`}
            >
              {subscribing ? (
                'Connecting…'
              ) : push.isSubscribed ? (
                'Disable'
              ) : (
                <>
                  <Sparkles className="size-3" />
                  <span>Allow Push</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: In-App Notifications */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5 transition-all hover:border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#082046]">
                <Bell className="size-3.5 text-[#082046]" />
                In-App Notifications
              </span>
              {/* Status Badge */}
              {inAppEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <Check className="size-2.5" /> Active
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Muted
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#526987] leading-relaxed">
              Floating real-time toasts and notification center inbox badges while browsing ApplyFields.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-400">
              {inAppEnabled ? 'In-app banners enabled' : 'Banners muted'}
            </span>
            <button
              type="button"
              onClick={handleToggleInApp}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                inAppEnabled
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  : 'bg-[#082046] text-white hover:bg-[#0e7bf4]'
              }`}
            >
              {inAppEnabled ? 'Mute In-App' : 'Allow In-App'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-only Test Button */}
      <div className="mt-2.5 sm:hidden flex justify-end">
        <button
          type="button"
          onClick={handleSendTestAlert}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
        >
          <Volume2 className="size-3 text-[#0e7bf4]" />
          <span>Send Test Alert</span>
        </button>
      </div>
    </div>
  );
}
