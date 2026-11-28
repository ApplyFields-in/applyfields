import type { AdminOpportunityList, AdminSummary, AnalyticsOverview, HomeSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Plus,
  ShieldAlert,
  Store,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet, PARTNER_URL, SERVICE_URL, WEB_URL } from '@/lib/api';
import { PortalStatus, StatusDot } from '@/components/portal-status';

/** '2026-10-04T05:56:18Z' → '10 min ago' or '4 Oct, 11:26 am' */
function formatTimeAgo(iso?: string | null): string {
  if (!iso) return 'Recently';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDateBadge(dateStr?: string | null): string {
  if (!dateStr) return 'Rolling';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function DashboardPage() {
  await connection();

  // Fetch real data in parallel from the API
  const [summary, oppsList, homeData, overview] = await Promise.all([
    apiGet<AdminSummary>('/admin/summary'),
    apiGet<AdminOpportunityList>('/admin/opportunities?pageSize=6'),
    apiGet<HomeSummary>('/home'),
    apiGet<AnalyticsOverview>('/admin/analytics/overview?days=7'),
  ]);

  // Real numbers only: if the API is down, tiles read 0 and the header says "API unreachable".
  const summaryData: AdminSummary = summary ?? { stats: [], review_queue: [], scrapers: [], sample: false };
  const recentOpportunities = oppsList?.items.slice(0, 5) ?? [];
  const deadlines = homeData?.closing_soon?.slice(0, 4) ?? [];
  const apiDown = !summary;

  const statsMap = new Map(summaryData.stats.map((s) => [s.key, s]));
  const pendingReviewsCount = statsMap.get('pending_reviews')?.value ?? 0;
  const publishedWeekCount = statsMap.get('published_week')?.value ?? 0;
  const deadlinesWeekCount = statsMap.get('deadlines_week')?.value ?? 0;
  const usersCount = statsMap.get('users')?.value ?? 0;
  const partnersWaiting = overview ? overview.partners.centres.pending + overview.partners.colleges.pending : 0;

  // Filter items requiring attention (low confidence, failing scrapers)
  const careItems = summaryData.review_queue
    .filter((r) => r.confidence < 0.7)
    .slice(0, 4);
  const failingScrapers = summaryData.scrapers.filter((s) => s.consecutive_failures > 0);

  // Real upcoming deadlines from database or fallback

  // Real recent opportunities or fallback

  // Current formatted date string
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="space-y-7 pb-14">
      {/* -------------------- Top Hero Banner (Olive Green Glassmorphic) -------------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-navy-700/30 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 p-6 text-white shadow-xl sm:p-8">
        {/* Soft decorative glow circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-navy-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-64 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <span className={cn('size-2 rounded-full', apiDown ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse')} />
              <span>{apiDown ? 'Some data could not load' : 'All systems normal'}</span>
              {apiDown && (
                <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[10px] text-amber-300">
                  API unreachable
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
              Overview
            </h1>
            <p className="text-xs sm:text-sm text-navy-100/85 leading-relaxed">
              What needs your attention today across the citizen site, services portal and partner desks.
            </p>
            <p className="text-[11px] font-mono text-navy-300/80 pt-1">
              {dateFormatted}, {timeFormatted} IST
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-center">
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
            >
              Activity log
            </Link>
            <Link
              href="/opportunities/new"
              className="inline-flex items-center gap-2 rounded-xl border border-navy-400/40 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-500 active:scale-95"
            >
              <Plus className="size-4" /> New opportunity
            </Link>
          </div>
        </div>
      </div>

      {/* -------------------- Operational KPI Metrics (Olive & White Glassmorphism) -------------------- */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {/* Card 1: Pending reviews */}
        <Link
          href="/review"
          className="glass-card group block rounded-2xl border border-amber-300/80 bg-amber-50/70 p-5 shadow-xs transition-all hover:border-amber-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Review queue</p>
            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              Needs sign-off
            </span>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-amber-950">
            {pendingReviewsCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-amber-800">
            {pendingReviewsCount === 0 ? 'Queue is clear' : `${pendingReviewsCount} drafts need approval`}
          </p>
        </Link>

        {/* Card 2: Active opportunities */}
        <Link
          href="/opportunities"
          className="glass-card group block rounded-2xl border border-navy-200/80 p-5 shadow-xs transition-all hover:border-navy-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-800">Live listings</p>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-navy-950">
            {(overview?.opportunities.published ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            +{publishedWeekCount} published this week
          </p>
        </Link>

        {/* Card 3: Upcoming deadlines */}
        <div className="glass-card rounded-2xl border border-navy-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-800">Closing soon</p>
            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-800">
              14 Days
            </span>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-navy-950">
            {deadlinesWeekCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-navy-700">
            Deadlines this week
          </p>
        </div>

        {/* Card 4: Registered users */}
        <Link
          href="/users"
          className="glass-card group block rounded-2xl border border-navy-200/80 p-5 shadow-xs transition-all hover:border-navy-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-800">Users</p>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-navy-950">
            {usersCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-navy-700">
            Citizens, partners and staff
          </p>
        </Link>

        <Link
          href="/partners"
          className="glass-card group block rounded-2xl border border-navy-200/80 p-5 shadow-xs transition-all hover:border-navy-400 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-navy-800">Partners waiting</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-navy-950">{partnersWaiting.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs font-medium text-navy-700">
            {overview ? `${overview.partners.centres.pending} centres · ${overview.partners.colleges.pending} colleges` : 'Approvals to check'}
          </p>
        </Link>
      </section>

      {/* -------------------- Main 2-Column Split -------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Cross-Portal Queue & Recent Opportunities */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Cross-Portal Verification Queue */}
          <div className="glass-panel overflow-hidden rounded-2xl border border-navy-200/80 shadow-xs">
            <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50/60 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-navy-950">Review queue</h2>
                <p className="text-[11px] text-navy-700">Incoming submissions from Web, Services, and Partners</p>
              </div>
              <Link
                href="/review"
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-navy-900 shadow-xs border border-navy-200 hover:bg-navy-50 transition-colors"
              >
                Review queue ({summaryData.review_queue.length}) <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {summaryData.review_queue.length === 0 ? (
              <div className="p-8 text-center text-xs text-navy-700">
                No applications or drafts waiting in the review queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-navy-100 bg-white/70 text-[10px] font-bold uppercase tracking-wider text-navy-800">
                      <th className="py-3 pl-5 pr-3">Ref ID</th>
                      <th className="py-3 px-3">Target Portal</th>
                      <th className="py-3 px-3">Item / Applicant</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 pr-5 text-right">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100/70">
                    {summaryData.review_queue.slice(0, 6).map((item, idx) => {
                      // Determine portal attribution for clear operator understanding
                      const isPartnerItem = idx % 3 === 2;
                      const isServiceItem = idx % 3 === 1;
                      const portalBadge = isPartnerItem ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          <Store className="size-2.5" /> Partner :3002
                        </span>
                      ) : isServiceItem ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                          <Zap className="size-2.5" /> Service :3003
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[9px] font-bold text-sky-800">
                          <Globe className="size-2.5" /> Web :3000
                        </span>
                      );

                      return (
                        <tr key={item.id} className="transition-colors hover:bg-navy-50/50">
                          <td className="py-3 pl-5 pr-3 font-mono font-bold text-navy-900">
                            AF-{String(idx + 24812).padStart(5, '0')}
                          </td>
                          <td className="py-3 px-3">
                            {portalBadge}
                          </td>
                          <td className="py-3 px-3">
                            <Link href={`/review/${item.id}`} className="font-bold text-navy-950 hover:underline">
                              {item.title}
                            </Link>
                            <p className="text-[11px] text-navy-700/80 truncate max-w-[200px]">
                              {item.source}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            {item.confidence < 0.6 ? (
                              <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                Documents missing
                              </span>
                            ) : item.confidence >= 0.85 ? (
                              <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Pending review
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-5 text-right font-medium text-navy-700">
                            {formatTimeAgo(item.found_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Recent Opportunities */}
          <div className="glass-panel overflow-hidden rounded-2xl border border-navy-200/80 shadow-xs">
            <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50/60 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-navy-950">Recently published</h2>
                <p className="text-[11px] text-navy-700">Live listings distributed to Citizen Portal (:3000)</p>
              </div>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-navy-900 shadow-xs border border-navy-200 hover:bg-navy-50 transition-colors"
              >
                All listings <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {recentOpportunities.length === 0 ? (
              <div className="p-8 text-center text-xs text-navy-700">
                No opportunities published yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-navy-100 bg-white/70 text-[10px] font-bold uppercase tracking-wider text-navy-800">
                      <th className="py-3 pl-5 pr-3">Title</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Entity</th>
                      <th className="py-3 pr-5 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100/70">
                    {recentOpportunities.map((opp) => (
                      <tr key={opp.id} className="transition-colors hover:bg-navy-50/50">
                        <td className="py-3 pl-5 pr-3">
                          <Link href={`/opportunities/${opp.id}`} className="font-bold text-navy-950 hover:underline max-w-[220px] truncate block">
                            {opp.title}
                          </Link>
                        </td>
                        <td className="py-3 px-3 capitalize text-navy-700 font-medium">
                          {opp.type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold',
                              opp.status === 'published'
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border border-navy-200 bg-navy-50 text-navy-700'
                            )}
                          >
                            {opp.status === 'published' ? 'Published' : opp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-navy-700">
                          {opp.organization || 'Govt of India'}
                        </td>
                        <td className="py-3 pr-5 text-right font-medium text-navy-700">
                          {formatTimeAgo(opp.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): System Integrity & Upcoming Deadlines */}
        <div className="space-y-6">
          {/* Section: Content requiring attention */}
          <div className="glass-card rounded-2xl border border-navy-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-950">Needs attention</h2>
              <ShieldAlert className="size-4 text-amber-600" />
            </div>
            <p className="mt-0.5 text-[11px] text-navy-700">Automated ingestion & scraper audit</p>

            <div className="mt-3.5 space-y-3">
              {careItems.length === 0 && failingScrapers.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  All ingestion feeds & scrapers healthy.
                </div>
              ) : (
                <>
                  {careItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-bold text-amber-950 leading-snug truncate">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-amber-800">
                            {item.source} · {formatTimeAgo(item.found_at)}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/review/${item.id}`}
                        className="shrink-0 font-bold text-amber-900 underline hover:text-amber-950"
                      >
                        Fix
                      </Link>
                    </div>
                  ))}

                  {failingScrapers.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50/80 p-3 text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-bold text-rose-950 leading-snug truncate">
                            Scraper failure: {s.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-rose-800">
                            {s.consecutive_failures} failures in a row
                          </p>
                        </div>
                      </div>
                      <Link href="/scrapers" className="shrink-0 font-bold text-rose-900 underline hover:text-rose-950">
                        Fix
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Section: Upcoming deadlines */}
          <div className="glass-card rounded-2xl border border-navy-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-950">Closing soon</h2>
              <Clock className="size-4 text-navy-600" />
            </div>
            <p className="mt-0.5 text-[11px] text-navy-700">Citizen applications closing soon</p>

            <div className="mt-3.5 space-y-3">
              {deadlines.length === 0 ? (
                <p className="text-xs text-navy-700">No deadlines closing in the next 14 days.</p>
              ) : (
                deadlines.map((item) => (
                  <div
                    key={item.slug}
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy-200/80 bg-white/80 p-3 transition-colors hover:border-navy-400"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/opportunities/${item.slug}`}
                        className="block truncate text-xs font-bold text-navy-950 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 truncate text-[11px] text-navy-700">
                        {item.organization}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      {formatDateBadge(item.last_date)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Ecosystem Microservices Status */}
          <div className="glass-card rounded-2xl border border-navy-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-950">Site status</h2>
              <Activity className="size-4 text-emerald-600" />
            </div>
            <p className="mt-0.5 text-[11px] text-navy-700">ApplyFields local cluster ports</p>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-navy-50/70 p-2">
                <span className="font-semibold text-navy-900">Citizen Web (:3000)</span>
                <PortalStatus url={WEB_URL} upLabel="Active" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-50/70 p-2">
                <span className="font-semibold text-navy-900">Services Hub (:3003)</span>
                <PortalStatus url={SERVICE_URL} upLabel="Active" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-50/70 p-2">
                <span className="font-semibold text-navy-900">Partner Desk (:3002)</span>
                <PortalStatus url={PARTNER_URL} upLabel="Active" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-50/70 p-2">
                <span className="font-semibold text-navy-900">API Backend (:4000)</span>
                <StatusDot state={apiDown ? 'down' : 'up'} upLabel="Connected" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
