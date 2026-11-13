/** Holding screen while staff verify the partner (web: /under-review and /institution/under-review). */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KycDocuments } from '@/components/kyc-documents';
import { Badge, Button, Card, Muted, Page } from '@/components/ui';
import { ago, typeLabel } from '@/lib/format';
import { isInstitution, useSession } from '@/lib/session';
import { C, S } from '@/theme';

export default function UnderReview() {
  const insets = useSafeAreaInsets();
  const { partner, status, reload, logout } = useSession();
  const [checking, setChecking] = useState(false);
  const rejected = status === 'rejected';
  const note = partner?.documents?.find((d) => d.reviewer_note)?.reviewer_note;

  async function check() {
    setChecking(true);
    await reload(); // verified → the router moves to the workspace on its own
    setChecking(false);
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Page refreshing={checking} onRefresh={check}>
        <View style={st.hero}>
          <View style={[st.icon, { backgroundColor: rejected ? `${C.bad}14` : C.ice }]}>
            <Ionicons
              name={rejected ? 'close-circle-outline' : 'hourglass-outline'}
              size={36}
              color={rejected ? C.bad : C.blue}
            />
          </View>
          <Text style={st.h1}>{rejected ? 'Application not approved' : 'Under review'}</Text>
          <Muted style={{ textAlign: 'center' }}>
            {rejected
              ? 'The ApplyFields team could not verify this application. Contact partner support to fix the details and apply again.'
              : isInstitution(partner)
                ? 'Our team is verifying your admissions desk. Once approved, student enquiries reach you here.'
                : 'Our team is verifying your centre. Once approved, you go live and citizens can book you.'}
          </Muted>
        </View>

        {partner ? (
          <Card style={st.card}>
            <Text style={st.name}>{partner.business_name}</Text>
            <Muted>{typeLabel(partner.type)}</Muted>
            <Muted>
              {[partner.city, partner.district, partner.state_code, partner.pincode].filter(Boolean).join(', ')}
            </Muted>
            <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.xs }}>
              <Badge label={rejected ? 'Rejected' : 'Pending'} color={rejected ? C.bad : C.warn} />
              <Badge label={`Submitted ${ago(partner.created_at)}`} color={C.muted} />
            </View>
            {note ? <Muted style={{ marginTop: S.sm }}>Reviewer note: {note}</Muted> : null}
          </Card>
        ) : null}

        {partner ? <KycDocuments partner={partner} onUploaded={() => void reload()} /> : null}

        <Button label={checking ? 'Checking…' : 'Check status'} icon="refresh" disabled={checking} onPress={check} />
        <Button label="Sign out" variant="secondary" onPress={() => void logout()} />
      </Page>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { alignItems: 'center', gap: S.sm, paddingVertical: S.xl },
  icon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  h1: { color: C.navy, fontSize: 24, fontWeight: '800' },
  card: { padding: S.lg, gap: 4 },
  name: { color: C.navy, fontSize: 17, fontWeight: '800' },
});
