'use client';

import { getStoredConsent } from '../cookies/use-cookie-consent';
import { API_URL } from '../api';
import type { AnalyticsEventName, AnalyticsEventInput } from '@applyfields/types';

const SESSION_STORAGE_KEY = 'applyfields_anon_session_id';

/**
 * Returns or creates an ephemeral, non-identifiable anonymous session ID in sessionStorage.
 * Reset automatically when the browser tab/session is closed.
 */
function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sess = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sess) {
      sess = `anon_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, sess);
    }
    return sess;
  } catch {
    return '';
  }
}

/**
 * Privacy-first event tracker.
 * Strictly verifies citizen DPDP Act / GDPR cookie consent before dispatching.
 * Uses navigator.sendBeacon for non-blocking asynchronous transmission.
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  details: {
    entity_type?: 'opportunity' | 'service' | 'partner' | 'career' | 'search';
    entity_id?: string;
    metadata?: Record<string, unknown>;
  } = {},
): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Consent Gate: Strictly verify that analytics cookies are consented
  const consent = getStoredConsent();
  if (!consent || !consent.analytics) {
    // Explicitly do not track if consent is not granted
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

    // Try non-blocking beacon first
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([serialized], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return true;
    }

    // Fallback to fetch with keepalive
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serialized,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {
      // Fire-and-forget: silence errors to never disturb the citizen experience
    });

    return true;
  } catch {
    return false;
  }
}
