/** Edit the centre's public details and GPS pin. PATCH /partners/me. */
import type { PartnerDetail, PartnerUpdateInput } from '@applyfields/types';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, ErrorNote, Field, Muted, Page, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { PHONE_RE, PIN_RE } from '@/lib/format';
import { useSession } from '@/lib/session';
import { S } from '@/theme';

export default function CentreProfile() {
  const router = useRouter();
  const { partner, setPartner } = useSession();
  const [f, setF] = useState({
    business_name: partner?.business_name ?? '',
    description: partner?.description ?? '',
    owner_name: partner?.owner_name ?? '',
    phone: partner?.phone ?? '',
    whatsapp: partner?.whatsapp ?? '',
    address: partner?.address ?? '',
    city: partner?.city ?? '',
    district: partner?.district ?? '',
    state_code: partner?.state_code ?? '',
    pincode: partner?.pincode ?? '',
  });
  const [gps, setGps] = useState(
    partner?.latitude != null && partner.longitude != null
      ? { latitude: partner.latitude, longitude: partner.longitude }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const set = (key: keyof typeof f) => (value: string) => setF((p) => ({ ...p, [key]: value }));

  async function locate() {
    setLocating(true);
    setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) setError('Location permission was denied.');
      else {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      }
    } catch {
      setError('Could not get your location. Try again near a window.');
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    const phone = f.phone.replace(/\s+/g, '');
    if (f.business_name.trim().length < 2) return setError('Enter the centre name.');
    if (!PHONE_RE.test(phone)) return setError('Enter a valid 10-digit Indian mobile number.');
    if (f.pincode && !PIN_RE.test(f.pincode.trim())) return setError('Enter the 6-digit PIN code.');
    if (f.state_code && !/^[A-Za-z]{2}$/.test(f.state_code.trim())) return setError('State code is two letters.');
    if (f.address.trim().length < 3) return setError('Enter the full address.');

    // Blank optional fields are left out rather than sent as "" (the API rejects short strings).
    const body: PartnerUpdateInput = {
      business_name: f.business_name.trim(),
      owner_name: f.owner_name.trim() || undefined,
      description: f.description.trim() || undefined,
      phone,
      whatsapp: f.whatsapp.trim() || undefined,
      address: f.address.trim(),
      city: f.city.trim() || undefined,
      district: f.district.trim() || undefined,
      state_code: f.state_code.trim().toUpperCase() || undefined,
      pincode: f.pincode.trim() || undefined,
      ...(gps ?? {}),
    };
    setBusy(true);
    setError(null);
    const res = await api.patch<PartnerDetail>('/partners/me', body);
    setBusy(false);
    if (!res.data) return setError(res.error ?? 'Could not save.');
    setPartner(res.data);
    router.back();
  }

  return (
    <Page>
      <Card style={st.card}>
        <SectionTitle>Business</SectionTitle>
        <Field label="Centre name" value={f.business_name} onChangeText={set('business_name')} />
        <Field label="Owner name" value={f.owner_name} onChangeText={set('owner_name')} />
        <Field label="Mobile number" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="WhatsApp" value={f.whatsapp} onChangeText={set('whatsapp')} keyboardType="phone-pad" />
        <Field label="About" value={f.description} onChangeText={set('description')} multiline />
      </Card>
      <Card style={st.card}>
        <SectionTitle>Location</SectionTitle>
        <Button
          label={locating ? 'Finding you…' : 'Re-pin at my current location'}
          icon="locate-outline"
          variant="secondary"
          disabled={locating}
          onPress={locate}
        />
        <Muted>
          {gps ? `Pinned at ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}` : 'Not pinned yet — citizens cannot see your distance.'}
        </Muted>
        <Field label="Address" value={f.address} onChangeText={set('address')} multiline />
        <Field label="City / mandal" value={f.city} onChangeText={set('city')} />
        <Field label="District" value={f.district} onChangeText={set('district')} />
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Field label="State code" value={f.state_code} onChangeText={set('state_code')} autoCapitalize="characters" maxLength={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="PIN code" value={f.pincode} onChangeText={set('pincode')} keyboardType="number-pad" maxLength={6} />
          </View>
        </View>
      </Card>
      <ErrorNote text={error} />
      <Button label={busy ? 'Saving…' : 'Save details'} disabled={busy} onPress={save} />
    </Page>
  );
}

const st = StyleSheet.create({
  card: { padding: S.lg, gap: S.md },
  row: { flexDirection: 'row', gap: S.md },
});
