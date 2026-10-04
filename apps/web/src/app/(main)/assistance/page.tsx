import { SectionPage } from '@applyfields/ui';
import { SECTIONS } from '@/lib/sections';

export const metadata = { title: SECTIONS.assistance.title };

/** Outer look only. Replace <SectionPage /> with the real page when you build it. */
export default function Page() {
  return <SectionPage info={SECTIONS.assistance} />;
}
