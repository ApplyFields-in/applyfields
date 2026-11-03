/**
 * The navy bar at the top of every tab: wordmark on the left, the account
 * avatar on the right. The avatar is the way into Profile from anywhere,
 * which keeps the bottom bar for the things people open all day.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../lib/auth';
import { C, CHROME_FONT_SCALE, R, S, TAP, column } from '../theme';

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
        <View style={{ flex: 1 }}>
          <Text style={s.wordmark} numberOfLines={1} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
            Apply<Text style={{ color: C.sky }}>Fields</Text>
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
  bar: { backgroundColor: C.navy, paddingBottom: S.md },
  // Padding lives inside the column so the wordmark lines up with the cards below on tablets.
  inner: {
    ...column,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
  },
  wordmark: { color: C.white, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  tagline: { color: C.ice, fontSize: 11, marginTop: 1 },
  avatar: {
    width: TAP,
    height: TAP,
    borderRadius: R.pill,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { color: C.white, fontSize: 14, fontWeight: '800' },
});
