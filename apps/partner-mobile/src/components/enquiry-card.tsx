import type { InstitutionEnquiry } from '@applyfields/types';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ENQUIRY_STATUS, ago } from '../lib/format';
import { C, S, card } from '../theme';
import { Badge, Muted } from './ui';

export function EnquiryCard({ enquiry }: { enquiry: InstitutionEnquiry }) {
  const router = useRouter();
  const st = ENQUIRY_STATUS[enquiry.status];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/enquiry/[id]', params: { id: enquiry.id } })}
      style={({ pressed }) => [card, s.card, pressed && { opacity: 0.85 }]}
    >
      <View style={s.top}>
        <Badge label={st.label} color={st.color} />
        <Muted style={{ fontSize: 12 }}>{ago(enquiry.created_at)}</Muted>
      </View>
      <Text style={s.name} numberOfLines={1}>
        {enquiry.name ?? 'Student'}
      </Text>
      {enquiry.course_name ? <Muted numberOfLines={1}>{enquiry.course_name}</Muted> : null}
      <Text style={s.message} numberOfLines={2}>
        {enquiry.message}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { padding: S.lg, gap: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: C.navy, fontSize: 15, fontWeight: '800' },
  message: { color: C.navy, fontSize: 14, lineHeight: 20 },
});
