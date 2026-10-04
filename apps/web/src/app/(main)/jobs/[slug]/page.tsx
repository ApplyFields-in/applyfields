import { ComingSoon } from '@applyfields/ui';
import { DETAIL_SECTIONS } from '@/lib/sections';

export default async function Page({ params }: PageProps<'/jobs/[slug]'>) {
  const { slug } = await params;
  return (
    <ComingSoon
      title='Job details'
      description='Every section of the official notification — explained simply, with the official apply link.'
      owner="Karthik"
      when='Week 3'
      detail={`/jobs/${slug}`}
      items={DETAIL_SECTIONS.job}
      backHref="/jobs"
      backLabel='Back to jobs'
    />
  );
}
