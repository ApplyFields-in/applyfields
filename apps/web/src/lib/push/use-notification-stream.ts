'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/api';
import type { NotificationItem } from '@applyfields/types';

export function useNotificationStream() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only establish SSE stream when user is authenticated
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    let eventSource: EventSource | null = null;
    let retryTimer: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    function connect() {
      const user = localStorage.getItem('currentUser');
      if (!user) return;

      const token = localStorage.getItem('accessToken');
      const url = token
        ? `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`
        : `${API_URL}/notifications/stream`;

      try {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        eventSource = new EventSource(url, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          retryCount = 0;
        };

        eventSource.addEventListener('notification', (event) => {
          try {
            const item = JSON.parse(event.data) as NotificationItem;
            // Dispatch window event for in-app floating toasts and bell badge updates
            window.dispatchEvent(new CustomEvent('applyfields-notification', { detail: item }));
            window.dispatchEvent(new Event('notifications-read'));
          } catch (err) {
            console.warn('[SSE] Parse notification error:', err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          retryCount++;
          // If unauthenticated or repeated failures, abort to prevent flooding console with 401s
          if (retryCount >= MAX_RETRIES) {
            return;
          }
          // Exponential backoff
          retryTimer = setTimeout(() => {
            if (localStorage.getItem('currentUser')) {
              connect();
            }
          }, 15_000 * retryCount);
        };
      } catch (err) {
        console.warn('[SSE] Connection error:', err);
      }
    }

    connect();

    const handleAuthChange = () => {
      const user = localStorage.getItem('currentUser');
      if (user) {
        retryCount = 0;
        if (retryTimer) clearTimeout(retryTimer);
        connect();
      } else if (eventSource) {
        eventSource.close();
        eventSource = null;
        if (retryTimer) clearTimeout(retryTimer);
      }
    };

    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      if (retryTimer) clearTimeout(retryTimer);
      if (eventSource) eventSource.close();
    };
  }, []);
}
