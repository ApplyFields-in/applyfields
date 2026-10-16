import webpush from 'web-push';
import { Logger } from '@nestjs/common';

const logger = new Logger('WebPushEngine');

let cachedVapidKeys: { publicKey: string; privateKey: string } | null = null;

export function getVapidKeys(): { publicKey: string; privateKey: string } {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY.trim(),
      privateKey: process.env.VAPID_PRIVATE_KEY.trim(),
    };
  }

  // Fallback to auto-generated keys for seamless development without configuration friction
  if (!cachedVapidKeys) {
    cachedVapidKeys = webpush.generateVAPIDKeys();
    logger.warn('No VAPID keys in .env. Auto-generated ephemeral development VAPID keys:');
    logger.warn(`VAPID_PUBLIC_KEY=${cachedVapidKeys.publicKey}`);
    logger.warn(`VAPID_PRIVATE_KEY=${cachedVapidKeys.privateKey}`);
  }

  return cachedVapidKeys;
}

export function getVapidSubject(): string {
  return (process.env.VAPID_SUBJECT || 'mailto:support@applyfields.in').trim();
}

/** Initialize web-push details */
export function initWebPush(): void {
  const keys = getVapidKeys();
  const subject = getVapidSubject();
  try {
    webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
  } catch (err) {
    logger.error(`Failed to set VAPID details: ${(err as Error).message}`);
  }
}

export interface WebPushPayload {
  title: string;
  body?: string | null;
  link?: string | null;
  badge?: string;
  icon?: string;
  tag?: string;
  timestamp?: number;
}

export interface PushResult {
  success: boolean;
  expired?: boolean;
  error?: string;
}

/**
 * Dispatches a native Web Push notification directly to the browser push service.
 * Free, standard, zero third-party SaaS dependency.
 */
export async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: WebPushPayload,
): Promise<PushResult> {
  initWebPush();

  const pushSubscription: webpush.PushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const stringifiedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body ?? '',
    link: payload.link ?? '/notifications',
    icon: payload.icon ?? '/icon.png',
    badge: payload.badge ?? '/favicon.ico',
    tag: payload.tag ?? 'applyfields-alert',
    timestamp: payload.timestamp ?? Date.now(),
  });

  try {
    await webpush.sendNotification(pushSubscription, stringifiedPayload, {
      TTL: 86400, // 24 hours retention on push relays
      urgency: 'high',
    });
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    // HTTP 404 or 410 indicates the push subscription has expired or user unsubscribed in browser
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { success: false, expired: true, error: 'Subscription expired or revoked' };
    }
    logger.warn(`Web push dispatch failed (${error.statusCode ?? 'unknown'}): ${error.message ?? 'Unknown error'}`);
    return { success: false, error: error.message };
  }
}
