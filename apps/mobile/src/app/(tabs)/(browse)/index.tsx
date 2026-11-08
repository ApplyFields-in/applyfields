/**
 * Apply — the feed. Government jobs, exams, scholarships and admissions in one
 * list, filtered by type, free text and (when signed in) "only what I'm
 * eligible for". Backed by GET /opportunities.
 */
import type { OpportunityList, OpportunityType } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { OpportunityCard } from '@/components/opportunity-card';
import { Chips, Empty, Loading, Muted } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useApi, useDebounced } from '@/lib/use-api';
import { recordMascotEvent } from '@/services/mascot/IconManager';
import { C, R, S, TAP, column } from '@/theme';

type Filter = 'all' | OpportunityType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'govt_job', label: 'Government jobs' },
  { value: 'exam', label: 'Exams' },
  { value: 'scholarship', label: 'Scholarships' },
  { value: 'admission', label: 'Admissions' },
];

export default function ApplyFeed() {
  const { signedIn, me } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [closingSoon, setClosingSoon] = useState(false);

  // Fieldy's shortcuts open this screen with ?deadline=closing_soon or ?eligible=1.
  const params = useLocalSearchParams<{ deadline?: string; eligible?: string }>();
  useEffect(() => {
    if (params.deadline === 'closing_soon') setClosingSoon(true);
    if (params.eligible === '1') setOnlyEligible(true);
  }, [params.deadline, params.eligible]);

  // One request after typing settles for 300ms, not one per keystroke.
  const q = useDebounced(search.trim(), 300);
  // Searching or filtering by eligibility is the "thinking" mascot's signal.
  useEffect(() => {
    if (q || onlyEligible) recordMascotEvent({ type: 'research' });
  }, [q, onlyEligible]);

  // Eligibility badges need the core profile fields; nudge if they are missing.
  const profileIncomplete =
    !me?.profile?.date_of_birth || !me?.profile?.category || !me?.profile?.state_code;

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (q) params.set('q', q);
    if (onlyEligible && signedIn) params.set('eligible', 'true');
    if (closingSoon) params.set('deadline', 'closing_soon');
    const qs = params.toString();
    return `/opportunities${qs ? `?${qs}` : ''}`;
  }, [type, q, onlyEligible, closingSoon, signedIn]);

  const { data, loading, error, stale, refreshing, refresh } = useApi<OpportunityList>(path);
  const items = data?.items ?? [];

  // Shown above the list: finish-profile nudge, offline note, then the count.
  const header = (
    <>
      {signedIn && profileIncomplete ? (
        <Pressable onPress={() => router.push('/profile')} style={s.nudge}>
          <View style={s.nudgeIconTile}>
            <Ionicons name="sparkles" size={18} color={C.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.nudgeTitle}>Finish your profile</Text>
            <Text style={s.nudgeBody}>Add a few details to see what you qualify for.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.mutedNavy} />
        </Pressable>
      ) : !signedIn ? (
        <Pressable onPress={() => router.push('/login')} style={s.nudge}>
          <View style={s.nudgeIconTile}>
            <Ionicons name="sparkles" size={18} color={C.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.nudgeTitle}>See what you qualify for</Text>
            <Text style={s.nudgeBody}>Sign in and every card shows a straight yes or no.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.mutedNavy} />
        </Pressable>
      ) : null}
      {stale ? (
        <Muted style={{ marginBottom: S.sm }}>Showing saved results · you are offline</Muted>
      ) : null}
      {items.length ? (
        <Muted style={{ marginBottom: S.sm }}>
          {items.length} {items.length === 1 ? 'opportunity' : 'opportunities'} open
          {data?.sample ? ' · sample data' : ''}
        </Muted>
      ) : null}
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchOuter}>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color={C.blue} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search jobs, exams, scholarships…"
            placeholderTextColor={C.muted}
            style={s.search}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={13}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Chips options={FILTERS} value={type} onChange={setType} />

      {signedIn ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: onlyEligible }}
          onPress={() => setOnlyEligible((v) => !v)}
          style={s.eligibleRow}
        >
          <Ionicons
            name={onlyEligible ? 'checkbox' : 'square-outline'}
            size={18}
            color={onlyEligible ? C.blue : C.muted}
          />
          <Text style={s.eligibleText}>Only what I am eligible for</Text>
        </Pressable>
      ) : null}

      {closingSoon ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove the closing in 7 days filter"
          onPress={() => setClosingSoon(false)}
          style={s.eligibleRow}
        >
          <Ionicons name="time" size={18} color={C.blue} />
          <Text style={[s.eligibleText, { flex: 1 }]}>Closing in the next 7 days</Text>
          <Ionicons name="close-circle" size={18} color={C.muted} />
        </Pressable>
      ) : null}

      {loading && !refreshing ? (
        <Loading label="Finding opportunities…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.slug}
          renderItem={({ item }) => <OpportunityCard item={item} />}
          contentContainerStyle={[column, s.list]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />
          }
          ListHeaderComponent={header}
          ListEmptyComponent={
            error ? (
              <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
            ) : (
              <Empty
                title="Nothing matches yet"
                body="Try another filter, or clear the search box."
              />
            )
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // Padding on the outer column, not margin on the box: margin + width 100% overflows.
  searchOuter: { ...column, paddingHorizontal: S.lg, paddingTop: S.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.md,
    backgroundColor: C.inputBg,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  search: { flex: 1, minHeight: TAP, paddingVertical: S.sm, color: C.navy, fontSize: 14 },
  eligibleRow: {
    ...column,
    minHeight: TAP,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.lg,
    paddingBottom: S.xs,
  },
  eligibleText: { color: C.navy, fontSize: 13, fontWeight: '600' },
  list: { padding: S.lg, paddingTop: S.xs, gap: S.md, flexGrow: 1 },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    padding: S.md,
    marginBottom: S.md,
    backgroundColor: C.ice,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: C.navy,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nudgeIconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  nudgeTitle: { color: C.navy, fontSize: 14, fontWeight: '800' },
  nudgeBody: { color: C.mutedNavy, fontSize: 12.5, marginTop: 1 },
});
