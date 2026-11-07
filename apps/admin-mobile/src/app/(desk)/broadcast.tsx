/**
 * Urgent broadcast composer (admin only): POST /admin/notifications/broadcast.
 * The API sends an in-app notification to every recipient, plus push and email by each user's own
 * notification settings (it ignores `channels`, so we don't offer a channel picker). Sending asks for a
 * confirm AND the phone's Face ID / fingerprint: a broadcast to everyone can't be recalled.
 */
import type { AdminBroadcastInput, AdminBroadcastResult, BroadcastAudience } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chips, ErrorNote, Field, Muted, Page, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { C, S } from '@/theme';

type Kind = BroadcastAudience['kind'];
const AUDIENCES: { value: Kind; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'subscribers', label: 'Subscribers' },
  { value: 'savers', label: 'Saved a job' },
  { value: 'user', label: 'One user' },
];
// Same rule as the API's sitePath: a path on the website, never an outside link.
const SITE_PATH = /^\/(?!\/)[^\s\\]*$/;

export default function Broadcast() {
  const [kind, setKind] = useState<Kind>('all');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(AdminBroadcastResult & { title: string }) | null>(null);

  const who =
    kind === 'all'
      ? 'every active ApplyFields account'
      : kind === 'subscribers'
        ? 'every active subscriber'
        : kind === 'savers'
          ? `everyone who saved "${slug.trim()}"`
          : email.trim();

  function problem(): string | null {
    if (title.trim().length < 3) return 'Title needs at least 3 characters.';
    if (kind === 'savers' && !slug.trim()) return 'Enter the job or exam slug, e.g. ssc-cgl-2026.';
    if (kind === 'user' && !/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter the user’s email.';
    if (link.trim() && !SITE_PATH.test(link.trim())) return 'Link must be a path on the website, like /jobs/ssc-cgl-2026.';
    return null;
  }

  function confirm() {
    const p = problem();
    if (p) return setError(p);
    setError(null);
    Alert.alert(
      kind === 'all' ? 'Send to everyone?' : 'Send this broadcast?',
      `"${title.trim()}" goes to ${who}: in the app, and by push and email where they allow it. It can’t be recalled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', style: 'destructive', onPress: () => void send() },
      ],
    );
  }

  async function send() {
    const auth = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm the broadcast' });
    if (!auth.success) return setError('Not sent: the broadcast needs your Face ID, fingerprint or PIN.');

    const audience: BroadcastAudience =
      kind === 'savers'
        ? { kind, opportunity_slug: slug.trim() }
        : kind === 'user'
          ? { kind, email: email.trim().toLowerCase() }
          : { kind };
    const input: AdminBroadcastInput = {
      title: title.trim(),
      body: body.trim() || null,
      link: link.trim() || null,
      audience,
    };
    setBusy(true);
    const res = await api.post<AdminBroadcastResult>('/admin/notifications/broadcast', input);
    setBusy(false);
    if (!res.data) return setError(res.error);
    setResult({ ...res.data, title: input.title });
    setTitle('');
    setBody('');
    setLink('');
  }

  return (
    <Page>
      {result ? (
        <Card style={s.result}>
          <View style={s.resultHead}>
            <Ionicons name="checkmark-circle" size={20} color={C.good} />
            <Text style={s.resultTitle}>Sent: {result.title}</Text>
          </View>
          <Muted>
            {result.notified.toLocaleString('en-IN')} in-app · {result.push_sent.toLocaleString('en-IN')} push devices ·{' '}
            {result.email_queued.toLocaleString('en-IN')} emails queued
          </Muted>
        </Card>
      ) : null}

      <SectionTitle>Who gets it</SectionTitle>
      <Chips options={AUDIENCES} value={kind} onChange={setKind} />
      {kind === 'savers' ? (
        <Field label="Job or exam slug" value={slug} onChangeText={setSlug} placeholder="ssc-cgl-2026" autoCapitalize="none" autoCorrect={false} />
      ) : null}
      {kind === 'user' ? (
        <Field
          label="User’s email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
      ) : null}

      <SectionTitle>Message</SectionTitle>
      <Field label={`Title (${title.length}/150)`} value={title} onChangeText={setTitle} maxLength={150} placeholder="Admit cards are out" />
      <Field
        label={`Details (${body.length}/1000)`}
        value={body}
        onChangeText={setBody}
        maxLength={1000}
        multiline
        placeholder="What changed and what to do now"
      />
      <Field
        label="Opens (optional)"
        value={link}
        onChangeText={setLink}
        placeholder="/jobs/ssc-cgl-2026"
        autoCapitalize="none"
        autoCorrect={false}
        hint="A page on applyfields.com. Leave empty for no link."
      />

      <SectionTitle>Preview</SectionTitle>
      <Card style={s.preview}>
        <View style={s.previewHead}>
          <Ionicons name="notifications" size={14} color={C.blue} />
          <Text style={s.previewApp}>ApplyFields · now</Text>
        </View>
        <Text style={s.previewTitle}>{title.trim() || 'Your title'}</Text>
        {body.trim() ? <Text style={s.previewBody} numberOfLines={3}>{body.trim()}</Text> : null}
      </Card>

      <ErrorNote text={error} />
      <Button
        label={busy ? 'Sending…' : kind === 'all' ? 'Send to everyone' : 'Send broadcast'}
        icon="megaphone"
        variant={kind === 'all' ? 'danger' : 'primary'}
        disabled={busy}
        onPress={confirm}
      />
      <Muted style={{ textAlign: 'center' }}>Every broadcast is recorded in the audit log with your name.</Muted>
    </Page>
  );
}

const s = StyleSheet.create({
  result: { padding: S.md, gap: 4, borderColor: `${C.good}55` },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  resultTitle: { flex: 1, color: C.navy, fontSize: 15, fontWeight: '700' },
  preview: { padding: S.md, gap: 4 },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewApp: { color: C.muted, fontSize: 12, fontWeight: '600' },
  previewTitle: { color: C.navy, fontSize: 15, fontWeight: '700' },
  previewBody: { color: C.navy, fontSize: 14 },
});
