/** Services & rate card — GET /partners/me/services; the switch is a quick PATCH { is_active }. */
import type { PartnerServiceDetail } from '@applyfields/types';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';

import { PartnerHeader } from '@/components/partner-header';
import { ServicePresets } from '@/components/service-presets';
import { Button, Empty, ErrorNote, Loading, Muted } from '@/components/ui';
import { api } from '@/lib/api';
import { rupees } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

export default function Services() {
  const router = useRouter();
  const { data, error, loading, refreshing, refresh, setData } = useApi<PartnerServiceDetail[]>('/partners/me/services');

  async function toggle(svc: PartnerServiceDetail, next: boolean) {
    setData((prev) => prev?.map((s) => (s.id === svc.id ? { ...s, is_active: next } : s)) ?? prev);
    const res = await api.patch<PartnerServiceDetail>(`/partners/me/services/${svc.id}`, { is_active: next });
    if (!res.data) setData((prev) => prev?.map((s) => (s.id === svc.id ? svc : s)) ?? prev);
  }

  return (
    <View style={{ flex: 1 }}>
      <PartnerHeader />
      {loading && !data ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(s) => s.id}
          contentContainerStyle={[column, { padding: S.lg, paddingTop: 0, gap: S.sm, flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}
          ListHeaderComponent={
            <View style={{ gap: S.sm, marginBottom: S.xs }}>
              <ErrorNote text={data ? null : error} />
              <Button label="Add your own service" icon="add" onPress={() => router.push('/service-form')} />
            </View>
          }
          ListFooterComponent={
            data ? (
              <View style={{ marginTop: S.md }}>
                <ServicePresets existing={data} onAdded={(svc) => setData((prev) => [...(prev ?? []), svc])} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            data ? <Empty icon="pricetags-outline" title="No services yet" body="Add your own, or quick-add common ones below. Citizens see this list when they book." /> : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/service-form', params: { id: item.id } })}
              style={({ pressed }) => [card, st.row, pressed && { opacity: 0.85 }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[st.name, !item.is_active && { color: C.muted }]}>{item.name}</Text>
                <Muted style={{ fontSize: 12 }}>
                  {[item.charge_paise != null ? rupees(item.charge_paise) : item.charge_text, item.estimated_time_text]
                    .filter(Boolean)
                    .join(' · ') || 'No price set'}
                </Muted>
              </View>
              <Switch
                accessibilityLabel={`${item.name} offered`}
                value={item.is_active}
                onValueChange={(v) => void toggle(item, v)}
                trackColor={{ true: C.blue, false: C.line }}
                thumbColor={C.white}
              />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.lg },
  name: { color: C.navy, fontSize: 15, fontWeight: '800' },
});
