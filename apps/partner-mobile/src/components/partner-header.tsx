/**
 * The capsule at the top of every workspace tab, same shape as the citizen app's
 * header: logo, the centre/college name with its verification state, and the
 * avatar that opens Account.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NotificationList } from '@applyfields/types';

import { typeLabel } from '../lib/format';
import { useSession } from '../lib/session';
import { useApi } from '../lib/use-api';
import { C, CHROME_FONT_SCALE, R, S, TAP, capsule, column } from '../theme';

const LOGO = require('../../assets/images/logo-mark.png');

export function PartnerHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { partner, status } = useSession();
  const online = partner?.is_available ?? false;
  const unread = useApi<NotificationList>('/notifications').data?.unread ?? 0;

  return (
    <View style={[s.bar, { paddingTop: insets.top + S.sm }]}>
      <View style={s.inner}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
            {partner?.business_name ?? 'ApplyFields Partner'}
          </Text>
          <View style={s.metaRow}>
            {status === 'centre' ? (
              <View style={[s.dot, { backgroundColor: online ? C.good : C.bad }]} />
            ) : null}
            <Text style={s.meta} numberOfLines={1} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
              {status === 'centre' ? (online ? 'Online · ' : 'Offline · ') : ''}
              {partner ? typeLabel(partner.type) : ''}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unread ? `Alerts, ${unread} unread` : 'Alerts'}
          onPress={() => router.push('/alerts')}
          style={({ pressed }) => [s.bell, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="notifications-outline" size={22} color={C.navy} />
          {unread ? (
            <View style={s.badge}>
              <Text style={s.badgeText} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
                {unread > 9 ? '9+' : unread}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={() => router.push('/account')}
          style={({ pressed }) => [s.avatar, pressed && { opacity: 0.8 }]}
        >
          <Ionicons
            name={status === 'institution' ? 'school-outline' : 'storefront-outline'}
            size={20}
            color={C.white}
          />
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
  name: { color: C.navy, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  dot: { width: 7, height: 7, borderRadius: R.pill },
  meta: { color: C.muted, fontSize: 11, flexShrink: 1 },
  bell: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: R.pill,
    backgroundColor: C.bad,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: C.white, fontSize: 10, fontWeight: '800' },
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
});
