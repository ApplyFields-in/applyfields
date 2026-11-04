/** Student enquiries desk — GET /career/colleges/partner/enquiries[?status]. */
import type { InstitutionEnquiryListResponse, InstitutionEnquiryStatus } from '@applyfields/types';
import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { EnquiryCard } from '@/components/enquiry-card';
import { PartnerHeader } from '@/components/partner-header';
import { Chips, Empty, ErrorNote, Loading, SearchBox } from '@/components/ui';
import { matchesSearch } from '@/lib/booking-filters';
import { useApi } from '@/lib/use-api';
import { C, S, column } from '@/theme';

type Filter = InstitutionEnquiryStatus | 'all';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'responded', label: 'Responded' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

export default function Enquiries() {
  const [filter, setFilter] = useState<Filter>('new');
  const path = `/career/colleges/partner/enquiries${filter === 'all' ? '' : `?status=${filter}`}`;
  const { data, error, loading, refreshing, refresh } = useApi<InstitutionEnquiryListResponse>(path);
  const [query, setQuery] = useState('');
  const items = (data?.items ?? []).filter((e) => matchesSearch(query, [e.name, e.phone, e.email, e.course_name, e.message]));

  return (
    <View style={{ flex: 1 }}>
      <PartnerHeader />
      <SearchBox value={query} onChange={setQuery} placeholder="Search student, phone, course, message" />
      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      {loading && !data ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <EnquiryCard enquiry={item} />}
          contentContainerStyle={[column, { padding: S.lg, paddingTop: 0, gap: S.md, flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}
          ListHeaderComponent={<ErrorNote text={data ? null : error} />}
          ListEmptyComponent={
            data ? <Empty icon="mail-open-outline" title="No enquiries" body="Students ask questions from your college page on ApplyFields." /> : undefined
          }
        />
      )}
    </View>
  );
}
