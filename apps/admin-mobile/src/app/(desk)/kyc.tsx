/** Partner KYC queue (GET /admin/partners). Tap a partner → full-screen inspector. */
import type { AdminPartnerItem, AdminPartnerListResponse, PartnerVerificationStatus } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Badge, Chips, Empty, ErrorNote, Loading, Muted, SearchBox } from '@/components/ui';
import { STATUS_COLOR, typeLabel } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

const FILTERS: { value: PartnerVerificationStatus; label: string }[] = [
  { value: 'pending', label: 'Waiting' },
  { value: 'verified', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function KycQueue() {
  const [status, setStatus] = useState<PartnerVerificationStatus>('pending');
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const { data, error, loading, refreshing, refresh } = useApi<AdminPartnerListResponse>(
    `/admin/partners?status=${status}&limit=50${q ? `&q=${encodeURIComponent(q)}` : ''}`,
  );

  return (
    <View style={{ flex: 1 }}>
      <SearchBox value={text} onChange={setText} placeholder="Search name, city or phone" />
      <Chips options={FILTERS} value={status} onChange={setStatus} />
      {loading && !data ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[column, { padding: S.lg, paddingTop: 0, gap: S.sm }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={C.blue} />}
          ListHeaderComponent={<ErrorNote text={error} />}
          ListEmptyComponent={
            error ? undefined : <Empty icon="shield-checkmark-outline" title={status === 'pending' ? 'No one waiting' : 'Nothing here'} />
          }
          renderItem={({ item }) => <PartnerRow p={item} />}
        />
      )}
    </View>
  );
}

function PartnerRow({ p }: { p: AdminPartnerItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/kyc/${p.id}`)}
      style={({ pressed }) => [card, s.row, pressed && { opacity: 0.85 }]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.name} numberOfLines={2}>
          {p.business_name}
        </Text>
        <Muted numberOfLines={1}>
          {typeLabel(p.type)} · {[p.city, p.district, p.state_code].filter(Boolean).join(', ') || 'No address'}
        </Muted>
        <View style={s.meta}>
          <Badge label={typeLabel(p.verification_status)} color={STATUS_COLOR[p.verification_status]} />
          <Muted>
            {p.documents_count} document{p.documents_count === 1 ? '' : 's'} · joined{' '}
            {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Muted>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md },
  name: { color: C.navy, fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexWrap: 'wrap' },
});
