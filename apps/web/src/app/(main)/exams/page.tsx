import { GraduationCap } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata = { title: 'Exams' };

/** List page — data comes from GET /api/v1/opportunities?type=exam */
export default function Page() {
  return (
    <OpportunityListPage
      type="exam"
      title='Exams'
      description='Entrance, competitive and recruitment exams — dates, eligibility, admit cards, answer keys and results.'
      icon={<GraduationCap />}
      owner='Karthik (page) · Harsha (data)'
      when='Week 4'
      categories={['JEE', 'NEET', 'CUET', 'CAT', 'UPSC', 'SSC', 'Banking', 'APPSC', 'TSPSC', 'State entrance exams']}
      features={[
        'Application, correction and exam dates',
        'Admit cards, answer keys and results',
        'Eligibility, age and qualification',
        'Syllabus and previous papers',
        'Counselling and next steps',
        'Save exams and get reminders',
      ]}
    />
  );
}
