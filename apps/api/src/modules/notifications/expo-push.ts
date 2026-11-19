import { Logger } from '@nestjs/common';
import type { PushResult, WebPushPayload } from './web-push.js';

const logger = new Logger('ExpoPushEngine');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Expo push tokens look like ExponentPushToken[xxxxxxxx]. We keep them in the
 * same push_subscriptions table as browser subscriptions — the token goes in
 * `endpoint` — so one dispatcher reaches web and phones alike.
 */
export function isExpoPushToken(endpoint: string): boolean {
  return endpoint.startsWith('ExponentPushToken[') || endpoint.startsWith('ExpoPushToken[');
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/** Expo accepts at most 100 messages per request. */
export const EXPO_BATCH = 100;

/**
 * Sends up to 100 notifications in one request through Expo's push service, which fans out to
 * APNs (iOS) and FCM (Android). Returns one result per message, in the same order.
 */
export async function sendExpoPushBatch(
  messages: { token: string; payload: WebPushPayload }[],
): Promise<PushResult[]> {
  if (messages.length === 0) return [];
  if (messages.length > EXPO_BATCH) throw new Error(`Expo batch is ${messages.length}, max ${EXPO_BATCH}`);
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  const failAll = (error: string): PushResult[] => messages.map(() => ({ success: false, error }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(
        messages.map(({ token, payload }) => ({
          to: token,
          title: payload.title,
          body: payload.body ?? '',
          sound: 'default',
          priority: 'high',
          channelId: 'default',
          badge: 1,
          // The app reads `link` to open the matching screen.
          data: { link: payload.link ?? '/notifications', type: payload.tag ?? null },
        })),
      ),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.warn(`Expo push rejected (${res.status}): ${text.slice(0, 300)}`);
      return failAll(`Expo push HTTP ${res.status}`);
    }

    const json = (await res.json()) as { data?: ExpoTicket[] };
    return messages.map((_, i) => {
      const ticket = json.data?.[i];
      if (ticket?.status === 'ok') return { success: true };
      // The app was uninstalled or the token was replaced — stop sending to it.
      const expired = ticket?.details?.error === 'DeviceNotRegistered';
      if (!expired) logger.warn(`Expo push ticket error: ${ticket?.message ?? 'unknown'}`);
      return { success: false, expired, error: ticket?.message ?? 'Expo push failed' };
    });
  } catch (err) {
    const message = (err as Error).message;
    logger.warn(`Expo push dispatch failed: ${message}`);
    return failAll(message);
  }
}
