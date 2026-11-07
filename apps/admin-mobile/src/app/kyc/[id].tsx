/**
 * Full-screen Partner KYC inspector.
 * - Swipe through the documents this partner type must send (latest upload of each kind).
 * - Tap a photo → full-screen zoom viewer; PDFs open in the in-app browser (signed links last 10 min,
 *   the screen re-fetches on focus).
 * - One tap per document: Verify / Reject (PATCH /admin/partners/documents/:id/verify).
 * - Approve & list is enabled only when every required document is verified; rejecting the partner
 *   needs a note, because the partner sees it (PATCH /admin/partners/:id/verify).
 */
import type { PartnerDetail, PartnerDocumentSummary, PartnerVerificationStatus } from '@applyfields/types';
import { CENTRE_KYC_DOCUMENTS, COLLEGE_KYC_DOCUMENTS } from '@applyfields/types/src/partner-documents';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Empty, ErrorNote, Loading, Muted } from '@/components/ui';
import { ZoomViewer } from '@/components/zoom-viewer';
import { api } from '@/lib/api';
import { STATUS_COLOR, shortDate, typeLabel } from '@/lib/format';
import { isInstitutionType, kycRows, type KycRow, type KycRowState } from '@/lib/staff';
import { useApi } from '@/lib/use-api';
import { C, R, S, TAP } from '@/theme';

const ROW_COLOR: Record<KycRowState, string> = { ...STATUS_COLOR, missing: C.muted };
const ROW_LABEL: Record<KycRowState, string> = {
  missing: 'Not uploaded',
  pending: 'To check',
  verified: 'Verified',
  rejected: 'Rejected',
};

