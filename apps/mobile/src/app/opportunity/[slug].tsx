/**
 * One opportunity: what it is, who can apply, when, and the official route out.
 * GET /opportunities/:slug plus GET /opportunities/:slug/eligibility.
 */
import type { EligibilityResponse, OpenReminderStatus, OpportunityDetail, ReviewEligibility } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Badge,
  Button,
  Card,
  Empty,
  Loading,
  Muted,
  SectionTitle,
  useCompact,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ELIGIBILITY, TYPE_LABEL, deadline, formatDate, rupees } from '@/lib/format';
import { openOffline, saveOffline, useOfflineFiles } from '@/lib/offline';
import { opportunityUrl, shareLink } from '@/lib/share';
import { useApi } from '@/lib/use-api';
import { C, R, S, column } from '@/theme';

const DATE_LABEL: Record<string, string> = {
  notification_date: 'Notification',
  application_start: 'Applications open',
  application_end: 'Last date to apply',
  fee_last_date: 'Last date to pay the fee',
  correction_window: 'Correction window',
  admit_card: 'Admit card',
  exam_date: 'Exam',
  answer_key: 'Answer key',
  result: 'Result',
  interview: 'Interview',
  counselling: 'Counselling',
  other: 'Other',
};

export default function OpportunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { signedIn } = useAuth();
  const insets = useSafeAreaInsets();
  // Narrow phone or large text: stack Apply over Save instead of squeezing both.
  const compact = useCompact();

  const { data, loading, error } = useApi<OpportunityDetail>(
    slug ? `/opportunities/${slug}` : null,
  );
  const { data: eligibility } = useApi<EligibilityResponse>(
    slug && signedIn ? `/opportunities/${slug}/eligibility` : null,
  );

  const [saved, setSaved] = useState<boolean | null>(null);
  const [savePending, setSavePending] = useState(false);

  // "Remind me when it opens" (ApplyFields Plus) — only while applications haven't opened yet.
  const todayIstIso = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
  const opensOn = data?.application_start && data.application_start.slice(0, 10) > todayIstIso ? data.application_start.slice(0, 10) : null;
  const { data: openReminder, setData: setOpenReminder } = useApi<OpenReminderStatus>(
    opensOn && signedIn ? `/saved/opportunity/${slug}/open-reminder` : null,
  );
  const [reminderPending, setReminderPending] = useState(false);

  async function toggleOpenReminder() {
    if (!signedIn) return router.push('/login');
    if (!openReminder) return;
    if (!openReminder.plus) {
      Alert.alert('ApplyFields Plus', 'Opening-day reminders are part of ApplyFields Plus.');
      return;
    }
    setReminderPending(true);
    const path = `/saved/opportunity/${slug}/open-reminder`;
    const res = openReminder.on ? await api.del<OpenReminderStatus>(path) : await api.put<OpenReminderStatus>(path);
    setReminderPending(false);
    if (res.data) setOpenReminder(res.data);
    else Alert.alert('Could not set the reminder', res.error ?? 'Please try again.');
  }

  async function toggleSave() {
    if (!signedIn) {
      router.push('/login');
      return;
    }
    const next = !(saved ?? false);
    setSavePending(true);
    setSaved(next); // optimistic — the list screens re-fetch on focus anyway
    const res = next
      ? await api.put(`/saved/opportunity/${slug}`)
      : await api.del(`/saved/opportunity/${slug}`);
    if (res.error) setSaved(!next);
    setSavePending(false);
  }

  if (loading) return <Loading />;
  if (!data) {
    return (
      <Empty
        icon="cloud-offline-outline"
        title="Could not open this one"
        body={error ?? 'It may have been closed or archived.'}
      />
    );
  }

  const d = deadline(data.days_left);
  const applyUrl = data.links.apply_url || data.links.official_page_url;
  const mainRules = data.eligibility.find((e) => e.post_id === null) ?? data.eligibility[0];

  return (
    <ScrollView contentContainerStyle={[column, s.page, { paddingBottom: S.xxl + insets.bottom }]}>
      <View style={s.badges}>
        <Badge label={TYPE_LABEL[data.type]} color={C.blue} />
        <Badge label={d.label} color={d.color} />
        {eligibility && 'rules' in eligibility ? (
          <Badge
            label={ELIGIBILITY[eligibility.status].label}
            color={ELIGIBILITY[eligibility.status].color}
          />
        ) : null}
      </View>

      <Text style={s.h1}>{data.title}</Text>
      <Muted>{data.organization.name}</Muted>
      {data.notification_number ? <Muted>Notification {data.notification_number}</Muted> : null}
      {data.summary ? <Text style={s.summary}>{data.summary}</Text> : null}

      <View style={[s.actions, compact && s.actionsStacked]}>
        <Button
          label={applyUrl ? 'Apply on the official site' : 'No official link yet'}
          icon="open-outline"
          disabled={!applyUrl}
          style={compact ? undefined : { flex: 1 }}
          onPress={() =>
            applyUrl &&
            router.push({
              pathname: '/apply',
              params: { url: applyUrl, title: data.title },
            })
          }
        />
        <Button
          label={saved ? 'Saved' : 'Save'}
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          variant="secondary"
          disabled={savePending}
          onPress={toggleSave}
        />
        <Button
          label="Share"
          icon="share-social-outline"
          variant="secondary"
          onPress={() => shareLink(data.title, opportunityUrl(data.type, data.slug))}
        />
      </View>
      {opensOn ? (
        <Button
          label={
            openReminder?.on
              ? `Reminding you on ${formatDate(opensOn)}`
              : `Remind me when it opens (${formatDate(opensOn)})${openReminder?.plus ? '' : ' · Plus'}`
          }
          icon={openReminder?.on ? 'notifications' : 'notifications-outline'}
          variant="secondary"
          disabled={reminderPending}
          onPress={toggleOpenReminder}
        />
      ) : null}
      <Muted>
        ApplyFields is a guide. Applications are always submitted on the official portal.
      </Muted>

      {/* Why you are / are not eligible */}
      {eligibility && 'rules' in eligibility ? (
        <Card style={s.card}>
          <SectionTitle>Am I eligible?</SectionTitle>
          <Text style={[s.status, { color: ELIGIBILITY[eligibility.status].color }]}>
            {ELIGIBILITY[eligibility.status].label}
            {eligibility.match_score !== null ? ` · ${eligibility.match_score}% match` : ''}
          </Text>
          {eligibility.post ? <Muted>Checked against: {eligibility.post}</Muted> : null}
          <View style={{ gap: S.sm, marginTop: S.sm }}>
            {eligibility.rules.map((r) => (
              <View key={r.rule} style={s.ruleRow}>
                <Ionicons
                  name={
                    r.status === 'pass'
                      ? 'checkmark-circle'
                      : r.status === 'fail'
                        ? 'close-circle'
                        : 'help-circle'
                  }
                  size={16}
                  color={r.status === 'pass' ? C.good : r.status === 'fail' ? C.bad : C.warn}
                />
                <Text style={s.ruleText}>{r.reason}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <Pressable onPress={() => router.push('/login')}>
          <Card style={s.card}>
            <SectionTitle>Am I eligible?</SectionTitle>
            <Muted>Sign in and fill your profile to see a per-rule answer here.</Muted>
          </Card>
        </Pressable>
      )}

      {mainRules ? <EligibilityRules rules={mainRules} /> : null}

      {data.dates.length ? (
        <Card style={s.card}>
          <SectionTitle>Important dates</SectionTitle>
          {data.dates.map((date) => (
            <View key={date.id} style={s.row}>
              <Text style={s.rowKey}>{DATE_LABEL[date.kind] ?? date.kind}</Text>
              <Text style={s.rowValue}>
                {formatDate(date.date)}
                {date.end_date ? ` – ${formatDate(date.end_date)}` : ''}
                {date.is_tentative ? ' (tentative)' : ''}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {data.related_links?.length ? (
        <Card style={s.card}>
          <SectionTitle>Related documents</SectionTitle>
          {data.related_links.map((l) => (
            <Pressable
              key={l.url}
              accessibilityRole="link"
              onPress={() => WebBrowser.openBrowserAsync(l.url).catch(() => undefined)}
              style={s.row}
            >
              <Text style={[s.rowKey, { color: C.blue }]}>{l.title}</Text>
              <Ionicons name="open-outline" size={15} color={C.muted} />
            </Pressable>
          ))}
        </Card>
      ) : null}

      {data.posts.length ? (
        <Card style={s.card}>
          <SectionTitle>Posts and vacancies</SectionTitle>
          {data.posts.map((post) => (
            <View key={post.id} style={s.row}>
              <Text style={s.rowKey}>{post.name}</Text>
              <Text style={s.rowValue}>
                {post.vacancies_total ? `${post.vacancies_total} posts` : '—'}
                {post.salary_text
                  ? ` · ${post.salary_text}`
                  : post.salary_min
                    ? ` · ${rupees(post.salary_min)}–${rupees(post.salary_max)}`
                    : ''}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {data.fees.length || data.fee_text ? (
        <Card style={s.card}>
          <SectionTitle>Application fee</SectionTitle>
          {data.fees.map((fee, i) => (
            <View key={`${fee.category}-${fee.gender}-${i}`} style={s.row}>
              <Text style={s.rowKey}>
                {fee.category === 'ALL' ? 'All categories' : fee.category}
                {fee.gender && fee.gender !== 'any' ? ` · ${fee.gender}` : ''}
              </Text>
              <Text style={s.rowValue}>{fee.amount === 0 ? 'No fee' : rupees(fee.amount)}</Text>
            </View>
          ))}
          {data.fee_text ? <Muted style={{ marginTop: S.sm }}>{data.fee_text}</Muted> : null}
          {data.payment_modes.length ? (
            <Muted style={{ marginTop: 4 }}>Pay by: {data.payment_modes.join(', ')}</Muted>
          ) : null}
        </Card>
      ) : null}

      {data.selection_process.length ? (
        <Card style={s.card}>
          <SectionTitle>Selection process</SectionTitle>
          {data.selection_process.map((step, i) => (
            <View key={step} style={s.stepRow}>
              <Text style={s.stepNum}>{i + 1}</Text>
              <Text style={s.ruleText}>{step}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {data.syllabus?.text || data.syllabus?.url || data.previous_papers.length ? (
        <Card style={s.card}>
          <SectionTitle>Syllabus and papers</SectionTitle>
          {data.syllabus?.text ? <Text style={s.ruleText}>{data.syllabus.text}</Text> : null}
          {data.syllabus?.url ? (
            <LinkRow label="Official syllabus" url={data.syllabus.url} />
          ) : null}
          {data.previous_papers.map((paper) => (
            <LinkRow key={paper.url} label={paper.title} url={paper.url} />
          ))}
        </Card>
      ) : null}

      {data.required_documents.length ? (
        <Card style={s.card}>
          <SectionTitle>Documents to keep ready</SectionTitle>
          {data.required_documents.map((doc) => (
            <View key={doc.name} style={s.ruleRow}>
              <Ionicons
                name={doc.mandatory ? 'alert-circle' : 'ellipse-outline'}
                size={15}
                color={doc.mandatory ? C.warn : C.muted}
              />
              <Text style={s.ruleText}>
                {doc.name}
                {doc.spec ? ` — ${doc.spec}` : ''}
                {doc.mandatory ? '' : ' (optional)'}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={s.card}>
        <SectionTitle>Official links</SectionTitle>
        {data.links.notification_pdf_url ? (
          <>
            <LinkRow label="Notification PDF" url={data.links.notification_pdf_url} />
            <KeepOffline
              fileKey={`pdf:${data.slug}`}
              title={`${data.title} — notification`}
              url={data.links.notification_pdf_url}
            />
          </>
        ) : null}
        {data.links.official_page_url ? (
          <LinkRow label="Official page" url={data.links.official_page_url} />
        ) : null}
        {data.links.official_website ? (
          <LinkRow label="Official website" url={data.links.official_website} />
        ) : null}
        {data.last_verified_at ? (
          <Muted style={{ marginTop: S.sm }}>
            Last checked against the source on {formatDate(data.last_verified_at)}
          </Muted>
        ) : null}
      </Card>
    </ScrollView>
  );
}

function EligibilityRules({ rules }: { rules: ReviewEligibility }) {
  const lines: string[] = [];
  if (rules.age_min || rules.age_max) {
    lines.push(
      `${
        rules.age_min && rules.age_max
          ? `Age ${rules.age_min} to ${rules.age_max} years`
          : rules.age_min
            ? `At least ${rules.age_min} years old`
            : `Up to ${rules.age_max} years old`
      }${rules.age_as_on_date ? ` as on ${formatDate(rules.age_as_on_date)}` : ''}`,
    );
  }
  if (rules.qualification_level) {
    lines.push(
      `Qualification: ${rules.qualification_level.replace(/_/g, ' ')}${
        rules.qualification_streams.length ? ` (${rules.qualification_streams.join(', ')})` : ''
      }`,
    );
  }
  if (rules.min_percentage) lines.push(`Minimum ${rules.min_percentage}% marks`);
  if (rules.final_year_allowed) lines.push('Final-year students may apply');
  if (rules.gender !== 'any') lines.push(`Open to: ${rules.gender}`);
  if (rules.domicile_states.length) lines.push(`Domicile: ${rules.domicile_states.join(', ')}`);
  if (rules.categories_allowed.length)
    lines.push(`Categories: ${rules.categories_allowed.join(', ')}`);
  if (rules.income_max) lines.push(`Family income up to ${rupees(rules.income_max)} a year`);
  for (const condition of rules.other_conditions) lines.push(condition);

  if (!lines.length) return null;

  return (
    <Card style={s.card}>
      <SectionTitle>Eligibility in the notification</SectionTitle>
      {lines.map((line) => (
        <View key={line} style={s.ruleRow}>
          <Ionicons name="chevron-forward" size={14} color={C.blue} />
          <Text style={s.ruleText}>{line}</Text>
        </View>
      ))}
      {rules.age_relaxations.length ? (
        <Muted style={{ marginTop: S.sm }}>
          Age relaxation:{' '}
          {rules.age_relaxations
            .map(
              (r) =>
                `${r.category ?? r.gender ?? r.condition ?? 'eligible groups'} +${r.years} years`,
            )
            .join(' · ')}
        </Muted>
      ) : null}
    </Card>
  );
}

/** Keep the notification PDF on the phone for the exam centre, where data is often jammed. */
function KeepOffline({ fileKey, title, url }: { fileKey: string; title: string; url: string }) {
  const saved = useOfflineFiles().find((f) => f.key === fileKey);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await saveOffline({ key: fileKey, title, url });
    } catch (err) {
      Alert.alert('Could not save to this phone', (err as Error).message);
    }
    setBusy(false);
  }

  return (
    <Button
      variant="secondary"
      icon={saved ? 'checkmark-circle' : 'cloud-download-outline'}
      label={saved ? 'Open the copy on this phone' : busy ? 'Saving…' : 'Save PDF for offline'}
      disabled={busy}
      style={{ marginVertical: S.sm }}
      onPress={() =>
        saved
          ? void openOffline(saved).catch((e: Error) => Alert.alert('Could not open', e.message))
          : void save()
      }
    />
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() =>
        WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => undefined))
      }
      style={s.linkRow}
    >
      <Ionicons name="link-outline" size={15} color={C.blue} />
      <Text style={s.link} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  page: { padding: S.lg, gap: S.md },
  badges: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  h1: { color: C.navy, fontSize: 21, fontWeight: '800', lineHeight: 28 },
  summary: { color: C.navy, fontSize: 14, lineHeight: 21, marginTop: S.xs },
  actions: { flexDirection: 'row', gap: S.sm, marginTop: S.sm },
  actionsStacked: { flexDirection: 'column' },
  card: { padding: S.lg },
  status: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: S.md,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  rowKey: { color: C.muted, fontSize: 13, flex: 1 },
  rowValue: { color: C.navy, fontSize: 13, fontWeight: '600', flexShrink: 0, maxWidth: '55%' },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, paddingVertical: 3 },
  ruleText: { color: C.navy, fontSize: 13.5, lineHeight: 20, flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, paddingVertical: 4 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: R.pill,
    backgroundColor: C.ice,
    color: C.navy,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: 6 },
  link: { color: C.blue, fontSize: 13.5, fontWeight: '600', flex: 1 },
});
