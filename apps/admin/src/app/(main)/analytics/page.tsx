import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import type { AnalyticsFunnelSummary, AnalyticsOverview } from '@applyfields/types';
import { Card, PageHeader } from '@applyfields/ui';
import { Bot, TrendingUp } from 'lucide-react';
import { apiGetWithStatus } from '@/lib/api';
import { DailyBars } from '@/components/daily-bars';

export const metadata: Metadata = {
  title: 'Analytics — ApplyFields Admin',
};

const n = (v: number) => v.toLocaleString('en-IN');
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '–');

function Stat({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <div className="text-xs font-semibold text-teal/70">{label}</div>
      <div className="mt-1 font-mono text-2xl font-black text-teal">{value}</div>
      {note && <div className="mt-0.5 text-xs text-teal/60">{note}</div>}
    </>
  );
  const cls = 'block rounded-2xl border border-line bg-white p-4';
  return href ? (
    <Link href={href} className={`${cls} transition hover:border-[#0e7bf4]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** A row of steps with the share that made it from one step to the next. */
function Steps({ steps }: { steps: Array<{ label: string; count: number }> }) {
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {steps.map((s, i) => (
        <li key={s.label} className="rounded-2xl bg-canvas p-3">
          <div className="text-xs font-semibold text-teal/70">
            {i + 1}. {s.label}
          </div>
          <div className="mt-1 font-mono text-xl font-black text-teal">{n(s.count)}</div>
          {i > 0 && <div className="text-xs text-teal/60">{pct(s.count, steps[i - 1].count)} of previous step</div>}
        </li>
      ))}
    </ol>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await connection();
  const { days = '30' } = await searchParams;
  const [overviewRes, funnelRes] = await Promise.all([
    apiGetWithStatus<AnalyticsOverview>(`/admin/analytics/overview?days=${encodeURIComponent(days)}`),
    apiGetWithStatus<AnalyticsFunnelSummary>(`/admin/analytics/funnel?days=${encodeURIComponent(days)}`),
  ]);
  const o = overviewRes.data;
  const f = funnelRes.data;
  const waiting = o ? o.partners.centres.pending + o.partners.colleges.pending : 0;

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow="Insights"
          title="Analytics"
          description="Who signs up, who visits, and what they do. Visits are anonymous and only counted for people who accepted analytics cookies."
          icon={<TrendingUp />}
        />
        <div className="flex flex-wrap items-center gap-2">
          {['7', '30', '90'].map((d) => (
            <Link
              key={d}
              href={`/analytics?days=${d}`}
              aria-current={days === d ? 'page' : undefined}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                days === d ? 'bg-teal text-white' : 'bg-white text-teal/70 hover:text-teal'
              }`}
            >
              Last {d} days
            </Link>
          ))}
          <Link
            href="/analytics/chatbot"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-teal/80 hover:text-teal"
          >
            <Bot className="size-3.5" /> Chatbot usage
          </Link>
        </div>
      </div>

      {!o ? (
        <Card className="p-6 text-sm text-teal/80">
          Could not load analytics{overviewRes.error ? `: ${overviewRes.error}` : ''}. Try again in a minute.
        </Card>
      ) : (
        <>
          <section aria-labelledby="glance" className="space-y-3">
            <h2 id="glance" className="text-sm font-black text-teal">
              At a glance
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <Stat label="Users" value={n(o.users.total)} note={`+${n(o.users.new)} new`} href="/users" />
              <Stat label="Signed in" value={n(o.users.active)} note="in this period" />
              <Stat label="Visitors" value={n(o.visits.visitors)} note="anonymous visits" />
              <Stat label="Page views" value={n(o.visits.page_views)} />
              <Stat label="Bookings" value={n(o.bookings.total)} note={`${n(o.bookings.completed)} completed`} />
              <Stat
                label="Waiting for approval"
                value={n(waiting)}
                note={`${o.partners.centres.pending} centres · ${o.partners.colleges.pending} colleges`}
                href="/partners"
              />
            </div>
          </section>

          <section aria-label="Daily trends" className="grid gap-4 lg:grid-cols-2">
            <DailyBars title="Sign-ups per day" data={o.users.signups_by_day} unit="sign-ups" />
            <DailyBars title="Page views per day" data={o.visits.views_by_day} unit="views" />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-5">
              <h2 className="text-sm font-black text-teal">Most visited pages</h2>
              {o.visits.top_pages.length === 0 ? (
                <p className="py-4 text-xs text-teal/60">No page views recorded yet in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {o.visits.top_pages.map((p) => (
                    <li key={`${p.site}${p.path}`} className="text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="truncate font-mono text-teal">
                          <span className="text-teal/50">{p.site === 'service' ? 'services' : 'main'} </span>
                          {p.path}
                        </span>
                        <span className="font-mono font-bold text-teal">{n(p.views)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-canvas">
                        <div
                          className="h-1.5 rounded-full bg-[#0e7bf4]"
                          style={{ width: `${(p.views / o.visits.top_pages[0].views) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="space-y-3 p-5">
              <h2 className="text-sm font-black text-teal">Partners</h2>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-teal/60">
                    <th className="py-1.5 font-semibold" />
                    <th className="py-1.5 text-right font-semibold">Waiting</th>
                    <th className="py-1.5 text-right font-semibold">Approved</th>
                    <th className="py-1.5 text-right font-semibold">Rejected</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-teal">
                  {(
                    [
                      ['Service centres', o.partners.centres, '/partners'],
                      ['Colleges', o.partners.colleges, '/partners/colleges'],
                    ] as const
                  ).map(([label, c, href]) => (
                    <tr key={label} className="border-t border-line">
                      <td className="py-2 font-sans font-semibold">
                        <Link href={href} className="hover:underline">
                          {label}
                        </Link>
                      </td>
                      <td className="py-2 text-right font-bold">{c.pending}</td>
                      <td className="py-2 text-right">{c.verified}</td>
                      <td className="py-2 text-right">{c.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-teal/60">
                {n(o.opportunities.published)} opportunities live · {n(o.opportunities.views)} views ·{' '}
                {n(o.opportunities.saves)} saves in this period
              </p>
            </Card>
          </section>
        </>
      )}

      {f && (
        <section aria-labelledby="journey" className="space-y-4">
          <h2 id="journey" className="text-sm font-black text-teal">
            What visitors do
          </h2>
          <Card className="space-y-3 p-5">
            <h3 className="text-xs font-bold text-teal/80">Jobs, exams and scholarships</h3>
            <Steps
              steps={[
                { label: 'Searched', count: f.funnel.searches },
                { label: 'Opened a listing', count: f.funnel.views },
                { label: 'Checked eligibility', count: f.funnel.eligibility_checks },
                { label: 'Saved', count: f.funnel.saves },
                { label: 'Went to apply', count: f.funnel.external_applies },
              ]}
            />
          </Card>
          <Card className="space-y-3 p-5">
            <h3 className="text-xs font-bold text-teal/80">Citizen services</h3>
            <Steps
              steps={[
                { label: 'Browsed centres', count: f.funnel.service_browses },
                { label: 'Started a booking', count: f.funnel.bookings_started },
                { label: 'Booked', count: f.funnel.bookings_completed },
              ]}
            />
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-2 p-5">
              <h3 className="text-xs font-bold text-teal/80">Top searches</h3>
              {f.top_search_queries.length === 0 ? (
                <p className="py-3 text-xs text-teal/60">No searches recorded in this period.</p>
              ) : (
                f.top_search_queries.map((q) => (
                  <div key={q.query} className="flex justify-between rounded-xl bg-canvas px-3 py-2 text-xs text-teal">
                    <span className="truncate">{q.query}</span>
                    <span className="font-mono font-bold">{n(q.count)}</span>
                  </div>
                ))
              )}
            </Card>
            <Card className="space-y-2 p-5">
              <h3 className="text-xs font-bold text-teal/80">Most opened listings</h3>
              {f.top_viewed_opportunities.length === 0 ? (
                <p className="py-3 text-xs text-teal/60">No listing views recorded in this period.</p>
              ) : (
                f.top_viewed_opportunities.map((v) => (
                  <Link
                    key={v.id}
                    href={`/opportunities/${v.id}`}
                    className="flex justify-between rounded-xl bg-canvas px-3 py-2 text-xs text-teal hover:underline"
                  >
                    <span className="truncate font-mono">{v.id}</span>
                    <span className="font-mono font-bold">{n(v.count)}</span>
                  </Link>
                ))
              )}
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
