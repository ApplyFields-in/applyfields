import * as Notifications from 'expo-notifications';
import { DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button, Empty, Loading } from '@/components/ui';
import { SplitIntro } from '@/components/split-intro';
import { notificationRoute } from '@/lib/notification-route';
import { SessionProvider, useSession, type SessionStatus } from '@/lib/session';
import { C, S } from '@/theme';

const THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.canvas } };

/**
 * Tapping a push opens its screen: chat, booking, or Alerts. useLastNotificationResponse also
 * covers the tap that launched a closed app. Waits until the desk is open (signed in, verified),
 * then handles each tap once.
 */
function usePushTaps(status: SessionStatus) {
  const router = useRouter();
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!last || (status !== 'centre' && status !== 'institution')) return;
    const id = last.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const link = (last.notification.request.content.data as { link?: unknown } | undefined)?.link;
    // Chat and booking screens exist for centres only; colleges land on Alerts.
    const route = status === 'centre' ? notificationRoute(typeof link === 'string' ? link : null) : null;
    router.push(route ?? '/alerts');
  }, [last, status, router]);
}

/**
 * Each group of screens only exists while the session allows it. When the
 * status changes (login, onboarding submitted, verification approved) the
 * router drops the now-hidden screens and index.tsx sends the partner on.
 */
function Navigator() {
  const { status, error, reload } = useSession();
  usePushTaps(status);

  if (status === 'loading') return <Loading label="Opening your desk…" />;
  if (status === 'offline') {
    return (
      <View style={{ flex: 1, backgroundColor: C.canvas }}>
        <Empty icon="cloud-offline-outline" title="Can't reach ApplyFields" body={error ?? undefined} />
        <Button label="Try again" onPress={() => void reload()} style={{ margin: S.xl }} />
      </View>
    );
  }

  const workspace = status === 'centre' || status === 'institution';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.canvas },
        headerShadowVisible: false,
        headerTintColor: C.navy,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: C.canvas },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Protected guard={status === 'signed_out'}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'no_partner'}>
        <Stack.Screen name="onboard" options={{ title: 'Join the partner network' }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'pending' || status === 'rejected'}>
        <Stack.Screen name="under-review" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'centre'}>
        <Stack.Screen name="(centre)" options={{ headerShown: false }} />
        <Stack.Screen name="booking/[id]" options={{ title: 'Booking' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
        <Stack.Screen name="service-form" options={{ title: 'Service', presentation: 'modal' }} />
        <Stack.Screen name="schedule" options={{ title: 'Operating schedule' }} />
        <Stack.Screen name="centre-profile" options={{ title: 'Centre details' }} />
        <Stack.Screen name="earnings" options={{ title: 'Earnings & payouts' }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'institution'}>
        <Stack.Screen name="(institution)" options={{ headerShown: false }} />
        <Stack.Screen name="enquiry/[id]" options={{ title: 'Enquiry' }} />
      </Stack.Protected>

      <Stack.Protected guard={workspace}>
        <Stack.Screen name="account" options={{ title: 'Account' }} />
        <Stack.Screen name="alerts" options={{ title: 'Alerts' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <ThemeProvider value={THEME}>
            <StatusBar style="dark" />
            <Navigator />
            <SplitIntro />
          </ThemeProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
