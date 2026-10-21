'use client';

import { useState } from 'react';
import type {
  LinkHealthReport,
  ScrapeRunItem,
  ScrapeSourceItem,
  ScrapeSourcesListResponse,
} from '@applyfields/types';
import { Badge, buttonClass, cn } from '@applyfields/ui';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Link2,
  Play,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

interface ScrapersUiProps {
  initialData: ScrapeSourcesListResponse | null;
  initialLinkHealth: LinkHealthReport | null;
}

export function ScrapersUi({ initialData, initialLinkHealth }: ScrapersUiProps) {
  const [sources, setSources] = useState<ScrapeSourceItem[]>(
    initialData?.sources ?? [],
  );
  const [summary, setSummary] = useState(
    initialData?.summary ?? {
      total: 0,
      active: 0,
      healthy: 0,
      failing: 0,
      stale: 0,
    },
  );
  const [linkHealth, setLinkHealth] = useState<LinkHealthReport | null>(
    initialLinkHealth,
  );

  const [runningSourceId, setRunningSourceId] = useState<string | null>(null);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Modal states
  const [selectedSourceForHistory, setSelectedSourceForHistory] =
    useState<ScrapeSourceItem | null>(null);
  const [historyRuns, setHistoryRuns] = useState<ScrapeRunItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showLinkHealthModal, setShowLinkHealthModal] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const reloadSources = async () => {
    setRefreshing(true);
    try {
      const res = await apiGet<ScrapeSourcesListResponse>('/admin/sources');
      if (res) {
        setSources(res.sources);
        setSummary(res.summary);
        showToast('Sources reloaded successfully', 'success');
      }
    } catch {
      showToast('Failed to reload sources', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerScraper = async (source: ScrapeSourceItem) => {
    if (runningSourceId) return;
    setRunningSourceId(source.id);
    showToast(`Triggering scraper for ${source.name}...`, 'info');

    try {
      const res = await apiPost<any>(`/admin/sources/${source.id}/trigger`);
      if (res.ok && res.data?.success) {
        showToast(
          `Scrape completed for ${source.name}! Found: ${res.data.items_found ?? 0}, New drafts: ${res.data.new_items ?? 0}`,
          'success',
        );
        await reloadSources();
      } else {
        showToast(
          `Scrape failed for ${source.name}: ${res.data?.message ?? res.error ?? 'Unknown error'}`,
          'error',
        );
      }
    } catch (err) {
      showToast(
        `Error triggering ${source.name}: ${err instanceof Error ? err.message : String(err)}`,
        'error',
      );
    } finally {
      setRunningSourceId(null);
    }
  };

  const handleOpenHistory = async (source: ScrapeSourceItem) => {
    setSelectedSourceForHistory(source);
    setLoadingHistory(true);
    try {
      const res = await apiGet<{ runs: ScrapeRunItem[] }>(
        `/admin/sources/${source.id}/runs?limit=25`,
      );
      if (res && res.runs) {
        setHistoryRuns(res.runs);
      } else {
        setHistoryRuns([]);
      }
    } catch {
      showToast('Could not load run history', 'error');
      setHistoryRuns([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCheckLinkHealth = async () => {
    setCheckingLinks(true);
    showToast('Validating live opportunity links...', 'info');
    try {
      const res = await apiPost<LinkHealthReport>('/admin/link-health/check?limit=30');
      if (res.ok && res.data) {
        setLinkHealth(res.data);
        if (res.data.broken_count > 0) {
          showToast(
            `Link health check finished: ${res.data.broken_count} broken links detected`,
            'error',
          );
        } else {
          showToast(
            `All ${res.data.checked_count} tested links are fully operational!`,
            'success',
          );
        }
      } else {
        showToast('Link health check failed', 'error');
      }
    } catch {
      showToast('Link health check failed', 'error');
    } finally {
      setCheckingLinks(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-clay backdrop-blur-md transition-all',
            toastMessage.type === 'success'
              ? 'bg-sea/90 text-white'
              : toastMessage.type === 'error'
                ? 'bg-red-600/90 text-white'
                : 'bg-teal text-white',
          )}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
          {toastMessage.type === 'info' && <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 rounded-full p-1 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Controls & Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-teal">
            Official Sources & Scraper Engine
          </h2>
          <p className="text-sm text-teal/70">
            Real-time pipeline monitoring, automated ingestion schedule, and link health verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={reloadSources}
            disabled={refreshing}
            className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'gap-2 rounded-xl')}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </button>

          <button
            onClick={handleCheckLinkHealth}
            disabled={checkingLinks}
            className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'gap-2 rounded-xl')}
          >
            <Link2 className={cn('h-4 w-4', checkingLinks && 'animate-spin')} />
            Verify Live Links
          </button>

          {linkHealth && linkHealth.broken_count > 0 && (
            <button
              onClick={() => setShowLinkHealthModal(true)}
              className={cn(
                buttonClass({ variant: 'secondary', size: 'sm' }),
                'gap-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              {linkHealth.broken_count} Broken Link{linkHealth.broken_count > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-card border border-teal/10">
          <div className="flex items-center justify-between text-teal/60">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Sources</span>
            <Activity className="h-4 w-4 text-sea" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-teal">
            {summary.active} <span className="text-base font-normal text-teal/50">/ {summary.total}</span>
          </div>
          <p className="mt-1 text-xs text-teal/60">Registered ingestion crawlers</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card border border-teal/10">
          <div className="flex items-center justify-between text-teal/60">
            <span className="text-xs font-semibold uppercase tracking-wider">Healthy</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-700">
            {summary.healthy}
          </div>
          <p className="mt-1 text-xs text-emerald-600/80">Operating normally without errors</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card border border-teal/10">
          <div className="flex items-center justify-between text-teal/60">
            <span className="text-xs font-semibold uppercase tracking-wider">Failing / Error</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className={cn('mt-3 text-3xl font-extrabold', summary.failing > 0 ? 'text-red-600' : 'text-teal/40')}>
            {summary.failing}
          </div>
          <p className="mt-1 text-xs text-teal/60">Consecutive run failures</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card border border-teal/10">
          <div className="flex items-center justify-between text-teal/60">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Link Health</span>
            <ShieldCheck className="h-4 w-4 text-sea" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-teal">
            {linkHealth ? (
              <span className={linkHealth.broken_count > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                {linkHealth.broken_count === 0 ? '100%' : `${linkHealth.healthy_count}/${linkHealth.checked_count}`}
              </span>
            ) : (
              '100%'
            )}
          </div>
          <p className="mt-1 text-xs text-teal/60">
            {linkHealth ? `${linkHealth.checked_count} opportunities tested` : 'Ready to verify'}
          </p>
        </div>
      </div>

      {/* Sources Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card border border-teal/10">
        <div className="border-b border-teal/10 px-6 py-4">
          <h3 className="font-bold text-teal">Configured Ingestion Portals</h3>
          <p className="text-xs text-teal/60">
            Official government portals polled automatically by ApplyFields Ingestion Engine.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase text-teal/70 border-b border-teal/10">
              <tr>
                <th className="px-6 py-3 font-semibold">Portal & Key</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Interval</th>
                <th className="px-6 py-3 font-semibold">Last Crawl</th>
                <th className="px-6 py-3 font-semibold">Discovered</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal/10">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-teal/60">
                    No scrapers registered in database yet.
                  </td>
                </tr>
              ) : (
                sources.map((s) => {
                  const isRunningThis = runningSourceId === s.id;
                  return (
                    <tr key={s.id} className="hover:bg-teal/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-teal">{s.name}</div>
                        <div className="flex items-center gap-2 text-xs text-teal/60">
                          <span className="font-mono bg-teal/10 px-1.5 py-0.5 rounded text-[11px] text-teal">
                            {s.key}
                          </span>
                          <span>·</span>
                          <a
                            href={s.list_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-sea hover:underline"
                          >
                            Official Notice Board
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {s.health === 'healthy' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Healthy
                          </span>
                        )}
                        {s.health === 'failing' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            {s.consecutive_failures} Failures
                          </span>
                        )}
                        {s.health === 'stale' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                            Stale
                          </span>
                        )}
                        {s.health === 'idle' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            Idle
                          </span>
                        )}
                        {s.health === 'disabled' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-teal/80">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-teal/50" />
                          <span>Every {s.interval_hours}h</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {s.last_run_at ? (
                          <div>
                            <div className="text-teal font-medium">
                              {new Intl.DateTimeFormat('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'Asia/Kolkata',
                              }).format(new Date(s.last_run_at))}
                            </div>
                            <div className="text-[11px] text-teal/60">
                              {s.latest_run?.status === 'success' && 'Success'}
                              {s.latest_run?.status === 'partial' && 'Partial (some errors)'}
                              {s.latest_run?.status === 'failed' && 'Failed'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-teal/40">Never run</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-teal font-medium">
                          {s.total_documents} notice{s.total_documents === 1 ? '' : 's'}
                        </div>
                        <div className="text-[11px] text-teal/60">
                          {s.total_runs} total run{s.total_runs === 1 ? '' : 's'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenHistory(s)}
                            className={cn(
                              buttonClass({ variant: 'secondary', size: 'sm' }),
                              'gap-1.5 rounded-xl text-xs',
                            )}
                          >
                            <History className="h-3.5 w-3.5" />
                            Runs
                          </button>

                          <button
                            onClick={() => handleTriggerScraper(s)}
                            disabled={isRunningThis || !s.is_active}
                            className={cn(
                              buttonClass({ variant: 'primary', size: 'sm' }),
                              'gap-1.5 rounded-xl text-xs bg-sea hover:bg-sea/90 text-white',
                            )}
                          >
                            <Play className={cn('h-3.5 w-3.5', isRunningThis && 'animate-spin')} />
                            {isRunningThis ? 'Crawling...' : 'Run Now'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run History Slide-Over / Modal */}
      {selectedSourceForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-clay border border-teal/10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-teal/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-teal">
                  Run History — {selectedSourceForHistory.name}
                </h3>
                <p className="text-xs text-teal/60">
                  Past crawl executions, downloaded notice counts and failure logs.
                </p>
              </div>
              <button
                onClick={() => setSelectedSourceForHistory(null)}
                className="rounded-full p-2 text-teal/60 hover:bg-teal/10 hover:text-teal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-teal/60">
                  <RefreshCw className="h-8 w-8 animate-spin text-sea" />
                  <p className="mt-3 text-sm">Loading scraper run history...</p>
                </div>
              ) : historyRuns.length === 0 ? (
                <div className="py-12 text-center text-teal/60">
                  No previous runs recorded for this portal yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyRuns.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-2xl border border-teal/10 p-4 transition-all hover:bg-canvas"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {run.status === 'success' && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" /> Success
                            </span>
                          )}
                          {run.status === 'partial' && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              <AlertTriangle className="h-3 w-3" /> Partial
                            </span>
                          )}
                          {run.status === 'failed' && (
                            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                              <AlertCircle className="h-3 w-3" /> Failed
                            </span>
                          )}
                          {run.status === 'running' && (
                            <span className="flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-semibold text-teal">
                              <RefreshCw className="h-3 w-3 animate-spin" /> In Progress
                            </span>
                          )}

                          <span className="text-xs text-teal/60">
                            {new Intl.DateTimeFormat('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false,
                              timeZone: 'Asia/Kolkata',
                            }).format(new Date(run.started_at))}
                          </span>
                        </div>

                        <div className="text-xs text-teal/70">
                          Found <strong className="text-teal">{run.items_found}</strong> · New drafts:{' '}
                          <strong className="text-sea font-bold">{run.new_items}</strong>
                        </div>
                      </div>

                      {run.error && (
                        <div className="mt-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 font-mono">
                          {run.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-teal/10 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedSourceForHistory(null)}
                className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'rounded-xl')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broken Links Modal */}
      {showLinkHealthModal && linkHealth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-clay border border-teal/10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-teal/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-teal flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Live Broken Links Report
                </h3>
                <p className="text-xs text-teal/60">
                  {linkHealth.broken_count} broken links detected during automated worker validation.
                </p>
              </div>
              <button
                onClick={() => setShowLinkHealthModal(false)}
                className="rounded-full p-2 text-teal/60 hover:bg-teal/10 hover:text-teal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-3">
                {linkHealth.broken_links.map((item) => (
                  <div
                    key={item.opportunity_id}
                    className="rounded-2xl border border-red-200 bg-red-50/50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-teal">{item.title}</h4>
                        <div className="text-xs text-teal/60 font-mono mt-0.5">
                          slug: {item.slug}
                        </div>
                      </div>
                      <a
                        href={`/opportunities/${item.slug}`}
                        className="text-xs font-semibold text-sea hover:underline flex items-center gap-1"
                      >
                        Edit Opportunity <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      {item.apply_url && !item.apply_url_ok && (
                        <div className="flex items-center gap-2 text-red-700">
                          <span className="font-semibold">Broken Apply URL:</span>
                          <span className="font-mono truncate max-w-md">{item.apply_url}</span>
                          <span className="rounded bg-red-200 px-1 py-0.2 font-mono text-[10px]">
                            {item.apply_url_status ? `HTTP ${item.apply_url_status}` : 'Offline'}
                          </span>
                        </div>
                      )}
                      {item.pdf_url && !item.pdf_url_ok && (
                        <div className="flex items-center gap-2 text-red-700">
                          <span className="font-semibold">Broken PDF Notice:</span>
                          <span className="font-mono truncate max-w-md">{item.pdf_url}</span>
                          <span className="rounded bg-red-200 px-1 py-0.2 font-mono text-[10px]">
                            {item.pdf_url_status ? `HTTP ${item.pdf_url_status}` : 'Offline'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-teal/10 pt-4 flex justify-end">
              <button
                onClick={() => setShowLinkHealthModal(false)}
                className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'rounded-xl')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
