/** Centre overview — the web /dashboard, computed from the live booking inbox. */
import type { BookingListResponse } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvailabilityCard } from '@/components/availability';
import { BookingCard } from '@/components/booking-card';
import { PartnerHeader } from '@/components/partner-header';
import { Card, ErrorNote, Muted, Page, SectionTitle } from '@/components/ui';
import { useCitizens } from '@/lib/citizens';
import { rupees } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

const SERVICE_PORTAL = 'https://service.applyfields.in';

function Stat({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Card style={st.stat}>
      <Ionicons name={icon} size={18} color={C.blue} />
      <Text style={st.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Muted style={{ fontSize: 12 }}>{label}</Muted>
    </Card>
  );
}

function Shortcut({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [st.shortcut, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icon} size={18} color={C.navy} />
      <Text style={st.shortcutText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const { partner } = useSession();
  const { data, error, refreshing, refresh } = useApi<BookingListResponse>('/bookings/partner/inbox');
  const items = data?.items ?? [];
  const citizens = useCitizens();

  const today = new Date().toDateString();
  const month = new Date().toISOString().slice(0, 7);
  const fresh = items.filter((b) => b.status === 'new');
  const todays = items.filter(
    (b) => b.appointment_at && new Date(b.appointment_at).toDateString() === today && b.status !== 'cancelled' && b.status !== 'rejected',
  );
  const earned = items
    .filter((b) => b.status === 'completed' && (b.completed_at ?? b.updated_at).startsWith(month))
    .reduce((sum, b) => sum + (b.final_paise ?? b.quoted_paise ?? 0), 0);
  const upcoming = items
    .filter((b) => b.status === 'accepted' || b.status === 'in_progress')
    .sort((a, b) => (a.appointment_at ?? '9').localeCompare(b.appointment_at ?? '9'))
    .slice(0, 3);

  const go = (href: Href) => () => router.push(href);

  return (
    <View style={{ flex: 1 }}>
      <PartnerHeader />
      <Page refreshing={refreshing} onRefresh={refresh} bottomInset={false}>
        <AvailabilityCard />
        <ErrorNote text={data ? null : error} />

        <View style={st.grid}>
          <Stat label="New requests" value={String(fresh.length)} icon="mail-unread-outline" />
          <Stat label="Today" value={String(todays.length)} icon="today-outline" />
          <Stat label="Earned this month" value={rupees(earned)} icon="wallet-outline" />
          <Stat
            label={`Rating · ${partner?.rating_count ?? 0} reviews`}
            value={partner?.rating_count ? partner.rating_avg.toFixed(1) : '—'}
            icon="star-outline"
          />
        </View>

        {fresh.length ? (
          <>
            <SectionTitle>Waiting for you</SectionTitle>
            {fresh.slice(0, 3).map((b) => (
              <BookingCard key={b.id} booking={b} citizen={citizens.get(b.id)} />
            ))}
          </>
        ) : null}

        {upcoming.length ? (
          <>
            <SectionTitle>Up next</SectionTitle>
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} citizen={citizens.get(b.id)} />
            ))}
          </>
        ) : null}

        <SectionTitle>Manage</SectionTitle>
        <Card style={{ overflow: 'hidden' }}>
          <Shortcut label="Operating schedule & holidays" icon="time-outline" onPress={go('/schedule')} />
          <Shortcut label="Centre details & location" icon="location-outline" onPress={go('/centre-profile')} />
          <Shortcut
            label="See my public page"
            icon="open-outline"
            onPress={() => WebBrowser.openBrowserAsync(`${SERVICE_PORTAL}/partners/${partner?.slug ?? ''}`)}
          />
        </Card>
        {!partner?.is_listed ? (
          <Muted>Your public listing is not live yet. ApplyFields staff turn it on after verification.</Muted>
        ) : null}
      </Page>
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  stat: { flexBasis: '46%', flexGrow: 1, padding: S.lg, gap: 4 },
  statValue: { color: C.navy, fontSize: 24, fontWeight: '900' },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    minHeight: 52,
    paddingHorizontal: S.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  shortcutText: { flex: 1, color: C.navy, fontSize: 14, fontWeight: '600' },
});
