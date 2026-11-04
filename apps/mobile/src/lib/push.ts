/**
 * Device push notifications (APNs on iOS, FCM on Android) through Expo's push
 * service. The token goes to the same notification engine the website uses —
 * POST /notifications/device-token — so reminders, results and admit-card
 * alerts reach the phone with no second pipeline.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Last token we successfully sent, so re-renders don't re-POST it. */
let sentToken: string | null = null;

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/**
 * Asks for permission, gets the Expo push token and registers it.
 * Returns the token, or null when push is not available (simulator, denied).
 */
export async function registerForPush(): Promise<string | null> {
  // Simulators and emulators are never issued an APNs/FCM token.
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ApplyFields alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#0e7bf4',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return null;

  const id = projectId();
  if (!id) return null; // not linked to an EAS project yet

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

/** Drops this device from the engine. Called on sign-out. */
export async function unregisterPush(): Promise<void> {
  if (!sentToken) return;
  await api.post('/notifications/device-token/remove', { token: sentToken });
  sentToken = null;
}
