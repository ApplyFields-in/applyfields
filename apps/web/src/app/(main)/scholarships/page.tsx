import { Award } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata = { title: 'Scholarships' };

/** List page — data comes from GET /api/v1/opportunities?type=scholarship */
export default function Page() {
  return (
    <OpportunityListPage
      type="scholarship"
      title='Scholarships'
      description='Central, state and NSP scholarships — with income and category conditions checked against your profile.'
      icon={<Award />}
      owner='Karthik (page) · Harsha (data)'
      when='Week 5'
      categories={['Central', 'State', 'National Scholarship Portal', 'Merit-based', 'SC / ST / BC', 'Minority', 'For girls', 'Disability']}
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
