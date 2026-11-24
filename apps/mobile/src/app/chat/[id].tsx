/**
 * Booking chat with the centre (GET/POST /bookings/:id/messages). Refreshes every 5 s while on
 * screen and marks the centre's messages read. Until the work starts, a strip on top shows the
 * citizen's start code with one-tap "Send in chat" — the centre's chat fills its start box from it.
 * Nothing here is stored on the phone (personal data; see lib/cacheable.ts).
 * The paperclip shares a document from the citizen's locker (POST /bookings/:id/chat/attachments):
 * it goes through document_shares, so the centre opens it through the share, never a raw link.
 */
import type { BookingDetail, ChatAttachment, ChatMessageItem, UserDocumentListResponse } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading, Muted } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { openSharedDocument } from '@/lib/offline';
import { useApi } from '@/lib/use-api';
import { C, R, S, TAP, column } from '@/theme';

// ponytail: 5 s polling, same as the partner app; move to the realtime channel if chat volume grows.
const POLL_MS = 5000;

const time = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function Chat() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const insets = useSafeAreaInsets();
  const { me } = useAuth();
  const senderName = me?.profile?.full_name?.trim() || 'Citizen';
  const path = `/bookings/${id}/messages`;
  const { data, loading, error, refresh, setData } = useApi<ChatMessageItem[]>(path);
  const booking = useApi<BookingDetail>(`/bookings/${id}`);
  const startCode = booking.data?.start_code ?? null;

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const list = useRef<FlatList<ChatMessageItem>>(null);
  const router = useRouter();

  // Attachments: pick a locker document -> shared with this booking -> message with the share.
  const [picking, setPicking] = useState(false);
  const locker = useApi<UserDocumentListResponse>(picking ? '/documents' : null);
  const [attaching, setAttaching] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  async function attach(documentId: string) {
    setAttaching(documentId);
    setSendError(null);
    const res = await api.post<ChatMessageItem>(`/bookings/${id}/chat/attachments`, { document_id: documentId });
    setAttaching(null);
    setPicking(false);
    if (!res.data) {
      setSendError(res.error ?? 'Could not share the document.');
      return;
    }
    const sent = res.data;
    setData((prev) => [...(prev ?? []), sent]);
  }

  async function openAttachment(a: ChatAttachment) {
    if (!a.share_id || opening) return;
    setOpening(a.share_id);
    setSendError(null);
    try {
      await openSharedDocument({ bookingId: id, shareId: a.share_id, title: a.name, mimeType: a.file_type });
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setOpening(null);
    }
  }

  // Poll while on screen; while a code shows, also re-check the booking so the strip goes once the centre starts.
  // (The latest functions live in a ref: useApi hands out a new refresh each render.)
  const tick = useRef(() => {});
  tick.current = () => {
    void refresh();
    if (startCode) void booking.refresh();
  };
  useFocusEffect(
    useCallback(() => {
      const t = setInterval(() => tick.current(), POLL_MS);
      return () => clearInterval(t);
    }, []),
  );

  const unreadFromCentre = data?.some((m) => m.sender_type !== 'citizen' && !m.is_read) ?? false;
  useEffect(() => {
    if (unreadFromCentre) void api.patch(`${path}/read`, { reader_type: 'citizen' });
  }, [unreadFromCentre, path]);

  async function send(message: string): Promise<boolean> {
    if (!message || sending) return false;
    setSending(true);
    setSendError(null);
    const res = await api.post<ChatMessageItem>(path, { message, sender_type: 'citizen', sender_name: senderName });
    setSending(false);
    if (!res.data) {
      setSendError(res.error ?? 'Message not sent. Check your connection and try again.');
      return false;
    }
    const sent = res.data;
    setData((prev) => [...(prev ?? []), sent]);
    return true;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <Stack.Screen options={{ title: title ?? 'Chat with the centre' }} />

      {startCode ? (
        <View style={st.codeBar}>
          <View style={{ flex: 1 }} accessible accessibilityLabel={`Your start code ${startCode.split('').join(' ')}`}>
            <Text style={st.codeLabel}>YOUR START CODE</Text>
            <Text style={st.code}>{startCode}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={codeSent || sending}
            onPress={async () => {
              if (await send(`My start code is ${startCode}`)) setCodeSent(true);
            }}
            style={({ pressed }) => [st.codeBtn, codeSent && { backgroundColor: C.good }, pressed && { opacity: 0.8 }]}
          >
            <Text style={st.codeBtnText}>{codeSent ? 'Sent ✓' : 'Send in chat'}</Text>
          </Pressable>
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
          ListEmptyComponent={
            <Muted style={{ textAlign: 'center', marginTop: S.xl }}>
              {error && !data ? error : 'No messages yet. Ask the centre anything about your booking.'}
            </Muted>
          }
          renderItem={({ item }) => {
            if (item.sender_type === 'system') return <Muted style={st.system}>{item.message}</Muted>;
            const mine = item.sender_type === 'citizen';
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
                      onPress={() => void openAttachment(a)}
                      style={[st.attachChip, mine && { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                    >
                      {opening === a.share_id ? (
                        <ActivityIndicator size="small" color={mine ? C.white : C.blue} />
                      ) : (
                        <Ionicons
                          name={a.kind === 'image' ? 'image-outline' : 'document-text-outline'}
                          size={16}
                          color={mine ? C.white : C.blue}
                        />
                      )}
                      <Text style={[st.attach, mine && { color: C.white }]} numberOfLines={1}>
                        {a.name}
                        {a.file_size ? ` · ${a.file_size}` : ''}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text key={`${a.name}-${i}`} style={[st.attach, mine && { color: C.ice }]}>
                      📎 {a.name}
                    </Text>
                  ),
                )}
                <Text style={[st.time, mine && { color: C.ice }]}>{time(item.created_at)}</Text>
              </View>
            );
          }}
        />
      )}

      <View style={[st.composer, { paddingBottom: S.sm + insets.bottom }]}>
        {sendError ? <Text style={st.error}>{sendError}</Text> : null}
        <View style={st.inputRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share a document from your locker"
            onPress={() => setPicking(true)}
            style={({ pressed }) => [st.clip, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="attach" size={22} color={C.navy} />
          </Pressable>
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
            onPress={async () => {
              if (await send(text.trim())) setText('');
            }}
            style={({ pressed }) => [st.send, (sending || !text.trim()) && { opacity: 0.5 }, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="send" size={18} color={C.white} />
          </Pressable>
        </View>
      </View>

      <Modal visible={picking} animationType="slide" transparent onRequestClose={() => setPicking(false)}>
        <Pressable style={st.backdrop} onPress={() => setPicking(false)} accessibilityLabel="Close" />
        <View style={[st.sheet, { paddingBottom: S.lg + insets.bottom }]}>
          <Text style={st.sheetTitle}>Share from your locker</Text>
          <Muted style={{ marginBottom: S.sm }}>
            Only this centre can open it, until a week after your appointment. Every opening is logged.
          </Muted>
          {locker.loading && !locker.data ? (
            <ActivityIndicator color={C.blue} style={{ marginVertical: S.xl }} />
          ) : (locker.data?.items.length ?? 0) === 0 ? (
            <View style={{ gap: S.sm, paddingVertical: S.md }}>
              <Muted>{locker.error ?? 'No documents in your locker yet.'}</Muted>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setPicking(false);
                  router.push('/documents');
                }}
                style={st.sheetLink}
              >
                <Text style={st.sheetLinkText}>Add documents in Documents</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={locker.data?.items ?? []}
              keyExtractor={(d) => d.id}
              style={{ maxHeight: 360 }}
              renderItem={({ item: d }) => (
                <Pressable
                  accessibilityRole="button"
                  disabled={attaching !== null}
                  onPress={() => void attach(d.id)}
                  style={({ pressed }) => [st.docRow, pressed && { backgroundColor: C.ice }]}
                >
                  <Ionicons
                    name={d.mime_type?.startsWith('image/') ? 'image-outline' : 'document-text-outline'}
                    size={20}
                    color={C.blue}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={st.docTitle} numberOfLines={1}>
                      {d.title || d.document_type_name || d.file_name || 'Document'}
                    </Text>
                    {d.document_type_name ? <Muted style={{ fontSize: 12 }}>{d.document_type_name}</Muted> : null}
                  </View>
                  {attaching === d.id ? <ActivityIndicator size="small" color={C.blue} /> : null}
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  codeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  codeLabel: { color: C.mutedNavy, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  code: { color: C.navy, fontSize: 26, fontWeight: '900', letterSpacing: 8, fontVariant: ['tabular-nums'] },
  codeBtn: { minHeight: TAP, paddingHorizontal: S.md, borderRadius: R.pill, backgroundColor: C.blue, justifyContent: 'center' },
  codeBtnText: { color: C.white, fontSize: 13, fontWeight: '800' },
  bubble: { maxWidth: '82%', padding: S.md, borderRadius: R.lg, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.blue, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 4 },
  sender: { color: C.blue, fontSize: 12, fontWeight: '800' },
  text: { color: C.navy, fontSize: 15, lineHeight: 21 },
  attach: { color: C.blue, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: S.sm,
    borderRadius: R.md,
    backgroundColor: C.ice,
  },
  clip: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(8, 32, 70, 0.35)' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: R.card, borderTopRightRadius: R.card, padding: S.lg, gap: 4 },
  sheetTitle: { color: C.navy, fontSize: 17, fontWeight: '800' },
  sheetLink: { minHeight: TAP, justifyContent: 'center' },
  sheetLinkText: { color: C.blue, fontSize: 14, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: 52, paddingHorizontal: S.sm, borderRadius: R.md },
  docTitle: { color: C.navy, fontSize: 15, fontWeight: '700' },
  time: { color: C.muted, fontSize: 10, alignSelf: 'flex-end' },
  system: { textAlign: 'center', fontSize: 12, marginVertical: S.xs },
  composer: { borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white, paddingHorizontal: S.md, paddingTop: S.sm, gap: S.sm },
  error: { color: C.bad, fontSize: 12 },
  inputRow: { ...column, flexDirection: 'row', alignItems: 'flex-end', gap: S.sm },
  input: {
    flex: 1,
    minHeight: TAP,
    maxHeight: 120,
    backgroundColor: C.inputBg,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    paddingTop: 12,
    paddingBottom: 12,
    color: C.navy,
    fontSize: 15,
  },
  send: { width: TAP, height: TAP, borderRadius: R.pill, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
});
