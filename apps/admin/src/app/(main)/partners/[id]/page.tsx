import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { PartnerDetail } from '@applyfields/types';
import { apiGet } from '@/lib/api';
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

  const data = await apiGet<PartnerDetail>(`/admin/partners/${id}`);

  if (!data) {
    // If API returned null, fallback to offline notice or mock detail for local operations
    return (
      <div className="p-6">
        <PartnerKycInspectorClient
          partner={{
            id,
            slug: `partner-${id.slice(0, 8)}`,
            business_name: 'MeeSeva Online Citizen Services #402',
            type: 'meeseva',
            verification_status: 'pending',
            is_listed: false,
            city: 'Hyderabad',
            state_code: 'TS',
            district: 'Hyderabad',
            pincode: '500001',
            address: 'Shop #14, Municipal Complex, Gandhi Road',
            description: null,
            logo_url: null,
            owner_name: 'Authorized Operator',
            whatsapp: null,
            email: 'partner@meeseva.gov.in',
            latitude: 17.385,
            longitude: 78.4867,
            service_areas: [],
            working_hours: {},
            is_available: true,
            rating_avg: 4.8,
            rating_count: 32,
            phone: '+91 98450 12345',
            institution_id: null,
            verified_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            services: [],
            documents: [],
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PartnerKycInspectorClient partner={data} />
    </div>
  );
}
