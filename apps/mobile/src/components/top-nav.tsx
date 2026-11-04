/**
 * Apply · Career · Services — the top navbar. These three are the app's modes,
 * so they sit under the header where a thumb reads them first; Saved,
 * Documents and Alerts live in the bottom bar.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, CHROME_FONT_SCALE, R, S, TAP, capsule, column } from '../theme';
import { useCompact } from './ui';

const MODES = [
  { href: '/', label: 'Apply', icon: 'briefcase-outline' },
  { href: '/career', label: 'Career', icon: 'compass-outline' },
  { href: '/services', label: 'Services', icon: 'business-outline' },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  // On narrow screens or with large text, the labels need the icons' room.
  const compact = useCompact();

  return (
    <View style={s.bar}>
      <View style={s.inner} accessibilityRole="tablist">
        {MODES.map((m) => {
          // '/' is the Apply feed, so it must match exactly or it would always win.
          const active = m.href === '/' ? pathname === '/' : pathname.startsWith(m.href);
          return (
            <Pressable
              key={m.href}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(m.href)}
              style={[s.item, active && s.itemActive]}
            >
              <View style={s.itemInner}>
                {compact ? null : <Ionicons name={m.icon} size={16} color={C.blue} />}
                <Text
                  style={[s.label, active && s.labelActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
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

// The website's Career / Apply / Services switcher: a sunken pill track with
// the active mode raised out of it.
const s = StyleSheet.create({
  bar: { backgroundColor: C.canvas, paddingHorizontal: S.md, paddingBottom: S.sm },
  inner: {
    ...capsule,
    ...column,
    flexDirection: 'row',
    gap: 4,
    padding: 5,
  },
  item: {
    flex: 1,
    minHeight: TAP,
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: R.pill,
  },
  itemActive: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 2, height: 2 },
    elevation: 3,
  },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { color: C.navy, fontSize: 14, fontWeight: '800', flexShrink: 1 },
  labelActive: { color: C.blue },
});
