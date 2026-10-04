import type { AdminSummary } from '@applyfields/types';
import { Preview, SectionPage } from '@applyfields/ui';
import { Radar } from 'lucide-react';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.scrapers.title };

/** Scraper status — data from GET /api/v1/admin/summary (sample) */
export default async function Page() {
  await connection();
  const data = await apiGet<AdminSummary>('/admin/summary');
  return (
    <SectionPage info={SECTIONS.scrapers}>
      {data ? (
        <Preview
          preview={{
            kind: 'list',
            items: data.scrapers.map((s) => ({
              title: s.name,
              meta: `key: ${s.key} · ${s.consecutive_failures} failures in a row`,
              badge: s.consecutive_failures > 0 ? 'Failing' : 'Working',
              icon: <Radar />,
            })),
          }}
        />
      ) : (
        <ApiOffline />
      )}
    </SectionPage>
  );
}
