'use client';

import { Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Pages the app has a screen for (same list as apps/mobile/src/lib/deep-link.ts). */
const APP_PATH = /^\/(?:jobs|exams|scholarships|admissions|services)\/[^/]+$|^\/career\/colleges\/[^/]+$/;
const PLAY_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=in.applyfields.app';
const IOS_URL = process.env.NEXT_PUBLIC_IOS_APP_STORE_URL || '';
const DISMISS_KEY = 'af-open-in-app-dismissed';

/**
 * Phone browsers on a job/college/service page: "Open in app" (Android: opens the app if installed,
 * else the Play Store) or "Get the app" (iPhone, once the App Store link is set). With App Links /
 * Universal Links verified, a shared link opens the app before this page even loads.
 */
export function OpenInAppBanner({ pathname }: { pathname: string }) {
  const [os, setOs] = useState<'android' | 'ios' | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {}
    const ua = navigator.userAgent;
    const detected = /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- user agent is only known in the browser
    if (!dismissed) setOs(detected);
  }, []);

  if (!os || !APP_PATH.test(pathname) || (os === 'ios' && !IOS_URL)) return null;

  const href =
    os === 'android'
      ? `intent://${window.location.host}${pathname}#Intent;scheme=https;package=in.applyfields.app;S.browser_fallback_url=${encodeURIComponent(PLAY_URL)};end`
      : IOS_URL;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setOs(null);
  }

  return (
    <div className="mx-auto mt-2 flex max-w-[1360px] items-center gap-3 rounded-2xl border border-[#dbe4ef] bg-white px-4 py-2.5 shadow-sm sm:hidden">
      <Smartphone className="size-5 shrink-0 text-[#0e7bf4]" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs font-semibold text-[#082046]">Faster in the ApplyFields app, with reminders.</p>
      <a href={href} className="shrink-0 rounded-full bg-[#082046] px-3 py-1.5 text-xs font-bold text-white">
        {os === 'android' ? 'Open in app' : 'Get the app'}
      </a>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="shrink-0 p-1 text-[#526987]">
        <X className="size-4" />
      </button>
    </div>
  );
}
