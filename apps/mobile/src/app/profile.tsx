/**
 * Profile — who you are, what the eligibility engine knows, and the switches
 * for push alerts. Editing the full profile stays on the website; this screen
 * shows what is there and what is missing, which is what mobile users check.
 */
import type { NotificationPreferences, UserEducation } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Loading, Muted, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, rupees } from '@/lib/format';
import { LANGUAGES, useLocale } from '@/lib/locale';
import { useApi } from '@/lib/use-api';
import { registerForPush } from '@/lib/push';
import {
  isMascotIconSupported,
  resetMascotIcon,
  setAutoEnabled,
  useMascotSettings,
} from '@/services/mascot/IconManager';
import type { MascotIcon } from '@/services/mascot/MascotEventTypes';
import { C, R, S, column } from '@/theme';

const SITE = 'https://applyfields.com';

export default function Profile() {
  const router = useRouter();
  const { me, name, signedIn, loading, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: education } = useApi<UserEducation[]>(signedIn ? '/me/education' : null);
  const { data: prefs } = useApi<NotificationPreferences>(
    signedIn ? '/notifications/preferences' : null,
  );

  const [push, setPush] = useState<boolean | null>(null);
  useEffect(() => {
    if (prefs) setPush(prefs.push_enabled);
  }, [prefs]);

  if (loading) return <Loading />;

  if (!signedIn || !me) {
    return (
      <ScrollView contentContainerStyle={[column, s.gate]}>
        <Ionicons name="person-circle-outline" size={56} color={C.line} />
        <Text style={s.h1}>You are signed out</Text>
        <Muted style={{ textAlign: 'center' }}>
          Sign in to check eligibility, save opportunities and get reminders.
        </Muted>
        <Button label="Sign in" onPress={() => router.replace('/login')} style={s.gateButton} />
        <LanguageCard />
        <MascotIconCard />
      </ScrollView>
    );
  }

  const p = me.profile;
  const missing = [
    !p?.date_of_birth && 'date of birth',
    !p?.category && 'category',
    !p?.state_code && 'state',
    !education?.length && 'education',
  ].filter(Boolean) as string[];

  async function togglePush(next: boolean) {
    setPush(next);
    const res = await api.put('/notifications/preferences', { push_enabled: next });
    if (res.error) {
      setPush(!next);
      Alert.alert('Could not save', res.error);
      return;
    }
    if (next) await registerForPush();
  }

  function confirmLogout() {
    Alert.alert('Sign out?', 'You will stop getting reminders on this phone.', [
      { text: 'Stay signed in', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={[column, s.page, { paddingBottom: S.xxl + insets.bottom }]}>
      <Card style={[s.card, s.identity]}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.h2}>{name}</Text>
          {me.user.email ? <Muted>{me.user.email}</Muted> : null}
          {me.user.phone ? <Muted>{me.user.phone}</Muted> : null}
          <View style={s.verifyRow}>
            {me.user.email_verified ? <Badge label="Email verified" color={C.good} /> : null}
            {me.user.phone_verified ? <Badge label="Phone verified" color={C.good} /> : null}
          </View>
        </View>
      </Card>

      {missing.length ? (
        <Pressable onPress={() => WebBrowser.openBrowserAsync(`${SITE}/profile`)}>
          <Card style={[s.card, { borderColor: C.warn, backgroundColor: '#fff7ed' }]}>
            <SectionTitle>Finish your profile</SectionTitle>
            <Muted>
              Eligibility checks need your {missing.join(', ')}. Add them and every card gets a
              straight yes or no.
            </Muted>
          </Card>
        </Pressable>
      ) : null}

      <Card style={s.card}>
        <SectionTitle>Eligibility details</SectionTitle>
        <Row label="Date of birth" value={p?.date_of_birth ? formatDate(p.date_of_birth) : null} />
        <Row label="Gender" value={p?.gender?.replace(/_/g, ' ')} />
        <Row label="Category" value={p?.category} />
        <Row label="State" value={p?.state_code} />
        <Row label="District" value={p?.district} />
        <Row label="Domicile" value={p?.domicile_state_code} />
        <Row
          label="Family income"
          value={p?.annual_family_income ? `${rupees(p.annual_family_income)} a year` : null}
        />
        {p?.is_pwbd ? <Row label="PwBD" value={p.pwbd_type ?? 'Yes'} /> : null}
        {p?.is_ex_serviceman ? <Row label="Ex-serviceman" value="Yes" /> : null}
      </Card>

      {education?.length ? (
        <Card style={s.card}>
          <SectionTitle>Education</SectionTitle>
          {education.map((e) => (
            <View key={e.id} style={s.edu}>
              <Text style={s.eduTitle}>
                {e.degree || e.level.replace(/_/g, ' ')}
                {e.stream ? ` · ${e.stream}` : ''}
              </Text>
              <Muted>
                {[
                  e.institution_name || e.board_or_university,
                  e.year_of_passing,
                  e.score ? `${e.score} ${e.score_type ?? ''}`.trim() : null,
                  e.status === 'pursuing' ? 'pursuing' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Muted>
            </View>
          ))}
        </Card>
      ) : null}

      <LanguageCard />

      <Card style={s.card}>
        <SectionTitle>Alerts</SectionTitle>
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Push notifications</Text>
            <Muted>Reminders before a last date, plus results and admit cards.</Muted>
          </View>
          <Switch
            value={push ?? false}
            onValueChange={togglePush}
            trackColor={{ true: C.blue, false: C.line }}
            thumbColor={C.white}
          />
        </View>
        {prefs ? (
          <Muted style={{ marginTop: S.sm }}>
            Email alerts are {prefs.email_enabled ? 'on' : 'off'}
            {prefs.reminder_days_before.length
              ? ` · reminders ${prefs.reminder_days_before.join(', ')} days before`
              : ''}
            . Change the details on the website.
          </Muted>
        ) : null}
      </Card>

      <MascotIconCard />

      <Button
        label="Edit profile on applyfields.com"
        icon="open-outline"
        variant="secondary"
        onPress={() => WebBrowser.openBrowserAsync(`${SITE}/profile`)}
      />
      <Button label="Sign out" icon="log-out-outline" variant="danger" onPress={confirmLogout} />
    </ScrollView>
  );
}

/** Language switch. Content comes back in the chosen language via Accept-Language. */
function LanguageCard() {
  const { locale, setLocale } = useLocale();
  return (
    <Card style={[s.card, { alignSelf: 'stretch' }]}>
      <SectionTitle>Language</SectionTitle>
      <View style={s.langRow}>
        {LANGUAGES.map((l) => {
          const active = l.code === locale;
          return (
            <Pressable
              key={l.code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setLocale(l.code)}
              style={[s.lang, active && s.langActive]}
            >
              <Text style={[s.langText, active && s.langTextActive]}>{l.nativeName}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const ICON_LABEL: Record<MascotIcon, string> = {
  logo: 'ApplyFields logo',
  default: 'Mascot',
  sleeping: 'Sleeping',
  active: 'Active',
  notification: 'Alert',
  thinking: 'Thinking',
  achievement: 'Achievement',
};

/** Dynamic mascot app icon. Hidden where the native module isn't built in (Expo Go, web). */
function MascotIconCard() {
  const { autoEnabled, current } = useMascotSettings();
  if (!isMascotIconSupported()) return null;

  function toggle(next: boolean) {
    if (!next || Platform.OS !== 'ios') return setAutoEnabled(next);
    // Apple shows its own message on every icon change and offers no silent option: ask first.
    Alert.alert(
      'Change the icon automatically?',
      'Your iPhone shows a short "You have changed the icon" message each time. ApplyFields changes it at most once a day (sooner for a deadline or a new milestone), only while the app is open.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Turn on', onPress: () => setAutoEnabled(true) },
      ],
    );
  }

  async function restore() {
    if (!(await resetMascotIcon())) Alert.alert('Could not change the icon', 'Please try again in a moment.');
  }

  return (
    <Card style={[s.card, { alignSelf: 'stretch' }]}>
      <SectionTitle>App icon</SectionTitle>
      <View style={s.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.switchLabel}>Dynamic mascot icon</Text>
          <Muted>
            The mascot on your home screen reacts: a bell for a deadline, a star after you apply,
            asleep when you have been away.
          </Muted>
        </View>
        <Switch
          value={autoEnabled}
          onValueChange={toggle}
          trackColor={{ true: C.blue, false: C.line }}
          thumbColor={C.white}
        />
      </View>
      <Muted style={{ marginTop: S.sm }}>
        Current icon: {ICON_LABEL[current]}.{' '}
        {Platform.OS === 'ios'
          ? 'iPhone shows a system message whenever the icon changes.'
          : 'Changes appear after you leave the app; some launchers take a moment.'}
      </Muted>
      {current !== 'logo' ? (
        <Button
          label="Restore ApplyFields logo"
          icon="refresh-outline"
          variant="secondary"
          onPress={restore}
          style={{ marginTop: S.md }}
        />
      ) : null}
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={s.row}>
      <Text style={s.rowKey}>{label}</Text>
      <Text style={[s.rowValue, !value && { color: C.muted, fontWeight: '400' }]}>
        {value || 'Not added'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  page: { padding: S.lg, gap: S.md },
  gate: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.sm },
  gateButton: { alignSelf: 'stretch', marginTop: S.lg },
  card: { padding: S.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: S.lg },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: R.pill,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.white, fontSize: 22, fontWeight: '800' },
  h1: { color: C.navy, fontSize: 19, fontWeight: '800', marginTop: S.sm },
  h2: { color: C.navy, fontSize: 17, fontWeight: '800' },
  verifyRow: { flexDirection: 'row', gap: S.sm, marginTop: 6, flexWrap: 'wrap' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: S.md,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  rowKey: { color: C.muted, fontSize: 13, flex: 1 },
  rowValue: {
    color: C.navy,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '55%',
    textTransform: 'capitalize',
  },
  edu: {
    paddingVertical: S.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  eduTitle: { color: C.navy, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  switchLabel: { color: C.navy, fontSize: 14, fontWeight: '700' },
  langRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  lang: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  langActive: { backgroundColor: C.navy, borderColor: C.navy },
  langText: { color: C.navy, fontSize: 14, fontWeight: '700' },
  langTextActive: { color: C.white },
});
