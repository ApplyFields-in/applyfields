/**
 * Staff alerts on this phone (new complaints, KYC uploads, new drafts) through Expo push.
 * Same pipeline as the other apps: POST /notifications/device-token, then the API's notifyStaff()
 * reaches every device of every staff member with the right role. Tapping an alert opens its screen.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api } from './api';
import { alertRoute } from './staff';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let sentToken: string | null = null;

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/** Ask permission, get the Expo token, register it. Null on emulators, denied permission or no EAS project. */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Staff alerts',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#0e7bf4',
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return null;

  const id = projectId();
  if (!id) return null;
  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  } catch {
    return null;
  }
  if (token === sentToken) return token;

  const res = await api.post('/notifications/device-token', {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    device_name: Device.modelName ?? null,
  });
  if (!res.error) sentToken = token;
  return token;
}

/** Sign-out: this phone stops getting staff alerts. */
export async function unregisterPush(): Promise<void> {
  if (!sentToken) return;
  await api.post('/notifications/device-token/remove', { token: sentToken });
  sentToken = null;
}

function open(response: Notifications.NotificationResponse | null) {
  const link = response?.notification.request.content.data?.link;
  const to = alertRoute(typeof link === 'string' ? link : null);
  router.navigate((to ?? '/pulse') as Href);
}

/** Mount once while signed in as staff: handles taps (also the tap that cold-started the app). */
export function useAlertTaps(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      void Notifications.clearLastNotificationResponseAsync();
    }
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [enabled]);
}
