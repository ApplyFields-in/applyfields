import { ComingSoon } from '@applyfields/ui';
import { DETAIL_SECTIONS } from '@/lib/sections';

export default async function Page({ params }: PageProps<'/services/[slug]'>) {
  const { slug } = await params;
  return (
    <ComingSoon
      title="Service details"
      description="What the service is, who needs it, the documents, the official fee and the official way to apply."
      owner="Karthik"
      when="Week 6"
      detail={`/services/${slug}`}
      items={DETAIL_SECTIONS.service}
      backHref="/services"
      backLabel="Back to services"
    />
  );
}
