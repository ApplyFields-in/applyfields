import type { AdminSummary } from '@applyfields/types';
import { Preview, SectionPage } from '@applyfields/ui';
import { Inbox } from 'lucide-react';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.review.title };

/** Review queue — data from GET /api/v1/admin/summary (sample) */
export default async function Page() {
  await connection();
  const data = await apiGet<AdminSummary>('/admin/summary');
  return (
    <SectionPage info={SECTIONS.review}>
      {data ? (
        <Preview
          preview={{
            kind: 'list',
            items: data.review_queue.map((r) => ({
              title: r.title,
              meta: `Source: ${r.source} · confidence ${Math.round(r.confidence * 100)}%`,
              badge: r.confidence < 0.6 ? 'Check carefully' : 'Ready to review',
              icon: <Inbox />,
              href: `/review/${r.id}`,
            })),
          }}
        />
      ) : (
        <ApiOffline />
      )}
    </SectionPage>
  );
}
