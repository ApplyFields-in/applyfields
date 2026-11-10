import type { AdminPartnerListResponse } from '@applyfields/types';
import { PageHeader } from '@applyfields/ui';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { PartnerMapClient } from './partner-map-client';

export const metadata = { title: 'Partner map | ApplyFields Admin' };

/** Real partner pins from GET /admin/partners (lat/lng the centre saved). No sample centres. */
export default async function AdminPartnerMapPage() {
  await connection();
  // ponytail: first 100 partners; page through /admin/partners when the network is bigger.
  const data = await apiGet<AdminPartnerListResponse>('/admin/partners?limit=100');
  return (
    <div className="space-y-6 pb-16">
      <Link href="/partners" className="text-xs font-semibold text-teal/70 hover:text-teal">
        ← Back to partners
      </Link>
      <PageHeader
        eyebrow="Partners"
        title="Partner map"
        description="Where registered centres are, from the GPS pin each centre saved."
        icon={<MapPin />}
      />
      {data ? <PartnerMapClient partners={data.items} total={data.total} /> : <ApiOffline />}
    </div>
  );
}
