/** Communication desk — one thread per booking. GET /partners/me/conversations. */
import type { ConversationListResponse, PartnerConversationThread } from '@applyfields/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { PartnerHeader } from '@/components/partner-header';
import { Empty, ErrorNote, Loading, Muted, SearchBox } from '@/components/ui';
import { matchesSearch } from '@/lib/booking-filters';
import { ago } from '@/lib/format';
import { useApi, usePoll } from '@/lib/use-api';
import { C, R, S, card, column } from '@/theme';

function Thread({ t }: { t: PartnerConversationThread }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: t.booking_id, title: t.citizen_name } })}
      style={({ pressed }) => [card, st.thread, pressed && { opacity: 0.85 }]}
    >
      <View style={st.avatar}>
        <Text style={st.avatarText}>{t.citizen_name.trim()[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={st.top}>
          <Text style={st.name} numberOfLines={1}>
            {t.citizen_name}
          </Text>
          <Muted style={{ fontSize: 11 }}>{ago(t.last_timestamp)}</Muted>
        </View>
        <Muted numberOfLines={1} style={{ fontSize: 12 }}>
          {t.token} · {t.service_title}
        </Muted>
        <Text style={[st.last, t.unread_count > 0 && { color: C.navy, fontWeight: '700' }]} numberOfLines={1}>
          {t.last_message}
        </Text>
      </View>
      {t.unread_count > 0 ? (
        <View style={st.badge}>
          <Text style={st.badgeText}>{t.unread_count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function Messages() {
  const { data, error, loading, refreshing, refresh } = useApi<ConversationListResponse>('/partners/me/conversations');
  const [query, setQuery] = useState('');
  // New citizen messages show up without pulling down (website refreshes every 10 s too).
  usePoll(() => void refresh(), 10000);
  const threads = (data?.threads ?? []).filter((t) =>
    matchesSearch(query, [t.citizen_name, t.citizen_phone, t.token, t.service_title]),
  );

  return (
    <View style={{ flex: 1 }}>
      <PartnerHeader />
      <SearchBox value={query} onChange={setQuery} placeholder="Search name, AF- number, service" />
      {loading && !data ? (
        <Loading />
      ) : (
        <FlatList
          data={threads}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(t) => t.booking_id}
          renderItem={({ item }) => <Thread t={item} />}
          contentContainerStyle={[column, { padding: S.lg, gap: S.sm, flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}
          ListHeaderComponent={<ErrorNote text={data ? null : error} />}
          ListEmptyComponent={
            data ? <Empty icon="chatbubbles-outline" title="No conversations" body="Citizens can message you once they book." /> : undefined
          }
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  thread: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.ice, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.blue, fontSize: 17, fontWeight: '800' },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: S.sm },
  name: { flex: 1, color: C.navy, fontSize: 15, fontWeight: '800' },
  last: { color: C.muted, fontSize: 13 },
  badge: { minWidth: 22, height: 22, borderRadius: R.pill, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: C.white, fontSize: 12, fontWeight: '800' },
});
