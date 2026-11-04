import type { OpportunityCard as Card_ } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ELIGIBILITY, TYPE_LABEL, deadline } from '../lib/format';
import { C, R, S, card } from '../theme';
import { Badge } from './ui';

export function OpportunityCard({ item }: { item: Card_ }) {
  const router = useRouter();
  const d = deadline(item.days_left);
  const elig = item.eligibility ? ELIGIBILITY[item.eligibility] : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/opportunity/${item.slug}`)}
      style={({ pressed }) => [card, s.wrap, pressed && { opacity: 0.9 }]}
    >
      <View style={s.topRow}>
        <Badge label={TYPE_LABEL[item.type]} color={C.blue} />
        {elig ? <Badge label={elig.label} color={elig.color} /> : null}
      </View>

      <Text style={s.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={s.org} numberOfLines={1}>
        {item.organization}
      </Text>

      <View style={s.metaRow}>
        <Meta icon="location-outline" text={item.location} />
        {item.qualification ? <Meta icon="school-outline" text={item.qualification} /> : null}
        {item.vacancies ? (
          <Meta icon="people-outline" text={`${item.vacancies.toLocaleString('en-IN')} posts`} />
        ) : null}
      </View>

      <View style={s.footer}>
        <View style={s.deadline}>
          <Ionicons name="time-outline" size={14} color={d.color} />
          <Text style={[s.deadlineText, { color: d.color }]}>{d.label}</Text>
        </View>
        {item.saved ? <Ionicons name="bookmark" size={16} color={C.blue} /> : null}
        {typeof item.match_score === 'number' ? (
          <Text style={s.match}>{item.match_score}% match</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.meta}>
      <Ionicons name={icon} size={13} color={C.muted} />
      <Text style={s.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: S.lg, gap: 6 },
  topRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  title: { color: C.navy, fontSize: 15.5, fontWeight: '700', lineHeight: 21, marginTop: 2 },
  org: { color: C.muted, fontSize: 13 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  metaText: { color: C.muted, fontSize: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginTop: S.sm,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  deadline: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  deadlineText: { fontSize: 12.5, fontWeight: '700' },
  match: {
    color: C.blue,
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: C.ice,
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    borderRadius: R.pill,
  },
});
