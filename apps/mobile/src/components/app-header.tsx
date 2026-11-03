/**
 * The capsule at the top of every tab, same as the website's navbar: logo and
 * wordmark on the left, the account avatar on the right. The avatar is the way
 * into Profile from anywhere, which keeps the bottom bar for the things people
 * open all day.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../lib/auth';
import { C, CHROME_FONT_SCALE, R, S, TAP, capsule, column } from '../theme';

const LOGO = require('../../assets/images/logo-mark.png');

/** First letters of the signed-in person's name, or a person icon when signed out. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signedIn, name } = useAuth();
  const mark = signedIn ? initials(name) : '';

  return (
    <View style={[s.bar, { paddingTop: insets.top + S.sm }]}>
      <View style={s.inner}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        <View style={{ flex: 1 }}>
          <Text style={s.wordmark} numberOfLines={1} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
            Apply<Text style={{ color: C.blue }}>Fields</Text>
          </Text>
          <Text style={s.tagline} numberOfLines={1} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
            {subtitle ?? 'Every opportunity. One place.'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={signedIn ? 'Your profile' : 'Sign in'}
          onPress={() => router.push(signedIn ? '/profile' : '/login')}
          style={({ pressed }) => [s.avatar, pressed && { opacity: 0.8 }]}
        >
          {mark ? (
            <Text style={s.avatarText} maxFontSizeMultiplier={1}>
              {mark}
            </Text>
          ) : (
            <Ionicons name="person-outline" size={20} color={C.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: C.canvas, paddingBottom: S.md, paddingHorizontal: S.md },
  inner: {
    ...capsule,
    ...column,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingVertical: 6,
    paddingLeft: S.md,
    paddingRight: 6,
  },
  logo: { width: 38, height: 28 },
  wordmark: { color: C.navy, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
  tagline: { color: C.muted, fontSize: 11, marginTop: 1 },
  avatar: {
    width: TAP,
    height: TAP,
    borderRadius: R.pill,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
  avatarText: { color: C.white, fontSize: 14, fontWeight: '800' },
});
