import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button, Empty, Loading } from '@/components/ui';
import { SessionProvider, useSession } from '@/lib/session';
import { C, S } from '@/theme';

const THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.canvas } };

/**
 * Each group of screens only exists while the session allows it. When the
 * status changes (login, onboarding submitted, verification approved) the
 * router drops the now-hidden screens and index.tsx sends the partner on.
 */
function Navigator() {
  const { status, error, reload } = useSession();

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
      </Stack.Protected>

      <Stack.Protected guard={status === 'institution'}>
        <Stack.Screen name="(institution)" options={{ headerShown: false }} />
        <Stack.Screen name="enquiry/[id]" options={{ title: 'Enquiry' }} />
      </Stack.Protected>

      <Stack.Protected guard={workspace}>
        <Stack.Screen name="account" options={{ title: 'Account' }} />
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
          </ThemeProvider>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
