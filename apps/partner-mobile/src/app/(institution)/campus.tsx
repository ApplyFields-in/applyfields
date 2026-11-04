/** Campus profile shown to students — PATCH /career/colleges/partner/desk. */
import type { InstitutionPartnerProfile, UpdateInstitutionProfileInput } from '@applyfields/types';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PartnerHeader } from '@/components/partner-header';
import { Button, Card, Empty, ErrorNote, Field, Loading, Page, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { PHONE_RE } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { S } from '@/theme';

const EMPTY = { name: '', short_name: '', website: '', contact_email: '', contact_phone: '', fees_text: '', description: '' };

export default function Campus() {
  const { data, loading, error: loadError, setData } = useApi<InstitutionPartnerProfile>('/career/colleges/partner/desk');
  const [f, setF] = useState(EMPTY);
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data || filled) return;
    setFilled(true);
    setF({
      name: data.name,
      short_name: data.short_name ?? '',
      website: data.website ?? '',
      contact_email: data.contact_email ?? '',
      contact_phone: data.contact_phone ?? '',
      fees_text: data.fees_text ?? '',
      description: data.description ?? '',
    });
  }, [data, filled]);

  const set = (key: keyof typeof EMPTY) => (value: string) => {
    setSaved(false);
    setF((p) => ({ ...p, [key]: value }));
  };

  async function save() {
    if (f.name.trim().length < 2) return setError('Enter the institution name.');
    if (f.website && !/^https?:\/\/\S+\.\S+/.test(f.website.trim())) return setError('Website must start with https://');
    if (f.contact_email && !/^\S+@\S+\.\S+$/.test(f.contact_email.trim())) return setError('The email address is not valid.');
    if (f.contact_phone && !PHONE_RE.test(f.contact_phone.replace(/\s+/g, ''))) return setError('Enter a valid 10-digit mobile number.');
    setBusy(true);
    setError(null);
    const body: UpdateInstitutionProfileInput = {
      name: f.name.trim(),
      short_name: f.short_name.trim(),
      website: f.website.trim(),
      contact_email: f.contact_email.trim(),
      contact_phone: f.contact_phone.replace(/\s+/g, ''),
      fees_text: f.fees_text.trim(),
      description: f.description.trim(),
    };
    const res = await api.patch<InstitutionPartnerProfile>('/career/colleges/partner/desk', body);
    setBusy(false);
    if (!res.data) return setError(res.error ?? 'Could not save.');
    setData(res.data);
    setSaved(true);
  }

  return (
    <View style={{ flex: 1 }}>
      <PartnerHeader />
      {loading && !data ? (
        <Loading />
      ) : !data ? (
        <Empty icon="link-outline" title="Desk not linked yet" body={loadError ?? undefined} />
      ) : (
        <Page bottomInset={false}>
          <Card style={st.card}>
            <SectionTitle>Shown on your college page</SectionTitle>
            <Field label="Institution name" value={f.name} onChangeText={set('name')} />
            <Field label="Short name" value={f.short_name} onChangeText={set('short_name')} placeholder="CBIT" />
            <Field label="Website" value={f.website} onChangeText={set('website')} autoCapitalize="none" keyboardType="url" />
            <Field label="Admissions email" value={f.contact_email} onChangeText={set('contact_email')} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Admissions phone" value={f.contact_phone} onChangeText={set('contact_phone')} keyboardType="phone-pad" />
            <Field label="Fees summary" value={f.fees_text} onChangeText={set('fees_text')} placeholder="₹1.2–1.6 L per year" />
            <Field label="About the campus" value={f.description} onChangeText={set('description')} multiline maxLength={2000} />
          </Card>
          <ErrorNote text={error} />
          <Button label={busy ? 'Saving…' : saved ? 'Saved' : 'Save profile'} icon={saved ? 'checkmark' : undefined} disabled={busy} onPress={save} />
        </Page>
      )}
    </View>
  );
}

const st = StyleSheet.create({ card: { padding: S.lg, gap: S.md } });
