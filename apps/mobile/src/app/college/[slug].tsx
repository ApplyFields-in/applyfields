/** One college: ranking, fees, placements, courses. GET /career/colleges/:slug. */
import type { InstitutionDetail } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Empty, Loading, Muted, SectionTitle } from '@/components/ui';
import { useApi } from '@/lib/use-api';
import { recordMascotEvent } from '@/services/mascot/IconManager';
import { C, R, S, column } from '@/theme';

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export default function CollegeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, loading, error } = useApi<InstitutionDetail>(
    slug ? `/career/colleges/${slug}` : null,
  );
  const insets = useSafeAreaInsets();
  useEffect(() => {
    recordMascotEvent({ type: 'research' }); // comparing colleges
  }, [slug]);

  if (loading) return <Loading />;
  if (!data) {
    return (
      <Empty
        icon="cloud-offline-outline"
        title="Could not open this college"
        body={error ?? undefined}
      />
    );
  }

  const place = [data.city, data.district, data.state_code].filter(Boolean).join(', ');
  const ps = data.placement_stats ?? {};

  return (
    <ScrollView contentContainerStyle={[column, s.page, { paddingBottom: S.xxl + insets.bottom }]}>
      <View style={s.badges}>
        {data.ranking_text ? <Badge label={data.ranking_text} color={C.blue} /> : null}
        <Badge label={cap(data.type)} color={C.navy} />
        {data.ownership ? <Badge label={cap(data.ownership)} color={C.navy} /> : null}
      </View>
      <Text style={s.h1}>{data.name}</Text>
      {place ? (
        <View style={s.place}>
          <Ionicons name="location-outline" size={15} color={C.muted} />
          <Muted>{place}</Muted>
        </View>
      ) : null}

      <Card style={s.card}>
        <SectionTitle>At a glance</SectionTitle>
        {data.fees_text ? <Row label="Fees" value={data.fees_text} /> : null}
        {data.established_year ? (
          <Row label="Established" value={String(data.established_year)} />
        ) : null}
        {ps.highest_package ? <Row label="Highest package" value={ps.highest_package} /> : null}
        {ps.avg_package ? <Row label="Average package" value={ps.avg_package} /> : null}
        <Row label="Courses listed" value={String(data.courses.length)} />
      </Card>

      {ps.top_recruiters?.length ? (
        <Card style={s.card}>
          <SectionTitle>Top recruiters</SectionTitle>
          <View style={s.pills}>
            {ps.top_recruiters.map((r) => (
              <Text key={r} style={s.pill}>
                {r}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      {data.description ? (
        <Card style={s.card}>
          <SectionTitle>About</SectionTitle>
          <Text style={s.body}>{data.description}</Text>
        </Card>
      ) : null}

      {data.courses.length ? (
        <Card style={s.card}>
          <SectionTitle>Courses</SectionTitle>
          {data.courses.map((c) => (
            <View key={c.id} style={s.course}>
              <Text style={s.courseName}>{c.name}</Text>
              <Muted>
                {[
                  cap(c.level),
                  c.seats ? `${c.seats} seats` : null,
                  c.fees_text ??
                    (c.fee_per_year ? `₹${c.fee_per_year.toLocaleString('en-IN')}/yr` : null),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Muted>
            </View>
          ))}
        </Card>
      ) : null}

      {data.campus_facilities.length ? (
        <Card style={s.card}>
          <SectionTitle>Campus facilities</SectionTitle>
          <View style={s.pills}>
            {data.campus_facilities.map((f) => (
              <Text key={f} style={s.pill}>
                {f}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      {data.website ? (
        <Button
          label="Visit website"
          icon="open-outline"
          onPress={() => WebBrowser.openBrowserAsync(data.website!).catch(() => undefined)}
        />
      ) : null}
      {data.contact_phone ? (
        <Button
          label={`Call ${data.contact_phone}`}
          icon="call-outline"
          variant="secondary"
          onPress={() =>
            Linking.openURL(`tel:${data.contact_phone!.replace(/[^\d+]/g, '')}`).catch(
              () => undefined,
            )
          }
        />
      ) : null}
      {data.latitude != null && data.longitude != null ? (
        <Button
          label="Directions"
          icon="navigate-outline"
          variant="secondary"
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`,
            ).catch(() => undefined)
          }
        />
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

const s = StyleSheet.create({
  page: { padding: S.lg, gap: S.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  h1: { color: C.navy, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  card: { padding: S.lg },
  body: { color: C.navy, fontSize: 13.5, lineHeight: 20 },
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
  course: {
    paddingVertical: S.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
    gap: 2,
  },
  courseName: { color: C.navy, fontSize: 14, fontWeight: '700' },
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
});
