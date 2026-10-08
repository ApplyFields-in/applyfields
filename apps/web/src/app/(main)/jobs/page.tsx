import type { Metadata } from 'next';
import { Briefcase } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata: Metadata = {
  title: 'Government Jobs in India — Central, State & PSU Recruitments',
  description:
    'Explore verified government job notifications across Central, State, Railways, Banking, Defence, Police, SSC, UPSC, and State PSCs with eligibility, vacancies, and official apply links.',
  alternates: {
    canonical: 'https://applyfields.in/jobs',
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
    eligible?: string;
  }>;
}) {
  const sp = await searchParams;

  return (
    <OpportunityListPage
      eligibleOnly={sp.eligible === 'true'}
      type="govt_job"
      title="Government jobs"
      description="Central, state, district, PSU, railways, banking, defence and police jobs — with eligibility explained simply."
      icon={<Briefcase />}
      owner="Karthik (page) · Harsha (data)"
      when="Week 3"
      basePath="/jobs"
      categories={[
        'Central',
        'State',
        'District',
        'Panchayat',
        'Municipal',
        'PSU',
        'Railways',
        'Banking',
        'Defence',
        'Police',
        'SSC',
        'UPSC',
        'APPSC',
        'TSPSC',
      ]}
      searchParams={sp}
      features={[
        'Filter by state, qualification, category and last date',
        '“Eligible for me” filter from your profile',
        'Save jobs and get reminders',
        'Admit cards, results and updates for every job',
        'Official notification and apply link on every job',
        'Shows when each job was last verified',
      ]}
    />
  );
}
