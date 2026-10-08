import { School } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata = { title: 'Admissions' };

/** List page — data comes from GET /api/v1/opportunities?type=admission */
export default async function Page({ searchParams }: PageProps<'/admissions'>) {
  const { eligible } = await searchParams;
  return (
    <OpportunityListPage
      eligibleOnly={eligible === 'true'}
      type="admission"
      title='Admissions'
      description='College, university and course admissions — entrance-based and direct, with the official application route.'
      icon={<School />}
      owner='Karthik (page) · Harsha (data)'
      when='Week 5'
      categories={['Engineering', 'Medical', 'Degree', 'Diploma / Polytechnic', 'MBA / MCA', 'Law', 'Universities']}
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