export default function KycInspector() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: p, error, loading, setData } = useApi<PartnerDetail>(`/admin/partners/${id}`);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState<{ uri: string; title: string } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pager = useRef<FlatList<KycRow<PartnerDocumentSummary>>>(null);
  // Dots and "verify → next" move the pager; a swipe sets page from the scroll position instead.
  useEffect(() => {
    pager.current?.scrollToOffset({ offset: page * width, animated: true });
  }, [page, width]);

  if (loading && !p) return <Loading label="Opening KYC file…" />;
  if (!p) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <Empty icon="alert-circle-outline" title="Couldn't open this partner" body={error ?? undefined} />
        <Button label="Back" variant="secondary" onPress={() => router.back()} style={{ margin: S.xl }} />
      </View>
    );
  }

  const specs = isInstitutionType(p.type) ? COLLEGE_KYC_DOCUMENTS : CENTRE_KYC_DOCUMENTS;
  const { rows, blocking, ready } = kycRows(specs, p.documents ?? []);
  const current = rows[page];

  async function verifyDoc(doc: PartnerDocumentSummary, status: 'verified' | 'rejected') {
    setBusy(`${doc.id}:${status}`);
    setActionError(null);
    const res = await api.patch<PartnerDocumentSummary>(`/admin/partners/documents/${doc.id}/verify`, {
      status,
      reviewer_note: note.trim() || undefined,
    });
    setBusy(null);
    if (!res.data) return setActionError(res.error);
    const updated = res.data;
    // Keep the signed url we already have; the PATCH response doesn't carry one.
    setData((prev) =>
      prev && {
        ...prev,
        documents: (prev.documents ?? []).map((d) => (d.id === updated.id ? { ...d, ...updated, url: d.url } : d)),
      },
    );
    // Verified → straight on to the next document still to check.
    if (status === 'verified' && page < rows.length - 1) setPage(page + 1);
  }

  async function decide(verification_status: PartnerVerificationStatus) {
    if (verification_status === 'rejected' && !note.trim()) {
      return setActionError('Write a note first: the partner sees why they were rejected.');
    }
    setBusy(verification_status);
    setActionError(null);
    const res = await api.patch<PartnerDetail>(`/admin/partners/${p!.id}/verify`, {
      verification_status,
      is_listed: verification_status === 'verified',
      reviewer_note: note.trim() || undefined,
    });
    setBusy(null);
    if (!res.data) return setActionError(res.error);
    router.back();
  }

  const isPdf = (d: PartnerDocumentSummary) => /\.pdf$/i.test(d.storage_path);

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top bar */}
      <View style={[s.top, { paddingTop: insets.top + S.sm }]}>
        <Pressable accessibilityLabel="Close" onPress={() => router.back()} hitSlop={8} style={s.iconBtn}>
          <Ionicons name="close" size={24} color={C.navy} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>
            {p.business_name}
          </Text>
          <Muted numberOfLines={1}>
            {typeLabel(p.type)} · {[p.city, p.district, p.state_code].filter(Boolean).join(', ')}
          </Muted>
        </View>
        <Badge label={typeLabel(p.verification_status)} color={STATUS_COLOR[p.verification_status]} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: S.lg }} keyboardShouldPersistTaps="handled">
        {/* Document pager */}
        <FlatList
          data={rows}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(r) => r.spec.kind}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          ref={pager}
          renderItem={({ item }: { item: KycRow<PartnerDocumentSummary> }) => (
            <View style={{ width, padding: S.lg, gap: S.sm }}>
              <View style={s.docHead}>
                <Text style={s.docTitle}>
                  {item.spec.label}
                  {item.spec.optional ? <Text style={s.optional}>  optional</Text> : null}
                </Text>
                <Badge label={ROW_LABEL[item.state]} color={ROW_COLOR[item.state]} />
              </View>
              {!item.doc ? (
                <View style={[s.preview, s.center]}>
                  <Ionicons name="cloud-offline-outline" size={36} color={C.line} />
                  <Muted>Not uploaded yet</Muted>
                </View>
              ) : !item.doc.url ? (
                <View style={[s.preview, s.center]}>
                  <Muted>File link unavailable (storage not configured?)</Muted>
                </View>
              ) : isPdf(item.doc) ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void WebBrowser.openBrowserAsync(item.doc!.url!)}
                  style={[s.preview, s.center]}
                >
                  <Ionicons name="document-text-outline" size={48} color={C.blue} />
                  <Text style={s.link}>Open PDF</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${item.spec.label}, tap to zoom`}
                  onPress={() => setZoom({ uri: item.doc!.url!, title: item.spec.label })}
                >
                  <Image source={{ uri: item.doc.url }} style={s.preview} resizeMode="contain" />
                  <View style={s.zoomHint}>
                    <Ionicons name="expand-outline" size={14} color={C.white} />
                    <Text style={s.zoomHintText}>Tap to zoom</Text>
                  </View>
                </Pressable>
              )}
              {item.doc ? (
                <Muted>
                  Uploaded {shortDate(item.doc.created_at)}
                  {item.doc.reviewer_note ? ` · Note: ${item.doc.reviewer_note}` : ''}
                </Muted>
              ) : null}
            </View>
          )}
        />

        {/* Page dots */}
        <View style={s.dots}>
          {rows.map((r, i) => (
            <Pressable key={r.spec.kind} onPress={() => setPage(i)} hitSlop={8} accessibilityLabel={r.spec.label}>
              <View style={[s.dot, { backgroundColor: ROW_COLOR[r.state] }, i === page && s.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* One-tap document actions */}
        {current?.doc ? (
          <View style={s.docActions}>
            <Button
              label={busy === `${current.doc.id}:rejected` ? 'Rejecting…' : 'Reject document'}
              icon="close-circle-outline"
              variant="danger"
              disabled={!!busy || current.state === 'rejected'}
              onPress={() => void verifyDoc(current.doc!, 'rejected')}
              style={{ flex: 1 }}
            />
            <Button
              label={busy === `${current.doc.id}:verified` ? 'Verifying…' : 'Verify document'}
              icon="checkmark-circle-outline"
              disabled={!!busy || current.state === 'verified'}
              onPress={() => void verifyDoc(current.doc!, 'verified')}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}

        {/* Partner facts */}
        <View style={s.facts}>
          <Fact icon="person-outline" text={p.owner_name ?? 'Owner not given'} />
          {p.phone ? (
            <Fact icon="call-outline" text={p.phone} onPress={() => void Linking.openURL(`tel:${p.phone}`)} />
          ) : null}
          {p.email ? <Fact icon="mail-outline" text={p.email} /> : null}
          <Fact icon="location-outline" text={[p.address, p.pincode].filter(Boolean).join(' · ') || 'No address'} />
          {p.latitude !== null && p.longitude !== null ? (
            <Fact
              icon="map-outline"
              text="Check the GPS pin on the map"
              onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`)}
            />
          ) : (
            <Fact icon="map-outline" text="No GPS pin" />
          )}
          <Fact icon="time-outline" text={`Joined ${shortDate(p.created_at)}`} />
        </View>
      </ScrollView>

      {/* Decision bar */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + S.sm }]}>
        <ErrorNote text={actionError} />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note for the partner (needed to reject)"
          placeholderTextColor={C.muted}
          maxLength={500}
          style={s.note}
        />
        {!ready ? (
          <Muted style={{ fontSize: 12 }}>To approve, verify: {blocking.map((r) => r.spec.label).join(', ')}</Muted>
        ) : null}
        <View style={s.decide}>
          <Button
            label={busy === 'rejected' ? 'Rejecting…' : 'Reject partner'}
            variant="danger"
            disabled={!!busy || p.verification_status === 'rejected'}
            onPress={() => void decide('rejected')}
            style={{ flex: 1 }}
          />
          <Button
            label={busy === 'verified' ? 'Approving…' : p.verification_status === 'verified' ? 'Approved' : 'Approve & list'}
            icon="shield-checkmark"
            disabled={!!busy || !ready || p.verification_status === 'verified'}
            onPress={() => void decide('verified')}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {zoom ? <ZoomViewer uri={zoom.uri} title={zoom.title} onClose={() => setZoom(null)} /> : null}
    </KeyboardAvoidingView>
  );
}

