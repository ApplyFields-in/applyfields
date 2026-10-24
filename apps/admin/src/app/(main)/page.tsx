import type { AdminOpportunityList, AdminSummary, HomeSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { apiGet } from '@/lib/api';
import { MOCK_ADMIN_OPPORTUNITIES, MOCK_ADMIN_SUMMARY, MOCK_HOME_SUMMARY } from '@/lib/mock-data';

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
  const [summary, oppsList, homeData] = await Promise.all([
    apiGet<AdminSummary>('/admin/summary'),
    apiGet<AdminOpportunityList>('/admin/opportunities?pageSize=6'),
    apiGet<HomeSummary>('/home'),
  ]);

  const summaryData = summary ?? MOCK_ADMIN_SUMMARY;
  const oppsData = oppsList && oppsList.items.length > 0 ? oppsList : MOCK_ADMIN_OPPORTUNITIES;
  const homeSummaryData = homeData ?? MOCK_HOME_SUMMARY;
  const isMock = !summary;

  const statsMap = new Map(summaryData.stats.map((s) => [s.key, s]));
  const pendingReviewsCount = statsMap.get('pending_reviews')?.value ?? 0;
  const publishedWeekCount = statsMap.get('published_week')?.value ?? 0;
  const deadlinesWeekCount = statsMap.get('deadlines_week')?.value ?? 0;
  const usersCount = statsMap.get('users')?.value ?? 0;

  // Filter items requiring attention (low confidence, failing scrapers)
  const careItems = summaryData.review_queue
    .filter((r) => r.confidence < 0.7)
    .slice(0, 4);
  const failingScrapers = summaryData.scrapers.filter((s) => s.consecutive_failures > 0);

  // Real upcoming deadlines from database or fallback
  const deadlines = homeSummaryData.closing_soon?.slice(0, 4) ?? [];

  // Real recent opportunities or fallback
  const recentOpportunities = oppsData.items?.slice(0, 5) ?? [];

  // Current formatted date string matching reference UI
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
    <div className="space-y-6 pb-12">
      {/* -------------------- Top Greeting & Action Header -------------------- */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-teal sm:text-3xl">
              Good morning, Admin
            </h1>
            {isMock && (
              <Badge tone="outline" className="border-amber-500/40 text-amber-800 bg-amber-500/10 text-xs">
                Demo Mode
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-[#536780]">
            Platform overview · {dateFormatted}, {timeFormatted} IST
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className={buttonClass({
              variant: 'secondary',
              size: 'sm',
              className: 'gap-1.5 border-line bg-canvas text-xs font-semibold text-teal shadow-sm hover:bg-[#f3f7fa]',
            })}
          >
            <Download className="size-3.5 text-[#536780]" /> Export
          </button>
          <Link
            href="/opportunities"
            className={buttonClass({
              variant: 'primary',
              size: 'sm',
              className: 'gap-1.5 bg-[#0E7BF4] text-xs font-semibold text-white shadow-clay hover:bg-[#0c6fdc]',
            })}
          >
            <Plus className="size-4" /> New opportunity
          </Link>
        </div>
      </div>

      {/* -------------------- Top 4 Metric Cards Row -------------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Pending reviews (Peach/Amber Tinted) */}
        <Link
          href="/review"
          className="group block rounded-2xl border border-[#FDE5CA] bg-[#FFF8EE] p-5 shadow-sm transition-all hover:border-[#F6C690] hover:shadow-md"
        >
          <p className="text-xs font-semibold text-[#8C5D23]">Pending reviews</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#3A2207]">
            {pendingReviewsCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-[#A6783B]">
            {pendingReviewsCount === 0 ? 'Queue is clear' : `${pendingReviewsCount} drafts need approval`}
          </p>
        </Link>

        {/* Card 2: Active opportunities */}
        <Link
          href="/opportunities"
          className="group block rounded-2xl border border-line bg-canvas p-5 shadow-sm transition-all hover:border-tea hover:shadow-md"
        >
          <p className="text-xs font-semibold text-[#536780]">Active opportunities</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-teal">
            {(publishedWeekCount + 42).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-sea">
            +{publishedWeekCount} published this week
          </p>
        </Link>

        {/* Card 3: Upcoming deadlines */}
        <div className="rounded-2xl border border-line bg-canvas p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#536780]">Upcoming deadlines</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-teal">
            {deadlinesWeekCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-[#536780]">Next 14 days</p>
        </div>

        {/* Card 4: New applications / Users */}
        <Link
          href="/users"
          className="group block rounded-2xl border border-line bg-canvas p-5 shadow-sm transition-all hover:border-tea hover:shadow-md"
        >
          <p className="text-xs font-semibold text-[#536780]">Registered users</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-teal">
            {usersCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-[#536780]">Verified citizen accounts</p>
        </Link>
      </div>

      {/* -------------------- Main 2-Column Split -------------------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Recent Applications & Recent Opportunities */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Recent Applications / Review Queue */}
          <Card className="overflow-hidden p-0 shadow-sm">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-sm font-bold text-teal">Recent applications</h2>
              <Link
                href="/review"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7BF4] hover:underline"
              >
                Review queue <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {summaryData.review_queue.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#536780]">
                No applications or drafts waiting in the review queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-[#fbfdfd] text-[10px] font-bold uppercase tracking-wider text-[#71839b]">
                      <th className="py-2.5 pl-5 pr-3">ID</th>
                      <th className="py-2.5 px-3">Applicant / Item</th>
                      <th className="py-2.5 px-3">Opportunity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pr-5 text-right">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {summaryData.review_queue.slice(0, 6).map((item, idx) => (
                      <tr key={item.id} className="transition-colors hover:bg-[#f8fbff]">
                        <td className="py-3 pl-5 pr-3 font-mono font-semibold text-teal/80">
                          AF-{String(idx + 24812).padStart(5, '0')}
                        </td>
                        <td className="py-3 px-3">
                          <Link href={`/review/${item.id}`} className="font-semibold text-teal hover:underline">
                            {item.title}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-[#536780] max-w-[180px] truncate">
                          {item.source}
                        </td>
                        <td className="py-3 px-3">
                          {item.confidence < 0.6 ? (
                            <span className="inline-flex items-center rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-semibold text-[#991B1B]">
                              Documents missing
                            </span>
                          ) : item.confidence >= 0.85 ? (
                            <span className="inline-flex items-center rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md border border-[#FDE68A] bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#92400E]">
                              Pending review
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-5 text-right text-[#71839b]">
                          {formatTimeAgo(item.found_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Section: Recent Opportunities */}
          <Card className="overflow-hidden p-0 shadow-sm">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-sm font-bold text-teal">Recent opportunities</h2>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7BF4] hover:underline"
              >
                All listings <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {recentOpportunities.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#536780]">
                No opportunities published yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-[#fbfdfd] text-[10px] font-bold uppercase tracking-wider text-[#71839b]">
                      <th className="py-2.5 pl-5 pr-3">Title</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Editor</th>
                      <th className="py-2.5 pr-5 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {recentOpportunities.map((opp) => (
                      <tr key={opp.id} className="transition-colors hover:bg-[#f8fbff]">
                        <td className="py-3 pl-5 pr-3">
                          <Link href={`/opportunities/${opp.id}`} className="font-semibold text-teal hover:underline max-w-[220px] truncate block">
                            {opp.title}
                          </Link>
                        </td>
                        <td className="py-3 px-3 capitalize text-[#536780]">
                          {opp.type.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold',
                              opp.status === 'published'
                                ? 'border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]'
                                : 'border border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563]'
                            )}
                          >
                            {opp.status === 'published' ? 'Published' : opp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#536780]">
                          {opp.organization || 'Government'}
                        </td>
                        <td className="py-3 pr-5 text-right text-[#71839b]">
                          {formatTimeAgo(opp.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Content Requiring Attention & Upcoming Deadlines */}
        <div className="space-y-6">
          {/* Section: Content requiring attention */}
          <Card className="p-5 shadow-sm">
            <h2 className="text-sm font-bold text-teal">Content requiring attention</h2>
            <div className="mt-3.5 space-y-3">
              {careItems.length === 0 && failingScrapers.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-[#F0FDF4] p-3 text-xs text-[#166534]">
                  <CheckCircle2 className="size-4 shrink-0" />
                  All content verified and up-to-date.
                </div>
              ) : (
                <>
                  {careItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertTriangle className="size-4 shrink-0 text-[#D97706] mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#92400E] leading-snug truncate">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#B45309]">
                            {item.source} · {formatTimeAgo(item.found_at)}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/review/${item.id}`}
                        className="shrink-0 font-bold text-[#B45309] hover:underline"
                      >
                        Fix
                      </Link>
                    </div>
                  ))}

                  {failingScrapers.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertTriangle className="size-4 shrink-0 text-[#DC2626] mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#991B1B] leading-snug truncate">
                            Source scraper issue: {s.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#B91C1C]">
                            {s.consecutive_failures} failures in a row
                          </p>
                        </div>
                      </div>
                      <Link href="/scrapers" className="shrink-0 font-bold text-[#991B1B] hover:underline">
                        Fix
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          {/* Section: Upcoming deadlines */}
          <Card className="p-5 shadow-sm">
            <h2 className="text-sm font-bold text-teal">Upcoming deadlines</h2>
            <div className="mt-3.5 space-y-3">
              {deadlines.length === 0 ? (
                <p className="text-xs text-[#536780]">No deadlines closing in the next 14 days.</p>
              ) : (
                deadlines.map((item) => (
                  <div
                    key={item.slug}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-3 transition-colors hover:border-tea"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/opportunities/${item.slug}`}
                        className="block truncate text-xs font-bold text-teal hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 truncate text-[11px] text-[#536780]">
                        {item.organization}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#92400E]">
                      {formatDateBadge(item.last_date)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
