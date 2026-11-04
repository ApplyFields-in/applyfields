import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { refreshUnread, useUnread } from '@/lib/unread';
import { C, CHROME_FONT_SCALE, R } from '@/theme';

/**
 * The bottom bar. Apply/Career/Services are not here — they are the top navbar
 * inside the Browse tab (src/components/top-nav.tsx), because they switch what
 * you are looking at rather than where you are. Profile is the header avatar.
 */
const TABS = [
  { name: '(browse)', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'saved', title: 'Saved', icon: 'bookmark-outline', activeIcon: 'bookmark' },
  { name: 'documents', title: 'Documents', icon: 'document-text-outline', activeIcon: 'document-text' },
  { name: 'alerts', title: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
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
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: 'rgba(8, 32, 70, 0.06)',
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingHorizontal: 8,
          elevation: 4,
          shadowColor: '#082046',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -2 },
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
            // The active tab sits in a soft ice blue pill indicator.
            tabBarIcon: ({ focused }) => (
              <View style={[pill.base, focused && pill.active]}>
                <Ionicons
                  name={focused ? tab.activeIcon : tab.icon}
                  size={20}
                  color={focused ? '#0E7BF4' : '#64748B'}
                />
              </View>
            ),
            // Own label so large system text scales a little but never pushes
            // "Documents" out of its quarter of a 320pt screen.
            tabBarLabel: ({ focused }) => (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CHROME_FONT_SCALE}
                style={{
                  fontSize: 11,
                  fontWeight: focused ? '700' : '500',
                  color: focused ? '#0E7BF4' : '#64748B',
                }}
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
    width: 48,
    height: 28,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  active: {
    backgroundColor: '#E0EDFB',
  },
});
