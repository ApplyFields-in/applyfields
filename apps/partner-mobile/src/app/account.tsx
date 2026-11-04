/** Account: who is signed in, the partner record, links and sign-out. Both workspaces. */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AvailabilityCard } from '@/components/availability';
import { Badge, Button, Card, Muted, Page, SectionTitle } from '@/components/ui';
import { phone, typeLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { C, S } from '@/theme';

const PARTNER_WEB = 'https://partners.applyfields.com';

function Line({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={st.line}>
      <Muted style={{ width: 96 }}>{label}</Muted>
      <Text style={st.value}>{value}</Text>
    </View>
  );
}

function Link({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [st.link, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icon} size={18} color={C.navy} />
      <Text style={st.linkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </Pressable>
  );
}

export default function Account() {
  const router = useRouter();
  const { me, partner, status, logout } = useSession();
  const centre = status === 'centre';
  const go = (href: Href) => () => router.push(href);

  return (
    <Page>
      {centre ? <AvailabilityCard /> : null}

      <Card style={st.card}>
        <Text style={st.name}>{partner?.business_name}</Text>
        <View style={{ flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' }}>
          <Badge label="Verified" color={C.good} />
          <Badge label={partner?.is_listed ? 'Listed publicly' : 'Not listed yet'} color={partner?.is_listed ? C.blue : C.warn} />
          {partner ? <Badge label={typeLabel(partner.type)} color={C.navy} /> : null}
        </View>
        <Line label={centre ? 'Owner' : 'Officer'} value={partner?.owner_name} />
        <Line label="Phone" value={phone(partner?.phone)} />
        <Line label="Email" value={partner?.email ?? me?.user.email} />
        <Line label="Address" value={[partner?.address, partner?.city, partner?.pincode].filter(Boolean).join(', ')} />
      </Card>

      <SectionTitle>Manage</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        {centre ? (
          <>
            <Link label="Centre details & location" icon="storefront-outline" onPress={go('/centre-profile')} />
            <Link label="Operating schedule" icon="time-outline" onPress={go('/schedule')} />
          </>
        ) : (
          <Link label="Campus profile" icon="school-outline" onPress={go('/campus')} />
        )}
        <Link
          label="Open the partner website"
          icon="desktop-outline"
          onPress={() => WebBrowser.openBrowserAsync(PARTNER_WEB)}
        />
      </Card>
      <Muted>
        {centre
          ? 'Walk-in counter, document scanner and cash settlement are on the partner website.'
          : 'Programs & seat matrix are managed on the partner website.'}
      </Muted>

      <Button label="Sign out" variant="danger" icon="log-out-outline" onPress={() => void logout()} />
    </Page>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.sm },
  name: { color: C.navy, fontSize: 18, fontWeight: '800' },
  line: { flexDirection: 'row', gap: S.sm },
  value: { flex: 1, color: C.navy, fontSize: 14, fontWeight: '600' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    minHeight: 52,
    paddingHorizontal: S.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  linkText: { flex: 1, color: C.navy, fontSize: 14, fontWeight: '600' },
});
