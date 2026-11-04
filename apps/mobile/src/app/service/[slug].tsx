/**
 * One government service (PAN, passport, a certificate…): what it is, who needs
 * it, the documents and fee, the steps, and the official route out. Backed by
 * GET /services/:slug. Gives push notifications about a service a screen to land
 * on, and the Services list a card to open.
 */
import type { GovServiceDetail } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Empty, Loading, Muted, SectionTitle, useCompact } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, rupees } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, R, S, column } from '@/theme';

export default function ServiceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { signedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const compact = useCompact();

  const { data, loading, error } = useApi<GovServiceDetail>(slug ? `/services/${slug}` : null);

  const [saved, setSaved] = useState<boolean | null>(null);
  const [savePending, setSavePending] = useState(false);

  async function toggleSave() {
    if (!signedIn) {
      router.push('/login');
      return;
    }
    const next = !(saved ?? false);
    setSavePending(true);
    setSaved(next);
    const res = next
      ? await api.put(`/saved/service/${slug}`)
      : await api.del(`/saved/service/${slug}`);
    if (res.error) setSaved(!next);
    setSavePending(false);
  }

  if (loading) return <Loading />;
  if (!data) {
    return (
      <Empty
        icon="cloud-offline-outline"
        title="Could not open this one"
        body={error ?? 'It may have been unpublished.'}
      />
    );
  }

  const url = data.apply_url || data.official_url;

  return (
    <ScrollView contentContainerStyle={[column, s.page, { paddingBottom: S.xxl + insets.bottom }]}>
      <View style={s.badges}>
        {data.category ? <Badge label={data.category} color={C.blue} /> : null}
        {data.assistance_available ? <Badge label="Help nearby" color={C.good} /> : null}
      </View>

      <Text style={s.h1}>{data.name}</Text>
      {data.organization?.name || data.authority_name ? (
        <Muted>{data.organization?.name ?? data.authority_name}</Muted>
      ) : null}
      {data.description ? <Text style={s.summary}>{data.description}</Text> : null}

      <View style={[s.actions, compact && { flexDirection: 'column' }]}>
        <Button
          label={url ? 'Apply on the official portal' : 'No official link yet'}
          icon="open-outline"
          disabled={!url}
          style={compact ? undefined : { flex: 1 }}
          onPress={() =>
            url && router.push({ pathname: '/apply', params: { url, title: data.name } })
          }
        />
        <Button
          label={saved ? 'Saved' : 'Save'}
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          variant="secondary"
          disabled={savePending}
          onPress={toggleSave}
        />
      </View>
      <Muted>ApplyFields is a guide. Applications are always submitted on the official portal.</Muted>

      {data.who_needs_it ? (
        <Card style={s.card}>
          <SectionTitle>Who needs it</SectionTitle>
          <Text style={s.body}>{data.who_needs_it}</Text>
        </Card>
      ) : null}

      {data.eligibility_text ? (
        <Card style={s.card}>
          <SectionTitle>Eligibility</SectionTitle>
          <Text style={s.body}>{data.eligibility_text}</Text>
        </Card>
      ) : null}

      {data.process_steps.length ? (
        <Card style={s.card}>
          <SectionTitle>How it works</SectionTitle>
          {data.process_steps
            .slice()
            .sort((a, b) => a.step - b.step)
            .map((step) => (
              <View key={step.step} style={s.stepRow}>
                <Text style={s.stepNum}>{step.step}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  {step.description ? <Muted>{step.description}</Muted> : null}
                </View>
              </View>
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
              <Text style={s.body}>
                {doc.name}
                {doc.spec ? ` — ${doc.spec}` : ''}
                {doc.mandatory ? '' : ' (optional)'}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {data.fees.length || data.fee_text || data.processing_time_text ? (
        <Card style={s.card}>
          <SectionTitle>Fee and processing time</SectionTitle>
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
          {data.processing_time_text ? (
            <Muted style={{ marginTop: 4 }}>Processing time: {data.processing_time_text}</Muted>
          ) : null}
        </Card>
      ) : null}

      {data.official_url || data.apply_url ? (
        <Card style={s.card}>
          <SectionTitle>Official links</SectionTitle>
          {data.official_url ? <LinkRow label="Official page" url={data.official_url} /> : null}
          {data.apply_url && data.apply_url !== data.official_url ? (
            <LinkRow label="Apply online" url={data.apply_url} />
          ) : null}
          {data.last_verified_at ? (
            <Muted style={{ marginTop: S.sm }}>
              Last checked against the source on {formatDate(data.last_verified_at)}
            </Muted>
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
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
  card: { padding: S.lg },
  body: { color: C.navy, fontSize: 13.5, lineHeight: 20, flex: 1 },
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
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, paddingVertical: 5 },
  stepTitle: { color: C.navy, fontSize: 14, fontWeight: '700' },
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
