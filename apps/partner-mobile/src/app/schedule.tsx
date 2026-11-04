/**
 * Weekly hours, slot length, capacity and holidays. GET/PUT /partners/me/schedule,
 * POST/DELETE /partners/me/overrides. Pausing bookings is the Online switch, so
 * it is not repeated here.
 */
import type { DaySchedule, HolidayOverride, PartnerScheduleMatrix } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Chips, ErrorNote, Field, Loading, Muted, Page, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { HHMM, copyMondayToWeekdays, scheduleProblem } from '@/lib/schedule-rules';
import { useApi } from '@/lib/use-api';
import { C, R, S, TAP } from '@/theme';

const DURATIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
] as const;

function Time({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      // Typing "0930" becomes "09:30": the number pad has no colon on most Android keyboards.
      onChangeText={(t) => {
        const digits = t.replace(/\D/g, '').slice(0, 4);
        onChange(digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);
      }}
      placeholder="09:00"
      placeholderTextColor={C.muted}
      maxLength={5}
      keyboardType="number-pad"
      style={[st.time, !HHMM.test(value) && { borderColor: C.bad }]}
    />
  );
}

export default function Schedule() {
  const { data, loading, error: loadError, setData } = useApi<PartnerScheduleMatrix>('/partners/me/schedule');
  const [days, setDays] = useState<DaySchedule[]>([]);
  const [duration, setDuration] = useState<'15' | '30' | '45' | '60'>('30');
  const [capacity, setCapacity] = useState(2);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (!data || filled) return;
    setFilled(true);
    setDays(data.schedule);
    setDuration(String(data.slotDuration) as typeof duration);
    setCapacity(data.maxConcurrent);
  }, [data, filled]);

  if (loading && !data) return <Loading />;
  if (!data) return <Page><ErrorNote text={loadError} /></Page>;

  const patchDay = (dow: number, change: Partial<DaySchedule>) => {
    setSaved(false);
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dow ? { ...d, ...change } : d)));
  };

  async function save() {
    const problem = scheduleProblem(days);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await api.put<PartnerScheduleMatrix>('/partners/me/schedule', {
      schedule: days.map((d) => (d.hasBreak ? d : { ...d, breakStart: null, breakEnd: null })),
      slotDuration: Number(duration),
      maxConcurrent: capacity,
    });
    setBusy(false);
    if (res.data) {
      setData(res.data);
      setSaved(true);
    } else setError(res.error ?? 'Could not save the schedule.');
  }

  async function addHoliday() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate.trim()) || Number.isNaN(Date.parse(holidayDate.trim()))) {
      setError('Holiday date is YYYY-MM-DD, like 2026-11-14.');
      return;
    }
    setError(null);
    const res = await api.post<HolidayOverride>('/partners/me/overrides', {
      date: holidayDate.trim(),
      reason: holidayReason.trim() || undefined,
      isClosed: true,
    });
    if (!res.data) {
      setError(res.error ?? 'Could not add the holiday.');
      return;
    }
    const added = res.data;
    setData((prev) => prev && { ...prev, holidayOverrides: [...prev.holidayOverrides, added] });
    setHolidayDate('');
    setHolidayReason('');
  }

  async function removeHoliday(h: HolidayOverride) {
    if (!h.id) return;
    const res = await api.del(`/partners/me/overrides/${h.id}`);
    if (res.error) setError(res.error);
    else setData((prev) => prev && { ...prev, holidayOverrides: prev.holidayOverrides.filter((x) => x.id !== h.id) });
  }

  const today = new Date().toISOString().slice(0, 10);
  const holidays = data.holidayOverrides.filter((h) => h.date >= today);

  return (
    <Page>
      <Card style={st.card}>
        <SectionTitle>Weekly hours</SectionTitle>
        <Button
          label="Copy Monday to Tue–Fri"
          icon="copy-outline"
          variant="secondary"
          onPress={() => {
            setSaved(false);
            setDays(copyMondayToWeekdays);
          }}
        />
        {days.map((d) => (
          <View key={d.dayOfWeek} style={st.day}>
            <View style={st.dayHead}>
              <Text style={st.dayName}>{d.dayName ?? `Day ${d.dayOfWeek}`}</Text>
              <Switch
                accessibilityLabel={`${d.dayName} open`}
                value={d.isOpen}
                onValueChange={(v) => patchDay(d.dayOfWeek, { isOpen: v })}
                trackColor={{ true: C.blue, false: C.line }}
                thumbColor={C.white}
              />
            </View>
            {d.isOpen ? (
              <>
                <View style={st.times}>
                  <Time label={`${d.dayName} opens`} value={d.openTime} onChange={(v) => patchDay(d.dayOfWeek, { openTime: v })} />
                  <Muted>to</Muted>
                  <Time label={`${d.dayName} closes`} value={d.closeTime} onChange={(v) => patchDay(d.dayOfWeek, { closeTime: v })} />
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: d.hasBreak }}
                    onPress={() =>
                      patchDay(d.dayOfWeek, {
                        hasBreak: !d.hasBreak,
                        breakStart: d.breakStart ?? '13:00',
                        breakEnd: d.breakEnd ?? '14:00',
                      })
                    }
                    style={st.breakToggle}
                  >
                    <Ionicons name={d.hasBreak ? 'checkbox' : 'square-outline'} size={18} color={C.blue} />
                    <Muted>Break</Muted>
                  </Pressable>
                </View>
                {d.hasBreak ? (
                  <View style={st.times}>
                    <Muted>Break</Muted>
                    <Time label={`${d.dayName} break starts`} value={d.breakStart ?? ''} onChange={(v) => patchDay(d.dayOfWeek, { breakStart: v })} />
                    <Muted>to</Muted>
                    <Time label={`${d.dayName} break ends`} value={d.breakEnd ?? ''} onChange={(v) => patchDay(d.dayOfWeek, { breakEnd: v })} />
                  </View>
                ) : null}
              </>
            ) : (
              <Muted>Closed</Muted>
            )}
          </View>
        ))}
      </Card>

      <Card style={st.card}>
        <SectionTitle>Booking slots</SectionTitle>
        <Muted>Slot length</Muted>
        <View style={{ marginHorizontal: -S.lg }}>
          <Chips options={[...DURATIONS]} value={duration} onChange={(v) => { setSaved(false); setDuration(v); }} />
        </View>
        <Muted>Citizens served at the same time</Muted>
        <View style={st.stepper}>
          <Pressable accessibilityLabel="Fewer" onPress={() => { setSaved(false); setCapacity((c) => Math.max(1, c - 1)); }} style={st.step}>
            <Ionicons name="remove" size={20} color={C.navy} />
          </Pressable>
          <Text style={st.capacity}>{capacity}</Text>
          <Pressable accessibilityLabel="More" onPress={() => { setSaved(false); setCapacity((c) => Math.min(10, c + 1)); }} style={st.step}>
            <Ionicons name="add" size={20} color={C.navy} />
          </Pressable>
        </View>
      </Card>

      <ErrorNote text={error} />
      <Button label={busy ? 'Saving…' : saved ? 'Saved' : 'Save schedule'} icon={saved ? 'checkmark' : undefined} disabled={busy} onPress={save} />

      <Card style={st.card}>
        <SectionTitle>Holidays & closures</SectionTitle>
        {holidays.length === 0 ? <Muted>No upcoming closures.</Muted> : null}
        {holidays.map((h) => (
          <View key={h.id ?? h.date} style={st.holiday}>
            <View style={{ flex: 1 }}>
              <Text style={st.dayName}>{new Date(`${h.date}T00:00:00`).toDateString()}</Text>
              {h.reason ? <Muted>{h.reason}</Muted> : null}
            </View>
            <Pressable accessibilityLabel="Remove closure" hitSlop={10} onPress={() => void removeHoliday(h)}>
              <Ionicons name="trash-outline" size={20} color={C.bad} />
            </Pressable>
          </View>
        ))}
        <Field label="Date" value={holidayDate} onChangeText={setHolidayDate} placeholder="2026-11-14" keyboardType="numbers-and-punctuation" maxLength={10} />
        <Field label="Reason (optional)" value={holidayReason} onChangeText={setHolidayReason} placeholder="Diwali" />
        <Button label="Add closure" variant="secondary" icon="add" onPress={addHoliday} />
      </Card>
    </Page>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.md },
  day: { gap: S.sm, paddingBottom: S.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { color: C.navy, fontSize: 15, fontWeight: '700' },
  times: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexWrap: 'wrap' },
  time: {
    width: 76,
    height: TAP,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    textAlign: 'center',
    color: C.navy,
    fontSize: 15,
    backgroundColor: C.white,
  },
  breakToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TAP, paddingHorizontal: S.xs },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: S.lg },
  step: { width: TAP, height: TAP, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  capacity: { color: C.navy, fontSize: 22, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  holiday: { flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: TAP },
});
