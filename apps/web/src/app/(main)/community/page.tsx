import type { Metadata } from 'next';
import { CommunityDiscussionSection } from '@/components/community-discussion-section';

export const metadata: Metadata = {
  title: 'Candidate Community & Q&A Discussions · ApplyFields',
  description:
    'Join real discussions with peer candidates and mentors on government jobs, entrance exams, admit cards, preparation tips, and counseling.',
};

export default function CommunityHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16 pt-4">
      {/* Top Banner */}
      <div className="rounded-3xl border border-line/60 bg-gradient-to-br from-cream/40 via-canvas to-cream/20 p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <span className="inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal">
            ApplyFields Community
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-teal sm:text-3xl">
            Candidate Discussions &amp; Peer Q&amp;A
          </h1>
          <p className="text-xs sm:text-sm text-teal/80 leading-relaxed">
            Ask questions regarding upcoming examination dates, hall ticket downloads, cutoff predictions, and syllabus breakdowns. Share verified notifications and connect with fellow aspirants.
          </p>
        </div>
      </div>

      {/* Community Section */}
      <CommunityDiscussionSection />
    </div>
  );
}
