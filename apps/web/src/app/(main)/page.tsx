import type { HomeSummary } from '@applyfields/types';
import { Badge, buttonClass, EmptyState, SectionTitle } from '@applyfields/ui';
import { ArrowRight, BriefcaseBusiness, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import {
  AssistancePromo,
  ClosingSoon,
  DeadlineCalendar,
  Hero,
  LatestUpdates,
  ProfileStrength,
  RecentlyViewed,
  SavedPreview,
  StatsRow,
  TrustNote,
} from '@/components/home/home-blocks';
import { ModeSwitcher } from '@/components/home/mode-switcher';
import { ApiOffline, OpportunityCardView } from '@/components/opportunity';
import { apiGetAsUser } from '@/lib/server-api';

/** Home dashboard (founder doc §5). Data comes from GET /api/v1/home (personal parts when logged in). */
export default async function HomePage() {
  await connection();
  const home = await apiGetAsUser<HomeSummary>('/home');
  const me = home?.personal ?? null;

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

        {me && (
          <section>
            <SectionTitle
              title="Recommended for you"
              action={
                <Link href="/jobs?eligible=true" className="flex items-center gap-1 text-xs font-semibold hover:underline">
                  All jobs you can apply for <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              }
            />
            {!me.profile_ready ? (
              <EmptyState
                icon={<UserCheck />}
                title="Add your details to get matches"
                text="We need your date of birth and at least one qualification to check eligibility for you."
                action={
                  <Link href="/profile" className={buttonClass({ size: 'sm' })}>
                    Complete profile
                  </Link>
                }
              />
            ) : me.recommended.length === 0 ? (
              <EmptyState
                icon={<UserCheck />}
                title="No open matches right now"
                text="Nothing open fits your profile yet. New notifications are checked against it as soon as they’re published."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {me.recommended.map((item) => (
                  <OpportunityCardView key={item.slug} item={item} />
                ))}
              </div>
            )}
          </section>
        )}

        <ModeSwitcher />

        {home && (
          <section>
            <SectionTitle
              title="Popular right now"
              action={
                me ? undefined : (
                  <Link href="/register" className="flex items-center gap-1 text-xs font-semibold hover:underline">
                    Get matches for your profile <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                )
              }
            />
            {home.popular.length === 0 ? (
              <EmptyState icon={<BriefcaseBusiness />} title="No opportunities published yet" text="Every notification is checked against the official source before it appears here — new ones show up as soon as our team publishes them." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {home.popular.map((item) => (
                  <OpportunityCardView key={item.slug} item={item} />
                ))}
              </div>
            )}
          </section>
        )}

        <TrustNote />
      </div>

      <aside className="space-y-6" aria-label="Your dashboard">
        <DeadlineCalendar deadlines={home?.closing_soon ?? []} />
        {!me && <ProfileStrength />}
        <SavedPreview items={me?.saved} />
        {me && <RecentlyViewed items={me.recently_viewed} />}
        <AssistancePromo />
      </aside>
    </div>
  );
}
