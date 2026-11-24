/**
 * My bookings — the citizen's centre bookings (GET /bookings/my), with the 4-digit start code on
 * every booking the centre hasn't started yet. The citizen reads it out at the counter (or sends it
 * in the booking chat); the centre can only start the work with it. The code is never stored on
 * the phone (personal data, see lib/cacheable.ts) and disappears once the work starts.
 * "Send in chat" posts the code to the booking chat; the centre's chat fills its start box from it.
 */
import type { BookingDetail, BookingListResponse, BookingRequestStatus, ChatMessageItem } from '@applyfields/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Empty, Loading, Muted } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, rupees } from '@/lib/format';
import { useApi, useRefreshOnFocus } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

const STATUS: Record<BookingRequestStatus, { label: string; color: string }> = {
  new: { label: 'Waiting for the centre', color: C.mutedNavy },
  accepted: { label: 'Confirmed', color: C.blue },
  in_progress: { label: 'In progress', color: C.blue },
  completed: { label: 'Completed', color: C.good },
  rejected: { label: 'Declined', color: C.bad },
  cancelled: { label: 'Cancelled', color: C.bad },
};

function BookingRow({ b, senderName }: { b: BookingDetail; senderName: string }) {
  const router = useRouter();
  const status = STATUS[b.status];
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function sendCode() {
    if (!b.start_code || sending || sent) return;
    setSending(true);
    setSendError(null);
    const res = await api.post<ChatMessageItem>(`/bookings/${b.id}/messages`, {
      message: `My start code is ${b.start_code}`,
      sender_type: 'citizen',
      sender_name: senderName,
    });
    setSending(false);
    if (res.data) setSent(true);
    else setSendError(res.error ?? 'Not sent. Check your connection and try again.');
  }

  const amount = b.final_paise ?? b.quoted_paise;
  return (
    <View style={[card, s.row]}>
      <View style={s.head}>
        <Text style={s.title} numberOfLines={2}>
          {b.service_name ?? 'Service request'}
        </Text>
        <Badge label={status.label} color={status.color} />
      </View>
      <Muted>{b.partner_business_name}</Muted>
      <Muted style={{ fontSize: 12 }}>
        {b.appointment_at ? formatDate(b.appointment_at) : 'No slot booked'}
        {amount != null ? ` · ${rupees(amount / 100)}` : ''}
        {` · AF-${b.id.slice(0, 8).toUpperCase()}`}
      </Muted>

      <Button
        label="Chat with the centre"
        icon="chatbubbles-outline"
        variant="secondary"
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: b.id, title: b.partner_business_name } })}
        style={{ marginTop: S.sm }}
      />

      {b.start_code ? (
        <View style={s.codeBox} accessible accessibilityLabel={`Start code ${b.start_code.split('').join(' ')}`}>
          <Text style={s.codeLabel}>YOUR START CODE</Text>
          <Text style={s.code}>{b.start_code}</Text>
          <Muted style={s.codeHint}>
            Tell the centre this code when you get there (or send it in the chat). They can only start your work with it.
          </Muted>
          <Button
            label={sent ? 'Sent to the centre ✓' : sending ? 'Sending…' : 'Send in chat'}
            icon={sent ? 'checkmark-circle' : 'send'}
            variant={sent ? 'secondary' : 'primary'}
            disabled={sending || sent}
            onPress={() => void sendCode()}
            style={s.sendBtn}
          />
          {sendError ? <Text style={s.sendError}>{sendError}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export default function Bookings() {
  const router = useRouter();
  const { signedIn, loading: authLoading, me } = useAuth();
  const senderName = me?.profile?.full_name?.trim() || 'Citizen';
  const { data, loading, error, refreshing, refresh } = useApi<BookingListResponse>(signedIn ? '/bookings/my' : null);
  // Back on screen after the visit: the code is gone once the centre starts.
  useRefreshOnFocus(refresh);

  if (authLoading || (loading && !refreshing)) return <Loading />;
  if (!signedIn) {
    return (
      <View style={s.gate}>
        <Empty icon="calendar-outline" title="Sign in to see your bookings" body="Your centre bookings and start codes show here." />
        <Button label="Sign in" onPress={() => router.push('/login')} style={{ marginHorizontal: S.xl }} />
      </View>
    );
  }

  // Not started first (they carry a code), then the rest, newest first (the API's order).
  const items = [...(data?.items ?? [])].sort((a, b) => Number(!!b.start_code) - Number(!!a.start_code));

  return (
    <FlatList
      data={items}
      keyExtractor={(b) => b.id}
      renderItem={({ item }) => <BookingRow b={item} senderName={senderName} />}
      contentContainerStyle={[column, s.list]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}
      ListEmptyComponent={
        error ? (
          <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
        ) : (
          <Empty icon="calendar-outline" title="No bookings yet" body="Book a MeeSeva or CSC centre and it shows here." />
        )
      }
    />
  );
}

const s = StyleSheet.create({
  list: { padding: S.lg, gap: S.md, flexGrow: 1 },
  gate: { flex: 1, justifyContent: 'center', backgroundColor: C.canvas },
  row: { padding: S.lg, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, justifyContent: 'space-between' },
  title: { flex: 1, color: C.navy, fontSize: 15, fontWeight: '800' },
  codeBox: {
    marginTop: S.md,
    padding: S.md,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${C.blue}66`,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  codeLabel: { color: C.mutedNavy, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  code: { color: C.navy, fontSize: 40, fontWeight: '900', letterSpacing: 12, fontVariant: ['tabular-nums'], marginVertical: 2 },
  codeHint: { textAlign: 'center', fontSize: 12 },
  sendBtn: { marginTop: S.sm, alignSelf: 'stretch' },
  sendError: { color: C.bad, fontSize: 12, marginTop: 4, textAlign: 'center' },
});
