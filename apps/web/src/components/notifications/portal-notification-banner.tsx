'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useWebPush } from '@/lib/push/use-web-push';
import { useLanguage } from '@/lib/i18n/language-context';
import { showAppToast } from '@/components/toast-notification-provider';

export function PortalNotificationBanner() {
  const { t } = useLanguage();
  const push = useWebPush();
  const [dismissed, setDismissed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = sessionStorage.getItem('applyfields_portal_notif_banner_dismissed') === '1';
      setDismissed(isDismissed);
    }
  }, []);

  if (dismissed || !push.isSupported || push.permission !== 'default') {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('applyfields_portal_notif_banner_dismissed', '1');
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
        setDismissed(true);
      } else {
        if (Notification.permission === 'denied') {
          showAppToast({
            message: t('push_blocked_notice', 'Notifications are blocked in your browser settings.'),
            type: 'remove',
          });
        }
        handleDismiss();
      }
    } catch (err) {
      console.warn('[PortalNotificationBanner] Error:', err);
      handleDismiss();
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 text-slate-800 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#082046]/5 text-[#082046]">
            <Bell className="size-4 text-[#082046]" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#082046]">
              {t('push_prompt_title', 'Turn on application notifications')}
            </p>
            <p className="text-xs text-[#526987]">
              {t('settings_notif_push_desc', 'Get instant alerts for last date countdowns, admit card releases, and exam updates on this device.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            disabled={subscribing}
            onClick={handleEnable}
            className="rounded-lg bg-[#082046] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0e7bf4] transition active:scale-95 disabled:opacity-60"
          >
            {subscribing ? t('push_enabling', 'Enabling…') : t('push_btn_allow', 'Allow Notifications')}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Dismiss banner"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
