/**
 * Alerts — the partner's notification inbox (GET /notifications). Same rows the
 * push notifications come from: booking updates, approval decisions and the
 * team's announcements (festival greetings, app updates).
 */
import type { NotificationItem, NotificationList } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Empty, Loading, Muted } from '@/components/ui';
import { api } from '@/lib/api';
import { ago } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

export default function Alerts() {
  const router = useRouter();
  const { data, loading, error, refreshing, refresh, setData } = useApi<NotificationList>('/notifications');

  function open(item: NotificationItem) {
    if (!item.read) {
      setData((p) =>
        p && { unread: Math.max(0, p.unread - 1), items: p.items.map((n) => (n.id === item.id ? { ...n, read: true } : n)) },
      );
      void api.post(`/notifications/${item.id}/read`);
    }
    const booking = item.link?.match(/\/bookings\/([^/?#]+)/);
    if (booking) router.push(`/booking/${booking[1]}`);
  }

  function markAll() {
    setData((p) => p && { unread: 0, items: p.items.map((n) => ({ ...n, read: true })) });
    void api.post('/notifications/read-all');
  }

  if (loading && !data) return <Loading />;

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(n) => n.id}
      contentContainerStyle={[column, s.list]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}
      ListHeaderComponent={
        data?.unread ? (
          <Pressable onPress={markAll} style={s.markAll} hitSlop={12} accessibilityRole="button">
            <Text style={s.markAllText}>Mark all as read</Text>
          </Pressable>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => open(item)}
          style={({ pressed }) => [card, s.row, !item.read && s.unread, pressed && { opacity: 0.9 }]}
        >
          <Ionicons
            name={item.type === 'system' ? 'megaphone-outline' : 'notifications-outline'}
            size={20}
            color={item.read ? C.muted : C.blue}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[s.title, !item.read && { fontWeight: '800' }]}>{item.title}</Text>
            {item.body ? <Muted>{item.body}</Muted> : null}
            <Muted style={{ fontSize: 11 }}>{ago(item.created_at)}</Muted>
          </View>
          {!item.read ? <View style={s.dot} /> : null}
        </Pressable>
      )}
      ListEmptyComponent={
        error ? (
          <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
        ) : (
          <Empty icon="notifications-outline" title="No alerts yet" body="New bookings and news from ApplyFields show up here." />
        )
      }
    />
  );
}

const s = StyleSheet.create({
  list: { padding: S.lg, gap: S.md, flexGrow: 1 },
  markAll: { alignSelf: 'flex-end', paddingBottom: S.sm },
  markAllText: { color: C.blue, fontSize: 12.5, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, padding: S.lg },
  unread: { borderColor: C.blue, backgroundColor: '#fbfdff' },
  title: { color: C.navy, fontSize: 14.5, fontWeight: '700', lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue, marginTop: 5 },
});
