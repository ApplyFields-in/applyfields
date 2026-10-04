import { ComingSoon } from '@applyfields/ui';
import { DETAIL_SECTIONS } from '@/lib/sections';

export default async function Page({ params }: PageProps<'/admissions/[slug]'>) {
  const { slug } = await params;
  return (
    <ComingSoon
      title='Admission details'
      description='The course, the institution, who can join and how to apply officially.'
      owner="Karthik"
      when='Week 5'
      detail={`/admissions/${slug}`}
      items={DETAIL_SECTIONS.admission}
      backHref="/admissions"
      backLabel='Back to admissions'
    />
  );
}
