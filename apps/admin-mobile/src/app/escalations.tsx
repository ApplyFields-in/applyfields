/**
 * Booking complaints (escalations): GET /admin/bookings/disputes, PATCH /admin/bookings/disputes/:id.
 * Support staff move a complaint to "reviewing", resolve or reject it; the note is sent to the citizen.
 * Same data and rules as the admin website's Disputes desk.
 */
import type { AdminBookingDispute, BookingDispute, ResolveBookingDisputeInput } from '@applyfields/types';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Chips, Empty, ErrorNote, Field, Loading, Muted, Page } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { ESCALATION_ROLES, canUse } from '@/lib/staff';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

type Filter = 'open' | 'in_review' | 'resolved' | 'rejected';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];
const STATUS_COLOR: Record<string, string> = { open: C.bad, in_review: C.warn, resolved: C.good, rejected: C.muted, closed: C.muted };
const rupees = (paise: number | null) => (paise == null ? '—' : `₹${(paise / 100).toLocaleString('en-IN')}`);

export default function Escalations() {
  const roles = useSession().staff?.roles ?? [];
  const [filter, setFilter] = useState<Filter>('open');
  const allowed = canUse(roles, ESCALATION_ROLES);
  const list = useApi<{ total: number; items: AdminBookingDispute[] }>(
    allowed ? `/admin/bookings/disputes?status=${filter}` : null,
  );

  if (!allowed) return <Empty icon="lock-closed-outline" title="Support staff only" />;
  if (list.loading && !list.data) return <Loading />;

  return (
    <Page refreshing={list.refreshing} onRefresh={() => void list.refresh()}>
      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      <ErrorNote text={list.error} />
      {list.data && list.data.items.length === 0 ? (
        <Empty icon="checkmark-done-outline" title={filter === 'open' ? 'No open complaints' : 'Nothing here'} />
      ) : null}
      {list.data?.items.map((d) => (
        <DisputeCard
          key={d.id}
          d={d}
          onChanged={(updated) =>
            list.setData((prev) =>
              prev && {
                ...prev,
                // It moved to another filter: drop it from this one.
                items: prev.items.filter((x) => x.id !== updated.id || updated.status === filter),
              },
            )
          }
        />
      ))}
    </Page>
  );
}

function DisputeCard({ d, onChanged }: { d: AdminBookingDispute; onChanged: (u: BookingDispute) => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<ResolveBookingDisputeInput['status'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closed = d.status === 'resolved' || d.status === 'rejected' || d.status === 'closed';

  async function move(status: ResolveBookingDisputeInput['status']) {
    if (note.trim().length < 3) return setError('Write a short note for the citizen first.');
    setBusy(status);
    setError(null);
    const res = await api.patch<BookingDispute>(`/admin/bookings/disputes/${d.id}`, { status, note: note.trim() });
    setBusy(null);
    if (!res.data) return setError(res.error ?? 'Could not update the complaint.');
    setNote('');
    onChanged(res.data);
  }

  return (
    <Card style={s.card}>
      <View style={s.head}>
        <Badge label={d.status.replace('_', ' ')} color={STATUS_COLOR[d.status] ?? C.muted} />
        <Muted>{new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Muted>
      </View>
      <Text style={s.reason}>{d.reason}</Text>
      <Text style={s.body}>{d.details}</Text>
      <Muted>
        {d.citizen_name ?? 'Citizen'} · {d.partner_business_name ?? 'Centre'} · {d.service_name ?? 'Service'}
      </Muted>
      <Muted>
        Paid {rupees(d.booking_amount_paise)} · Asks back {rupees(d.claim_paise)} · Booking AF-{d.booking_id.slice(0, 8).toUpperCase()}
      </Muted>
      {d.citizen_phone ? (
        <Button label={`Call ${d.citizen_phone}`} icon="call-outline" variant="secondary" onPress={() => void Linking.openURL(`tel:${d.citizen_phone}`)} />
      ) : null}
      {d.resolution_note ? <Muted>Last note: {d.resolution_note}</Muted> : null}

      {closed ? null : (
        <>
          <Field label="Note to the citizen" value={note} onChangeText={setNote} multiline placeholder="What you found and what happens next" />
          <ErrorNote text={error} />
          <View style={s.actions}>
            {d.status === 'open' ? (
              <Button label={busy === 'in_review' ? 'Saving…' : 'Reviewing'} variant="secondary" disabled={!!busy} onPress={() => void move('in_review')} style={{ flex: 1 }} />
            ) : null}
            <Button label={busy === 'resolved' ? 'Saving…' : 'Resolve'} disabled={!!busy} onPress={() => void move('resolved')} style={{ flex: 1 }} />
            <Button label={busy === 'rejected' ? 'Saving…' : 'Reject'} variant="danger" disabled={!!busy} onPress={() => void move('rejected')} style={{ flex: 1 }} />
          </View>
        </>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: S.md, gap: S.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reason: { color: C.navy, fontSize: 15, fontWeight: '800' },
  body: { color: C.navy, fontSize: 13.5, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
});
