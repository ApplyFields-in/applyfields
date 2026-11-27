/**
 * Which alerts to get and how many days before a last date to be reminded. Same switches as the
 * website's Settings → Notifications; each change saves straight away (PUT /notifications/preferences).
 */
import type { MutableNotificationType, NotificationPreferences, NotificationPreferencesInput } from '@applyfields/types';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Muted } from '@/components/ui';
import { api } from '@/lib/api';
import { C, R, S } from '@/theme';

const TYPES: { key: MutableNotificationType; label: string }[] = [
  { key: 'closing_reminder', label: 'Last date and exam reminders' },
  { key: 'admit_card', label: 'Admit cards' },
  { key: 'answer_key', label: 'Answer keys' },
  { key: 'result', label: 'Results' },
  { key: 'correction_window', label: 'Correction windows' },
  { key: 'date_change', label: 'Date changes and extensions' },
  { key: 'saved_item_changed', label: 'Other updates to saved items' },
  { key: 'daily_morning', label: 'Morning pick (9 am)' },
  { key: 'daily_afternoon', label: 'Afternoon deadline alert (2 pm)' },
  { key: 'daily_evening', label: 'Evening career spotlight (7 pm)' },
];
const DAYS = [30, 14, 7, 3, 1, 0];
const MAX_DAYS = 5; // the API's limit

export function NotificationRules({ initial }: { initial: NotificationPreferences }) {
  const [muted, setMuted] = useState(initial.muted_types);
  const [days, setDays] = useState(initial.reminder_days_before);

  async function save(body: NotificationPreferencesInput, undo: () => void) {
    const res = await api.put('/notifications/preferences', body);
    if (res.error) {
      undo();
      Alert.alert('Could not save', res.error);
    }
  }

  const toggleType = (key: MutableNotificationType) => {
    const before = muted;
    const next = muted.includes(key) ? muted.filter((m) => m !== key) : [...muted, key];
    setMuted(next);
    void save({ muted_types: next }, () => setMuted(before));
  };

  const toggleDay = (d: number) => {
    const before = days;
    if (!days.includes(d) && days.length >= MAX_DAYS) return;
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => b - a);
    setDays(next);
    void save({ reminder_days_before: next }, () => setDays(before));
  };

  return (
    <View>
      <Text style={s.heading}>Notify me about</Text>
      {TYPES.map((t) => (
        <View key={t.key} style={s.row}>
          <Text style={s.label}>{t.label}</Text>
          <Switch
            value={!muted.includes(t.key)}
            onValueChange={() => toggleType(t.key)}
            trackColor={{ true: C.blue, false: C.line }}
            thumbColor={C.white}
            accessibilityLabel={t.label}
          />
        </View>
      ))}

      <Text style={[s.heading, { marginTop: S.lg }]}>Remind me before a last date or exam</Text>
      <View style={s.chips}>
        {DAYS.map((d) => {
          const on = days.includes(d);
          return (
            <Pressable
              key={d}
              onPress={() => toggleDay(d)}
              style={[s.chip, on && s.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              hitSlop={6}
            >
              <Text style={[s.chipText, on && s.chipTextOn]}>
                {d === 0 ? 'On the day' : d === 1 ? '1 day' : `${d} days`}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Muted style={{ marginTop: S.sm }}>Up to {MAX_DAYS}. Reminders go out between 8 am and 9 pm.</Muted>
    </View>
  );
}

const s = StyleSheet.create({
  heading: { fontSize: 14, fontWeight: '800', color: C.navy, marginBottom: S.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: S.xs, gap: S.md },
  label: { flex: 1, fontSize: 14, color: C.mutedNavy },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: { paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.pill, backgroundColor: C.pillTrack },
  chipOn: { backgroundColor: C.navy },
  chipText: { fontSize: 13, fontWeight: '700', color: C.navy },
  chipTextOn: { color: C.white },
});
