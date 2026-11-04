import type { BookingDetail } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { bookingToken, type Citizen } from '../lib/citizens';
import { BOOKING_STATUS, ago, dateTime, phone, rupees } from '../lib/format';
import { C, S, card } from '../theme';
import { Badge, Muted } from './ui';

export function BookingCard({ booking, citizen }: { booking: BookingDetail; citizen?: Citizen }) {
  const router = useRouter();
  const st = BOOKING_STATUS[booking.status];
  const amount = booking.final_paise ?? booking.quoted_paise;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })}
      style={({ pressed }) => [card, s.card, pressed && { opacity: 0.85 }]}
    >
      <View style={s.top}>
        <Badge label={st.label} color={st.color} />
        <Muted style={{ fontSize: 12 }}>
          {bookingToken(booking.id)} · {ago(booking.created_at)}
        </Muted>
      </View>
      <Text style={s.title} numberOfLines={2}>
        {booking.service_name ?? 'Assistance request'}
      </Text>
      {citizen?.name ? (
        <View style={s.meta}>
          <Ionicons name="person-outline" size={14} color={C.muted} />
          <Muted numberOfLines={1} style={{ flex: 1 }}>
            {citizen.name}
            {citizen.phone ? ` · ${phone(citizen.phone)}` : ''}
          </Muted>
        </View>
      ) : null}
      <View style={s.meta}>
        <Ionicons name="time-outline" size={14} color={C.muted} />
        <Muted style={{ flex: 1 }}>
          {booking.appointment_at ? dateTime(booking.appointment_at) : 'Walk-in / no slot'}
        </Muted>
        {amount != null ? <Text style={s.amount}>{rupees(amount)}</Text> : null}
      </View>
      {booking.user_note ? (
        <Muted numberOfLines={2} style={{ fontStyle: 'italic' }}>
          “{booking.user_note}”
        </Muted>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { padding: S.lg, gap: S.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: S.sm },
  title: { color: C.navy, fontSize: 15, fontWeight: '800' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { color: C.navy, fontSize: 14, fontWeight: '800' },
});
