/**
 * Citizen-service guides that need a fresh check (never verified, or older than GUIDE_STALE_DAYS).
 * Open the guide as citizens see it (with its official links), compare with the official site, then
 * "Mark verified" → POST /admin/services/:id/verify (admin; sets "Verified on …" on the citizen page).
 */
import type { AdminGovServiceList, AdminGovServiceListItem } from '@applyfields/types';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, ErrorNote, Loading, Muted, Page } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { GUIDE_LIST_ROLES, GUIDE_STALE_DAYS, GUIDE_VERIFY_ROLES, canUse, guideNeedsCheck } from '@/lib/staff';
import { useApi } from '@/lib/use-api';
import { C, S } from '@/theme';

const WEB = (process.env.EXPO_PUBLIC_WEB_URL || 'https://applyfields.com').replace(/\/$/, '');
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Guides() {
  const roles = useSession().staff?.roles ?? [];
  const canList = canUse(roles, GUIDE_LIST_ROLES);
  const canVerify = canUse(roles, GUIDE_VERIFY_ROLES);
  // ponytail: first 100 published guides; page when there are more.
  const list = useApi<AdminGovServiceList>(canList ? '/admin/services?status=published&pageSize=100' : null);

  if (!canList) return <Empty icon="lock-closed-outline" title="Support staff only" />;
  if (list.loading && !list.data) return <Loading />;

  const now = Date.now();
  const due = (list.data?.items ?? [])
    .filter((g) => guideNeedsCheck(g.last_verified_at ?? null, now))
    // Never-verified first, then the oldest check.
    .sort((a, b) => (a.last_verified_at ?? '').localeCompare(b.last_verified_at ?? ''));

  return (
    <Page refreshing={list.refreshing} onRefresh={() => void list.refresh()}>
      <Muted>
        {due.length} of {list.data?.items.length ?? 0} published guides need a check (never verified, or over {GUIDE_STALE_DAYS} days).
        {canVerify ? '' : ' Only admins can mark them verified.'}
      </Muted>
      <ErrorNote text={list.error} />
      {list.data && due.length === 0 ? <Empty icon="checkmark-done-outline" title="All guides recently verified" /> : null}
      {due.map((g) => (
        <GuideCard
          key={g.id}
          g={g}
          canVerify={canVerify}
          onVerified={(at) =>
            list.setData((prev) => prev && { ...prev, items: prev.items.map((x) => (x.id === g.id ? { ...x, last_verified_at: at } : x)) })
          }
        />
      ))}
    </Page>
  );
}

function GuideCard({ g, canVerify, onVerified }: { g: AdminGovServiceListItem; canVerify: boolean; onVerified: (at: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    setBusy(true);
    setError(null);
    const res = await api.post(`/admin/services/${g.id}/verify`);
    setBusy(false);
    if (res.error) return setError(res.error);
    onVerified(new Date().toISOString());
  }

  return (
    <Card style={s.card}>
      <View style={s.head}>
        <Text style={s.name}>{g.name}</Text>
        <Badge label={g.last_verified_at ? 'Stale' : 'Never verified'} color={g.last_verified_at ? C.warn : C.bad} />
      </View>
      <Muted>
        {[g.authority_name, g.category, g.state_codes.join(', ')].filter(Boolean).join(' · ')}
      </Muted>
      <Muted>{g.last_verified_at ? `Last verified ${day(g.last_verified_at)}` : `Published ${g.published_at ? day(g.published_at) : '—'}`}</Muted>
      <ErrorNote text={error} />
      <View style={s.actions}>
        <Button
          label="Open guide"
          icon="open-outline"
          variant="secondary"
          onPress={() => void WebBrowser.openBrowserAsync(`${WEB}/services/${g.slug}`)}
          style={{ flex: 1 }}
        />
        {canVerify ? (
          <Button label={busy ? 'Saving…' : 'Mark verified'} icon="checkmark-circle-outline" disabled={busy} onPress={() => void verify()} style={{ flex: 1 }} />
        ) : null}
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  card: { padding: S.md, gap: S.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: S.sm },
  name: { flex: 1, color: C.navy, fontSize: 15, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
});
