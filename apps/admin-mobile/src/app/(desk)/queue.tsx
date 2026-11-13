/**
 * Reviewer queue (GET /admin/review): what is waiting and what blocks publishing. Editing and publishing
 * stay on the admin website for now (long forms + PDF side by side); each row opens it there.
 */
import type { ReviewList, ReviewListItem } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Badge, Empty, ErrorNote, Loading, Muted } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

const ADMIN_WEB = (process.env.EXPO_PUBLIC_ADMIN_WEB_URL || 'https://applyfields-admin.vercel.app').replace(/\/$/, '');

export default function ReviewQueue() {
  const { data, error, loading, refreshing, refresh } = useApi<ReviewList>('/admin/review');
  if (loading && !data) return <Loading />;

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(r) => r.id}
      contentContainerStyle={[column, { padding: S.lg, gap: S.sm }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={C.blue} />}
      ListHeaderComponent={
        <View style={{ gap: S.sm }}>
          <ErrorNote text={error} />
          {data ? (
            <Muted>
              {data.total} waiting · {data.needs_care} need care · {data.waiting_extraction} notices not extracted yet
            </Muted>
          ) : null}
        </View>
      }
      ListEmptyComponent={error ? undefined : <Empty icon="checkmark-done-outline" title="Queue is clear" />}
      renderItem={({ item }) => <DraftRow r={item} />}
    />
  );
}

function DraftRow({ r }: { r: ReviewListItem }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint="Opens this draft on the admin website"
      onPress={() => void WebBrowser.openBrowserAsync(`${ADMIN_WEB}/review/${r.id}`)}
      style={({ pressed }) => [card, s.row, pressed && { opacity: 0.85 }]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.title} numberOfLines={3}>
          {r.title}
        </Text>
        <Muted numberOfLines={1}>
          {r.organization} · {r.source_key ?? 'manual'}
        </Muted>
        <View style={s.meta}>
          {r.needs_care ? <Badge label="Check carefully" color={C.warn} /> : null}
          {r.confidence !== null ? <Badge label={`${Math.round(r.confidence * 100)}%`} color={C.blue} /> : null}
          {r.missing.length ? <Badge label={`${r.missing.length} blocker${r.missing.length === 1 ? '' : 's'}`} color={C.bad} /> : null}
        </View>
        {r.missing.length ? <Muted numberOfLines={2}>Missing: {r.missing.join(', ')}</Muted> : null}
      </View>
      <Ionicons name="open-outline" size={18} color={C.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md },
  title: { color: C.navy, fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
});
