import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { refreshUnread, useUnread } from '@/lib/unread';
import { C, CHROME_FONT_SCALE, R, S, capsule } from '@/theme';

/**
 * The bottom bar. Apply/Career/Services are not here — they are the top navbar
 * inside the Browse tab (src/components/top-nav.tsx), because they switch what
 * you are looking at rather than where you are. Profile is the header avatar.
 */
const TABS = [
  { name: '(browse)', title: 'Home', icon: 'home-outline' },
  { name: 'saved', title: 'Saved', icon: 'bookmark-outline' },
  { name: 'documents', title: 'Documents', icon: 'document-text-outline' },
  { name: 'alerts', title: 'Alerts', icon: 'notifications-outline' },
] as const;

export default function TabsLayout() {
  const { signedIn } = useAuth();
  const unread = useUnread();
  const insets = useSafeAreaInsets();

  // Seed the badge before Alerts is ever opened, and clear it on sign-out.
  useEffect(() => {
    void refreshUnread(signedIn);
  }, [signedIn]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // A floating capsule like the header, kept in the layout flow (not
        // absolute) so lists never scroll underneath it.
        tabBarStyle: {
          ...capsule,
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 6,
          marginHorizontal: S.md,
          marginBottom: insets.bottom + S.sm,
          borderTopWidth: 1,
          borderTopColor: C.white,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: tab.name === 'alerts' && unread > 0 ? unread : undefined,
            // The active tab sits in a raised white pill. Drawn here rather than
            // with tabBarActiveBackgroundColor, which Android fills as a square.
            tabBarIcon: ({ focused }) => (
              <View style={[pill.base, focused && pill.active]}>
                <Ionicons name={tab.icon} size={20} color={focused ? C.blue : C.muted} />
              </View>
            ),
            // Own label so large system text scales a little but never pushes
            // "Documents" out of its quarter of a 320pt screen.
            tabBarLabel: ({ focused }) => (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CHROME_FONT_SCALE}
                style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color: focused ? C.blue : C.muted }}
              >
                {tab.title}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const pill = StyleSheet.create({
  base: {
    width: 56,
    height: 30,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 2, height: 2 },
    elevation: 3,
  },
});
