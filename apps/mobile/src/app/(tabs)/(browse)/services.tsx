/**
 * Services — government services a citizen can apply for (PAN, passport,
 * certificates, MeeSeva…). GET /services. Every card sends the user to the
 * official portal; ApplyFields only guides.
 */
import type { GovServiceCard, GovServiceList } from '@applyfields/types';
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

import { Badge, Button, Empty, Loading, Muted } from '@/components/ui';
import { useApi, useDebounced } from '@/lib/use-api';
import { C, R, S, TAP, card, column } from '@/theme';

export default function Services() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 300);
  const path = useMemo(() => (q ? `/services?q=${encodeURIComponent(q)}` : '/services'), [q]);
  const { data, loading, error, refreshing, refresh } = useApi<GovServiceList>(path);

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchOuter}>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="PAN, passport, caste certificate…"
            placeholderTextColor={C.muted}
            style={s.search}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <Loading label="Loading services…" />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(i) => i.slug}
          renderItem={({ item }) => <ServiceRow item={item} />}
          contentContainerStyle={[column, s.list]}
          ListHeaderComponent={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/centres')}
              style={({ pressed }) => [s.near, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="map" size={20} color={C.white} />
              <View style={{ flex: 1 }}>
                <Text style={s.nearTitle}>MeeSeva & CSC centres near you</Text>
                <Text style={s.nearBody}>On a map, with walking and driving directions.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.ice} />
            </Pressable>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          }
          ListEmptyComponent={
            error ? (
              <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
            ) : (
              <Empty icon="business-outline" title="No services match that search" />
            )
          }
        />
      )}
    </View>
  );
}

function ServiceRow({ item }: { item: GovServiceCard }) {
  const router = useRouter();
  const url = item.apply_url || item.official_url;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/service/${item.slug}`)}
      style={({ pressed }) => [card, s.card, pressed && { opacity: 0.9 }]}
    >
      <View style={s.topRow}>
        {item.category ? <Badge label={item.category} color={C.blue} /> : null}
        {item.assistance_available ? <Badge label="Help nearby" color={C.good} /> : null}
      </View>

      <Text style={s.title}>{item.name}</Text>
      {item.organization || item.authority_name ? (
        <Muted numberOfLines={1}>{item.organization ?? item.authority_name}</Muted>
      ) : null}
      {item.description ? <Muted numberOfLines={3}>{item.description}</Muted> : null}

      <View style={s.metaRow}>
        {item.fee_text ? <Meta icon="pricetag-outline" text={item.fee_text} /> : null}
        {item.processing_time_text ? (
          <Meta icon="time-outline" text={item.processing_time_text} />
        ) : null}
        {item.required_documents_count ? (
          <Meta icon="document-text-outline" text={`${item.required_documents_count} documents`} />
        ) : null}
      </View>

      {url ? (
        <Button
          label="Apply on the official portal"
          icon="open-outline"
          style={{ marginTop: S.sm }}
          onPress={() => router.push({ pathname: '/apply', params: { url, title: item.name } })}
        />
      ) : (
        <Muted style={{ marginTop: S.sm }}>No official link published yet.</Muted>
      )}
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

const s = StyleSheet.create({
  // Padding on the outer column, not margin on the box: margin + width 100% overflows.
  searchOuter: { ...column, paddingHorizontal: S.lg, paddingTop: S.lg },
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
  list: { padding: S.lg, gap: S.md, flexGrow: 1 },
  card: { padding: S.lg, gap: 6 },
  topRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  title: { color: C.navy, fontSize: 16, fontWeight: '700', marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: C.muted, fontSize: 12 },
  near: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.md,
    backgroundColor: C.navy,
    borderRadius: R.md,
  },
  nearTitle: { color: C.white, fontSize: 14, fontWeight: '800' },
  nearBody: { color: C.ice, fontSize: 12.5, marginTop: 1 },
});
