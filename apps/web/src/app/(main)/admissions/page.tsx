import type { Metadata } from 'next';
import { School } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata: Metadata = {
  title: 'College & University Admissions in India — UG & PG Courses',
  description:
    'Browse verified college, university, and course admission notices in India. Check eligibility, admission process, important dates, fees, and the official route to apply.',
  alternates: {
    canonical: 'https://applyfields.in/admissions',
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
      type="admission"
      title="Admissions"
      description="College, university and course admissions — entrance-based and direct, with the official application route."
      icon={<School />}
      owner="Karthik (page) · Harsha (data)"
      when="Week 5"
      basePath="/admissions"
      categories={[
        'Engineering',
        'Medical',
        'Degree',
        'Diploma / Polytechnic',
        'MBA / MCA',
        'Law',
        'Universities',
      ]}
      searchParams={sp}
      features={[
        'Institution and course details',
        'Eligibility and admission process',
        'Entrance exams and important dates',
        'Fees (where available)',
        'Related scholarships and careers',
        'Official application route',
      ]}
    />
  );
}