function Fact({ icon, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress?: () => void }) {
  const body = (
    <View style={s.fact}>
      <Ionicons name={icon} size={16} color={onPress ? C.blue : C.muted} />
      <Text style={[s.factText, onPress && { color: C.blue }]}>{text}</Text>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="link" onPress={onPress} style={{ minHeight: TAP, justifyContent: 'center' }}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  top: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md, paddingBottom: S.sm },
  iconBtn: { width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' },
  name: { color: C.navy, fontSize: 17, fontWeight: '800' },
  docHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm },
  docTitle: { flexShrink: 1, color: C.navy, fontSize: 16, fontWeight: '700' },
  optional: { color: C.muted, fontSize: 12, fontWeight: '600' },
  preview: {
    width: '100%',
    height: 340,
    borderRadius: R.lg,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
  },
  center: { alignItems: 'center', justifyContent: 'center', gap: S.sm },
  link: { color: C.blue, fontSize: 15, fontWeight: '700' },
  zoomHint: {
    position: 'absolute',
    right: S.sm,
    bottom: S.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: R.pill,
    backgroundColor: 'rgba(8,32,70,0.7)',
  },
  zoomHintText: { color: C.white, fontSize: 11, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: S.sm, paddingVertical: S.xs },
  dot: { width: 8, height: 8, borderRadius: 4, opacity: 0.5 },
  dotActive: { width: 22, opacity: 1 },
  docActions: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.lg, paddingTop: S.sm },
  decide: { flexDirection: 'row', gap: S.sm },
  facts: { margin: S.lg, padding: S.md, gap: S.xs, borderRadius: R.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  fact: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: 4 },
  factText: { flex: 1, color: C.navy, fontSize: 14 },
  bottom: {
    gap: S.sm,
    paddingTop: S.sm,
    paddingHorizontal: S.lg,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  note: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    color: C.navy,
    fontSize: 14,
  },
});
