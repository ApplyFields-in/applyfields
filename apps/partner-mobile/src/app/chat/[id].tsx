/**
 * Booking chat with the citizen. Polls every 5 s while open, marks citizen messages read.
 * Until the booking starts, a bar on top takes the citizen's 4-digit start code (pre-filled when the
 * citizen typed it in the chat) and starts the work right here.
 */
import type { BookingDetail, BookingListResponse, ChatMessageItem } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorNote, Loading, Muted } from '@/components/ui';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { QUICK_REPLIES } from '@/lib/presets';
import { openSharedDocument } from '@/lib/shared-docs';
import { NEEDS_START, codeFromChat } from '@/lib/start-code';
import { useSession } from '@/lib/session';
import { useApi, usePoll } from '@/lib/use-api';
import { C, R, S, TAP, column } from '@/theme';

// ponytail: 5 s polling; move to the API's realtime channel if chat volume grows.
const POLL_MS = 5000;

export default function Chat() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const insets = useSafeAreaInsets();
  const { partner } = useSession();
  const path = `/bookings/${id}/messages`;
  const { data, loading, error, refresh, setData } = useApi<ChatMessageItem[]>(path);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const list = useRef<FlatList<ChatMessageItem>>(null);

  // The booking behind this chat (same inbox the booking screen reads): is a start code still needed?
  const inbox = useApi<BookingListResponse>('/bookings/partner/inbox');
  const booking = inbox.data?.items.find((b) => b.id === id);
  const needsStart = !!booking && booking.user_id !== null && NEEDS_START.has(booking.status);
  const suggested = needsStart ? codeFromChat(data ?? []) : null;
  const [typedCode, setTypedCode] = useState<string | null>(null); // null = not edited, follow the chat
  const code = typedCode ?? suggested ?? '';
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function startWork() {
    if (!/^\d{4}$/.test(code)) {
      setStartError('Enter the 4-digit start code from the citizen’s app.');
      return;
    }
    setStarting(true);
    setStartError(null);
    const res = await api.patch<BookingDetail>(`/bookings/partner/${id}`, {
      status: 'in_progress',
      start_code: code,
      partner_note: 'Citizen arrived (start code checked in chat)',
    });
    setStarting(false);
    if (!res.data) {
      setStartError(res.error ?? 'Could not start the booking.');
      return;
    }
    setTypedCode(null);
    const started = res.data;
    inbox.setData((prev) => prev && { ...prev, items: prev.items.map((b) => (b.id === started.id ? started : b)) });
    // Tell the citizen in the same thread (best effort: the booking already started).
    const msg = await api.post<ChatMessageItem>(path, {
      message: 'Code matched. We have started your work.',
      sender_type: 'partner',
      sender_name: partner?.business_name ?? 'Partner centre',
    });
    const sent = msg.data;
    if (sent) setData((prev) => [...(prev ?? []), sent]);
  }

  // A locker document the citizen attached: open it through the share.
  const [openingShare, setOpeningShare] = useState<string | null>(null);
  async function openAttachment(shareId: string, name: string, mimeType?: string) {
    setOpeningShare(shareId);
    setSendError(null);
    try {
      await openSharedDocument({ bookingId: id, shareId, title: name, mimeType });
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setOpeningShare(null);
    }
  }

  usePoll(() => void refresh(), POLL_MS);

  const unreadFromCitizen = data?.some((m) => m.sender_type === 'citizen' && !m.is_read) ?? false;
  useEffect(() => {
    if (unreadFromCitizen) void api.patch(`${path}/read`, { reader_type: 'partner' });
  }, [unreadFromCitizen, path]);

  async function send() {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setSendError(null);
    const res = await api.post<ChatMessageItem>(path, {
      message,
      sender_type: 'partner',
      sender_name: partner?.business_name ?? 'Partner centre',
    });
    setSending(false);
    if (!res.data) {
      setSendError(res.error ?? 'Message not sent.');
      return;
    }
    const sent = res.data;
    setText('');
    setData((prev) => [...(prev ?? []), sent]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      // iOS native stack header = status bar + 44pt; a fixed 90 was wrong on notch-less and Dynamic Island phones.
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <Stack.Screen options={{ title: title ?? 'Chat' }} />
      {needsStart ? (
        <View style={st.startBar}>
          <View style={st.startRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.startTitle}>Start code</Text>
              <Muted style={{ fontSize: 12 }}>
                {suggested && typedCode === null ? 'Filled from the citizen’s message' : 'Ask for the 4 digits in their app'}
              </Muted>
            </View>
            <TextInput
              value={code}
              onChangeText={(v) => {
                setTypedCode(v.replace(/\D/g, '').slice(0, 4));
                setStartError(null);
              }}
              keyboardType="number-pad"
              maxLength={4}
              textContentType="oneTimeCode"
              placeholder="••••"
              placeholderTextColor={C.muted}
              accessibilityLabel="Start code"
              style={st.codeInput}
            />
            <Pressable
              accessibilityRole="button"
              disabled={starting}
              onPress={() => void startWork()}
              style={({ pressed }) => [st.startBtn, (starting || pressed) && { opacity: 0.7 }]}
            >
              <Text style={st.startBtnText}>{starting ? 'Checking…' : 'Start work'}</Text>
            </Pressable>
          </View>
          <ErrorNote text={startError} />
        </View>
      ) : null}
      {loading && !data ? (
        <Loading />
      ) : (
        <FlatList
          ref={list}
          data={data ?? []}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={[column, { padding: S.lg, gap: S.sm, flexGrow: 1 }]}
          ListHeaderComponent={<ErrorNote text={data ? null : error} />}
          ListEmptyComponent={<Muted style={{ textAlign: 'center', marginTop: S.xl }}>No messages yet. Say hello.</Muted>}
          renderItem={({ item }) => {
            if (item.sender_type === 'system') {
              return <Muted style={st.system}>{item.message}</Muted>;
            }
            const mine = item.sender_type === 'partner';
            return (
              <View style={[st.bubble, mine ? st.mine : st.theirs]}>
                {!mine ? <Text style={st.sender}>{item.sender_name}</Text> : null}
                <Text style={[st.text, mine && { color: C.white }]}>{item.message}</Text>
                {item.attachments?.map((a, i) =>
                  a.share_id ? (
                    <Pressable
                      key={a.share_id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${a.name}`}
                      disabled={openingShare !== null}
                      onPress={() => void openAttachment(a.share_id!, a.name, a.file_type)}
                      style={[st.attachChip, mine && { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                    >
                      <Ionicons
                        name={a.kind === 'image' ? 'image-outline' : 'document-text-outline'}
                        size={16}
                        color={mine ? C.white : C.blue}
                      />
                      <Text style={[st.attach, mine && { color: C.white }]} numberOfLines={1}>
                        {openingShare === a.share_id ? 'Opening…' : a.name}
                        {a.file_size ? ` · ${a.file_size}` : ''}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text key={`${a.name}-${i}`} style={[st.attach, mine && { color: C.ice }]}>
                      📎 {a.name}
                    </Text>
                  ),
                )}
                <Text style={[st.time, mine && { color: C.ice }]}>{dateTime(item.created_at)}</Text>
              </View>
            );
          }}
        />
      )}

      <View style={[st.composer, { paddingBottom: S.sm + insets.bottom }]}>
        <ErrorNote text={sendError} />
        {/* Tap a phrase to drop it into the box; edit before sending if needed. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={st.quickRow} style={{ flexGrow: 0 }}>
          {QUICK_REPLIES.map((q) => (
            <Pressable key={q} accessibilityRole="button" onPress={() => setText(q)} style={({ pressed }) => [st.quick, pressed && { opacity: 0.7 }]}>
              <Text style={st.quickText} numberOfLines={1}>
                {q}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={st.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor={C.muted}
            multiline
            style={st.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={sending || !text.trim()}
            onPress={send}
            style={({ pressed }) => [st.send, (sending || !text.trim()) && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="send" size={18} color={C.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  startBar: { backgroundColor: C.ice, borderBottomWidth: 1, borderBottomColor: C.line, paddingHorizontal: S.md, paddingVertical: S.sm, gap: S.xs },
  startRow: { ...column, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  startTitle: { color: C.navy, fontSize: 14, fontWeight: '800' },
  codeInput: {
    width: 92,
    minHeight: TAP,
    backgroundColor: C.white,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    textAlign: 'center',
    color: C.navy,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
  },
  startBtn: { minHeight: TAP, paddingHorizontal: S.md, borderRadius: R.pill, backgroundColor: C.good, justifyContent: 'center' },
  startBtnText: { color: C.white, fontSize: 13, fontWeight: '800' },
  bubble: { maxWidth: '82%', padding: S.md, borderRadius: R.lg, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.blue, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 4 },
  sender: { color: C.blue, fontSize: 12, fontWeight: '800' },
  text: { color: C.navy, fontSize: 15, lineHeight: 21 },
  attach: { color: C.blue, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  attachChip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: S.sm, borderRadius: R.md, backgroundColor: C.ice },
  time: { color: C.muted, fontSize: 10, alignSelf: 'flex-end' },
  system: { textAlign: 'center', fontSize: 12, marginVertical: S.xs },
  composer: { borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white, paddingHorizontal: S.md, paddingTop: S.sm, gap: S.sm },
  quickRow: { gap: S.sm, paddingVertical: 2 },
  quick: { maxWidth: 260, minHeight: 34, justifyContent: 'center', paddingHorizontal: S.md, borderRadius: R.pill, backgroundColor: C.ice },
  quickText: { color: C.navy, fontSize: 12, fontWeight: '600' },
  inputRow: { ...column, flexDirection: 'row', alignItems: 'flex-end', gap: S.sm },
  input: {
    flex: 1,
    minHeight: TAP,
    maxHeight: 120,
    backgroundColor: C.canvas,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    paddingTop: 12,
    paddingBottom: 12,
    color: C.navy,
    fontSize: 15,
  },
  send: { width: TAP, height: TAP, borderRadius: R.pill, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
});
