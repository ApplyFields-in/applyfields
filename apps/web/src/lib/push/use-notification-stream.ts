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

    function connect() {
      try {
        eventSource = new EventSource(`${API_URL}/notifications/stream`, {
          withCredentials: true,
        });

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
          // Exponential backoff or retry after 15s
          retryTimer = setTimeout(() => {
            connect();
          }, 15_000);
        };
      } catch (err) {
        console.warn('[SSE] Connection error:', err);
      }
    }

    connect();

    const handleAuthChange = () => {
      const user = localStorage.getItem('currentUser');
      if (user && !eventSource) {
        connect();
      } else if (!user && eventSource) {
        eventSource.close();
        eventSource = null;
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
