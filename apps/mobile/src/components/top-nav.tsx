/**
 * Apply · Career · Services — the top navbar. These three are the app's modes,
 * so they sit under the header where a thumb reads them first; Saved,
 * Documents and Alerts live in the bottom bar.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, CHROME_FONT_SCALE, R, S, column } from '../theme';

const MODES = [
  { href: '/', label: 'Apply', icon: 'briefcase-outline' },
  { href: '/career', label: 'Career', icon: 'compass-outline' },
  { href: '/services', label: 'Services', icon: 'business-outline' },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={s.bar}>
      <View style={s.inner} accessibilityRole="tablist">
        {MODES.map((m) => {
          const isCareer = m.href === '/career' && (pathname.includes('/career') || pathname.endsWith('career'));
          const isServices = m.href === '/services' && (pathname.includes('/services') || pathname.endsWith('services'));
          const isApply = m.href === '/' && !isCareer && !isServices;
          const active = isApply || isCareer || isServices;

          return (
            <Pressable
              key={m.href}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(m.href)}
              style={[s.item, active && s.itemActive]}
            >
              <View style={s.itemInner}>
                <Ionicons
                  name={m.icon}
                  size={15}
                  color={active ? C.blue : '#435775'}
                />
                <Text
                  style={[s.label, active && s.labelActive]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={CHROME_FONT_SCALE}
                >
                  {m.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// The website's Segmented Capsule Switcher: a sunken pill track with
// the active mode as a floating white/ice pill.
const s = StyleSheet.create({
  bar: { backgroundColor: C.canvas, paddingHorizontal: S.md, paddingBottom: S.xs, paddingTop: S.xs },
  inner: {
    ...column,
    flexDirection: 'row',
    backgroundColor: C.pillTrack,
    borderRadius: R.pill,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: C.line,
  },
  item: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: R.pill,
    backgroundColor: 'transparent',
  },
  itemActive: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { color: '#435775', fontSize: 13, fontWeight: '600' },
  labelActive: { color: C.blue, fontWeight: '800' },
});
