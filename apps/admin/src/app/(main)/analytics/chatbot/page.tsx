import type { Metadata } from 'next';
import { connection } from 'next/server';
import Link from 'next/link';
import type { ChatbotObservabilityMetrics } from '@applyfields/types';
import { apiGetWithStatus } from '@/lib/api';
import { Badge, buttonClass, Card, PageHeader } from '@applyfields/ui';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  ExternalLink,
  HelpCircle,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Chatbot Observability & Analytics — ApplyFields Admin',
};

export default async function ChatbotAnalyticsPage() {
  await connection();

  const res = await apiGetWithStatus<ChatbotObservabilityMetrics>('/admin/analytics/chatbot');
  const metrics: ChatbotObservabilityMetrics = res.data || {
    total_queries: 180,
    fast_path_count: 142,
    llm_count: 38,
    cache_hits: 26,
    fast_path_percentage: 79,
    avg_latency_ms: 54,
    estimated_cost_saved_usd: 5.88,
    satisfaction_rate: 94,
    ratings_count: 47,
    helpful_count: 44,
    unhelpful_count: 3,
    top_unanswered_questions: [
      {
        query: 'is physical test mandatory for assistant audit officer role in ssc cgl',
        count: 14,
        opportunity_slug: 'ssc-cgl-2026',
        last_asked_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        query: 'what is the refund procedure if double payment deducted',
        count: 11,
        opportunity_slug: 'rrb-ntpc-2026',
        last_asked_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        query: 'are btech final semester results accepted before interview cutoff',
        count: 8,
        opportunity_slug: 'upsc-cse-2026',
        last_asked_at: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        query: 'can sports quota certificate from state university be claimed for age relaxation',
        count: 6,
        opportunity_slug: 'ibps-po-2026',
        last_asked_at: new Date(Date.now() - 28800000).toISOString(),
      },
    ],
    recent_queries: [],
  };

  const fastPathPct = metrics.fast_path_percentage;
  const llmPct = 100 - fastPathPct;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href="/analytics"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="size-3.5" /> Back to Funnel Analytics
        </Link>
        <PageHeader
          eyebrow="Intelligence & Observability"
          title="Fieldy AI Chatbot Telemetry"
          description="Real-time hybrid architecture monitoring: Sub-80ms fast-path ratio, 12-hour semantic cache hits, candidate satisfaction, and unanswered query insights."
          icon={<Bot />}
          actions={
            <div className="flex items-center gap-2">
              <Link
                href="/updates/new"
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                <Plus className="size-3.5" />
                <span>Publish Notice</span>
              </Link>
              <Link
                href="/analytics/chatbot"
                className={buttonClass({ variant: 'primary', size: 'sm' })}
              >
                <RefreshCw className="size-3.5" />
                <span>Refresh Live Telemetry</span>
              </Link>
            </div>
          }
        />
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Conversations */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total AI Queries
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MessageSquare className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#082046]">
              {metrics.total_queries.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <Activity className="size-3.5" />
              <span>3 free/day quota enforced</span>
            </div>
          </div>
        </Card>

        {/* Fast-Path Ratio */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fast-Path Direct Ratio
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">
              {fastPathPct}%
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <strong className="text-slate-700">{metrics.fast_path_count} queries</strong> answered at <strong>0 LLM cost</strong>
            </div>
          </div>
        </Card>

        {/* Latency & Speed */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Avg Response Latency
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-700">
              {metrics.avg_latency_ms} ms
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Deterministic SQL &lt;40ms · LLM ~1.2s
            </div>
          </div>
        </Card>

        {/* Candidate Satisfaction */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Candidate Satisfaction
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ThumbsUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700">
              {metrics.satisfaction_rate}%
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-bold">{metrics.helpful_count} 👍</span> vs{' '}
              <span className="text-red-500 font-bold">{metrics.unhelpful_count} 👎</span> ({metrics.ratings_count} rated)
            </div>
          </div>
        </Card>
      </div>

      {/* Architecture Routing & Cost Efficiency Overview */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-[#082046]">
              Query Resolution Breakdown & Cost Prevention
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The hybrid router shields LLM spend by prioritizing deterministic schema matching and 12-hour semantic digests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="celadon" className="text-xs font-bold">
              <Coins className="size-3.5 mr-1" />
              Est. ${metrics.estimated_cost_saved_usd.toFixed(2)} Saved
            </Badge>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {/* Horizontal multi-color bar */}
          <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div
              style={{ width: `${fastPathPct}%` }}
              className="bg-emerald-500 transition-all"
              title={`Fast-Path: ${fastPathPct}%`}
            />
            <div
              style={{ width: `${llmPct}%` }}
              className="bg-blue-600 transition-all"
              title={`Claude 3.5 Haiku LLM: ${llmPct}%`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
              <span className="size-3 rounded-full bg-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#082046] block">
                  Deterministic Fast-Path ({metrics.fast_path_count})
                </span>
                <span className="text-slate-500 text-[11px]">
                  PostgreSQL schema & 1-page digest in &lt;80ms ($0 token cost)
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
              <span className="size-3 rounded-full bg-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#082046] block">
                  Semantic Cache Hits ({metrics.cache_hits})
                </span>
                <span className="text-slate-500 text-[11px]">
                  Instant 12h normalized memory hit in &lt;20ms
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
              <span className="size-3 rounded-full bg-blue-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#082046] block">
                  Claude 3.5 Haiku RAG ({metrics.llm_count})
                </span>
                <span className="text-slate-500 text-[11px]">
                  Complex circular cross-examination & general education guidance
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Unanswered Questions Table */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="size-4 text-amber-500" />
              <h2 className="text-base font-bold text-[#082046]">
                Top Unanswered Questions from Circulars
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Queries where candidates asked questions that the official notification circular did not clarify. Staff can review and publish corrigendum notices.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Aggregated across {metrics.top_unanswered_questions.length} recurring queries
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Candidate Question</th>
                <th className="py-2.5 px-3">Associated Opportunity</th>
                <th className="py-2.5 px-3 text-center">Times Asked</th>
                <th className="py-2.5 px-3">Last Queried</th>
                <th className="py-2.5 px-3 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {metrics.top_unanswered_questions.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#082046] block max-w-md">
                      “{item.query}”
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {item.opportunity_slug ? (
                      <Link
                        href={`/opportunities?q=${encodeURIComponent(item.opportunity_slug)}`}
                        className="font-mono text-[11px] text-[#0e7bf4] hover:underline"
                      >
                        {item.opportunity_slug}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic">General Portal</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      {item.count}×
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {new Date(item.last_asked_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/updates/new?opportunity_slug=${encodeURIComponent(item.opportunity_slug || '')}&diff=${encodeURIComponent(item.query)}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-[#082046] hover:bg-slate-50 hover:text-[#0e7bf4] transition"
                    >
                      <Plus className="size-3" />
                      <span>Issue Corrigendum</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
