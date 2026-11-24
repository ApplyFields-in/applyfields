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
      title: 'Exam Not Found — ApplyFields',
      description: 'The requested examination could not be found.',
    };
  }

  const title = `${item.title} — Important Dates, Eligibility & Syllabus`;
  const description =
    item.summary ||
    `Complete details for ${item.title} conducted by ${item.organization.name}. Check exam dates, application window, eligibility, pattern, admit card, and results.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://applyfields.com/exams/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://applyfields.com/exams/${slug}`,
      type: 'article',
      siteName: 'ApplyFields',
      locale: 'en_IN',
      // A page-level openGraph replaces the root one, so the shared card must be named here.
      images: '/opengraph-image',
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

  if (!item || item.type !== 'exam') {
    notFound();
  }

  return <OpportunityDetailView item={item} />;
}
