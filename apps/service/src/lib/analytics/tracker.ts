'use client';

import { API_URL } from '../api';
import type { AnalyticsEventName, AnalyticsEventInput } from '@applyfields/types';

export const COOKIE_CONSENT_KEY = 'cookie_consent_v1';
const SESSION_STORAGE_KEY = 'applyfields_service_anon_session_id';

/**
 * Reads DPDP Act / GDPR cookie consent from document.cookie
 */
function isAnalyticsConsented(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, ...rest] = cookie.trim().split('=');
      if (key === COOKIE_CONSENT_KEY) {
        const raw = rest.join('=');
        if (!raw) return false;
        const parsed = JSON.parse(decodeURIComponent(raw));
        return Boolean(parsed.analytics);
      }
    }
  } catch {}
  return false;
}

/**
 * Ephemeral session ID for the service portal
 */
function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sess = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sess) {
      sess = `service_anon_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, sess);
    }
    return sess;
  } catch {
    return '';
  }
}

/**
 * Privacy-first event tracker for Citizen Assistance Portal
 */
export function trackServiceEvent(
  eventName: AnalyticsEventName,
  details: {
    entity_type?: 'opportunity' | 'service' | 'partner' | 'career' | 'search';
    entity_id?: string;
    metadata?: Record<string, unknown>;
  } = {},
): boolean {
  if (typeof window === 'undefined') return false;

  // Verify analytics cookie consent
  if (!isAnalyticsConsented()) {
    return false;
  }

  const payload: AnalyticsEventInput = {
    event_name: eventName,
    session_id: getAnonymousSessionId(),
    entity_type: details.entity_type,
    entity_id: details.entity_id,
    metadata: details.metadata,
  };

  try {
    const url = `${API_URL}/analytics/events`;
    const serialized = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([serialized], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return true;
    }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});

    return true;
  } catch {
    return false;
  }
}
