/** Add or edit one rate-card line. POST / PATCH / DELETE /partners/me/services. */
import type { PartnerServiceDetail, PartnerServiceInput } from '@applyfields/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, ErrorNote, Field, Loading, Page } from '@/components/ui';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

export default function ServiceForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data, loading } = useApi<PartnerServiceDetail[]>(id ? '/partners/me/services' : null);
  const existing = id ? data?.find((s) => s.id === id) : undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [chargeText, setChargeText] = useState('');
  const [time, setTime] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Prefill once; a later re-fetch (screen refocus) must not wipe what the partner is typing.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (!existing || filled) return;
    setFilled(true);
    setName(existing.name);
    setDescription(existing.description ?? '');
    setPrice(existing.charge_paise != null ? String(existing.charge_paise / 100) : '');
    setChargeText(existing.charge_text ?? '');
    setTime(existing.estimated_time_text ?? '');
    setActive(existing.is_active);
  }, [existing, filled]);

  if (id && loading && !data) return <Loading />;

  async function save() {
    if (name.trim().length < 2) {
      setError('Give the service a name.');
      return;
    }
    const rupeesValue = Number(price.replace(/[₹,\s]/g, ''));
    if (price.trim() && (!Number.isFinite(rupeesValue) || rupeesValue < 0)) {
      setError('The price must be a number, like 50 or 120.');
      return;
    }
    const body: PartnerServiceInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      charge_paise: price.trim() ? Math.round(rupeesValue * 100) : undefined,
      charge_text: chargeText.trim() || undefined,
      estimated_time_text: time.trim() || undefined,
      is_active: active,
    };
    setBusy(true);
    setError(null);
    const res = id
      ? await api.patch<PartnerServiceDetail>(`/partners/me/services/${id}`, body)
      : await api.post<PartnerServiceDetail>('/partners/me/services', body);
    setBusy(false);
    if (res.data) router.back();
    else setError(res.error ?? 'Could not save the service.');
  }

  function remove() {
    Alert.alert('Remove this service?', 'Citizens will no longer see it on your rate card.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const res = await api.del(`/partners/me/services/${id}`);
          if (res.error) setError(res.error);
          else router.back();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: id ? 'Edit service' : 'New service' }} />
      <Page>
        <Card style={st.card}>
          <Field label="Service name" value={name} onChangeText={setName} placeholder="Caste certificate application" />
          <Field label="Description (optional)" value={description} onChangeText={setDescription} multiline />
          <Field
            label="Your charge (₹)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="50"
            hint="Your fee only. Government fees are paid on the official portal."
          />
          <Field
            label="Price note (optional)"
            value={chargeText}
            onChangeText={setChargeText}
            placeholder="₹5 per page"
          />
          <Field label="Time taken (optional)" value={time} onChangeText={setTime} placeholder="15–20 minutes" />
          <View style={st.switchRow}>
            <Text style={st.label}>Offered right now</Text>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: C.blue, false: C.line }} thumbColor={C.white} />
          </View>
        </Card>
        <ErrorNote text={error} />
        <Button label={busy ? 'Saving…' : 'Save'} disabled={busy} onPress={save} />
        {id ? <Button label="Remove service" variant="danger" onPress={remove} /> : null}
      </Page>
    </>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  label: { color: C.navy, fontSize: 14, fontWeight: '600' },
});
