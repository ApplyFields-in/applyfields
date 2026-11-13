/** KYC files staff need before approving: photo or PDF for each, sent to POST /partners/me/documents. */
// Deep import: Metro can't follow the package index's .js specifiers; this file has no imports.
import { CENTRE_KYC_DOCUMENTS, COLLEGE_KYC_DOCUMENTS } from '@applyfields/types/src/partner-documents';
import type { PartnerDetail, PartnerDocumentSummary } from '@applyfields/types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, ErrorNote, Muted, SectionTitle } from '@/components/ui';
import { api } from '@/lib/api';
import { isInstitution } from '@/lib/session';
import { C, S } from '@/theme';

const MAX_BYTES = 10 * 1024 * 1024;

/** file:// or content:// URI → base64, via RN's fetch + FileReader (no expo-file-system needed). */
async function readBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(blob);
  });
}

const STATUS = {
  pending: { label: 'Sent', color: C.warn },
  verified: { label: 'Verified', color: C.good },
  rejected: { label: 'Re-upload', color: C.bad },
} as const;

export function KycDocuments({ partner, onUploaded }: { partner: PartnerDetail; onUploaded: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docs = isInstitution(partner) ? COLLEGE_KYC_DOCUMENTS : CENTRE_KYC_DOCUMENTS;
  // API returns newest first, so find() gets the latest upload of each kind.
  const latest = (kind: string) => partner.documents?.find((d) => d.document_kind === kind);

  async function send(kind: string, file: { name: string; mime: string; base64: string }) {
    setBusy(kind);
    const out = await api.post<PartnerDocumentSummary>('/partners/me/documents', {
      document_kind: kind,
      file_name: file.name,
      mime_type: file.mime,
      file_base64: file.base64,
    });
    setBusy(null);
    if (out.error) setError(out.error);
    else onUploaded();
  }

  async function pickPhoto(kind: string, from: 'camera' | 'library') {
    setError(null);
    const perm =
      from === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(from === 'camera' ? 'Allow camera access to take the photo.' : 'Allow photo access to pick the file.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, base64: true };
    const res =
      from === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const asset = res.canceled ? null : res.assets[0];
    if (!asset?.base64) return;
    const mime = asset.mimeType ?? 'image/jpeg';
    await send(kind, {
      name: asset.fileName ?? `${kind}.${mime.split('/')[1] ?? 'jpg'}`,
      mime,
      base64: asset.base64,
    });
  }

  async function pickPdf(kind: string) {
    setError(null);
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    const asset = res.canceled ? null : res.assets[0];
    if (!asset) return;
    if (asset.size && asset.size > MAX_BYTES) {
      setError('The PDF is larger than 10 MB.');
      return;
    }
    try {
      await send(kind, { name: asset.name, mime: 'application/pdf', base64: await readBase64(asset.uri) });
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : 'Could not read the PDF.');
    }
  }

  return (
    <View style={{ gap: S.sm }}>
      <SectionTitle>Verification documents</SectionTitle>
      <Muted>Clear photos speed up approval. Our team checks each one.</Muted>
      <ErrorNote text={error} />
      {docs.map((d) => {
        const doc = latest(d.kind);
        const tag = doc ? STATUS[doc.status as keyof typeof STATUS] : null;
        return (
          <Card key={d.kind} style={st.card}>
            <View style={st.row}>
              <View style={{ flex: 1 }}>
                <Text style={st.label}>
                  {d.label}
                  {d.optional ? <Text style={st.optional}> (optional)</Text> : null}
                </Text>
                <Muted>{d.hint}</Muted>
              </View>
              {tag ? <Badge label={tag.label} color={tag.color} /> : null}
            </View>
            {doc?.status === 'rejected' && doc.reviewer_note ? <Muted>Reviewer: {doc.reviewer_note}</Muted> : null}
            {doc?.status === 'verified' ? null : (
              <View style={st.row}>
                <Button
                  label={busy === d.kind ? 'Uploading…' : 'Camera'}
                  icon="camera-outline"
                  disabled={busy !== null}
                  onPress={() => void pickPhoto(d.kind, 'camera')}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Gallery"
                  icon="images-outline"
                  variant="secondary"
                  disabled={busy !== null}
                  onPress={() => void pickPhoto(d.kind, 'library')}
                  style={{ flex: 1 }}
                />
                <Button
                  label="PDF"
                  icon="document-outline"
                  variant="secondary"
                  disabled={busy !== null}
                  onPress={() => void pickPdf(d.kind)}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  card: { padding: S.md, gap: S.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  label: { color: C.navy, fontSize: 15, fontWeight: '700' },
  optional: { color: C.muted, fontSize: 13, fontWeight: '400' },
});
