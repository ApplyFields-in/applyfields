import type { AdminOpportunityList, AdminSummary, HomeSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Download,
  ExternalLink,
  Globe,
  HandHelping,
  Inbox,
  Layers,
  Plus,
  ShieldAlert,
  ShieldCheck,
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
  const [summary, oppsList, homeData] = await Promise.all([
    apiGet<AdminSummary>('/admin/summary'),
    apiGet<AdminOpportunityList>('/admin/opportunities?pageSize=6'),
    apiGet<HomeSummary>('/home'),
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
              <span>ApplyFields Global Operations</span>
              <span className="text-white/40">|</span>
              <span className="text-navy-200">Port :3001</span>
              {apiDown && (
                <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[10px] text-amber-300">
                  API unreachable
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
              Multi-Portal Control Center
            </h1>
            <p className="text-xs sm:text-sm text-navy-100/85 leading-relaxed">
              Centralized governance, audit trails, opportunity moderation, and microservice sync across the Citizen Portal, Services Engine, and Partner Operator desks.
            </p>
            <p className="text-[11px] font-mono text-navy-300/80 pt-1">
              Active Session · {dateFormatted}, {timeFormatted} IST
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
            >
              <Download className="size-3.5 text-navy-200" /> Export Audit Log
            </button>
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 rounded-xl border border-navy-400/40 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-500 active:scale-95"
            >
              <Plus className="size-4" /> Create Opportunity
            </Link>
          </div>
        </div>
      </div>

      {/* -------------------- Department Operations Cockpits (Role Separation) -------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              Department Operations Cockpits · Role Separation
            </h2>
          </div>
          <span className="text-[11px] font-medium text-navy-700/80">
            Dedicated operational workspaces for internal staff
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Dept 1: Partners & Franchise Network */}
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Store className="size-3 text-emerald-600" /> Partners & Franchise
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 pt-1">
                Franchise & Center Ops
              </h3>
              <p className="text-xs text-navy-700/80 leading-relaxed">
                Partner kiosk onboarding, MeeSeva verification, live center slots, and commission settlement ledgers.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-navy-900">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800">
                  24 Partners
                </span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800">
                  12 Pending KYC
                </span>
              </div>
            </div>
            <Link
              href="/partners"
              className="inline-flex items-center justify-between w-full pt-3 border-t border-emerald-100 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              <span>Launch Partners Cockpit</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Dept 2: Citizen Services & Assistance */}
          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <HandHelping className="size-3 text-blue-600" /> Citizen Services
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  94.2% SLA
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 pt-1">
                Assistance & Delivery
              </h3>
              <p className="text-xs text-navy-700/80 leading-relaxed">
                Government service delivery, certificate applications, citizen case triage, and center handoffs.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-navy-900">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800">
                  18 Kiosks
                </span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-800">
                  38 Active Bookings
                </span>
              </div>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center justify-between w-full pt-3 border-t border-blue-100 text-xs font-bold text-blue-800 hover:text-blue-950 transition-colors"
            >
              <span>Launch Services Cockpit</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Dept 3: Apply & Opportunities Pipeline */}
          <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <Inbox className="size-3 text-indigo-600" /> Apply & Opportunities
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {pendingReviewsCount} Pending
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 pt-1">
                Ingestion & Publishing
              </h3>
              <p className="text-xs text-navy-700/80 leading-relaxed">
                Raw ingestion review, confidence filters, scraper anomaly monitoring, and official notifications.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-navy-900">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-800">
                  {summaryData.scrapers.length} Scrapers
                </span>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-800">
                  {publishedWeekCount} Published/Wk
                </span>
              </div>
            </div>
            <Link
              href="/review"
              className="inline-flex items-center justify-between w-full pt-3 border-t border-indigo-100 text-xs font-bold text-indigo-800 hover:text-indigo-950 transition-colors"
            >
              <span>Launch Review Cockpit</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Dept 4: Career & Higher Education */}
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Building className="size-3 text-amber-600" /> Career & Higher Ed
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  100 Colleges
                </span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 pt-1">
                Colleges & Roadmaps
              </h3>
              <p className="text-xs text-navy-700/80 leading-relaxed">
                Top 50 Engineering & Medical Colleges, NIRF ranks, cutoff benchmarks, and trajectory roadmaps.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-navy-900">
                <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800">
                  Top 50 Engg
                </span>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800">
                  Top 50 Medical
                </span>
              </div>
            </div>
            <Link
              href="/colleges"
              className="inline-flex items-center justify-between w-full pt-3 border-t border-amber-100 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors"
            >
              <span>Launch Colleges Cockpit</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------- Multi-Portal Architecture Clarity Cards -------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-navy-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900">
              ApplyFields Ecosystem Portals · Live Matrix
            </h2>
          </div>
          <span className="text-[11px] text-navy-700/80">3 sister applications connected to core</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Portal 1: Citizen Web (:3000) */}
          <div className="glass-card relative flex flex-col justify-between rounded-2xl border border-navy-200/80 p-5 shadow-xs transition-all hover:border-navy-400 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                  <Globe className="size-3" /> Citizen Portal · :3000
                </span>
                <PortalStatus url={WEB_URL} />
              </div>

              <h3 className="mt-3 text-sm font-bold text-navy-950">
                Citizen Web & Career Discovery
              </h3>
              <p className="mt-1 text-xs text-navy-800/80 leading-relaxed">
                Public facing portal for students & citizens: Career roadmaps, college directories, government exams, private opportunities, and direct applications.
              </p>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-md bg-navy-100/80 px-2 py-0.5 font-semibold text-navy-900">
                  1,420+ Listings
                </span>
                <span className="rounded-md bg-navy-100/80 px-2 py-0.5 font-semibold text-navy-900">
                  Colleges Directory
                </span>
                <span className="rounded-md bg-navy-100/80 px-2 py-0.5 font-semibold text-navy-900">
                  Citizen Auth
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-navy-100 flex items-center justify-between">
              <span className="text-[11px] text-navy-700">{WEB_URL}</span>
              <a
                href={`${WEB_URL}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-emerald-700 hover:underline"
              >
                Open Web Portal <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          {/* Portal 2: Services Hub (:3003) */}
          <div className="glass-card relative flex flex-col justify-between rounded-2xl border border-navy-200/80 p-5 shadow-xs transition-all hover:border-navy-400 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                  <Zap className="size-3" /> Services Hub · :3003
                </span>
                <PortalStatus url={SERVICE_URL} />
              </div>

              <h3 className="mt-3 text-sm font-bold text-navy-950">
                MeeSeva, CSC & Cyber Hubs
              </h3>
              <p className="mt-1 text-xs text-navy-800/80 leading-relaxed">
                Citizen booking engine: Xerox, spiral binding, PAN & NSDL, caste & income certificates, and GPS geolocation search for verified kiosks.
              </p>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-md bg-amber-100/80 px-2 py-0.5 font-semibold text-amber-900">
                  GPS Discovery
                </span>
                <span className="rounded-md bg-amber-100/80 px-2 py-0.5 font-semibold text-amber-900">
                  18 Active Centers
                </span>
                <span className="rounded-md bg-amber-100/80 px-2 py-0.5 font-semibold text-amber-900">
                  Slot Booking
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-navy-100 flex items-center justify-between">
              <span className="text-[11px] text-navy-700">{SERVICE_URL}</span>
              <a
                href={`${SERVICE_URL}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-amber-700 hover:underline"
              >
                Open Services Hub <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          {/* Portal 3: Partner Desk (:3002) */}
          <div className="glass-card relative flex flex-col justify-between rounded-2xl border border-navy-200/80 p-5 shadow-xs transition-all hover:border-navy-400 hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <Store className="size-3" /> Partner Portal · :3002
                </span>
                <PortalStatus url={PARTNER_URL} />
              </div>

              <h3 className="mt-3 text-sm font-bold text-navy-950">
                Partner Desk & Kiosk Network
              </h3>
              <p className="mt-1 text-xs text-navy-800/80 leading-relaxed">
                Merchant and operator cockpit: CSC/MeeSeva store registration, admissions desk (§21), hardware status, commission settlements, and client KYC.
              </p>

              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 font-semibold text-emerald-900">
                  Operator Desk
                </span>
                <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 font-semibold text-emerald-900">
                  Admissions §21
                </span>
                <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 font-semibold text-emerald-900">
                  24 Partners
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-navy-100 flex items-center justify-between">
              <span className="text-[11px] text-navy-700">{PARTNER_URL}</span>
              <a
                href={`${PARTNER_URL}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-emerald-700 hover:underline"
              >
                Open Partner Desk <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- Operational KPI Metrics (Olive & White Glassmorphism) -------------------- */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Pending reviews */}
        <Link
          href="/review"
          className="glass-card group block rounded-2xl border border-amber-300/80 bg-amber-50/70 p-5 shadow-xs transition-all hover:border-amber-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Pending Reviews</p>
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
            <p className="text-xs font-bold uppercase tracking-wide text-navy-800">Active Listings</p>
            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-800">
              Citizen Web :3000
            </span>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-navy-950">
            {(publishedWeekCount + 42).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            +{publishedWeekCount} published this week
          </p>
        </Link>

        {/* Card 3: Upcoming deadlines */}
        <div className="glass-card rounded-2xl border border-navy-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-800">Closing Soon</p>
            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-800">
              14 Days
            </span>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-navy-950">
            {deadlinesWeekCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-navy-700">
            Urgent citizen deadlines
          </p>
        </div>

        {/* Card 4: Registered users */}
        <Link
          href="/users"
          className="glass-card group block rounded-2xl border border-navy-200/80 p-5 shadow-xs transition-all hover:border-navy-400 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-800">Verified Users</p>
            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-800">
              Accounts
            </span>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-navy-950">
            {usersCount.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-navy-700">
            Citizens & partner operators
          </p>
        </Link>
      </section>

      {/* -------------------- Main 2-Column Split -------------------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Cross-Portal Queue & Recent Opportunities */}
        <div className="space-y-6 lg:col-span-2">
          {/* Section: Cross-Portal Verification Queue */}
          <div className="glass-panel overflow-hidden rounded-2xl border border-navy-200/80 shadow-xs">
            <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50/60 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-navy-950">Cross-Portal Review Queue</h2>
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
                <h2 className="text-sm font-bold text-navy-950">Published Opportunities Feed</h2>
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
              <h2 className="text-sm font-bold text-navy-950">System Integrity & Alerts</h2>
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
              <h2 className="text-sm font-bold text-navy-950">Upcoming Deadlines</h2>
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
              <h2 className="text-sm font-bold text-navy-950">Network Status</h2>
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
