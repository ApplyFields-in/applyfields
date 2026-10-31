import type { Metadata } from 'next';
import { CommunityDiscussionSection } from '@/components/community-discussion-section';
import { CommunityPageHeader } from '@/components/community-page-header';

export const metadata: Metadata = {
  title: 'Candidate Community & Q&A Discussions · ApplyFields',
  description:
    'Join real discussions with peer candidates and mentors on government jobs, entrance exams, admit cards, preparation tips, and counseling.',
};

export default function CommunityHubPage() {
  return (
    <div className="mx-auto max-w-[1360px] space-y-8 pb-16 pt-4">
      {/* Top Banner */}
      <CommunityPageHeader />

      {/* Community Section */}
      <CommunityDiscussionSection />
    </div>
  );
}
