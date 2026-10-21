import type { LinkHealthReport, ScrapeSourcesListResponse } from '@applyfields/types';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { ScrapersUi } from '@/components/scrapers-ui';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.scrapers.title };

export default async function Page() {
  await connection();

  const [sourcesData, linkHealthData] = await Promise.all([
    apiGet<ScrapeSourcesListResponse>('/admin/sources'),
    apiGet<LinkHealthReport>('/admin/link-health'),
  ]);

  if (!sourcesData) {
    return (
      <div className="p-8">
        <ApiOffline />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <ScrapersUi
        initialData={sourcesData}
        initialLinkHealth={linkHealthData}
      />
    </div>
  );
}
