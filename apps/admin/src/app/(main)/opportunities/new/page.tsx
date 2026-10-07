import type { OrganizationOption } from '@applyfields/types';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { OpportunityForm } from '@/components/opportunity-form';
import { apiGet } from '@/lib/api';

export const metadata = { title: 'New opportunity' };

export default async function NewOpportunityPage() {
  await connection();
  const orgs = await apiGet<OrganizationOption[]>('/admin/organizations');

  if (orgs === null) {
    return <ApiOffline />;
  }

  return (
    <div className="mx-auto max-w-5xl py-2">
      <OpportunityForm initialData={null} organizations={orgs} mode="create" />
    </div>
  );
}
