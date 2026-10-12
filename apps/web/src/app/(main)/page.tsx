import type { HomeSummary } from '@applyfields/types';
import Link from 'next/link';
import { connection } from 'next/server';
import {
  CareerPromo,
  ClosingSoon,
  Hero,
  LatestUpdates,
  StatsRow,
  TrustNote,
} from '@/components/home/home-blocks';
import { ApiOffline } from '@/components/opportunity';
import { apiGetAsUser } from '@/lib/server-api';
import { ClientAuthDashboardSwitch } from '@/components/dashboard/client-auth-dashboard-switch';

/** Home dashboard. Automatically presents the unauthenticated view when signed out and the personalized dashboard when signed in. */
export default async function HomePage() {
  await connection();
  const home = await apiGetAsUser<HomeSummary>('/home');
  const liveHome = home && !home.sample ? home : null;

  // The signed-out home uses only live API content; sample payloads are omitted.
  const publicDashboard = (
    <div className="space-y-12 pb-12 pt-16">
      <Hero popular={liveHome?.popular_searches ?? []} deadlines={liveHome?.closing_soon ?? []} />

      <section aria-labelledby="explore-opportunities">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="explore-opportunities" className="text-lg font-bold text-teal">A possibility for every ambition.</h2>
          <Link href="/career" className="text-xs font-medium text-[#536780] hover:text-sea">Find your direction →</Link>
        </div>
        <StatsRow stats={liveHome?.stats ?? []} />
      </section>

      {liveHome ? <ClosingSoon items={liveHome.closing_soon} /> : <ApiOffline />}
      <CareerPromo />
      <LatestUpdates items={liveHome?.updates ?? []} />
      <TrustNote />
    </div>
  );

  return (
    <ClientAuthDashboardSwitch
      home={liveHome}
      publicDashboard={publicDashboard}
      initialLoggedIn={Boolean(liveHome?.personal)}
    />
  );
}
