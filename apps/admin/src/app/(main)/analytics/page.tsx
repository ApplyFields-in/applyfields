import type { Metadata } from 'next';
import { connection } from 'next/server';
import type { AnalyticsFunnelSummary } from '@applyfields/types';
import { apiGetWithStatus } from '@/lib/api';
import { Badge, Card, PageHeader } from '@applyfields/ui';
import {
  TrendingUp,
  Search,
  Eye,
  UserCheck,
  Bookmark,
  ExternalLink,
  Store,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Citizen Funnel Analytics — ApplyFields Admin',
};

export default async function AnalyticsFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await connection();
  const { days = '30' } = await searchParams;
  const res = await apiGetWithStatus<AnalyticsFunnelSummary>(
    `/admin/analytics/funnel?days=${encodeURIComponent(days)}`,
  );

  const data: AnalyticsFunnelSummary = res.data || {
    period_days: 30,
    total_events: 0,
    total_sessions: 0,
    funnel: {
      searches: 0,
      views: 0,
      eligibility_checks: 0,
      saves: 0,
      external_applies: 0,
      service_browses: 0,
      bookings_started: 0,
      bookings_completed: 0,
    },
    conversion_rates: {
      search_to_view: 0,
      view_to_eligibility: 0,
      eligibility_to_apply: 0,
      browse_to_booking: 0,
    },
    top_search_queries: [],
    top_viewed_opportunities: [],
  };

  const funnelSteps = [
    {
      label: '1. Universal Search',
      count: data.funnel.searches,
      icon: <Search className="size-4" />,
      desc: 'Citizen keyword & filter queries',
      tone: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: '2. Opportunity Views',
      count: data.funnel.views,
      icon: <Eye className="size-4" />,
      desc: 'Opened job/exam/scholarship detail pages',
      tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      label: '3. Eligibility Verified',
      count: data.funnel.eligibility_checks,
      icon: <UserCheck className="size-4" />,
      desc: 'Checked age & qualification rules',
      tone: 'bg-teal/10 text-teal border-teal/20',
    },
    {
      label: '4. Bookmarked / Saved',
      count: data.funnel.saves,
      icon: <Bookmark className="size-4" />,
      desc: 'Saved for deadline tracking',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: '5. Official Apply Click',
      count: data.funnel.external_applies,
      icon: <ExternalLink className="size-4" />,
      desc: 'Dispatched to official portal',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const serviceFunnelSteps = [
    {
      label: '1. MeeSeva / Center Browse',
      count: data.funnel.service_browses,
      icon: <Store className="size-4" />,
      desc: 'Explored verified physical kiosks',
      tone: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      label: '2. Appointment Cart / Slot Start',
      count: data.funnel.bookings_started,
      icon: <TrendingUp className="size-4" />,
      desc: 'Selected service & appointment slot',
      tone: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: '3. Fast-Track Slip Locked',
      count: data.funnel.bookings_completed,
      icon: <CheckCircle2 className="size-4" />,
      desc: 'Confirmed zero-wait counter token',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Privacy-First Telemetry"
          title="Citizen Conversion Funnel"
          description="End-to-end journey telemetry from Search → View → Eligibility → Save → Apply / Bookings. Strictly compliant with DPDP Act 2023 with zero PII stored."
          icon={<TrendingUp />}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-teal/70">Window:</span>
          {['7', '30', '90'].map((d) => (
            <a
              key={d}
              href={`/analytics?days=${d}`}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                days === d
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-cream text-teal/70 hover:bg-tea'
              }`}
            >
              Last {d}d
            </a>
          ))}
        </div>
      </div>

      {/* Compliance & Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-sea/30 bg-celadon/30 p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-sea shadow-xs">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-teal">
              DPDP Act 2023 &amp; GDPR Compliant Pipeline
            </div>
            <div className="text-xs text-teal/80">
              Only consented sessions with anonymous session tokens are recorded. No IP addresses or candidate credentials are logged.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-teal">
          <div className="rounded-2xl bg-white px-3.5 py-2 text-center shadow-xs">
            <div className="font-mono text-base font-black text-teal">{data.total_sessions}</div>
            <div className="text-[10px] text-teal/70 uppercase">Anonymous Sessions</div>
          </div>
          <div className="rounded-2xl bg-white px-3.5 py-2 text-center shadow-xs">
            <div className="font-mono text-base font-black text-sea">{data.total_events}</div>
            <div className="text-[10px] text-teal/70 uppercase">Total Events</div>
          </div>
        </div>
      </div>

      {/* Primary Opportunity Funnel Progression */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-base font-black text-teal flex items-center gap-2">
              <BarChart3 className="size-4 text-sea" /> Opportunity Application Funnel
            </h2>
            <p className="text-xs text-teal/70">
              Tracking discovery through to official external government portal conversion.
            </p>
          </div>
          <Badge tone="teal" className="text-[11px] font-bold">
            {data.conversion_rates.eligibility_to_apply}% Eligibility → Apply Rate
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {funnelSteps.map((step, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 space-y-2 relative ${step.tone} transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase">{step.label}</span>
                {step.icon}
              </div>
              <div className="font-mono text-2xl font-black">{step.count.toLocaleString()}</div>
              <p className="text-[11px] leading-tight opacity-80">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Conversion Ratios Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="rounded-2xl bg-canvas p-3 border border-line text-xs">
            <span className="text-[10px] uppercase font-bold text-teal/60">Search → View Rate</span>
            <div className="font-mono text-lg font-black text-teal">
              {data.conversion_rates.search_to_view}%
            </div>
            <p className="text-[10px] text-teal/70">Queries resulting in opportunity inspection</p>
          </div>

          <div className="rounded-2xl bg-canvas p-3 border border-line text-xs">
            <span className="text-[10px] uppercase font-bold text-teal/60">View → Eligibility Check</span>
            <div className="font-mono text-lg font-black text-teal">
              {data.conversion_rates.view_to_eligibility}%
            </div>
            <p className="text-[10px] text-teal/70">Viewers running rule verification</p>
          </div>

          <div className="rounded-2xl bg-canvas p-3 border border-line text-xs">
            <span className="text-[10px] uppercase font-bold text-teal/60">Eligibility → Apply Rate</span>
            <div className="font-mono text-lg font-black text-sea">
              {data.conversion_rates.eligibility_to_apply}%
            </div>
            <p className="text-[10px] text-teal/70">Eligible candidates clicking official link</p>
          </div>
        </div>
      </Card>

      {/* Citizen Assistance Kiosk Funnel */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-base font-black text-teal flex items-center gap-2">
              <Store className="size-4 text-sea" /> Citizen Assistance Kiosk Funnel
            </h2>
            <p className="text-xs text-teal/70">
              Tracking physical center discovery to appointment token reservation.
            </p>
          </div>
          <Badge tone="celadon" className="text-[11px] font-bold">
            {data.conversion_rates.browse_to_booking}% Browse → Booking Rate
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {serviceFunnelSteps.map((step, idx) => (
            <div key={idx} className={`rounded-2xl border p-4 space-y-2 ${step.tone}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase">{step.label}</span>
                {step.icon}
              </div>
              <div className="font-mono text-2xl font-black">{step.count.toLocaleString()}</div>
              <p className="text-[11px] leading-tight opacity-80">{step.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Search Keywords & Top Opportunities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-2">
            <Search className="size-3.5 text-sea" /> Top Search Queries
          </h3>
          {data.top_search_queries.length === 0 ? (
            <p className="text-xs text-teal/60 italic py-4">No search query events recorded yet in this window.</p>
          ) : (
            <div className="space-y-2">
              {data.top_search_queries.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-canvas p-2.5 text-xs font-bold text-teal"
                >
                  <span className="truncate max-w-[200px]">{q.query}</span>
                  <span className="font-mono text-sea">{q.count} searches</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-2">
            <Eye className="size-3.5 text-sea" /> Top Inspected Opportunities
          </h3>
          {data.top_viewed_opportunities.length === 0 ? (
            <p className="text-xs text-teal/60 italic py-4">No view events recorded yet in this window.</p>
          ) : (
            <div className="space-y-2">
              {data.top_viewed_opportunities.map((o, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-canvas p-2.5 text-xs font-bold text-teal"
                >
                  <span className="truncate max-w-[200px] font-mono">{o.id}</span>
                  <span className="font-mono text-teal">{o.count} views</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
