import type { AdminSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, PageHeader, SectionTitle } from '@applyfields/ui';
import { ArrowRight, Inbox, LayoutDashboard, Radar } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';

const KIND_LABEL = { new: 'New', change: 'Change', update: 'Update' } as const;

/** '2026-10-04T05:56:18Z' → '4 Oct, 11:26 am' */
function when(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** Internal Portal dashboard (founder doc §22.8) — data from GET /api/v1/admin/summary */
export default async function DashboardPage() {
  await connection();
  const data = await apiGet<AdminSummary>('/admin/summary');

  return (
    <>
      <PageHeader
        eyebrow="Internal Portal"
        title="Dashboard"
        description="What needs attention today: drafts to review, scrapers, reports and deadlines."
        icon={<LayoutDashboard />}
        actions={data?.sample ? <Badge tone="celadon">Sample data from the API</Badge> : undefined}
      />

      {!data ? (
        <ApiOffline />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {data.stats.map((s) => (
              <Card key={s.key} className="p-5">
                <p className="text-sm font-semibold text-teal/80">{s.label}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">{s.value.toLocaleString('en-IN')}</p>
                <p className="mt-1 text-xs font-semibold">{s.hint}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="min-w-0 p-5">
              <SectionTitle
                title={
                  <span className="flex items-center gap-2">
                    <Inbox className="size-4 text-sea" aria-hidden="true" /> Review queue
                  </span>
                }
                action={
                  <Link href="/review" className="flex items-center gap-1 text-xs font-semibold hover:underline">
                    Open queue <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wider text-teal/80">
                      <th className="py-2 pr-3 font-bold">Item</th>
                      <th className="py-2 pr-3 font-bold">Source</th>
                      <th className="py-2 pr-3 font-bold">Confidence</th>
                      <th className="py-2 font-bold">Found at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.review_queue.map((r) => (
                      <tr key={r.id} className="border-b border-line last:border-0">
                        <td className="py-3 pr-3">
                          <Link href={`/review/${r.id}`} className="font-semibold hover:underline">
                            {r.title}
                          </Link>
                          <Badge tone="tea" className="ml-2">
                            {KIND_LABEL[r.kind]}
                          </Badge>
                        </td>
                        <td className="py-3 pr-3 font-mono text-xs">{r.source}</td>
                        <td className="py-3 pr-3">
                          <Badge tone={r.confidence < 0.6 ? 'teal' : 'celadon'}>
                            {Math.round(r.confidence * 100)}%{r.confidence < 0.6 ? ' · check carefully' : ''}
                          </Badge>
                        </td>
                        <td className="py-3 text-teal/80">{when(r.found_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle
                title={
                  <span className="flex items-center gap-2">
                    <Radar className="size-4 text-sea" aria-hidden="true" /> Scrapers
                  </span>
                }
                action={
                  <Link href="/scrapers" className="text-xs font-semibold hover:underline">
                    Details
                  </Link>
                }
              />
              <ul className="space-y-2">
                {data.scrapers.map((s) => {
                  const failing = s.consecutive_failures > 0;
                  return (
                    <li key={s.key} className={cn('flex items-center gap-3 rounded-2xl p-3', failing ? 'bg-tea' : 'bg-canvas')}>
                      <span className={cn('size-2.5 shrink-0 rounded-full', failing ? 'bg-teal' : 'bg-sea')} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.name}</p>
                        <p className="text-xs text-teal/80">
                          {failing ? `${s.consecutive_failures} failures in a row` : 'Working'}
                          {s.last_success_at ? ` · last success ${when(s.last_success_at)}` : ''}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link href="/scrapers" className={buttonClass({ variant: 'secondary', size: 'sm', className: 'mt-4 w-full' })}>
                Run a scraper now
              </Link>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
