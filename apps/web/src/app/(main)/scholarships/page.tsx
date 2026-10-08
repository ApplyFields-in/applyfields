import type { Metadata } from 'next';
import { Award } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata: Metadata = {
  title: 'Government Scholarships in India — Central, State & NSP Schemes',
  description:
    'Discover open government scholarships in India. Check eligibility, family income limits, benefits amount, required certificates, and the official portal to apply.',
  alternates: {
    canonical: 'https://applyfields.in/scholarships',
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    state?: string;
    qualification?: string;
    deadline?: string;
  }>;
}) {
  const sp = await searchParams;

  return (
    <OpportunityListPage
      type="scholarship"
      title="Scholarships"
      description="Central, state and NSP scholarships — with income and category conditions checked against your profile."
      icon={<Award />}
      owner="Karthik (page) · Harsha (data)"
      when="Week 5"
      basePath="/scholarships"
      categories={[
        'Central',
        'State',
        'National Scholarship Portal',
        'Merit-based',
        'SC / ST / BC',
        'Minority',
        'For girls',
        'Disability',
      ]}
      searchParams={sp}
      features={[
        'Eligibility, income and category conditions',
        'Benefits (where officially available)',
        'Required documents',
        'Deadlines and reminders',
        'Official application route',
        'Eligibility check from your profile',
      ]}
    />
  );
}
