/** Booking chat with the citizen. Polls every 5 s while open, marks citizen messages read. */
import type { ChatMessageItem } from '@applyfields/types';
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
                {item.attachments?.map((a) => (
                  <Text key={a.name} style={[st.attach, mine && { color: C.ice }]}>
                    📎 {a.name}
                  </Text>
                ))}
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
  bubble: { maxWidth: '82%', padding: S.md, borderRadius: R.lg, gap: 4 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.blue, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 4 },
  sender: { color: C.blue, fontSize: 12, fontWeight: '800' },
  text: { color: C.navy, fontSize: 15, lineHeight: 21 },
  attach: { color: C.blue, fontSize: 13, fontWeight: '600' },
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
