/**
 * Join the partner network — the web's /onboard (centres) and
 * /institution/onboard (colleges) as one form. POST /partners/register creates
 * the partner with verification_status = 'pending'; the session then moves the
 * partner to Under review.
 */
import type {
  InstitutionListResponse,
  InstitutionSummary,
  PartnerDetail,
  PartnerRegistrationInput,
  PartnerType,
} from '@applyfields/types';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chips, ErrorNote, Field, Muted, Page, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { CENTRE_TYPES, PHONE_RE, PIN_RE } from '@/lib/format';
import { ACCREDITATIONS } from '@/lib/presets';
import { useSession } from '@/lib/session';
import { C, R, S } from '@/theme';

type Persona = 'centre' | 'institution';

const blank = {
  business_name: '',
  owner_name: '',
  designation: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  district: '',
  state_code: 'TS',
  pincode: '',
  description: '',
};

function plus91(phone: string): string {
  const digits = phone.replace(/\s+/g, '');
  return digits.startsWith('+91') ? digits : `+91${digits}`;
}

export default function Onboard() {
  const { me, setPartner, logout } = useSession();
  const [persona, setPersona] = useState<Persona>('centre');
  const [type, setType] = useState<PartnerType>('meeseva');
  const [f, setF] = useState({ ...blank, email: me?.user.email ?? '', phone: me?.user.phone ?? '' });
  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof blank) => (value: string) => setF((p) => ({ ...p, [key]: value }));
  const isCentre = persona === 'centre';

  // College directory search (website: institution/onboard). Picking one fills the address.
  const [collegeQuery, setCollegeQuery] = useState('');
  const [colleges, setColleges] = useState<InstitutionSummary[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [accreditation, setAccreditation] = useState<(typeof ACCREDITATIONS)[number]['value']>('naac');
  useEffect(() => {
    const q = collegeQuery.trim();
    if (isCentre || q.length < 3 || q === picked) {
      setColleges([]);
      return;
    }
    let live = true;
    const t = setTimeout(async () => {
      const res = await api.get<InstitutionListResponse>(`/career/colleges?q=${encodeURIComponent(q)}&limit=8`);
      if (live) setColleges(res.data?.items ?? []);
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [collegeQuery, isCentre, picked]);

  function pickCollege(c: InstitutionSummary) {
    setPicked(c.name);
    setCollegeQuery(c.name);
    setColleges([]);
    setF((p) => ({
      ...p,
      business_name: c.name,
      address: c.address ?? p.address,
      city: c.city ?? p.city,
      district: c.district ?? p.district,
      state_code: c.state_code ?? p.state_code,
    }));
  }

  async function locate() {
    setLocating(true);
    setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Location permission was denied. You can still type your address.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      // Prefill the address fields from the fix; the partner can correct them.
      const [place] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
      if (place) {
        setF((p) => ({
          ...p,
          address: p.address || [place.name, place.street].filter(Boolean).join(', '),
          city: p.city || place.city || place.subregion || '',
          district: p.district || place.subregion || place.district || '',
          pincode: p.pincode || place.postalCode || '',
        }));
      }
    } catch {
      setError('Could not get your location. Move near a window or type the address.');
    } finally {
      setLocating(false);
    }
  }

  function validate(): string | null {
    if (f.business_name.trim().length < 2) return isCentre ? 'Enter your centre name.' : 'Enter the college name.';
    if (f.owner_name.trim().length < 2) return isCentre ? 'Enter the owner name.' : 'Enter the officer name.';
    if (!PHONE_RE.test(f.phone.replace(/\s+/g, ''))) return 'Enter a valid 10-digit Indian mobile number.';
    if (f.whatsapp && !PHONE_RE.test(f.whatsapp.replace(/\s+/g, ''))) return 'The WhatsApp number is not valid.';
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'The email address is not valid.';
    if (f.address.trim().length < 3) return 'Enter the full address.';
    if (f.city.trim().length < 2 || f.district.trim().length < 2) return 'Enter the city and district.';
    if (!/^[A-Za-z]{2}$/.test(f.state_code.trim())) return 'State code is two letters, like TS or AP.';
    if (!PIN_RE.test(f.pincode.trim())) return 'Enter the 6-digit PIN code.';
    return null;
  }

  async function submit() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const body: PartnerRegistrationInput = {
      business_name: f.business_name.trim(),
      type: isCentre ? type : 'college',
      owner_name: isCentre || !f.designation.trim()
        ? f.owner_name.trim()
        : `${f.owner_name.trim()} (${f.designation.trim()})`,
      phone: plus91(f.phone),
      whatsapp: f.whatsapp.trim() ? plus91(f.whatsapp) : undefined,
      email: f.email.trim() || undefined,
      address: f.address.trim(),
      city: f.city.trim(),
      district: f.district.trim(),
      state_code: f.state_code.trim().toUpperCase(),
      pincode: f.pincode.trim(),
      // Same shape the website writes, so staff see the accreditation while verifying.
      description: isCentre
        ? f.description.trim() || undefined
        : [`Accreditation: ${accreditation.toUpperCase()}.`, f.description.trim()].filter(Boolean).join(' '),
      ...(isCentre && gps ? gps : {}),
    };
    const res = await api.post<PartnerDetail>('/partners/register', body);
    setBusy(false);
    if (res.error || !res.data) setError(res.error ?? 'Registration failed. Try again.');
    else setPartner(res.data); // status → pending → Under review
  }

  return (
    <Page>
      <View style={st.switch} accessibilityRole="tablist">
        {(['centre', 'institution'] as const).map((p) => (
          <Pressable
            key={p}
            accessibilityRole="tab"
            accessibilityState={{ selected: persona === p }}
            onPress={() => setPersona(p)}
            style={[st.tab, persona === p && st.tabActive]}
          >
            <Text style={[st.tabText, persona === p && st.tabTextActive]}>
              {p === 'centre' ? 'Service centre' : 'College / University'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Muted>
        {isCentre
          ? 'Citizens near you will find your centre on ApplyFields, book a slot and arrive with their forms filled.'
          : 'Verified admissions desks answer student enquiries sent from the college page on ApplyFields.'}
      </Muted>

      {isCentre ? (
        <Card style={st.card}>
          <SectionTitle>Centre type</SectionTitle>
          <View style={{ marginHorizontal: -S.lg }}>
            <Chips options={CENTRE_TYPES} value={type} onChange={setType} />
          </View>
        </Card>
      ) : (
        <Card style={st.card}>
          <SectionTitle>Find your college</SectionTitle>
          <Field
            label="Search the ApplyFields college list"
            value={collegeQuery}
            onChangeText={(t) => {
              setCollegeQuery(t);
              setPicked(null);
            }}
            placeholder="Type 3+ letters, e.g. Osmania"
            hint="Not listed? Just type the full name below."
          />
          {colleges.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              onPress={() => pickCollege(c)}
              style={({ pressed }) => [st.result, pressed && { opacity: 0.7 }]}
            >
              <Text style={st.resultName}>{c.name}</Text>
              <Muted style={{ fontSize: 12 }}>{[c.city, c.state_code].filter(Boolean).join(', ')}</Muted>
            </Pressable>
          ))}
          <Muted>Accreditation</Muted>
          <View style={{ marginHorizontal: -S.lg }}>
            <Chips options={[...ACCREDITATIONS]} value={accreditation} onChange={setAccreditation} />
          </View>
        </Card>
      )}

      <Card style={st.card}>
        <SectionTitle>{isCentre ? 'Business' : 'Institution & officer'}</SectionTitle>
        <Field
          label={isCentre ? 'Centre / shop name' : 'College or university name'}
          value={f.business_name}
          onChangeText={set('business_name')}
          placeholder={isCentre ? 'Sri Balaji MeeSeva Centre' : 'Your institution'}
        />
        <Field
          label={isCentre ? 'Owner full name' : 'Admissions officer name'}
          value={f.owner_name}
          onChangeText={set('owner_name')}
        />
        {!isCentre ? (
          <Field
            label="Designation"
            value={f.designation}
            onChangeText={set('designation')}
            placeholder="Admissions Officer"
          />
        ) : null}
        <Field
          label="Mobile number"
          value={f.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
          placeholder="98765 43210"
        />
        <Field
          label="WhatsApp number (optional)"
          value={f.whatsapp}
          onChangeText={set('whatsapp')}
          keyboardType="phone-pad"
        />
        <Field
          label={isCentre ? 'Email (optional)' : 'Official email'}
          value={f.email}
          onChangeText={set('email')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Card>

      <Card style={st.card}>
        <SectionTitle>{isCentre ? 'Location' : 'Campus address'}</SectionTitle>
        {isCentre ? (
          <>
            <Button
              label={locating ? 'Finding you…' : gps ? 'Location pinned · update' : 'Use my current location'}
              icon="locate-outline"
              variant="secondary"
              disabled={locating}
              onPress={locate}
            />
            {gps ? (
              <Muted>
                Pinned at {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}. Citizens see their
                distance to you.
              </Muted>
            ) : null}
          </>
        ) : null}
        <Field label="Address" value={f.address} onChangeText={set('address')} multiline />
        <Field label="City / mandal" value={f.city} onChangeText={set('city')} />
        <Field label="District" value={f.district} onChangeText={set('district')} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="State code"
              value={f.state_code}
              onChangeText={set('state_code')}
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="PIN code"
              value={f.pincode}
              onChangeText={set('pincode')}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>
        <Field
          label="About (optional)"
          value={f.description}
          onChangeText={set('description')}
          multiline
          placeholder={isCentre ? 'Services you offer, languages spoken…' : 'Accreditation, flagship programs…'}
        />
      </Card>

      <ErrorNote text={error} />
      <Button label={busy ? 'Submitting…' : 'Submit for verification'} disabled={busy} onPress={submit} />
      <Muted style={{ textAlign: 'center' }}>
        The ApplyFields team checks every partner before it goes live on ApplyFields.
      </Muted>
      <Button label="Sign out" variant="secondary" onPress={() => void logout()} />
    </Page>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.md },
  row: { flexDirection: 'row', gap: S.md },
  result: { paddingVertical: S.sm, paddingHorizontal: S.md, borderRadius: R.md, backgroundColor: C.canvas, minHeight: 44, justifyContent: 'center' },
  resultName: { color: C.navy, fontSize: 14, fontWeight: '700' },
  switch: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: R.md, backgroundColor: C.ice },
  tab: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: S.xs },
  tabActive: { backgroundColor: C.white },
  tabText: { color: C.muted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: C.navy, fontWeight: '800' },
});
