import type { UpdateList } from '@applyfields/types';
import { Preview, SectionPage } from '@applyfields/ui';
import { Megaphone } from 'lucide-react';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/opportunity';
import { apiGet } from '@/lib/api';
import { formatDate, UPDATE_LABEL } from '@/lib/format';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.updates.title };

/** Results & updates — data comes from GET /api/v1/updates */
export default async function Page() {
  await connection();
  const data = await apiGet<UpdateList>('/updates');
  return (
    <SectionPage info={SECTIONS.updates}>
      {data ? (
        <Preview
          preview={{
            kind: 'list',
            items: data.items.map((u) => ({
              title: `${u.organization} — ${u.title}`,
              meta: formatDate(u.date),
              badge: UPDATE_LABEL[u.kind],
              icon: <Megaphone />,
              href: `/updates/${u.id}`,
            })),
          }}
        />
      ) : (
        <ApiOffline />
      )}
    </SectionPage>
  );
}
