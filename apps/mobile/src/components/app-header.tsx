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
    <View style={[s.bar, { paddingTop: insets.top + S.xs }]}>
      <View style={s.inner}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        <View style={{ flex: 1 }}>
          <Text style={s.wordmark} numberOfLines={1} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
            Apply<Text style={s.fieldsText}>Fields</Text>
          </Text>
          <Text style={s.tagline} numberOfLines={1} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
            {subtitle ?? 'Every opportunity. One place.'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={signedIn ? 'Your profile' : 'Sign in'}
          onPress={() => router.push(signedIn ? '/profile' : '/login')}
          style={({ pressed }) => [s.avatar, pressed && { opacity: 0.85 }]}
        >
          {mark ? (
            <Text style={s.avatarText} maxFontSizeMultiplier={1}>
              {mark}
            </Text>
          ) : (
            <Ionicons name="person" size={17} color={C.blue} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: C.canvas,
    paddingBottom: S.sm,
    paddingHorizontal: S.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(8, 32, 70, 0.06)',
  },
  inner: {
    ...column,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingVertical: 7,
    paddingLeft: S.md,
    paddingRight: 7,
    backgroundColor: C.white,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: 'rgba(8, 32, 70, 0.08)',
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: { width: 26, height: 26, marginRight: 2 },
  wordmark: { color: C.navy, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  fieldsText: { color: C.blue, fontWeight: '800' },
  tagline: { color: C.muted, fontSize: 10.5, fontWeight: '500', marginTop: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: R.pill,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: C.navy,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  avatarText: { color: C.navy, fontSize: 13, fontWeight: '800' },
});
