/** One career: what the work is, the pathway, and the exams and jobs it leads to. */
import type { CareerDetail } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Card, Empty, Loading, Muted, SectionTitle } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { C, R, S, column } from '@/theme';

export default function CareerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, loading, error } = useApi<CareerDetail>(slug ? `/career/${slug}` : null);
  const insets = useSafeAreaInsets();

  if (loading) return <Loading />;
  if (!data) {
    return (
      <Empty
        icon="cloud-offline-outline"
        title="Could not open this career"
        body={error ?? undefined}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[column, s.page, { paddingBottom: S.xxl + insets.bottom }]}>
      <Badge label={data.category_name} color={C.blue} />
      <Text style={s.h1}>{data.title}</Text>
      <Text style={s.summary}>{data.summary}</Text>

      <Card style={s.card}>
        <SectionTitle>At a glance</SectionTitle>
        <Row label="Education needed" value={data.education_required} />
        {data.salary_text ? <Row label="Typical pay" value={data.salary_text} /> : null}
        {data.outlook_text ? <Row label="Outlook" value={data.outlook_text} /> : null}
      </Card>

      {data.what_it_involves ? (
        <Card style={s.card}>
          <SectionTitle>What the work involves</SectionTitle>
          <Text style={s.body}>{data.what_it_involves}</Text>
        </Card>
      ) : null}

      {data.pathway_steps.length ? (
        <Card style={s.card}>
          <SectionTitle>How to get there</SectionTitle>
          {data.pathway_steps.map((step) => (
            <View key={step.step} style={s.stepRow}>
              <Text style={s.stepNum}>{step.step}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Muted>{step.description}</Muted>
                {step.duration ? <Muted style={s.duration}>{step.duration}</Muted> : null}
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {data.skills.length ? (
        <Card style={s.card}>
          <SectionTitle>Skills that matter</SectionTitle>
          <View style={s.pills}>
            {data.skills.map((skill) => (
              <Text key={skill} style={s.pill}>
                {skill}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      {data.pros.length || data.cons.length ? (
        <Card style={s.card}>
          <SectionTitle>The honest view</SectionTitle>
          {data.pros.map((p) => (
            <Bullet key={p} icon="add-circle" color={C.good} text={p} />
          ))}
          {data.cons.map((c) => (
            <Bullet key={c} icon="remove-circle" color={C.warn} text={c} />
          ))}
        </Card>
      ) : null}

      {data.learning_resources.length ? (
        <Card style={s.card}>
          <SectionTitle>Where to learn</SectionTitle>
          {data.learning_resources.map((r) => (
            <Pressable
              key={`${r.title}-${r.url ?? ''}`}
              accessibilityRole={r.url ? 'link' : 'text'}
              disabled={!r.url}
              onPress={() =>
                r.url &&
                WebBrowser.openBrowserAsync(r.url).catch(() =>
                  Linking.openURL(r.url!).catch(() => undefined),
                )
              }
              style={s.resource}
            >
              <Ionicons name={r.url ? 'open-outline' : 'book-outline'} size={15} color={C.blue} />
              <View style={{ flex: 1 }}>
                <Text style={s.resourceTitle}>{r.title}</Text>
                <Muted>
                  {[r.provider_or_author, r.is_free ? 'Free' : null].filter(Boolean).join(' · ')}
                </Muted>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {data.linked_opportunities.length ? (
        <Card style={s.card}>
          <SectionTitle>Exams and jobs on this path</SectionTitle>
          {data.linked_opportunities.map((o) => (
            <View key={`${o.type}-${o.title}`} style={s.linked}>
              <Ionicons name="arrow-forward-circle-outline" size={15} color={C.blue} />
              <Text style={s.body}>{o.title}</Text>
            </View>
          ))}
          <Muted style={{ marginTop: S.sm }}>
            Search these in the Apply tab to see the open notifications.
          </Muted>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowKey}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

function Bullet({
  icon,
  color,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  text: string;
}) {
  return (
    <View style={s.linked}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={s.body}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: S.lg, gap: S.md },
  h1: { color: C.navy, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  summary: { color: C.navy, fontSize: 14, lineHeight: 21 },
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
  rowValue: { color: C.navy, fontSize: 13, fontWeight: '600', maxWidth: '58%' },
  stepRow: { flexDirection: 'row', gap: S.md, paddingVertical: S.sm },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: R.pill,
    backgroundColor: C.ice,
    color: C.navy,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepTitle: { color: C.navy, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  duration: { marginTop: 2, fontStyle: 'italic' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    color: C.navy,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: C.canvas,
    paddingHorizontal: S.md,
    paddingVertical: 5,
    borderRadius: R.pill,
  },
  resource: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, paddingVertical: S.sm },
  resourceTitle: { color: C.navy, fontSize: 13.5, fontWeight: '600' },
  linked: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, paddingVertical: 4 },
});
