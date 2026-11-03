/** Saved — everything the user bookmarked, with reminders on. GET /saved. */
import type { SavedList } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { OpportunityCard } from '@/components/opportunity-card';
import { Button, Empty, Loading, Muted } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useApi, useRefreshOnFocus } from '@/lib/use-api';
import { C, S, card, column } from '@/theme';

export default function Saved() {
  const { signedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, loading, error, refreshing, refresh } = useApi<SavedList>(
    signedIn ? '/saved' : null,
  );
  // Saving on a detail screen should show here the moment you come back.
  useRefreshOnFocus(refresh);

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <AppHeader subtitle="Saved for later" />

      {authLoading ? (
        <Loading />
      ) : !signedIn ? (
        <View style={s.gate}>
          <Empty
            icon="bookmark-outline"
            title="Sign in to keep a list"
            body="Saved items get a reminder before the last date, and an alert when the notification changes."
          />
          <Button label="Sign in" onPress={() => router.push('/login')} style={s.gateButton} />
        </View>
      ) : loading && !refreshing ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(i) => `${i.item_type}:${i.slug}`}
          contentContainerStyle={[column, s.list]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          }
          renderItem={({ item }) => {
            if (item.card) return <OpportunityCard item={item.card} />;
            const name = item.service?.name ?? item.institution?.name ?? item.slug;
            return (
              <View style={[card, s.row]}>
                <Ionicons
                  name={item.item_type === 'service' ? 'business-outline' : 'school-outline'}
                  size={18}
                  color={C.blue}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{name}</Text>
                  <Muted>
                    {item.item_type === 'service' ? 'Government service' : 'College'}
                    {item.reminder_enabled ? ' · reminders on' : ''}
                  </Muted>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            error ? (
              <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
            ) : (
              <Empty
                icon="bookmark-outline"
                title="Nothing saved yet"
                body="Tap Save on any job, exam, scholarship or service and it lands here."
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
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.lg },
  rowTitle: { color: C.navy, fontSize: 15, fontWeight: '700' },
});
