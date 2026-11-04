/**
 * Bookings desk — GET /bookings/partner/inbox, filtered and searched on the phone
 * (one fetch, instant chips). Citizen names come from the conversations list.
 */
import type { BookingListResponse } from '@applyfields/types';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { BookingCard } from '@/components/booking-card';
import { PartnerHeader } from '@/components/partner-header';
import { Chips, Empty, ErrorNote, Loading, SearchBox } from '@/components/ui';
import { BOOKING_FILTERS, matchesFilter, matchesSearch, type BookingFilter } from '@/lib/booking-filters';
import { bookingToken, useCitizens } from '@/lib/citizens';
import { useApi } from '@/lib/use-api';
import { C, S, column } from '@/theme';

export default function Bookings() {
  const [filter, setFilter] = useState<BookingFilter>('active');
  const [query, setQuery] = useState('');
  const { data, error, loading, refreshing, refresh } = useApi<BookingListResponse>('/bookings/partner/inbox');
  const citizens = useCitizens();

  const items = (data?.items ?? []).filter((b) => {
    const c = citizens.get(b.id);
    return (
      matchesFilter(b, filter) &&
      matchesSearch(query, [b.service_name, b.user_note, bookingToken(b.id), c?.name, c?.phone])
    );
  });

  return (
    <View style={{ flex: 1 }}>
      <PartnerHeader />
      <SearchBox value={query} onChange={setQuery} placeholder="Search name, phone, AF- number, service" />
      <Chips options={BOOKING_FILTERS} value={filter} onChange={setFilter} />
      {loading && !data ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(b) => b.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <BookingCard booking={item} citizen={citizens.get(item.id)} />}
          contentContainerStyle={[column, { padding: S.lg, paddingTop: 0, gap: S.md, flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}
          ListHeaderComponent={<ErrorNote text={data ? null : error} />}
          ListEmptyComponent={
            data ? (
              <Empty
                icon="calendar-clear-outline"
                title={query ? 'No match' : 'Nothing here'}
                body={query ? 'Try another name, number or service.' : 'Bookings citizens make on ApplyFields appear here.'}
              />
            ) : undefined
          }
        />
      )}
    </View>
  );
}
