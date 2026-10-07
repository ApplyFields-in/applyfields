import type { OrganizationOption, ReviewDetail } from '@applyfields/types';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { OpportunityForm } from '@/components/opportunity-form';
import { apiGet } from '@/lib/api';

export const metadata = { title: 'Edit opportunity' };

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const [opportunity, orgs] = await Promise.all([
    apiGet<ReviewDetail>(`/admin/opportunities/${encodeURIComponent(id)}`),
    apiGet<OrganizationOption[]>('/admin/organizations'),
  ]);

  if (!opportunity) {
    // Check if API is down vs record not found
    const health = await apiGet<{ status: string }>('/health');
    if (health) notFound();
    return <ApiOffline />;
  }

  return (
    <div className="mx-auto max-w-5xl py-2">
      <OpportunityForm initialData={opportunity} organizations={orgs ?? []} mode="edit" />
    </div>
  );
}
