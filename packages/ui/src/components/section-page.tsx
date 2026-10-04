import { ChevronRight, CircleCheck, Construction, SendHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass, cn } from '../cn';
import { Avatar, Badge, Card, EmptyState, IconTile, PageHeader, ProgressBar, SectionTitle } from './primitives';

/* ------------------------------------------------------------------ types */

export type PreviewItem = { title: string; meta?: string; badge?: string; href?: string; icon?: ReactNode };

export type SectionPreview =
  | { kind: 'cards'; items: PreviewItem[] }
  | { kind: 'list'; items: PreviewItem[] }
  | { kind: 'steps'; title: string; items: { title: string; done?: boolean }[] }
  | { kind: 'form'; groups: { title: string; fields: string[] }[] }
  | { kind: 'chat'; messages: { from: 'user' | 'ai'; text: string }[] }
  | { kind: 'empty'; title: string; text: string; action?: { label: string; href: string } };

/** Everything a section page needs — the apps keep one of these per page. */
export type SectionInfo = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  owner: string;
  when: string;
  features: string[];
  preview: SectionPreview;
  note?: string;
};

/* ------------------------------------------------------------------ status chip */

export function BuildStatus({ owner, when }: { owner: string; when: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-cream px-3 py-1.5 text-xs font-semibold">
      <Construction className="size-4 text-sea" aria-hidden="true" />
      Being built · {when} · {owner}
    </span>
  );
}

/* ------------------------------------------------------------------ section page */

export function SectionPage({ info, children }: { info: SectionInfo; children?: ReactNode }) {
  return (
    <>
      <PageHeader
        eyebrow={info.eyebrow}
        title={info.title}
        description={info.description}
        icon={info.icon}
        actions={<BuildStatus owner={info.owner} when={info.when} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="min-w-0 p-5">
          <SectionTitle title="Preview" action={<Badge tone="celadon">Sample data</Badge>} />
          {children ?? <Preview preview={info.preview} />}
          {info.note && <p className="mt-4 text-xs text-teal/80">{info.note}</p>}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle title="What this page will have" />
            <ul className="space-y-2.5">
              {info.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-sea" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card tone="tea" className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal/80">Who builds it</p>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={info.owner} />
              <div>
                <p className="font-bold">{info.owner}</p>
                <p className="text-sm text-teal/80">{info.when}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-teal/80">
              This is the outer look only. Buttons and links open a “not built yet” page until the feature is ready.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ previews */

function ItemShell({ item, className, children }: { item: PreviewItem; className: string; children: ReactNode }) {
  return item.href ? (
    <Link href={item.href} className={cn(className, 'transition-colors hover:border-teal/40')}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

export function Preview({ preview }: { preview: SectionPreview }) {
  switch (preview.kind) {
    case 'cards':
      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {preview.items.map((item) => (
            <ItemShell key={item.title} item={item} className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas p-4">
              <div className="flex items-start justify-between gap-2">
                {item.icon ? <IconTile tone="cream">{item.icon}</IconTile> : <span />}
                {item.badge && <Badge tone="tea">{item.badge}</Badge>}
              </div>
              <div>
                <p className="font-bold leading-snug">{item.title}</p>
                {item.meta && <p className="mt-1 text-sm text-teal/80">{item.meta}</p>}
              </div>
            </ItemShell>
          ))}
        </div>
      );

    case 'list':
      return (
        <ul className="divide-y divide-teal/10">
          {preview.items.map((item) => (
            <li key={item.title}>
              <ItemShell item={item} className="flex items-center gap-3 rounded-xl px-2 py-3">
                {item.icon && <IconTile tone="tea" className="size-9">{item.icon}</IconTile>}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.title}</p>
                  {item.meta && <p className="truncate text-sm text-teal/80">{item.meta}</p>}
                </div>
                {item.badge && <Badge tone="celadon">{item.badge}</Badge>}
                {item.href && <ChevronRight className="size-4 shrink-0 text-teal/80" aria-hidden="true" />}
              </ItemShell>
            </li>
          ))}
        </ul>
      );

    case 'steps': {
      const done = preview.items.filter((s) => s.done).length;
      return (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-bold">{preview.title}</p>
            <span className="text-sm font-semibold">
              {done} of {preview.items.length} steps
            </span>
          </div>
          <ProgressBar value={(done / preview.items.length) * 100} label={`${preview.title} progress`} className="mb-5" />
          <ol className="relative space-y-3 border-l-2 border-teal/15 pl-6">
            {preview.items.map((step, i) => {
              const current = !step.done && i === done;
              return (
                <li key={step.title} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[33px] top-0.5 grid size-5 place-items-center rounded-full text-[10px] font-bold',
                      step.done ? 'bg-sea text-cream' : current ? 'bg-cream ring-2 ring-sea' : 'bg-tea text-teal',
                    )}
                  >
                    {step.done ? '✓' : i + 1}
                  </span>
                  <p className={cn('text-sm', current ? 'font-bold' : 'font-medium', step.done && 'text-teal/80')}>
                    {step.title}
                    {current && <Badge tone="celadon" className="ml-2">Next</Badge>}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      );
    }

    case 'form':
      return (
        <div className="space-y-6">
          {preview.groups.map((group) => (
            <fieldset key={group.title} disabled>
              <legend className="mb-3 text-sm font-bold">{group.title}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <label key={field} className="block text-sm">
                    <span className="mb-1 block font-medium text-teal/80">{field}</span>
                    <span className="flex h-10 items-center rounded-xl border border-line bg-canvas px-3 text-teal/80">—</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <span aria-disabled="true" className={buttonClass()}>Save (not built yet)</span>
        </div>
      );

    case 'chat':
      return (
        <div>
          <div className="space-y-3">
            {preview.messages.map((m, i) => (
              <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <p
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                    m.from === 'user' ? 'rounded-br-md bg-teal text-cream' : 'rounded-bl-md bg-tea text-teal',
                  )}
                >
                  {m.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-full border border-line bg-canvas p-1.5 pl-4">
            <span className="flex-1 text-sm text-teal/80">Ask a career question… (coming soon)</span>
            <span aria-disabled="true" className={buttonClass({ size: 'sm' })}>
              <SendHorizontal aria-hidden="true" /> Send
            </span>
          </div>
        </div>
      );

    case 'empty':
      return (
        <EmptyState
          title={preview.title}
          text={preview.text}
          action={
            preview.action && (
              <Link href={preview.action.href} className={buttonClass()}>
                {preview.action.label}
              </Link>
            )
          }
        />
      );
  }
}
