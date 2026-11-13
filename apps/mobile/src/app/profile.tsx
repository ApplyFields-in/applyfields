/**
 * Profile — who you are, what the eligibility engine knows, and the switches
 * for push alerts. In-app editing for personal details, address and education
 * backed by PUT /me/profile and POST /me/education.
 */
import type {
  EducationLevel,
  EducationStatus,
  NotificationPreferences,
  SocialCategory,
  UserEducation,
  UserGender,
} from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Loading, Muted, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, rupees } from '@/lib/format';
import { LANGUAGES, useLocale } from '@/lib/locale';
import { registerForPush } from '@/lib/push';
import { useApi } from '@/lib/use-api';
import {
  isMascotIconSupported,
  resetMascotIcon,
  setAutoEnabled,
  useMascotSettings,
} from '@/services/mascot/IconManager';
import type { MascotIcon } from '@/services/mascot/MascotEventTypes';
import { C, R, S, TAP, column } from '@/theme';

const SITE = 'https://applyfields.com';

export default function Profile() {
  const router = useRouter();
  const { me, name, signedIn, loading, logout, reload } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: education, refresh: refreshEducation } = useApi<UserEducation[]>(
    signedIn ? '/me/education' : null,
  );
  const { data: prefs } = useApi<NotificationPreferences>(
    signedIn ? '/notifications/preferences' : null,
  );

  const [push, setPush] = useState<boolean | null>(null);
  useEffect(() => {
    if (prefs) setPush(prefs.push_enabled);
  }, [prefs]);

  // Modal states for in-app profile editing
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);

  // Form states - Personal
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [familyIncome, setFamilyIncome] = useState('');

  // Form states - Address
  const [stateCode, setStateCode] = useState('');
  const [district, setDistrict] = useState('');
  const [domicileCode, setDomicileCode] = useState('');

  // Form states - Education
  const [eduLevel, setEduLevel] = useState<EducationLevel>('graduate');
  const [eduDegree, setEduDegree] = useState('');
  const [eduStream, setEduStream] = useState('');
  const [eduInst, setEduInst] = useState('');
  const [eduYear, setEduYear] = useState('');
  const [eduScore, setEduScore] = useState('');
  const [eduStatus, setEduStatus] = useState<EducationStatus>('completed');

  const [saving, setSaving] = useState(false);

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

  // Open Personal Modal with existing values
  const openPersonalEdit = () => {
    setFullName(p?.full_name || '');
    setDob(p?.date_of_birth || '');
    setGender(p?.gender || 'male');
    setCategory(p?.category || 'general');
    setFamilyIncome(p?.annual_family_income ? p.annual_family_income.toString() : '');
    setShowPersonalModal(true);
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    const res = await api.put('/me/profile', {
      full_name: fullName.trim() || undefined,
      date_of_birth: dob.trim() || undefined,
      gender: (gender as UserGender) || undefined,
      category: (category as SocialCategory) || undefined,
      annual_family_income: familyIncome ? parseInt(familyIncome, 10) : undefined,
    });
    setSaving(false);

    if (res.error) {
      Alert.alert('Update failed', res.error);
    } else {
      await reload();
      setShowPersonalModal(false);
      Alert.alert('Success', 'Personal details updated successfully.');
    }
  };

  // Open Address Modal with existing values
  const openAddressEdit = () => {
    setStateCode(p?.state_code || '');
    setDistrict(p?.district || '');
    setDomicileCode(p?.domicile_state_code || '');
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    const res = await api.put('/me/profile', {
      state_code: stateCode.trim().toUpperCase() || undefined,
      district: district.trim() || undefined,
      domicile_state_code: domicileCode.trim().toUpperCase() || undefined,
    });
    setSaving(false);

    if (res.error) {
      Alert.alert('Update failed', res.error);
    } else {
      await reload();
      setShowAddressModal(false);
      Alert.alert('Success', 'Address and domicile details updated.');
    }
  };

  // Open Education Modal
  const openAddEducation = () => {
    setEduLevel('graduate');
    setEduDegree('');
    setEduStream('');
    setEduInst('');
    setEduYear(new Date().getFullYear().toString());
    setEduScore('');
    setEduStatus('completed');
    setShowEducationModal(true);
  };

  const handleSaveEducation = async () => {
    if (!eduInst.trim()) {
      Alert.alert('Required', 'Please enter your institution or college name.');
      return;
    }

    setSaving(true);
    const res = await api.post('/me/education', {
      level: eduLevel,
      degree: eduDegree.trim() || undefined,
      stream: eduStream.trim() || undefined,
      institution_name: eduInst.trim(),
      year_of_passing: eduYear ? parseInt(eduYear, 10) : undefined,
      score: eduScore ? parseFloat(eduScore) : undefined,
      status: eduStatus,
    });
    setSaving(false);

    if (res.error) {
      Alert.alert('Error', res.error);
    } else {
      await refreshEducation();
      await reload();
      setShowEducationModal(false);
      Alert.alert('Success', 'Educational qualification added.');
    }
  };

  const handleDeleteEducation = (id: string, label: string) => {
    Alert.alert('Remove Qualification', `Are you sure you want to delete ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await api.del(`/me/education/${id}`);
          if (res.error) {
            Alert.alert('Error', res.error);
          } else {
            await refreshEducation();
            await reload();
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[column, s.page, { paddingBottom: S.xxl + insets.bottom }]}>
      {/* Identity Card */}
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

      {/* Incomplete Nudge - Now opens in-app editor directly */}
      {missing.length ? (
        <Pressable onPress={openPersonalEdit}>
          <Card style={[s.card, { borderColor: '#BFDBFE', backgroundColor: C.ice }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <SectionTitle>Finish your profile</SectionTitle>
              <Ionicons name="create-outline" size={18} color={C.blue} />
            </View>
            <Muted style={{ marginTop: 2 }}>
              Eligibility checks need your {missing.join(', ')}. Tap here to update directly on your phone.
            </Muted>
          </Card>
        </Pressable>
      ) : null}

      {/* Personal & Eligibility Details Card */}
      <Card style={s.card}>
        <View style={s.cardHeaderRow}>
          <SectionTitle>Eligibility details</SectionTitle>
          <Pressable onPress={openPersonalEdit} hitSlop={10} style={s.editActionBtn}>
            <Ionicons name="create-outline" size={15} color={C.blue} />
            <Text style={s.editActionText}>Edit</Text>
          </Pressable>
        </View>
        <Row label="Date of birth" value={p?.date_of_birth ? formatDate(p.date_of_birth) : null} />
        <Row label="Gender" value={p?.gender?.replace(/_/g, ' ')} />
        <Row label="Category" value={p?.category} />
        <Row
          label="Family income"
          value={p?.annual_family_income ? `${rupees(p.annual_family_income)} a year` : null}
        />
        {p?.is_pwbd ? <Row label="PwBD" value={p.pwbd_type ?? 'Yes'} /> : null}
        {p?.is_ex_serviceman ? <Row label="Ex-serviceman" value="Yes" /> : null}
      </Card>

      {/* Address & Domicile Card */}
      <Card style={s.card}>
        <View style={s.cardHeaderRow}>
          <SectionTitle>Address & Domicile</SectionTitle>
          <Pressable onPress={openAddressEdit} hitSlop={10} style={s.editActionBtn}>
            <Ionicons name="create-outline" size={15} color={C.blue} />
            <Text style={s.editActionText}>Edit</Text>
          </Pressable>
        </View>
        <Row label="State of residence" value={p?.state_code} />
        <Row label="District" value={p?.district} />
        <Row label="State of Domicile" value={p?.domicile_state_code} />
      </Card>

      {/* Education Card with Add and Delete */}
      <Card style={s.card}>
        <View style={s.cardHeaderRow}>
          <SectionTitle>Education</SectionTitle>
          <Pressable onPress={openAddEducation} hitSlop={10} style={s.editActionBtn}>
            <Ionicons name="add-circle-outline" size={16} color={C.blue} />
            <Text style={s.editActionText}>Add</Text>
          </Pressable>
        </View>

        {education?.length ? (
          education.map((e) => (
            <View key={e.id} style={s.edu}>
              <View style={{ flex: 1 }}>
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
              <Pressable
                onPress={() => handleDeleteEducation(e.id, e.degree || e.level)}
                hitSlop={12}
                style={{ padding: 4 }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>
          ))
        ) : (
          <Muted style={{ paddingVertical: S.sm }}>
            No qualifications added yet. Tap Add to record your degree or school certificate.
          </Muted>
        )}
      </Card>

      <LanguageCard />

      {/* Alerts Card */}
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
            .
          </Muted>
        ) : null}
      </Card>

      <MascotIconCard />

      <Button
        label="View full web profile"
        icon="open-outline"
        variant="secondary"
        onPress={() => WebBrowser.openBrowserAsync(`${SITE}/profile`)}
      />
      <Button label="Sign out" icon="log-out-outline" variant="danger" onPress={confirmLogout} />

      {/* MODAL 1: Edit Personal Details */}
      <Modal visible={showPersonalModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Personal Details</Text>
              <Pressable onPress={() => setShowPersonalModal(false)}>
                <Ionicons name="close" size={22} color={C.navy} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={s.modalBody}>
              <Text style={s.fieldLabel}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name as per records"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                value={dob}
                onChangeText={setDob}
                placeholder="2002-05-15"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Gender (male / female / other)</Text>
              <TextInput
                value={gender}
                onChangeText={(v) => setGender(v.toLowerCase())}
                placeholder="male / female / other"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Social Category (general / obc_ncl / sc / st / ews)</Text>
              <TextInput
                value={category}
                onChangeText={(v) => setCategory(v.toLowerCase())}
                placeholder="general / obc_ncl / sc / st / ews"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Annual Family Income (INR)</Text>
              <TextInput
                value={familyIncome}
                onChangeText={setFamilyIncome}
                placeholder="e.g. 350000"
                keyboardType="numeric"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <View style={s.modalActionRow}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowPersonalModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  label={saving ? 'Saving…' : 'Save'}
                  onPress={handleSavePersonal}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Edit Address & Domicile */}
      <Modal visible={showAddressModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Address & Domicile</Text>
              <Pressable onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={22} color={C.navy} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={s.modalBody}>
              <Text style={s.fieldLabel}>State Code (e.g. KA, MH, DL, TS, AP)</Text>
              <TextInput
                value={stateCode}
                onChangeText={setStateCode}
                placeholder="KA"
                maxLength={2}
                autoCapitalize="characters"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>District</Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                placeholder="e.g. Bengaluru, Pune, Hyderabad"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Domicile State Code (for Native Reservation)</Text>
              <TextInput
                value={domicileCode}
                onChangeText={setDomicileCode}
                placeholder="KA"
                maxLength={2}
                autoCapitalize="characters"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <View style={s.modalActionRow}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowAddressModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  label={saving ? 'Saving…' : 'Save'}
                  onPress={handleSaveAddress}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Add Education */}
      <Modal visible={showEducationModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Educational Qualification</Text>
              <Pressable onPress={() => setShowEducationModal(false)}>
                <Ionicons name="close" size={22} color={C.navy} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={s.modalBody}>
              <Text style={s.fieldLabel}>Level (10th / 12th / diploma / graduate / post_graduate)</Text>
              <TextInput
                value={eduLevel}
                onChangeText={(v) => setEduLevel(v.toLowerCase() as EducationLevel)}
                placeholder="graduate"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Degree / Qualification Title</Text>
              <TextInput
                value={eduDegree}
                onChangeText={setEduDegree}
                placeholder="e.g. B.Tech / B.Com / Higher Secondary"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Stream / Major Branch</Text>
              <TextInput
                value={eduStream}
                onChangeText={setEduStream}
                placeholder="e.g. Computer Science / Commerce"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>College or Institution Name *</Text>
              <TextInput
                value={eduInst}
                onChangeText={setEduInst}
                placeholder="e.g. Bangalore University / NITK"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Year of Passing</Text>
              <TextInput
                value={eduYear}
                onChangeText={setEduYear}
                placeholder="2025"
                keyboardType="numeric"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <Text style={s.fieldLabel}>Score / CGPA / %</Text>
              <TextInput
                value={eduScore}
                onChangeText={setEduScore}
                placeholder="e.g. 82.5 or 8.4"
                keyboardType="numeric"
                placeholderTextColor={C.muted}
                style={s.input}
              />

              <View style={s.modalActionRow}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowEducationModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  label={saving ? 'Saving…' : 'Add to Profile'}
                  onPress={handleSaveEducation}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.xs,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: R.sm,
    backgroundColor: C.ice,
  },
  editActionText: { color: C.blue, fontSize: 12, fontWeight: '700' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: S.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
    gap: S.md,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 32, 70, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: S.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  modalTitle: { color: C.navy, fontSize: 16, fontWeight: '800' },
  modalBody: { paddingVertical: S.md, gap: S.sm },
  fieldLabel: { color: C.navy, fontSize: 12, fontWeight: '700', marginTop: S.xs },
  input: {
    minHeight: TAP,
    backgroundColor: C.canvas,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: S.md,
    fontSize: 14,
    color: C.navy,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: S.md,
    marginTop: S.lg,
    paddingBottom: S.md,
  },
});
