import type { HomeSummary } from '@applyfields/types';
import { Badge, SectionTitle } from '@applyfields/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import {
  AssistancePromo,
  ClosingSoon,
  DeadlineCalendar,
  Hero,
  LatestUpdates,
  ProfileStrength,
  SavedPreview,
  StatsRow,
  TrustNote,
} from '@/components/home/home-blocks';
import { ModeSwitcher } from '@/components/home/mode-switcher';
import { ApiOffline, OpportunityCardView } from '@/components/opportunity';
import { apiGet } from '@/lib/api';

/** Home dashboard (founder doc §5). Data comes from GET /api/v1/home. */
export default async function HomePage() {
  await connection();
  const home = await apiGet<HomeSummary>('/home');

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Hero popular={home?.popular_searches ?? ['SSC CGL', 'NEET UG', 'PAN card']} />

        {home ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold">Today on ApplyFields</h2>
              {home.sample && <Badge tone="celadon">Sample data from the API</Badge>}
            </div>
            <StatsRow stats={home.stats} />
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ClosingSoon items={home.closing_soon} />
              </div>
              <div className="lg:col-span-2">
                <LatestUpdates items={home.updates} />
              </div>
            </div>
          </>
        ) : (
          <ApiOffline />
        )}

        <ModeSwitcher />

        {home && (
          <section>
            <SectionTitle
              title="Popular right now"
              action={
                <Link href="/register" className="flex items-center gap-1 text-xs font-semibold hover:underline">
                  Get matches for your profile <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              {home.popular.map((item) => (
                <OpportunityCardView key={item.slug} item={item} />
              ))}
            </div>
          </section>
        )}

        <TrustNote />
      </div>

      <aside className="space-y-6" aria-label="Your dashboard">
        <DeadlineCalendar deadlines={home?.closing_soon ?? []} />
        <ProfileStrength />
        <SavedPreview />
        <AssistancePromo />
      </aside>
    </div>
  );
}
