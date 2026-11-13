import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { PartnerDetail } from '@applyfields/types';
import { apiGetWithStatus } from '@/lib/api';
import { ApiOffline } from '@/components/admin-shell';
import { PartnerKycInspectorClient } from './partner-kyc-inspector-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Partner Center KYC Inspector | ApplyFields Admin',
  description: 'Split-screen verification and compliance inspector for physical MeeSeva and CSC kiosk franchise partners.',
};

export default async function PartnerDetailPage({ params }: PageProps) {
  await connection();
  const { id } = await params;

  const res = await apiGetWithStatus<PartnerDetail>(`/admin/partners/${id}`);
  if (res.status === 404) notFound();
  const data = res.data;
  if (!data) {
    return (
      <div className="p-6">
        <ApiOffline />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PartnerKycInspectorClient partner={data} />
    </div>
  );
}
