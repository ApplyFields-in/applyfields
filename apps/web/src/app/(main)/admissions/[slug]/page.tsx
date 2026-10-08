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
      title: 'Admission Not Found — ApplyFields',
      description: 'The requested admission notification could not be found.',
    };
  }

  const title = `${item.title} — Admission Process, Eligibility & Dates`;
  const description =
    item.summary ||
    `Apply for admission at ${item.organization.name}. Review course eligibility criteria, entrance exams, fee structure, and the official application portal.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://applyfields.in/admissions/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://applyfields.in/admissions/${slug}`,
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

  if (!item || item.type !== 'admission') {
    notFound();
  }

  return <OpportunityDetailView item={item} />;
}
