import { buttonClass, EmptyState } from '@applyfields/ui';
import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';

/** Shown when /review/[id] points to a draft that doesn't exist (deleted, or a mistyped link). */
export default function DraftNotFound() {
  return (
    <EmptyState
      icon={<SearchX />}
      title="This draft doesn’t exist"
      text="It may have been deleted, or the link is wrong."
      action={
        <Link href="/review" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          <ArrowLeft aria-hidden="true" /> Back to the review queue
        </Link>
      }
    />
  );
}
