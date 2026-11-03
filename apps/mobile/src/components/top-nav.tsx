/**
 * Apply · Career · Services — the top navbar. These three are the app's modes,
 * so they sit under the header where a thumb reads them first; Saved,
 * Documents and Alerts live in the bottom bar.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, CHROME_FONT_SCALE, S, TAP, column } from '../theme';
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
              style={s.item}
            >
              <View style={s.itemInner}>
                {compact ? null : (
                  <Ionicons name={m.icon} size={16} color={active ? C.blue : C.muted} />
                )}
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
              <View style={[s.underline, active && s.underlineActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  inner: { ...column, flexDirection: 'row' },
  item: { flex: 1, minHeight: TAP + 4, justifyContent: 'flex-end', paddingHorizontal: 4 },
  itemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: S.sm,
  },
  label: { color: C.muted, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  labelActive: { color: C.navy, fontWeight: '800' },
  underline: { height: 3, borderRadius: 3, backgroundColor: 'transparent' },
  underlineActive: { backgroundColor: C.blue },
});
