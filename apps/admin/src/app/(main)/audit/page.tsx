import type { Metadata } from 'next';
import { connection } from 'next/server';
import type { AdminAuditListResponse } from '@applyfields/types';
import { PageHeader } from '@applyfields/ui';
import { ShieldCheck } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { SECTIONS } from '@/lib/sections';
import { AuditClient } from './audit-client';

export const metadata: Metadata = {
  title: 'Audit & Staff Activity — ApplyFields Editorial Portal',
  description: 'Team audit logs and version modifications for recruitment opportunities.',
};

export default async function AuditPage() {
  await connection();
  const res = await apiGet<AdminAuditListResponse>('/admin/audit');

  const items = res?.items ?? [];
  const total = res?.total ?? items.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit & Team Actions"
        description="Comprehensive audit trail recording staff creates, updates, status changes, and version restorations."
        eyebrow={
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal">
            <ShieldCheck className="size-4" />
            <span>Governance &amp; Accountability</span>
          </span>
        }
      />

      <AuditClient initialItems={items} total={total} />
    </div>
  );
}
