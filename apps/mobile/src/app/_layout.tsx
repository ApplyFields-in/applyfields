import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { notificationRoute } from '@/lib/deep-link';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashIntro } from '@/components/splash-intro';
import { AuthProvider } from '@/lib/auth';
import { LocaleProvider } from '@/lib/locale';
import { C } from '@/theme';

/**
 * A push notification carries the same site path the website uses
 * (/jobs/ssc-cgl-2026). Opening one should land on the matching screen.
 */
function usePushDeepLinks() {
  const router = useRouter();
  // Also covers the tap that launched a closed app; each tap is handled once.
  const last = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!last) return;
    const id = last.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const data = last.notification.request.content.data as { link?: string } | undefined;
    const link = typeof data?.link === 'string' ? data.link : null;
    // Opportunity, service, booking or booking-chat screen; anything else opens Alerts.
    router.push((notificationRoute(link) ?? '/alerts') as Href);
  }, [last, router]);
}

// Canvas behind every navigator, so the gaps around the floating tab bar match the page.
const THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.canvas } };

export default function RootLayout() {
  usePushDeepLinks();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AuthProvider>
            <ThemeProvider value={THEME}>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: C.canvas },
                  headerShadowVisible: false,
                  headerTintColor: C.navy,
                  headerTitleStyle: { fontWeight: '800' },
                  contentStyle: { backgroundColor: C.canvas },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="opportunity/[slug]" options={{ title: '' }} />
                <Stack.Screen name="service/[slug]" options={{ title: '' }} />
                <Stack.Screen name="centres" options={{ title: 'Centres near you' }} />
                <Stack.Screen name="bookings" options={{ title: 'My bookings' }} />
                <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
                <Stack.Screen name="career/[slug]" options={{ title: '' }} />
                <Stack.Screen name="college/[slug]" options={{ title: '' }} />
                <Stack.Screen name="apply" options={{ title: 'Official application' }} />
                <Stack.Screen name="profile" options={{ title: 'Profile' }} />
                <Stack.Screen
                  name="login"
                  options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                  name="assistant"
                  options={{
                    headerShown: false,
                    presentation: 'transparentModal',
                    animation: 'slide_from_bottom',
                  }}
                />
              </Stack>
              <SplashIntro />
            </ThemeProvider>
          </AuthProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
