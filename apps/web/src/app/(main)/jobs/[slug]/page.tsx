import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { OpportunityDetail } from '@applyfields/types';
import { OpportunityDetailView } from '@/components/opportunity-detail-view';
import { apiGet } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await apiGet<OpportunityDetail>(`/opportunities/${slug}`);

  if (!item) {
    return {
      title: 'Job Not Found — ApplyFields',
      description: 'The requested government job notification could not be found.',
    };
  }

  const title = `${item.title} — ${item.organization.short_name || item.organization.name} Recruitment`;
  const description =
    item.summary ||
    `Apply for ${item.title} conducted by ${item.organization.name}. Check eligibility, age limits, vacancy breakdown, syllabus, and official apply link.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://applyfields.in/jobs/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://applyfields.in/jobs/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const item = await apiGet<OpportunityDetail>(`/opportunities/${slug}`);

  if (!item || item.type !== 'govt_job') {
    notFound();
  }

  return <OpportunityDetailView item={item} />;
}
