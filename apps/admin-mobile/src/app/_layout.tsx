import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BiometricGate } from '@/components/biometric-gate';
import { Button, Empty, Loading } from '@/components/ui';
import { SessionProvider, useSession } from '@/lib/session';
import { C, S } from '@/theme';

const THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.canvas } };

function Navigator() {
  const { status, error, fresh, reload, logout } = useSession();

  if (status === 'loading') return <Loading label="Opening the staff desk…" />;
  if (status === 'offline') {
    return (
      <View style={{ flex: 1, backgroundColor: C.canvas }}>
        <Empty icon="cloud-offline-outline" title="Can't reach ApplyFields" body={error ?? undefined} />
        <Button label="Try again" onPress={() => void reload()} style={{ margin: S.xl }} />
      </View>
    );
  }

  const stack = (
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
      <Stack.Protected guard={status === 'staff'}>
        <Stack.Screen name="home" options={{ title: 'Staff desk' }} />
      </Stack.Protected>
    </Stack>
  );

  if (status !== 'staff') return stack;
  return (
    <BiometricGate startUnlocked={fresh} onSignOut={() => void logout()}>
      {stack}
    </BiometricGate>
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
