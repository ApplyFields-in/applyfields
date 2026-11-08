/**
 * Unread-alert count shared between the Alerts screen (the source of truth once
 * it loads, and after Mark-all / opening an alert) and the bottom-tab badge.
 * A one-value external store so both stay in sync without prop drilling.
 */
import type { NotificationList } from '@applyfields/types';
import { useSyncExternalStore } from 'react';

import { noteNotifications } from '@/services/mascot/IconManager';

import { api } from './api';

type Listener = () => void;

let count = 0;
const listeners = new Set<Listener>();

export function setUnread(next: number): void {
  const n = Math.max(0, next);
  if (n === count) return;
  count = n;
  for (const l of listeners) l();
}

/** One-off fetch so the badge is right before the user ever opens Alerts. */
export async function refreshUnread(signedIn: boolean): Promise<void> {
  if (!signedIn) {
    setUnread(0);
    noteNotifications([]); // signed out: no one's deadline bell on the icon
    return;
  }
  const res = await api.get<NotificationList>('/notifications');
  if (res.data) {
    setUnread(res.data.unread);
    noteNotifications(res.data.items);
  }
}

export function useUnread(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => count,
  );
}
