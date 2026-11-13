import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth';
import { LocaleProvider } from '@/lib/locale';
import { C } from '@/theme';

/**
 * A push notification carries the same site path the website uses
 * (/jobs/ssc-cgl-2026). Opening one should land on the matching screen.
 */
function usePushDeepLinks() {
  const router = useRouter();
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { link?: string } | undefined;
      const link = typeof data?.link === 'string' ? data.link : null;
      // /jobs/<slug>, /exams/<slug>, /scholarships/<slug>, /admissions/<slug>
      const opp = link?.match(/^\/(?:jobs|exams|scholarships|admissions)\/([^/?#]+)/);
      // /services/<slug> — a push about a service now lands on its detail screen.
      const service = link?.match(/^\/services?\/([^/?#]+)/);
      if (opp) router.push(`/opportunity/${opp[1]}`);
      else if (service) router.push(`/service/${service[1]}`);
      else router.push('/alerts');
    });
    return () => sub.remove();
  }, [router]);
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
                  options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
              </Stack>
            </ThemeProvider>
          </AuthProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
