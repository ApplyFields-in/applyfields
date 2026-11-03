/**
 * Career — explore careers by category (GET /career/categories + GET /career)
 * or browse colleges (GET /career/colleges), same data as the website.
 */
import type {
  CareerCategory,
  CareerSummary,
  InstitutionListResponse,
  InstitutionSummary,
} from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge, Chips, Empty, Loading, Muted } from '@/components/ui';
import { useApi, useDebounced } from '@/lib/use-api';
import { C, CHROME_FONT_SCALE, R, S, TAP, card, column } from '@/theme';

// The website's /career/colleges stream tabs; the API filters on the same keys.
const STREAMS = [
  { value: '', label: 'All colleges' },
  { value: 'top-50-engg', label: 'Top 50 Engineering' },
  { value: 'medical', label: 'Top 50 Medical' },
  { value: 'management', label: 'Management' },
  { value: 'polytechnic', label: 'Polytechnic' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'pharmacy', label: 'Pharmacy' },
];

export default function CareerTab() {
  const [view, setView] = useState<'careers' | 'colleges'>('careers');
  return (
    <View style={{ flex: 1 }}>
      <View style={s.switchOuter}>
        <View style={s.switch} accessibilityRole="tablist">
          {(['careers', 'colleges'] as const).map((v) => (
            <Pressable
              key={v}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === v }}
              onPress={() => setView(v)}
              style={[s.switchItem, view === v && s.switchItemActive]}
            >
              <Ionicons
                name={v === 'careers' ? 'compass-outline' : 'school-outline'}
                size={16}
                color={view === v ? C.blue : C.muted}
              />
              <Text
                style={[s.switchText, view === v && s.switchTextActive]}
                maxFontSizeMultiplier={CHROME_FONT_SCALE}
              >
                {v === 'careers' ? 'Careers' : 'Colleges'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {view === 'careers' ? <CareerExplore /> : <Colleges />}
    </View>
  );
}

function CareerExplore() {
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

function Colleges() {
  const [search, setSearch] = useState('');
  const [stream, setStream] = useState('');
  const q = useDebounced(search.trim(), 300);
  const path = useMemo(() => {
    // ponytail: first 50 only; add onEndReached paging when a stream outgrows it.
    const p = new URLSearchParams({ limit: '50' });
    if (q) p.set('q', q);
    if (stream) p.set('stream', stream);
    return `/career/colleges?${p.toString()}`;
  }, [q, stream]);
  const { data, loading, error, refreshing, refresh } = useApi<InstitutionListResponse>(path);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchOuter}>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search colleges, cities, rankings…"
            placeholderTextColor={C.muted}
            style={s.search}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={13}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <Chips options={STREAMS} value={stream} onChange={setStream} />
      {loading && !refreshing ? (
        <Loading label="Loading colleges…" />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(c) => c.slug}
          renderItem={({ item }) => <CollegeRow item={item} />}
          contentContainerStyle={[column, s.list]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          }
          ListHeaderComponent={
            data?.total ? (
              <Muted>
                {data.total.toLocaleString('en-IN')} {data.total === 1 ? 'college' : 'colleges'}
              </Muted>
            ) : undefined
          }
          ListEmptyComponent={
            error ? (
              <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
            ) : (
              <Empty
                icon="school-outline"
                title="No colleges match"
                body="Try another stream or search."
              />
            )
          }
        />
      )}
    </View>
  );
}

function CollegeRow({ item }: { item: InstitutionSummary }) {
  const router = useRouter();
  const place = [item.city, item.state_code].filter(Boolean).join(', ');
  const highest = item.placement_stats?.highest_package;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/college/${item.slug}`)}
      style={({ pressed }) => [card, s.card, pressed && { opacity: 0.9 }]}
    >
      <View style={s.badges}>
        {item.ranking_text ? <Badge label={item.ranking_text} color={C.blue} /> : null}
        {item.ownership ? <Badge label={cap(item.ownership)} color={C.navy} /> : null}
      </View>
      <Text style={s.title}>{item.name}</Text>

      <View style={s.metaRow}>
        {place ? <Meta icon="location-outline" text={place} /> : null}
        {item.fees_text ? <Meta icon="cash-outline" text={`Fees ${item.fees_text}`} /> : null}
        {highest ? <Meta icon="trending-up-outline" text={`Highest ${highest}`} /> : null}
        {item.courses_count ? (
          <Meta icon="book-outline" text={`${item.courses_count} courses`} />
        ) : null}
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.meta}>
      <Ionicons name={icon} size={13} color={C.muted} />
      <Text style={s.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const cap =(v: string) => v.charAt(0).toUpperCase() + v.slice(1);

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
  switchOuter: { ...column, paddingHorizontal: S.lg, paddingTop: S.md },
  // Same sunken track + raised pill as the login screen's mode switcher.
  switch: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: R.pill,
    backgroundColor: C.ice,
  },
  switchItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: R.pill,
  },
  switchItemActive: {
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  switchText: { color: C.muted, fontSize: 14, fontWeight: '700' },
  switchTextActive: { color: C.navy, fontWeight: '800' },
  searchOuter: { ...column, paddingHorizontal: S.lg, paddingTop: S.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.md,
    backgroundColor: C.white,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
  },
  search: { flex: 1, minHeight: TAP, paddingVertical: S.sm, color: C.navy, fontSize: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
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
