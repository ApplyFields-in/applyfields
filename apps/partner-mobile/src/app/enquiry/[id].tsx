/** Read and answer one student enquiry. PATCH /career/colleges/partner/enquiries/:id. */
import type { InstitutionEnquiry, InstitutionEnquiryListResponse } from '@applyfields/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, ErrorNote, Field, Loading, Muted, Page, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { whatsappUrl } from '@/lib/citizens';
import { ENQUIRY_STATUS, dateTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

export default function Enquiry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // No GET-by-id for partners; the full list is small and already cached by the desk.
  const { data, loading } = useApi<InstitutionEnquiryListResponse>('/career/colleges/partner/enquiries');
  const enquiry = data?.items.find((e) => e.id === id);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState<'responded' | 'closed' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading && !data) return <Loading />;
  if (!enquiry) return <Empty icon="alert-circle-outline" title="Enquiry not found" />;

  const status = ENQUIRY_STATUS[enquiry.status];

  async function send(next: 'responded' | 'closed') {
    if (reply.trim().length < 2) {
      setError(next === 'closed' ? 'Add a short closing note for the student.' : 'Write your reply first.');
      return;
    }
    setBusy(next);
    setError(null);
    const res = await api.patch<InstitutionEnquiry>(`/career/colleges/partner/enquiries/${enquiry!.id}`, {
      status: next,
      response: reply.trim(),
    });
    setBusy(null);
    if (res.data) router.back();
    else setError(res.error ?? 'Could not send your reply.');
  }

  return (
    <Page>
      <Card style={st.card}>
        <Badge label={status.label} color={status.color} />
        <Text style={st.name}>{enquiry.name ?? 'Student'}</Text>
        {enquiry.course_name ? <Muted>Course: {enquiry.course_name}</Muted> : null}
        <Muted style={{ fontSize: 12 }}>{dateTime(enquiry.created_at)}</Muted>
        <Text style={st.message}>{enquiry.message}</Text>
        <View style={st.contact}>
          {enquiry.phone ? (
            <Button label="Call" icon="call-outline" variant="secondary" style={{ flex: 1, minWidth: 140 }} onPress={() => Linking.openURL(`tel:${enquiry.phone}`)} />
          ) : null}
          {enquiry.phone ? (
            <Button
              label="WhatsApp"
              icon="logo-whatsapp"
              variant="secondary"
              style={{ flex: 1, minWidth: 140 }}
              onPress={() =>
                Linking.openURL(
                  whatsappUrl(
                    enquiry.phone!,
                    `Hello ${enquiry.name ?? ''}, this is the admissions desk at ${enquiry.institution_name} about your enquiry.`,
                  ),
                )
              }
            />
          ) : null}
          {enquiry.email ? (
            <Button label="Email" icon="mail-outline" variant="secondary" style={{ flex: 1, minWidth: 140 }} onPress={() => Linking.openURL(`mailto:${enquiry.email}`)} />
          ) : null}
        </View>
      </Card>

      {enquiry.response ? (
        <Card style={st.card}>
          <SectionTitle>Your last reply</SectionTitle>
          <Text style={st.message}>{enquiry.response}</Text>
          <Muted style={{ fontSize: 12 }}>{dateTime(enquiry.responded_at)}</Muted>
        </Card>
      ) : null}

      <Card style={st.card}>
        <SectionTitle>{enquiry.response ? 'Reply again' : 'Reply'}</SectionTitle>
        <Field
          label="Message to the student"
          value={reply}
          onChangeText={setReply}
          multiline
          maxLength={1000}
          placeholder="Admissions for B.Tech open on…"
        />
        <ErrorNote text={error} />
        <Button label={busy === 'responded' ? 'Sending…' : 'Send reply'} disabled={busy !== null} onPress={() => void send('responded')} />
        <Button label={busy === 'closed' ? 'Closing…' : 'Send & close enquiry'} variant="secondary" disabled={busy !== null} onPress={() => void send('closed')} />
      </Card>
    </Page>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.sm },
  name: { color: C.navy, fontSize: 18, fontWeight: '800' },
  message: { color: C.navy, fontSize: 15, lineHeight: 22 },
  contact: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs },
});
