import type { ApiHealth, ReviewDetail } from '@applyfields/types';
import { Badge } from '@applyfields/ui';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { formatFoundAt, TYPE_LABEL } from '@/components/review-ui';
import { apiGet } from '@/lib/api';
import { ReviewWorkspaceClient } from './review-workspace-client';

export const metadata = { title: 'Review draft' };

/**
 * Review one draft: the official PDF on the left, what was extracted on the right (read-only).
 * Data: GET /api/v1/admin/review/:id.
 */
export default async function Page({ params }: PageProps<'/review/[id]'>) {
  await connection();
  const { id } = await params;
  const d = await apiGet<ReviewDetail>(`/admin/review/${encodeURIComponent(id)}`);

  if (!d) {
    // The API answered nothing: either it is down, or this draft doesn't exist.
    const health = await apiGet<ApiHealth>('/health');
    if (health) notFound();
    return <ApiOffline />;
  }

  return (
    <>
      <Link href="/review" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Review queue
      </Link>

      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="teal">{TYPE_LABEL[d.type]}</Badge>
          <Badge tone={d.status === 'draft' ? 'celadon' : 'tea'}>{d.status === 'draft' ? 'Draft' : d.status}</Badge>
          {d.needs_care && (
            <Badge tone="outline" className="bg-cream">
              <TriangleAlert aria-hidden="true" /> Check carefully
            </Badge>
          )}
          <span className="text-xs text-teal/70">Version {d.version}</span>
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{d.title || 'Untitled draft'}</h1>
        <p className="mt-1 text-sm text-teal/80">
          {d.organization.name}
          {d.source.fetched_at && <> · found {formatFoundAt(d.source.fetched_at)}</>}
          {d.source.key && <> · source {d.source.key.toUpperCase()}</>}
        </p>
      </header>

      <ReviewWorkspaceClient detail={d} />
    </>
  );
}
