/**
 * Alerts — the notification centre. GET /notifications, POST /:id/read.
 * The same engine that sends the push notification writes these rows, so the
 * list and the phone's tray always agree.
 */
import type { NotificationItem, NotificationList } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Button, Empty, Loading, Muted } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { setUnread } from '@/lib/unread';
import { useApi, useRefreshOnFocus } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  closing_reminder: 'alarm-outline',
  result: 'trophy-outline',
  admit_card: 'card-outline',
  answer_key: 'key-outline',
  date_change: 'calendar-outline',
  correction_window: 'create-outline',
  saved_item_changed: 'bookmark-outline',
  profile_match: 'sparkles-outline',
  document_expiry: 'document-text-outline',
  account_security: 'shield-checkmark-outline',
  request_update: 'chatbubble-ellipses-outline',
};

export default function Alerts() {
  const { signedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, loading, error, refreshing, refresh, setData } = useApi<NotificationList>(
    signedIn ? '/notifications' : null,
  );

  // Re-fetch when the tab regains focus, and keep the tab badge in sync.
  useRefreshOnFocus(refresh);
  useEffect(() => {
    if (data) setUnread(data.unread);
  }, [data?.unread]);

  async function open(item: NotificationItem) {
    if (!item.read) {
      setData((prev) =>
        prev
          ? {
              unread: Math.max(0, prev.unread - 1),
              items: prev.items.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
            }
          : prev,
      );
      void api.post(`/notifications/${item.id}/read`);
    }
    // Links are website paths; map the ones that have a mobile screen.
    const opp = item.link?.match(/^\/(?:jobs|exams|scholarships|admissions)\/([^/?#]+)/);
    const service = item.link?.match(/^\/services?\/([^/?#]+)/);
    if (opp) router.push(`/opportunity/${opp[1]}`);
    else if (service) router.push(`/service/${service[1]}`);
  }

  async function markAll() {
    setData((prev) =>
      prev ? { unread: 0, items: prev.items.map((n) => ({ ...n, read: true })) } : prev,
    );
    void api.post('/notifications/read-all');
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <AppHeader subtitle={data?.unread ? `${data.unread} unread` : 'Reminders and results'} />

      {authLoading ? (
        <Loading />
      ) : !signedIn ? (
        <View style={s.gate}>
          <Empty
            icon="notifications-outline"
            title="Sign in for alerts"
            body="Get a reminder before every last date, and a push when a result or admit card is out."
          />
          <Button label="Sign in" onPress={() => router.push('/login')} style={s.gateButton} />
        </View>
      ) : loading && !refreshing ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[column, s.list]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          }
          ListHeaderComponent={
            data?.unread ? (
              <Pressable
                onPress={markAll}
                style={s.markAll}
                hitSlop={12}
                accessibilityRole="button"
              >
                <Text style={s.markAllText}>Mark all as read</Text>
              </Pressable>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => open(item)}
              style={({ pressed }) => [
                card,
                s.row,
                !item.read && s.unread,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Ionicons
                name={ICON[item.type] ?? 'megaphone-outline'}
                size={20}
                color={item.read ? C.muted : C.blue}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.title, !item.read && { fontWeight: '800' }]}>{item.title}</Text>
                {item.body ? <Muted>{item.body}</Muted> : null}
                <Muted style={{ fontSize: 11 }}>{formatDate(item.created_at)}</Muted>
              </View>
              {!item.read ? <View style={s.dot} /> : null}
            </Pressable>
          )}
          ListEmptyComponent={
            error ? (
              <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
            ) : (
              <Empty
                icon="notifications-outline"
                title="No alerts yet"
                body="Save a few opportunities and reminders will start arriving here."
              />
            )
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  list: { padding: S.lg, gap: S.md, flexGrow: 1 },
  gate: { flex: 1, justifyContent: 'center' },
  gateButton: { marginHorizontal: S.xl, marginBottom: S.xxl },
  markAll: { alignSelf: 'flex-end', paddingBottom: S.sm },
  markAllText: { color: C.blue, fontSize: 12.5, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, padding: S.lg },
  unread: { borderColor: C.blue, backgroundColor: '#fbfdff' },
  title: { color: C.navy, fontSize: 14.5, fontWeight: '700', lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue, marginTop: 5 },
});
