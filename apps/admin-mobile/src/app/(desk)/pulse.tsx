/**
 * Pulse: live counts from the same endpoints the admin website uses, each fetched only when the
 * staff member's roles allow it (no 403 tiles). Refreshes every 60 s while open and on pull.
 *   /admin/summary (any staff) · /admin/partners + /admin/bookings (support) · /admin/notifications (reviewer)
 */
import type {
  AdminGovServiceList,
  AdminNotificationOverview,
  AdminPartnerListResponse,
  AdminSummary,
  BookingListResponse,
} from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, ErrorNote, Loading, Muted, Page, SectionTitle } from '@/components/ui';
import { useSession } from '@/lib/session';
import { canUse, guideNeedsCheck } from '@/lib/staff';
import { useApi, usePoll } from '@/lib/use-api';
import { C, S, card } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function Pulse() {
  const roles = useSession().staff?.roles ?? [];
  const support = canUse(roles, ['support']);
  const reviewer = canUse(roles, ['reviewer']);
  const content = canUse(roles, ['reviewer', 'content_editor']);

  const summary = useApi<AdminSummary>('/admin/summary');
  const kyc = useApi<AdminPartnerListResponse>(support ? '/admin/partners?status=pending&limit=1' : null);
  const bookings = useApi<BookingListResponse>(support ? '/admin/bookings?status=new&limit=1' : null);
  const notif = useApi<AdminNotificationOverview>(reviewer ? '/admin/notifications' : null);
  const complaints = useApi<{ total: number }>(support ? '/admin/bookings/disputes?status=open' : null);
  const guides = useApi<AdminGovServiceList>(support ? '/admin/services?status=published&pageSize=100' : null);
  const guidesDue = guides.data ? guides.data.items.filter((g) => guideNeedsCheck(g.last_verified_at ?? null, Date.now())).length : null;

  const refreshAll = () =>
    Promise.all([summary.refresh(), kyc.refresh(), bookings.refresh(), notif.refresh(), complaints.refresh(), guides.refresh()]);
  usePoll(() => void refreshAll(), 60_000);

  if (summary.loading && !summary.data) return <Loading label="Taking the pulse…" />;

  const stat = (key: string) => summary.data?.stats.find((s) => s.key === key)?.value ?? null;
  // A source that failed its last run, or hasn't succeeded for 2 days.
  const sick = (summary.data?.scrapers ?? []).filter(
    (s) => s.consecutive_failures > 0 || !s.last_success_at || Date.now() - Date.parse(s.last_success_at) > 2 * DAY_MS,
  );

  return (
    <Page refreshing={summary.refreshing} onRefresh={() => void refreshAll()}>
      <ErrorNote text={summary.error} />

      <View style={s.grid}>
        {support ? (
          <>
            <Tile icon="shield-checkmark-outline" label="KYC waiting" value={kyc.data?.total ?? null} urgent href="/kyc" />
            <Tile icon="calendar-outline" label="New bookings" value={bookings.data?.total ?? null} urgent />
            <Tile icon="alert-circle-outline" label="Open complaints" value={complaints.data?.total ?? null} urgent href="/escalations" />
            <Tile icon="book-outline" label="Guides to verify" value={guidesDue} urgent href="/guides" />
          </>
        ) : null}
        {content ? (
          <Tile icon="document-text-outline" label="Drafts to review" value={stat('pending_reviews')} urgent href="/queue" />
        ) : null}
        <Tile icon="alarm-outline" label="Deadlines in 7 days" value={stat('deadlines_week')} />
        <Tile icon="checkmark-done-outline" label="Published this week" value={stat('published_week')} />
        <Tile icon="people-outline" label="Registered users" value={stat('users')} />
        {reviewer ? (
          <>
            <Tile icon="mail-unread-outline" label="Emails failed" value={notif.data?.counts.failed ?? null} urgent />
            <Tile icon="phone-portrait-outline" label="Push devices" value={notif.data?.counts.push_subscriptions_total ?? null} />
          </>
        ) : null}
      </View>
      {reviewer && notif.error ? <Muted>Notification counts unavailable: {notif.error}</Muted> : null}

      <SectionTitle>Scrapers</SectionTitle>
      <Card style={s.list}>
        {summary.data && sick.length === 0 ? (
          <Row icon="checkmark-circle" color={C.good} title={`All ${summary.data.scrapers.length} sources healthy`} />
        ) : (
          sick.map((src) => (
            <Row
              key={src.key}
              icon="warning"
              color={C.bad}
              title={src.name}
              sub={
                src.consecutive_failures > 0
                  ? `${src.consecutive_failures} failed run${src.consecutive_failures === 1 ? '' : 's'} in a row`
                  : src.last_success_at
                    ? `Last success ${new Date(src.last_success_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                    : 'Never succeeded'
              }
            />
          ))
        )}
      </Card>

      {content && summary.data?.review_queue.length ? (
        <>
          <SectionTitle>Newest drafts</SectionTitle>
          <Card style={s.list}>
            {summary.data.review_queue.slice(0, 5).map((r) => (
              <Row
                key={r.id}
                icon="document-outline"
                color={r.confidence < 0.6 ? C.warn : C.blue}
                title={r.title}
                sub={`${r.source} · ${Math.round(r.confidence * 100)}% confidence`}
              />
            ))}
          </Card>
        </>
      ) : null}
    </Page>
  );
}

function Tile({
  icon,
  label,
  value,
  urgent,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | null;
  urgent?: boolean;
  href?: Href;
}) {
  const hot = urgent && !!value;
  return (
    <Pressable
      accessibilityRole={href ? 'button' : undefined}
      disabled={!href}
      onPress={() => href && router.navigate(href)}
      style={({ pressed }) => [card, s.tile, hot && s.tileHot, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name={icon} size={18} color={hot ? C.bad : C.blue} />
      <Text style={[s.value, hot && { color: C.bad }]}>{value === null ? '—' : value.toLocaleString('en-IN')}</Text>
      <Text style={s.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function Row({
  icon,
  color,
  title,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  sub?: string;
}) {
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={18} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        {sub ? <Muted>{sub}</Muted> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  tile: { flexGrow: 1, flexBasis: '45%', padding: S.md, gap: 4 },
  tileHot: { borderColor: `${C.bad}55` },
  value: { color: C.navy, fontSize: 26, fontWeight: '800' },
  label: { color: C.muted, fontSize: 12, fontWeight: '600' },
  list: { padding: S.md, gap: S.md },
  row: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start' },
  rowTitle: { color: C.navy, fontSize: 14, fontWeight: '600' },
});
