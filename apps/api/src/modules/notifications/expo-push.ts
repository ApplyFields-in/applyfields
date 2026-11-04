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

/**
 * Sends one notification to one device through Expo's push service, which
 * fans out to APNs (iOS) and FCM (Android).
 *
 * ponytail: one HTTP call per device. Expo accepts batches of 100, so if a
 * broadcast ever goes to thousands of phones, group the tokens first.
 */
export async function sendExpoPush(
  token: string,
  payload: WebPushPayload,
): Promise<PushResult> {
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify([
        {
          to: token,
          title: payload.title,
          body: payload.body ?? '',
          sound: 'default',
          priority: 'high',
          channelId: 'default',
          badge: 1,
          // The app reads `link` to open the matching screen.
          data: { link: payload.link ?? '/notifications', type: payload.tag ?? null },
        },
      ]),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.warn(`Expo push rejected (${res.status}): ${text.slice(0, 300)}`);
      return { success: false, error: `Expo push HTTP ${res.status}` };
    }

    const json = (await res.json()) as { data?: ExpoTicket[]; errors?: unknown[] };
    const ticket = json.data?.[0];

    if (ticket?.status === 'ok') return { success: true };

    // The app was uninstalled or the token was replaced — stop sending to it.
    const expired = ticket?.details?.error === 'DeviceNotRegistered';
    if (!expired) {
      logger.warn(`Expo push ticket error: ${ticket?.message ?? 'unknown'}`);
    }
    return { success: false, expired, error: ticket?.message ?? 'Expo push failed' };
  } catch (err) {
    const message = (err as Error).message;
    logger.warn(`Expo push dispatch failed: ${message}`);
    return { success: false, error: message };
  }
}
