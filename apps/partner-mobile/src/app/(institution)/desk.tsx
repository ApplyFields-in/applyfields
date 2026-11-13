/** Admissions overview — the web /institution/dashboard on GET /career/colleges/partner/desk. */
import type { InstitutionEnquiryListResponse, InstitutionPartnerProfile } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text, View } from 'react-native';

import { EnquiryCard } from '@/components/enquiry-card';
import { PartnerHeader } from '@/components/partner-header';
import { Button, Card, Empty, Loading, Muted, Page, SectionTitle } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

const MAIN_WEB = 'https://applyfields.com';

function Stat({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Card style={st.stat}>
      <Ionicons name={icon} size={18} color={C.blue} />
      <Text style={st.statValue}>{value}</Text>
      <Muted style={{ fontSize: 12 }}>{label}</Muted>
    </Card>
  );
}

export default function Desk() {
  const desk = useApi<InstitutionPartnerProfile>('/career/colleges/partner/desk');
  const fresh = useApi<InstitutionEnquiryListResponse>('/career/colleges/partner/enquiries?status=new');
  const refresh = () => {
    void desk.refresh();
    void fresh.refresh();
  };

  return (
    <View style={{ flex: 1 }}>
      <PartnerHeader />
      {desk.loading && !desk.data ? (
        <Loading />
      ) : !desk.data ? (
        // 403 until staff link this partner to a college listing during verification.
        <Page refreshing={desk.refreshing} onRefresh={refresh} bottomInset={false}>
          <Empty
            icon="link-outline"
            title="Desk not linked yet"
            body={desk.error ?? 'ApplyFields staff link your desk to your college listing. Pull down to check again.'}
          />
        </Page>
      ) : (
        <Page refreshing={desk.refreshing || fresh.refreshing} onRefresh={refresh} bottomInset={false}>
          <Card style={st.card}>
            <Text style={st.name}>{desk.data.name}</Text>
            <Muted>
              {[desk.data.type.replace(/^./, (c) => c.toUpperCase()), desk.data.ownership, desk.data.established_year && `Est. ${desk.data.established_year}`]
                .filter(Boolean)
                .join(' · ')}
            </Muted>
          </Card>

          <View style={st.grid}>
            <Stat label="New enquiries" value={fresh.data?.total ?? 0} icon="mail-unread-outline" />
            <Stat label="All enquiries" value={desk.data.enquiries_count} icon="chatbox-ellipses-outline" />
            <Stat label="Courses listed" value={desk.data.courses_count} icon="book-outline" />
          </View>

          <SectionTitle>Waiting for a reply</SectionTitle>
          {fresh.data?.items.length ? (
            fresh.data.items.slice(0, 5).map((e) => <EnquiryCard key={e.id} enquiry={e} />)
          ) : (
            <Muted>All caught up. New student enquiries appear here.</Muted>
          )}

          <Button
            label="See your college page"
            icon="open-outline"
            variant="secondary"
            onPress={() => WebBrowser.openBrowserAsync(`${MAIN_WEB}/career/colleges/${desk.data?.slug ?? ''}`)}
          />
        </Page>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: 4 },
  name: { color: C.navy, fontSize: 18, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  stat: { flexBasis: '30%', flexGrow: 1, padding: S.lg, gap: 4 },
  statValue: { color: C.navy, fontSize: 24, fontWeight: '900' },
});
