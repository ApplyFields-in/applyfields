import type { AdminUpdateDetail } from '@applyfields/types';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { UpdateForm } from '@/components/updates-ui';
import { apiGet } from '@/lib/api';

export const metadata = { title: 'Edit notice / update' };

export default async function EditUpdatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const update = await apiGet<AdminUpdateDetail>(`/admin/updates/${encodeURIComponent(id)}`);

  if (!update) {
    const health = await apiGet<{ status: string }>('/health');
    if (health) notFound();
    return <ApiOffline />;
  }

  return (
    <div className="mx-auto max-w-4xl py-2">
      <UpdateForm initialData={update} mode="edit" />
    </div>
  );
}
