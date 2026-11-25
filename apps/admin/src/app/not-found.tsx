import { buttonClass, Card } from '@applyfields/ui';
import { SearchX } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <SearchX className="size-7" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Not found (404)</p>
        <h1 className="mt-1 text-xl font-bold">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-sm text-teal/80">
          The link may be wrong, or the record was deleted or moved.
        </p>
        <Link href="/" className={buttonClass({ variant: 'primary', size: 'sm', className: 'mt-6' })}>
          Go to dashboard
        </Link>
      </Card>
    </div>
  );
}
