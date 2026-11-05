/** Earnings: completed bookings + payouts from ApplyFields (GET /partners/me/earnings). Owner only; same data as the website's Settlement page. */
import type { PartnerEarningsSummary } from '@applyfields/types';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, Empty, ErrorNote, Loading, Muted, Page, SectionTitle, useCompact } from '@/components/ui';
import { rupees } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

type Payout = PartnerEarningsSummary['payouts'][number];

const PAYOUT: Record<Payout['status'], { label: string; color: string }> = {
  paid: { label: 'Paid', color: C.good },
  pending: { label: 'Pending', color: C.warn },
  processing: { label: 'Processing', color: C.blue },
  failed: { label: 'Failed', color: C.bad },
};

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent?: boolean }) {
  const compact = useCompact();
  return (
    <Card style={[st.metric, { flexBasis: compact ? '100%' : '47%' }, accent && st.metricAccent]}>
      <Muted style={st.metricLabel}>{label}</Muted>
      <Text style={[st.metricValue, accent && { color: C.good }]}>{value}</Text>
      <Muted style={{ fontSize: 12 }}>{note}</Muted>
    </Card>
  );
}

export default function Earnings() {
  const { data, error, loading, refreshing, refresh } = useApi<PartnerEarningsSummary>('/partners/me/earnings');

  if (loading && !data) return <Loading label="Loading earnings…" />;
  if (!data) {
    return (
      <Page onRefresh={refresh} refreshing={refreshing}>
        <ErrorNote text={error ?? 'Could not load earnings.'} />
        <Muted>Earnings are visible to the centre owner account only.</Muted>
      </Page>
    );
  }

  return (
    <Page onRefresh={refresh} refreshing={refreshing}>
      <View style={st.grid}>
        <Metric label="Completed services" value={String(data.completed_count)} note="All time" />
        <Metric label="Total earned" value={rupees(data.gross_paise)} note="Final amounts on completed bookings" />
        <Metric
          label="Paid to you"
          value={rupees(data.paid_paise)}
          note={`ApplyFields commission recorded: ${rupees(data.commission_paise)}`}
          accent
        />
        <Metric label="Payouts pending" value={rupees(data.pending_payout_paise)} note="Created, not yet paid" />
      </View>

      <Card style={st.note}>
        <Text style={st.body}>
          <Text style={st.strong}>{rupees(data.unsettled_paise)}</Text> from completed bookings is not in any settlement yet
          {data.last_settled_until ? ` (after ${day(data.last_settled_until)}).` : ' (no settlement has been made yet).'}
        </Text>
        {data.unpriced_count > 0 ? (
          <Text style={[st.body, { color: C.warn }]}>
            {data.unpriced_count} completed booking{data.unpriced_count === 1 ? ' has' : 's have'} no final amount, so{' '}
            {data.unpriced_count === 1 ? 'it is' : 'they are'} not counted. Enter the amount when you complete a booking.
          </Text>
        ) : null}
        <Muted style={{ fontSize: 12 }}>The commission rate and settlement cycle are set by ApplyFields and shown on each payout.</Muted>
      </Card>

      <SectionTitle>Recent completed services</SectionTitle>
      {data.recent.length === 0 ? (
        <Empty icon="receipt-outline" title="No completed bookings yet" />
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {data.recent.map((r) => (
            <View key={r.id} style={st.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.rowTitle} numberOfLines={1}>
                  {r.service_name ?? 'Service'}
                </Text>
                <Muted style={{ fontSize: 12 }}>
                  AF-{r.id.slice(0, 4).toUpperCase()} · {day(r.completed_at)}
                </Muted>
              </View>
              {r.final_paise === null ? (
                <Text style={[st.amount, { color: C.warn }]}>Not entered</Text>
              ) : (
                <Text style={st.amount}>{rupees(r.final_paise)}</Text>
              )}
            </View>
          ))}
        </Card>
      )}

      <SectionTitle>Payout history</SectionTitle>
      {data.payouts.length === 0 ? (
        <Empty
          icon="wallet-outline"
          title="No payouts yet"
          body="ApplyFields creates a payout for each settlement period."
        />
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          {data.payouts.map((p) => (
            <View key={p.id} style={st.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.rowTitle}>
                  {day(p.period_start)} – {day(p.period_end)}
                </Text>
                <Muted style={{ fontSize: 12 }}>
                  Gross {rupees(p.gross_paise)} · Commission {rupees(p.commission_paise)}
                  {p.reference ? ` · Ref ${p.reference}` : ''}
                </Muted>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={st.amount}>{rupees(p.net_paise)}</Text>
                <Badge label={PAYOUT[p.status].label} color={PAYOUT[p.status].color} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </Page>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md },
  metric: { flexGrow: 1, padding: S.lg, gap: 4 },
  metricAccent: { borderColor: C.good },
  metricLabel: { fontSize: 13, fontWeight: '700' },
  metricValue: { color: C.navy, fontSize: 22, fontWeight: '800' },
  note: { padding: S.lg, gap: S.sm },
  body: { color: C.navy, fontSize: 14, lineHeight: 20 },
  strong: { fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    minHeight: 56,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  rowTitle: { color: C.navy, fontSize: 14, fontWeight: '700' },
  amount: { color: C.navy, fontSize: 15, fontWeight: '800' },
});
