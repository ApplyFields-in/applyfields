import { ArrowLeft, CircleCheck, Construction, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { buttonClass } from '../cn';
import { Badge, Card, IconTile } from './primitives';
import { Logo } from './shell';

/** Shown for pages that are planned but not built yet (Login, job details, …). */
export function ComingSoon({
  title,
  description,
  owner,
  when,
  items = [],
  detail,
  backHref = '/',
  backLabel = 'Back to home',
}: {
  title: string;
  description: string;
  owner?: string;
  when?: string;
  items?: string[];
  detail?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <IconTile tone="celadon" className="size-12 rounded-2xl [&>svg]:size-6">
          <Construction />
        </IconTile>
        <div className="min-w-0">
          <Badge tone="teal">Not built yet</Badge>
          <h1 className="mt-2 text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-teal/80">{description}</p>
          {detail && <p className="mt-2 break-all font-mono text-xs text-teal/80">{detail}</p>}
        </div>
      </div>

      {(owner || when) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {when && <Badge tone="tea">{when}</Badge>}
          {owner && <Badge tone="outline">Built by {owner}</Badge>}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 rounded-2xl bg-canvas p-4">
          <p className="mb-2 text-sm font-bold">This page will include</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={backHref} className={buttonClass()}>
          <ArrowLeft aria-hidden="true" /> {backLabel}
        </Link>
        <Link href="/help" className={buttonClass({ variant: 'secondary' })}>
          <LifeBuoy aria-hidden="true" /> Help centre
        </Link>
      </div>
    </Card>
  );
}

/** Full-page version for links that have no page at all yet (used by not-found). */
export function NotBuiltYet({ portal }: { portal?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <Logo subtitle={portal} />
      <ComingSoon
        title="This page isn’t built yet"
        description="ApplyFields is being built step by step. This link points to a page the team hasn’t built yet — or the address is mistyped."
      />
    </div>
  );
}
