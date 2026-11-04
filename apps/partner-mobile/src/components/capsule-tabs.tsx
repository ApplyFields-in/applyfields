/** The citizen app's floating capsule tab bar, shared by the centre and institution workspaces. */
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, CHROME_FONT_SCALE, R, S, capsule } from '../theme';

export interface TabDef {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

export function CapsuleTabs({ tabs }: { tabs: TabDef[] }) {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: tab.badge ? tab.badge : undefined,
            tabBarIcon: ({ focused }) => (
              <View style={[pill.base, focused && pill.active]}>
                <Ionicons name={tab.icon} size={20} color={focused ? C.blue : C.muted} />
              </View>
            ),
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
  base: { width: 56, height: 30, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  active: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 2, height: 2 },
    elevation: 3,
  },
});
