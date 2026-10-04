import { Briefcase } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata = { title: 'Government jobs' };

/** List page — data comes from GET /api/v1/opportunities?type=govt_job */
export default function Page() {
  return (
    <OpportunityListPage
      type="govt_job"
      title='Government jobs'
      description='Central, state, district, PSU, railways, banking, defence and police jobs — with eligibility explained simply.'
      icon={<Briefcase />}
      owner='Karthik (page) · Harsha (data)'
      when='Week 3'
      categories={['Central government', 'State government', 'District recruitment', 'Panchayat', 'Municipal', 'PSU', 'Railways', 'Banking', 'Defence', 'Police', 'SSC', 'UPSC', 'APPSC', 'TSPSC']}
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
