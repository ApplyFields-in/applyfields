import { ComingSoon } from '@applyfields/ui';
import { DETAIL_SECTIONS } from '@/lib/sections';

export default async function Page({ params }: PageProps<'/scholarships/[slug]'>) {
  const { slug } = await params;
  return (
    <ComingSoon
      title='Scholarship details'
      description='Who can apply, what you get, the documents you need and the official way to apply.'
      owner="Karthik"
      when='Week 5'
      detail={`/scholarships/${slug}`}
      items={DETAIL_SECTIONS.scholarship}
      backHref="/scholarships"
      backLabel='Back to scholarships'
    />
  );
}
