/** Career — explore careers by category. GET /career/categories + GET /career. */
import type { CareerCategory, CareerSummary } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Badge, Chips, Empty, Loading, Muted } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { C, R, S, card, column } from '@/theme';

export default function CareerExplore() {
  const [category, setCategory] = useState('all');

  const { data: categories } = useApi<CareerCategory[]>('/career/categories');
  const path = useMemo(
    () => (category === 'all' ? '/career' : `/career?category=${encodeURIComponent(category)}`),
    [category],
  );
  const { data, loading, error, refreshing, refresh } = useApi<CareerSummary[]>(path);

  const options = useMemo(
    () => [
      { value: 'all', label: 'All careers' },
      ...(categories ?? []).map((c) => ({ value: c.slug, label: c.name })),
    ],
    [categories],
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Chips stay put while a new category loads — only the list below swaps. */}
      <Chips options={options} value={category} onChange={setCategory} />
      {loading && !refreshing ? (
        <Loading label="Loading careers…" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.slug}
          renderItem={({ item }) => <CareerRow item={item} />}
          contentContainerStyle={[column, s.list]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          }
          ListEmptyComponent={
            error ? (
              <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
            ) : (
              <Empty icon="compass-outline" title="No careers in this category yet" />
            )
          }
        />
      )}
    </View>
  );
}

function CareerRow({ item }: { item: CareerSummary }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/career/${item.slug}`)}
      style={({ pressed }) => [card, s.card, pressed && { opacity: 0.9 }]}
    >
      <Badge label={item.category_name} color={C.blue} />
      <Text style={s.title}>{item.title}</Text>
      <Muted numberOfLines={3}>{item.summary}</Muted>

      <View style={s.metaRow}>
        <View style={s.meta}>
          <Ionicons name="school-outline" size={13} color={C.muted} />
          <Text style={s.metaText} numberOfLines={1}>
            {item.education_required}
          </Text>
        </View>
        {item.salary_text ? (
          <View style={s.meta}>
            <Ionicons name="cash-outline" size={13} color={C.muted} />
            <Text style={s.metaText} numberOfLines={1}>
              {item.salary_text}
            </Text>
          </View>
        ) : null}
      </View>

      {item.skills.length ? (
        <View style={s.skills}>
          {item.skills.slice(0, 4).map((skill) => (
            <Text key={skill} style={s.skill}>
              {skill}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  list: { padding: S.lg, paddingTop: 0, gap: S.md, flexGrow: 1 },
  card: { padding: S.lg, gap: 6 },
  title: { color: C.navy, fontSize: 16, fontWeight: '700', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: C.muted, fontSize: 12 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.sm },
  skill: {
    color: C.navy,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: C.canvas,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
});
