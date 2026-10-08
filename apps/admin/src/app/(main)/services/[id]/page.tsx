import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { GovServiceDetail } from '@applyfields/types';
import { ServiceForm } from '@/components/service-form';
import { apiGet } from '@/lib/api';

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const data = await apiGet<GovServiceDetail>(`/admin/services/${id}`);

  if (!data) {
    notFound();
  }

  return <ServiceForm initialData={data} mode="edit" />;
}
