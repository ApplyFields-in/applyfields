import type { OpportunityType, SavedList } from '@applyfields/types';
import { Card, IconTile } from '@applyfields/ui';
import { Landmark } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline, OpportunityCardView } from '@/components/opportunity';
import { ReminderToggle, SaveButton } from '@/components/save-button';
import { TYPE_META } from '@/lib/format';
import { apiGetAsUser } from '@/lib/server-api';
import {
  SavedEmptyState,
  SavedLoginRequired,
  SavedPageHeader,
  SavedPageNav,
} from '@/components/saved-client-components';

export const metadata = { title: 'Saved' };

type Filter = OpportunityType | 'service';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'govt_job', label: 'Jobs' },
  { key: 'exam', label: 'Exams' },
  { key: 'scholarship', label: 'Scholarships' },
  { key: 'admission', label: 'Admissions' },
  { key: 'service', label: 'Services' },
];

/** Everything the user saved — data from GET /api/v1/saved; ?type= filters. */
export default async function Page({ searchParams }: PageProps<'/saved'>) {
  await connection();
  const { type } = await searchParams;
  const filter = FILTERS.some((f) => f.key === type) ? (type as Filter) : null;

  if (!(await cookies()).has('accessToken')) {
    return (
      <>
        <SavedPageHeader />
        <SavedLoginRequired />
      </>
    );
  }

  const data = await apiGetAsUser<SavedList>('/saved');
  if (data === null) {
    return (
      <>
        <SavedPageHeader />
        <ApiOffline />
      </>
    );
  }

  const kindOf = (i: SavedList['items'][number]): Filter => i.card?.type ?? 'service';
  const items = filter ? data.items.filter((i) => kindOf(i) === filter) : data.items;

  return (
    <>
      <SavedPageHeader />
      <SavedPageNav
        filters={FILTERS}
        activeFilter={filter}
        data={data}
        itemsCount={items.length}
      />

      {items.length === 0 ? (
        <SavedEmptyState hasFilter={Boolean(filter)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((i) =>
            i.card ? (
              <div key={`o-${i.slug}`} className="flex flex-col gap-2">
                <OpportunityCardView item={i.card} />
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs text-teal/80">{TYPE_META[i.card.type].label}</span>
                  <ReminderToggle slug={i.slug} initial={i.reminder_enabled} />
                </div>
              </div>
            ) : i.service ? (
              <Card key={`s-${i.slug}`} interactive className="flex items-start gap-3 p-4">
                <IconTile tone="tea">
                  <Landmark />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-teal/80">Government service</p>
                  <Link href={`/services/${i.service.slug}`} className="mt-0.5 line-clamp-2 font-bold leading-snug hover:underline">
                    {i.service.name}
                  </Link>
                </div>
                <SaveButton itemType="service" slug={i.service.slug} title={i.service.name} initial />
              </Card>
            ) : null,
          )}
        </div>
      )}
    </>
  );
}
