import { notFound, permanentRedirect } from 'next/navigation';
import type { OpportunityDetail } from '@applyfields/types';
import { apiGet } from '@/lib/api';
import { TYPE_META } from '@/lib/format';

/**
 * /opportunities/<slug> → the listing's real page (/jobs, /exams, /scholarships, /admissions).
 * Links that only know the slug (corrigendum banner, notifications) land here instead of a 404.
 */
export default async function OpportunityRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await apiGet<OpportunityDetail>(`/opportunities/${encodeURIComponent(slug)}`);
  const base = item ? TYPE_META[item.type]?.base : undefined;
  if (!base) notFound();
  permanentRedirect(`${base}/${encodeURIComponent(slug)}`);
}
