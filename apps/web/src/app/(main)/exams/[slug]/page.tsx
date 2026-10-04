import { ComingSoon } from '@applyfields/ui';
import { DETAIL_SECTIONS } from '@/lib/sections';

export default async function Page({ params }: PageProps<'/exams/[slug]'>) {
  const { slug } = await params;
  return (
    <ComingSoon
      title='Exam details'
      description='Dates, eligibility, syllabus, admit cards, answer keys and results — in one place.'
      owner="Karthik"
      when='Week 4'
      detail={`/exams/${slug}`}
      items={DETAIL_SECTIONS.exam}
      backHref="/exams"
      backLabel='Back to exams'
    />
  );
}
