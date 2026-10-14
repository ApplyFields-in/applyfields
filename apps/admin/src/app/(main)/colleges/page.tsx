import type { InstitutionListResponse } from '@applyfields/types';
import { buttonClass, PageHeader } from '@applyfields/ui';
import { Building, ExternalLink } from 'lucide-react';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { CollegesTableClient } from '@/components/colleges-table-client';
import { apiGet } from '@/lib/api';

export const metadata = {
  title: 'Colleges & Universities Directory',
  description: 'Manage verified colleges, institutions, rankings, accreditation, and edit missing data fields.',
};

export default async function AdminCollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; state?: string; status?: string; page?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const type = typeof sp.type === 'string' ? sp.type.trim() : '';
  const state = typeof sp.state === 'string' ? sp.state.trim().toUpperCase() : '';
  const status = typeof sp.status === 'string' ? sp.status.trim() : '';
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (type) query.set('type', type);
  if (state) query.set('state', state);
  if (status) query.set('status', status);
  query.set('page', String(page));
  query.set('limit', '20');

  const data = await apiGet<InstitutionListResponse>(
    `/admin/institutions?${query.toString()}`,
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Content Management"
        title="Colleges & Universities"
        description="Verified directory of 13,000+ higher education institutions. Fill missing fee and placement fields, add new institutions, or edit rankings."
        icon={<Building />}
        actions={
          <div className="flex items-center gap-2">
            <a
              href="http://localhost:3000/career/colleges"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: 'secondary', size: 'sm', className: 'gap-1.5' })}
            >
              <ExternalLink className="size-3.5" /> View Citizen Directory
            </a>
          </div>
        }
      />

      {data === null ? (
        <ApiOffline />
      ) : (
        <CollegesTableClient
          colleges={data.items || []}
          total={data.total || 0}
          page={data.page || page}
          limit={data.limit || 20}
          totalPages={data.total_pages || 1}
          q={q}
          type={type}
          state={state}
        />
      )}
    </div>
  );
}
