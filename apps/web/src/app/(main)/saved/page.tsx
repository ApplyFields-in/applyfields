import type { OpportunityType, SavedList } from '@applyfields/types';
import { buttonClass, Card, cn, EmptyState, IconTile, PageHeader } from '@applyfields/ui';
import { Bookmark, Landmark, LogIn } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline, OpportunityCardView } from '@/components/opportunity';
import { ReminderToggle, SaveButton } from '@/components/save-button';
import { TYPE_META } from '@/lib/format';
import { apiGetAsUser } from '@/lib/server-api';

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
  const header = (
    <PageHeader
      eyebrow="My space"
      title="Saved"
      description="Jobs, exams, scholarships, admissions and services you saved. We remind you before the last date and tell you when there’s an update."
      icon={<Bookmark />}
    />
  );

  if (!(await cookies()).has('accessToken')) {
    return (
      <>
        {header}
        <EmptyState
          icon={<LogIn />}
          title="Log in to see what you saved"
          text="Save opportunities and get reminders before the last date, plus admit cards and results as they come out."
          action={
            <Link href="/login" className={buttonClass({ size: 'sm' })}>
              Log in
            </Link>
          }
        />
      </>
    );
  }

  const data = await apiGetAsUser<SavedList>('/saved');
  if (data === null) {
    return (
      <>
        {header}
        <ApiOffline />
      </>
    );
  }

  const kindOf = (i: SavedList['items'][number]): Filter => i.card?.type ?? 'service';
  const count = (f: Filter) => data.items.filter((i) => kindOf(i) === f).length;
  const items = filter ? data.items.filter((i) => kindOf(i) === filter) : data.items;
  const chip = (active: boolean) =>
    cn(
      'clay-press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-clay',
      active ? 'bg-teal text-cream' : 'bg-cream',
    );

  return (
    <>
      {header}
      <nav aria-label="Filter saved items" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-3 pt-1">
        <Link href="/saved" className={chip(!filter)} aria-current={!filter ? 'page' : undefined}>
          All ({data.total})
        </Link>
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/saved?type=${f.key}`} className={chip(filter === f.key)} aria-current={filter === f.key ? 'page' : undefined}>
            {f.label} ({count(f.key)})
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bookmark />}
          title={filter ? 'Nothing saved here yet' : 'Nothing saved yet'}
          text="Tap the bookmark on any job, exam, scholarship or admission to save it and get reminders."
          action={
            <Link href="/jobs" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              Browse government jobs
            </Link>
          }
        />
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
