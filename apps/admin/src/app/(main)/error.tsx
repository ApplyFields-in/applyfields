'use client';

import { useEffect } from 'react';
import { buttonClass, Card } from '@applyfields/ui';
import { RotateCw, ServerCrash } from 'lucide-react';
import Link from 'next/link';

/** Any page inside the portal that crashes while loading lands here (the sidebar stays). */
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => console.error(error), [error]);

  // In production a server crash hides its message and only gives a digest (look it up in Vercel logs).
  const serverSide = Boolean(error.digest);

  return (
    <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ServerCrash className="size-7" aria-hidden="true" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-red-600">
        {serverSide ? 'Server error (500)' : 'Page error'}
      </p>
      <h1 className="mt-1 text-xl font-bold">This page could not load</h1>
      <p className="mt-2 text-sm text-teal/80">
        {serverSide
          ? 'The server failed while building this page. Try again; if it keeps happening, the API may be down or redeploying.'
          : error.message || 'Something in this page broke.'}
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-teal/60">
          Error code: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={retry} className={buttonClass({ variant: 'primary', size: 'sm' })}>
          <RotateCw className="size-3.5" aria-hidden="true" /> Try again
        </button>
        <Link href="/" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          Go to dashboard
        </Link>
      </div>
    </Card>
  );
}
