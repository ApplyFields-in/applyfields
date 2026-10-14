'use client';

import { useEffect, useState } from 'react';

export interface CookiePreferences {
  strictly_necessary: true; // Always true & locked (Authentication, Security, Session)
  functional: boolean;       // Language (NEXT_LOCALE), Theme, UI options
  analytics: boolean;        // Anonymous telemetry & usage insights
  timestamp: string;
  version: string;
}

export const COOKIE_CONSENT_KEY = 'cookie_consent_v1';
export const CURRENT_CONSENT_VERSION = '1.0';

/** Read stored consent from document.cookie */
export function getStoredConsent(): CookiePreferences | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, ...rest] = cookie.trim().split('=');
      if (key === COOKIE_CONSENT_KEY) {
        const raw = rest.join('=');
        if (!raw) return null;
        const parsed = JSON.parse(decodeURIComponent(raw)) as CookiePreferences;
        return {
          strictly_necessary: true,
          functional: Boolean(parsed.functional),
          analytics: Boolean(parsed.analytics),
          timestamp: parsed.timestamp || new Date().toISOString(),
          version: parsed.version || CURRENT_CONSENT_VERSION,
        };
      }
    }
  } catch (err) {
    console.warn('[useCookieConsent] Failed to parse consent cookie:', err);
  }
  return null;
}

/** Persist consent to document.cookie (1-year lifetime, SameSite=Lax) */
export function setStoredConsent(prefs: { functional: boolean; analytics: boolean }): CookiePreferences {
  const fullConsent: CookiePreferences = {
    strictly_necessary: true,
    functional: prefs.functional,
    analytics: prefs.analytics,
    timestamp: new Date().toISOString(),
    version: CURRENT_CONSENT_VERSION,
  };

  if (typeof document !== 'undefined') {
    const serialized = encodeURIComponent(JSON.stringify(fullConsent));
    // 365 days in seconds = 31536000
    document.cookie = `${COOKIE_CONSENT_KEY}=${serialized}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: fullConsent }));
  }

  return fullConsent;
}

/** Trigger the preferences modal to open from anywhere (e.g. footer button) */
export function openCookiePreferencesModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('open-cookie-preferences'));
  }
}

/** React hook for tracking and updating cookie consent */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setLoaded(true);

    const handleConsentChange = (e: Event) => {
      const custom = e as CustomEvent<CookiePreferences>;
      if (custom.detail) {
        setConsent(custom.detail);
      } else {
        setConsent(getStoredConsent());
      }
    };

    window.addEventListener('cookie-consent-changed', handleConsentChange);
    return () => {
      window.removeEventListener('cookie-consent-changed', handleConsentChange);
    };
  }, []);

  const saveConsent = (prefs: { functional: boolean; analytics: boolean }) => {
    const updated = setStoredConsent(prefs);
    setConsent(updated);
    return updated;
  };

  const acceptAll = () => saveConsent({ functional: true, analytics: true });
  const rejectNonEssential = () => saveConsent({ functional: false, analytics: false });

  return {
    consent,
    loaded,
    hasConsented: Boolean(consent),
    acceptAll,
    rejectNonEssential,
    saveConsent,
    openPreferences: openCookiePreferencesModal,
  };
}
