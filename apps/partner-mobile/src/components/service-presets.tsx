/** "Quick add" starter services, one tap each — POST /partners/me/services. */
import type { PartnerServiceDetail } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../lib/api';
import { SERVICE_PRESETS, type ServicePreset } from '../lib/presets';
import { C, S, TAP } from '../theme';
import { Card, Chips, ErrorNote, Muted, SectionTitle } from './ui';

const GROUPS = [...new Set(SERVICE_PRESETS.map((p) => p.group))];

export function ServicePresets({
  existing,
  onAdded,
}: {
  existing: PartnerServiceDetail[];
  onAdded: (svc: PartnerServiceDetail) => void;
}) {
  const [group, setGroup] = useState(GROUPS[0]);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const have = new Set(existing.map((s) => s.name.trim().toLowerCase()));
  const shown = SERVICE_PRESETS.filter((p) => p.group === group);

  async function add(p: ServicePreset) {
    setAdding(p.name);
    setError(null);
    const res = await api.post<PartnerServiceDetail>('/partners/me/services', {
      name: p.name,
      description: p.description,
      charge_paise: p.rupees * 100,
      estimated_time_text: p.time,
      is_active: true,
    });
    setAdding(null);
    if (res.data) onAdded(res.data);
    else setError(res.error ?? 'Could not add the service.');
  }

  return (
    <Card style={st.card}>
      <SectionTitle>Quick add</SectionTitle>
      <Muted>Common services with a starting price. Tap one to add it, then tap it in your list to change the price.</Muted>
      <View style={{ marginHorizontal: -S.lg }}>
        <Chips options={GROUPS.map((g) => ({ value: g, label: g }))} value={group} onChange={setGroup} />
      </View>
      <ErrorNote text={error} />
      {shown.map((p) => {
        const added = have.has(p.name.toLowerCase());
        return (
          <View key={p.name} style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={[st.name, added && { color: C.muted }]}>{p.name}</Text>
              <Muted style={{ fontSize: 12 }}>
                ₹{p.rupees} · {p.time}
              </Muted>
            </View>
            {added ? (
              <Ionicons name="checkmark-circle" size={22} color={C.good} accessibilityLabel="Already added" />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${p.name}`}
                disabled={adding !== null}
                onPress={() => void add(p)}
                style={({ pressed }) => [st.add, pressed && { opacity: 0.8 }]}
              >
                {adding === p.name ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <Ionicons name="add" size={20} color={C.white} />
                )}
              </Pressable>
            )}
          </View>
        );
      })}
    </Card>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: TAP },
  name: { color: C.navy, fontSize: 14, fontWeight: '700' },
  add: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
});
