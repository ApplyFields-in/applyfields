/**
 * Documents — the certificates the user keeps for applications. GET /documents.
 * Uploading stays on the website (encrypted vault, DigiLocker). Any document can
 * be saved to the phone for offline use; "On this phone" is always shown first —
 * also while loading, signed out or with no signal — because the exam hall is
 * exactly where the network fails.
 */
import type { UserDocumentSummary, UserDocumentListResponse } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Badge, Button, Empty, Loading, Muted, SectionTitle } from '@/components/ui';
import { API_URL, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import {
  type OfflineFile,
  openOffline,
  removeOffline,
  saveOffline,
  useOfflineFiles,
} from '@/lib/offline';
import { useApi } from '@/lib/use-api';
import { C, S, TAP, card, column } from '@/theme';

/** kB / MB, whichever reads better. */
function size(bytes: number | null): string {
  if (!bytes) return '';
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} kB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function docTitle(d: UserDocumentSummary): string {
  return d.title || d.document_type_name || d.document_type_code;
}

export default function Documents() {
  const { signedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const offline = useOfflineFiles();
  const { data, loading, error, refreshing, refresh } = useApi<UserDocumentListResponse>(
    signedIn ? '/documents' : null,
  );
  const [busy, setBusy] = useState<string | null>(null);

  async function keepOffline(item: UserDocumentSummary) {
    setBusy(item.id);
    // The downloader can't refresh an expired session; this call does, first.
    const check = await api.get(`/documents/${item.id}`);
    try {
      if (check.error) throw new Error(check.error);
      await saveOffline({
        key: `doc:${item.id}`,
        title: docTitle(item),
        url: `${API_URL}/documents/${item.id}/download`,
        mimeType: item.mime_type,
        auth: true,
      });
    } catch (err) {
      Alert.alert('Could not save to this phone', (err as Error).message);
    }
    setBusy(null);
  }

  const savedKeys = new Set(offline.map((f) => f.key));

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <AppHeader subtitle="My documents" />

      <FlatList
        data={signedIn ? (data?.items ?? []) : []}
        keyExtractor={(d) => d.id}
        contentContainerStyle={[column, s.list]}
        refreshControl={
          signedIn ? (
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          ) : undefined
        }
        ListHeaderComponent={offline.length ? <OnThisPhone files={offline} /> : undefined}
        renderItem={({ item }) => {
          const expired = item.expires_on ? new Date(item.expires_on) < new Date() : false;
          const saved = savedKeys.has(`doc:${item.id}`);
          return (
            <View style={[card, s.row]}>
              <Ionicons name="document-text" size={22} color={C.blue} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.title}>{docTitle(item)}</Text>
                <Muted numberOfLines={1}>
                  {[item.file_name, size(item.size_bytes)].filter(Boolean).join(' · ')}
                </Muted>
                {item.masked_identifier ? <Muted>{item.masked_identifier}</Muted> : null}
                {item.expires_on ? (
                  <Muted style={{ color: expired ? C.bad : C.muted }}>
                    {expired ? 'Expired on ' : 'Valid until '}
                    {formatDate(item.expires_on)}
                  </Muted>
                ) : null}
                {item.source === 'digilocker' || item.details?.verified_by_digilocker ? (
                  <Badge label="DigiLocker" color={C.good} />
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Saved on this phone' : 'Save to this phone for offline use'}
                disabled={saved || busy !== null}
                onPress={() => keepOffline(item)}
                hitSlop={10}
                style={s.keep}
              >
                {busy === item.id ? (
                  <ActivityIndicator color={C.blue} />
                ) : (
                  <Ionicons
                    name={saved ? 'checkmark-circle' : 'cloud-download-outline'}
                    size={22}
                    color={saved ? C.good : C.blue}
                  />
                )}
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          authLoading || (signedIn && loading) ? (
            <Loading />
          ) : !signedIn ? (
            <View style={s.gate}>
              <Empty
                icon="document-text-outline"
                title="Sign in to see your documents"
                body="Your certificates stay encrypted. Staff can never open them."
              />
              <Button label="Sign in" onPress={() => router.push('/login')} style={s.gateButton} />
            </View>
          ) : error ? (
            <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
          ) : (
            <Empty
              icon="document-text-outline"
              title="No documents yet"
              body="Add them on applyfields.in and they appear here, ready for every form."
            />
          )
        }
      />
    </View>
  );
}

/** Files saved on the phone. Read from local storage, so this works with no signal. */
function OnThisPhone({ files }: { files: OfflineFile[] }) {
  function confirmRemove(f: OfflineFile) {
    Alert.alert('Remove from this phone?', f.title, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeOffline(f.key) },
    ]);
  }

  return (
    <View style={[card, s.offline]}>
      <SectionTitle>On this phone · works offline</SectionTitle>
      {files.map((f) => (
        <View key={f.key} style={s.offlineRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${f.title}`}
            onPress={() => openOffline(f).catch((e: Error) => Alert.alert('Could not open', e.message))}
            style={s.offlineOpen}
          >
            <Ionicons
              name={f.mimeType === 'application/pdf' ? 'document' : 'image'}
              size={18}
              color={C.navy}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.offlineTitle} numberOfLines={1}>
                {f.title}
              </Text>
              <Muted style={{ fontSize: 11.5 }}>
                {[size(f.size), `saved ${formatDate(f.savedAt)}`].filter(Boolean).join(' · ')}
              </Muted>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${f.title} from this phone`}
            onPress={() => confirmRemove(f)}
            hitSlop={10}
            style={s.keep}
          >
            <Ionicons name="trash-outline" size={18} color={C.muted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  list: { padding: S.lg, gap: S.md, flexGrow: 1 },
  gate: { flex: 1, justifyContent: 'center' },
  gateButton: { marginHorizontal: S.xl, marginBottom: S.xxl },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, padding: S.lg },
  title: { color: C.navy, fontSize: 15, fontWeight: '700' },
  keep: { minWidth: TAP, minHeight: TAP, alignItems: 'center', justifyContent: 'center' },
  offline: { padding: S.lg, borderColor: C.good, marginBottom: S.xs },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  offlineOpen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: TAP },
  offlineTitle: { color: C.navy, fontSize: 14, fontWeight: '700' },
});
