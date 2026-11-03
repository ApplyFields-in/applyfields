/**
 * Documents — the certificates the user keeps for applications. GET /documents.
 * Read-only on mobile: uploading and previewing stay on the website, where the
 * encrypted vault and DigiLocker flow live.
 */
import type { UserDocumentListResponse } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Badge, Button, Empty, Loading, Muted } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

/** kB / MB, whichever reads better. */
function size(bytes: number | null): string {
  if (!bytes) return '';
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} kB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { signedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, loading, error, refreshing, refresh } = useApi<UserDocumentListResponse>(
    signedIn ? '/documents' : null,
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <AppHeader subtitle="My documents" />

      {authLoading ? (
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
      ) : loading && !refreshing ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={[column, s.list]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          }
          renderItem={({ item }) => {
            const expired = item.expires_on ? new Date(item.expires_on) < new Date() : false;
            return (
              <View style={[card, s.row]}>
                <Ionicons name="document-text" size={22} color={C.blue} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.title}>
                    {item.title || item.document_type_name || item.document_type_code}
                  </Text>
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
                </View>
                {item.source === 'digilocker' || item.details?.verified_by_digilocker ? (
                  <Badge label="DigiLocker" color={C.good} />
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            error ? (
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
      )}
    </View>
  );
}

const s = StyleSheet.create({
  list: { padding: S.lg, gap: S.md, flexGrow: 1 },
  gate: { flex: 1, justifyContent: 'center' },
  gateButton: { marginHorizontal: S.xl, marginBottom: S.xxl },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, padding: S.lg },
  title: { color: C.navy, fontSize: 15, fontWeight: '700' },
});
