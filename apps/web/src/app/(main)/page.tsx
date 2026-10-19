import type { HomeSummary } from '@applyfields/types';
import Link from 'next/link';
import { connection } from 'next/server';
import {
  CareerPromo,
  ClosingSoon,
  ExploreAmbitionSection,
  Hero,
  LatestUpdates,
  TrustNote,
} from '@/components/home/home-blocks';
import { ServicesQuickBridge } from '@/components/home/services-quick-bridge';
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

      <ServicesQuickBridge />

      <ExploreAmbitionSection stats={liveHome?.stats ?? []} />

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
