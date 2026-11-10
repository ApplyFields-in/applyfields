/**
 * One booking: details, timeline and the next moves (accept → start → complete).
 * GET /bookings/:id is the citizen's endpoint, so the partner reads the booking
 * out of its own inbox and writes with PATCH /bookings/partner/:id.
 */
import type { BookingDetail, BookingListResponse, BookingRequestStatus } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, ErrorNote, Field, Loading, Muted, Page, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { bookingToken, useCitizens, whatsappUrl } from '@/lib/citizens';
import { useSession } from '@/lib/session';
import { BOOKING_STATUS, NEXT_ACTIONS, dateTime, phone, rupees } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.row}>
      <Muted style={{ width: 110 }}>{label}</Muted>
      <Text style={st.value}>{value}</Text>
    </View>
  );
}

/** A detail line with a copy button — operators paste these into the official portal. */
function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}`}
      onPress={async () => {
        await Clipboard.setStringAsync(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={({ pressed }) => [st.copyRow, pressed && { opacity: 0.7 }]}
    >
      <Muted style={{ width: 110 }}>{label}</Muted>
      <Text style={st.value} selectable>
        {value}
      </Text>
      <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? C.good : C.blue} />
    </Pressable>
  );
}

/** Rupees typed by the partner → paise, or undefined when blank / not a number. */
function toPaise(text: string): number | undefined {
  const n = Number(text.replace(/[₹,\s]/g, ''));
  return text.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
}

export default function Booking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, refreshing, refresh, setData } = useApi<BookingListResponse>('/bookings/partner/inbox');
  const booking = data?.items.find((b) => b.id === id);
  const citizen = useCitizens().get(id);
  const { partner } = useSession();
  const [note, setNote] = useState('');
  const [ack, setAck] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState<BookingRequestStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  if (loading && !data) return <Loading />;
  if (!booking) return <Empty icon="alert-circle-outline" title="Booking not found" body="It may have been removed." />;

  const status = BOOKING_STATUS[booking.status];
  const actions = NEXT_ACTIONS[booking.status];
  // Accepting sets the quote; completing records what was actually charged.
  const amountField =
    booking.status === 'new' ? 'quoted_paise' : booking.status === 'in_progress' ? 'final_paise' : null;

  async function move(to: BookingRequestStatus) {
    if (!booking) return;
    const closing = to === 'rejected' || to === 'cancelled';
    if (closing && !note.trim()) {
      setError('Add a short reason so the citizen knows why.');
      return;
    }
    setBusy(to);
    setError(null);
    const paise = toPaise(amount);
    // Same wording as the website's "Complete & receipt" so both desks read the same history.
    const partnerNote = [to === 'completed' && ack.trim() ? `Govt Ack #: ${ack.trim()}` : '', note.trim()]
      .filter(Boolean)
      .join(' — ');
    const res = await api.patch<BookingDetail>(`/bookings/partner/${booking.id}`, {
      status: to,
      ...(partnerNote && { partner_note: partnerNote }),
      ...(closing && { cancelled_reason: note.trim() }),
      ...(amountField && paise !== undefined && { [amountField]: paise }),
    });
    setBusy(null);
    if (!res.data) {
      setError(res.error ?? 'Could not update the booking.');
      return;
    }
    const updated = res.data;
    setData((prev) => prev && { ...prev, items: prev.items.map((b) => (b.id === updated.id ? updated : b)) });
    setNote('');
    setAmount('');
    setAck('');
  }

  return (
    <>
      <Stack.Screen options={{ title: `Booking ${bookingToken(booking.id)}` }} />
      <Page refreshing={refreshing} onRefresh={refresh}>
        <Card style={st.card}>
          <Badge label={status.label} color={status.color} />
          <Text style={st.title}>{booking.service_name ?? 'Assistance request'}</Text>
          <Row label="Slot" value={booking.appointment_at ? dateTime(booking.appointment_at) : 'Walk-in / no slot'} />
          <Row label="Requested" value={dateTime(booking.created_at)} />
          <Row label="Quoted" value={rupees(booking.quoted_paise)} />
          <Row label="Charged" value={rupees(booking.final_paise)} />
          {booking.cancelled_reason ? <Row label="Reason" value={booking.cancelled_reason} /> : null}
        </Card>

        <Card style={st.card}>
          <SectionTitle>Citizen · tap a line to copy</SectionTitle>
          <CopyRow label="Reference" value={bookingToken(booking.id)} />
          {citizen?.name ? <CopyRow label="Name" value={citizen.name} /> : null}
          {citizen?.phone ? <CopyRow label="Phone" value={phone(citizen.phone)} /> : null}
          {booking.user_note ? <CopyRow label="Their note" value={booking.user_note} /> : null}
          {booking.partner_note ? <CopyRow label="Your note" value={booking.partner_note} /> : null}
          {citizen?.phone ? (
            <View style={st.contact}>
              <Button
                label="Call"
                icon="call-outline"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => Linking.openURL(`tel:${citizen.phone}`)}
              />
              <Button
                label="WhatsApp"
                icon="logo-whatsapp"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() =>
                  Linking.openURL(
                    whatsappUrl(citizen.phone!, `Hello, this is ${partner?.business_name ?? 'your ApplyFields centre'} about booking ${bookingToken(booking.id)}.`),
                  )
                }
              />
            </View>
          ) : null}
        </Card>

        <Card style={st.card}>
          <SectionTitle>Documents shared by the citizen</SectionTitle>
          {booking.shared_documents?.length ? (
            booking.shared_documents.map((d) => (
              <Button
                key={d.share_id}
                label={d.title || d.file_name || d.document_type_code.replace(/_/g, ' ')}
                icon="document-outline"
                variant="secondary"
                disabled={opening === d.share_id}
                onPress={async () => {
                  setOpening(d.share_id);
                  const res = await api.get<{ url: string }>(`/bookings/${booking.id}/documents/${d.share_id}`);
                  setOpening(null);
                  if (res.data) WebBrowser.openBrowserAsync(res.data.url).catch(() => undefined);
                  else setError(res.error ?? 'Could not open the document.');
                }}
              />
            ))
          ) : (
            <Muted>None shared. Ask the citizen to bring originals or share from their Document Locker.</Muted>
          )}
        </Card>

        <Button
          label="Chat with citizen"
          icon="chatbubbles-outline"
          variant="secondary"
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: booking.id, title: citizen?.name ?? booking.service_name ?? 'Chat' } })}
        />

        {actions.length ? (
          <Card style={st.card}>
            <SectionTitle>Next step</SectionTitle>
            {amountField ? (
              <Field
                label={amountField === 'quoted_paise' ? 'Your charge (₹, optional)' : 'Amount charged (₹)'}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder={booking.quoted_paise != null ? String(booking.quoted_paise / 100) : '0'}
              />
            ) : null}
            {booking.status === 'in_progress' ? (
              <Field
                label="Government acknowledgement number (optional)"
                value={ack}
                onChangeText={setAck}
                autoCapitalize="characters"
                placeholder="TS-MEESEVA-2026-00000"
                hint="From the official portal's receipt. Saved in the booking history."
              />
            ) : null}
            <Field
              label="Note to citizen"
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Bring original Aadhaar and two photos…"
              hint="Required when rejecting or cancelling."
            />
            <ErrorNote text={error} />
            <View style={{ gap: S.sm }}>
              {actions.map((a) => (
                <Button
                  key={a.to}
                  label={busy === a.to ? 'Saving…' : a.label}
                  variant={a.variant}
                  disabled={busy !== null}
                  onPress={() => void move(a.to)}
                />
              ))}
            </View>
          </Card>
        ) : null}

        <Card style={st.card}>
          <SectionTitle>Timeline</SectionTitle>
          {booking.events.length === 0 ? <Muted>No updates yet.</Muted> : null}
          {[...booking.events].reverse().map((e) => (
            <View key={e.id} style={st.event}>
              <View style={[st.dot, { backgroundColor: BOOKING_STATUS[e.to_status].color }]} />
              <View style={{ flex: 1 }}>
                <Text style={st.value}>{BOOKING_STATUS[e.to_status].label}</Text>
                {e.note ? <Muted>{e.note}</Muted> : null}
                <Muted style={{ fontSize: 12 }}>{dateTime(e.created_at)}</Muted>
              </View>
            </View>
          ))}
        </Card>

        {booking.review ? (
          <Card style={st.card}>
            <SectionTitle>Citizen review</SectionTitle>
            <Text style={st.value}>{'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}</Text>
            {booking.review.comment ? <Muted>{booking.review.comment}</Muted> : null}
          </Card>
        ) : null}
      </Page>
    </>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.sm },
  title: { color: C.navy, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', gap: S.sm },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: 36 },
  contact: { flexDirection: 'row', gap: S.sm, marginTop: S.xs },
  value: { flex: 1, color: C.navy, fontSize: 14, fontWeight: '600' },
  event: { flexDirection: 'row', gap: S.md, paddingVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
});
