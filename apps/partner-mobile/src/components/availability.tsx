/** Online / Offline switch for a centre — PATCH /partners/me { is_available }. Used on Home and Account. */
import type { PartnerDetail } from '@applyfields/types';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { C, S } from '../theme';
import { Card, ErrorNote, Muted } from './ui';

export function AvailabilityCard() {
  const { partner, setPartner } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!partner) return null;
  const online = partner.is_available;

  async function toggle(next: boolean) {
    if (!partner) return;
    setBusy(true);
    setError(null);
    setPartner({ ...partner, is_available: next }); // optimistic
    const res = await api.patch<PartnerDetail>('/partners/me', { is_available: next });
    setBusy(false);
    if (res.data) setPartner(res.data);
    else {
      setPartner({ ...partner, is_available: !next });
      setError(res.error ?? 'Could not change your status.');
    }
  }

  return (
    <Card style={[st.card, { borderColor: online ? `${C.good}55` : `${C.bad}44` }]}>
      <View style={st.row}>
        <View style={[st.dot, { backgroundColor: online ? C.good : C.bad }]} />
        <View style={{ flex: 1 }}>
          <Text style={st.title}>{online ? 'Online · accepting bookings' : 'Offline · closed'}</Text>
          <Muted>
            {online
              ? 'Citizens can book slots at your centre.'
              : 'New bookings are paused until you go online.'}
          </Muted>
        </View>
        <Switch
          accessibilityLabel="Accepting bookings"
          value={online}
          disabled={busy}
          onValueChange={toggle}
          trackColor={{ true: C.good, false: C.line }}
          thumbColor={C.white}
        />
      </View>
      <ErrorNote text={error} />
    </Card>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
  title: { color: C.navy, fontSize: 15, fontWeight: '800' },
});
