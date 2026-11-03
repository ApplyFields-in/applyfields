import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { useAuth } from '@/lib/auth';
import { refreshUnread, useUnread } from '@/lib/unread';
import { C, CHROME_FONT_SCALE } from '@/theme';

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

  // Seed the badge before Alerts is ever opened, and clear it on sign-out.
  useEffect(() => {
    void refreshUnread(signedIn);
  }, [signedIn]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { borderTopColor: C.line, backgroundColor: C.white },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: tab.name === 'alerts' && unread > 0 ? unread : undefined,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name={tab.icon} size={size} color={focused ? C.blue : C.muted} />
            ),
            // Own label so large system text scales a little but never pushes
            // "Documents" out of its quarter of a 320pt screen.
            tabBarLabel: ({ focused }) => (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CHROME_FONT_SCALE}
                style={{ fontSize: 11, fontWeight: '600', color: focused ? C.blue : C.muted }}
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
