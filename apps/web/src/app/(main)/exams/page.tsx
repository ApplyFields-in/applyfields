import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { OpportunityListPage } from '@/components/opportunity';

export const metadata: Metadata = {
  title: 'Competitive & Entrance Exams in India — JEE, NEET, CUET, UPSC',
  description:
    'Find upcoming entrance and competitive examinations in India. Get notification updates, eligibility requirements, syllabus, exam dates, admit cards, and results.',
  alternates: {
    canonical: 'https://applyfields.in/exams',
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
      type="exam"
      title="Exams"
      description="Entrance, competitive and recruitment exams — dates, eligibility, admit cards, answer keys and results."
      icon={<GraduationCap />}
      owner="Karthik (page) · Harsha (data)"
      when="Week 4"
      basePath="/exams"
      categories={[
        'JEE',
        'NEET',
        'CUET',
        'CAT',
        'UPSC',
        'SSC',
        'Banking',
        'APPSC',
        'TSPSC',
        'State entrance exams',
      ]}
      searchParams={sp}
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
