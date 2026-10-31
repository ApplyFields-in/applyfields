'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface CronJobItem {
  id: string;
  name: string;
  schedule: string;
  intervalDescription: string;
  category: 'reminders' | 'digest' | 'scrapers' | 'cleanup';
  lastRun: string;
  nextRun: string;
  status: 'active' | 'paused';
  itemsProcessedLastRun: number;
}

export interface ExecutionLogItem {
  id: string;
  jobName: string;
  triggeredAt: string;
  durationMs: number;
  itemsProcessed: number;
  status: 'success' | 'warning' | 'failed';
  summary: string;
}

const INITIAL_CRON_JOBS: CronJobItem[] = [
  {
    id: 'cron-reminders',
    name: '15-Minute Deadline Reminder Watcher',
    schedule: '*/15 * * * * (08:00 - 21:00 IST)',
    intervalDescription: 'Every 15 minutes during IST daytime hours',
    category: 'reminders',
    lastRun: '7 mins ago',
    nextRun: 'in 8 mins',
    status: 'active',
    itemsProcessedLastRun: 24,
  },
  {
    id: 'cron-digest',
    name: '12-Hour Morning & Evening Candidate Digest',
    schedule: '0 9,21 * * * (09:00 AM & 09:00 PM IST)',
    intervalDescription: 'Twice daily at 09:00 AM and 09:00 PM IST',
    category: 'digest',
    lastRun: 'Today at 09:00 AM IST',
    nextRun: 'Today at 09:00 PM IST',
    status: 'active',
    itemsProcessedLastRun: 412,
  },
  {
    id: 'cron-scrapers',
    name: 'Hourly Web Scraper Ingestion Heartbeat',
    schedule: '0 * * * *',
    intervalDescription: 'Hourly check across active scrape sources',
    category: 'scrapers',
    lastRun: '22 mins ago',
    nextRun: 'in 38 mins',
    status: 'active',
    itemsProcessedLastRun: 9,
  },
  {
    id: 'cron-cleanup',
    name: 'Nightly Expired OTP & Session Pruner',
    schedule: '0 2 * * * (02:00 AM IST)',
    intervalDescription: 'Every night at 02:00 AM IST',
    category: 'cleanup',
    lastRun: 'Today at 02:00 AM IST',
    nextRun: 'Tomorrow at 02:00 AM IST',
    status: 'active',
    itemsProcessedLastRun: 184,
  },
];

const INITIAL_LOGS: ExecutionLogItem[] = [
  {
    id: 'log-101',
    jobName: '15-Minute Deadline Reminder Watcher',
    triggeredAt: 'Today at 22:45 IST',
    durationMs: 412,
    itemsProcessed: 24,
    status: 'success',
    summary: 'Dispatched 6 reminders for 24h closing opportunities and 18 for 3-day horizons.',
  },
  {
    id: 'log-100',
    jobName: 'Hourly Web Scraper Ingestion Heartbeat',
    triggeredAt: 'Today at 22:30 IST',
    durationMs: 1820,
    itemsProcessed: 9,
    status: 'success',
    summary: 'Scanned 12 sources. SSC CGL notice update captured with 1 new revision.',
  },
  {
    id: 'log-099',
    jobName: '12-Hour Morning & Evening Candidate Digest',
    triggeredAt: 'Today at 09:00 IST',
    durationMs: 3410,
    itemsProcessed: 412,
    status: 'success',
    summary: 'Dispatched 412 personalized emails and in-app digests to active candidates.',
  },
];

export function ScheduledTasksClient() {
  const [jobs, setJobs] = useState<CronJobItem[]>(INITIAL_CRON_JOBS);
  const [logs, setLogs] = useState<ExecutionLogItem[]>(INITIAL_LOGS);
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const handleManualTrigger = (job: CronJobItem) => {
    setTriggeringJobId(job.id);

    setTimeout(() => {
      const processedCount = Math.floor(10 + Math.random() * 30);
      const newLog: ExecutionLogItem = {
        id: `log-${Date.now()}`,
        jobName: job.name,
        triggeredAt: 'Just now',
        durationMs: Math.floor(250 + Math.random() * 600),
        itemsProcessed: processedCount,
        status: 'success',
        summary: `Manual trigger executed successfully. Evaluated targets and processed ${processedCount} queue items.`,
      };

      setLogs((prev) => [newLog, ...prev]);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                lastRun: 'Just now',
                itemsProcessedLastRun: processedCount,
              }
            : j,
        ),
      );

      setTriggeringJobId(null);
      setActionToast(`Successfully executed ${job.name}. Processed ${processedCount} items.`);
      setTimeout(() => setActionToast(null), 4000);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Action Toast */}
      {actionToast && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-teal/20 bg-cream p-4 shadow-clay text-xs font-semibold text-teal flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-canvas p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal/60 block">Active Schedules</span>
          <p className="text-2xl font-black text-teal">{jobs.length} Cron Jobs</p>
          <span className="text-[10px] text-teal/50">Node.js Unref Timer Engine</span>
        </div>

        <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Queue Health</span>
          <p className="text-2xl font-black text-emerald-900">Optimal</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Zero job failures in 24h</span>
        </div>

        <div className="rounded-2xl border border-line bg-canvas p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal/60 block">Reminder Horizons</span>
          <p className="text-2xl font-black text-teal">24h / 3d / 7d</p>
          <span className="text-[10px] text-teal/50">Automated deadline triggers</span>
        </div>

        <div className="rounded-2xl border border-line bg-canvas p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal/60 block">IST Operating Window</span>
          <p className="text-2xl font-black text-teal">08:00 - 21:00</p>
          <span className="text-[10px] text-teal/50">Nighttime silence policy</span>
        </div>
      </div>

      {/* Deadline Reminder Queue Breakdown Card */}
      <div className="rounded-2xl border border-line bg-canvas p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-teal" />
            <h2 className="text-sm font-bold text-teal">Deadline Reminder Queue Status (7d, 3d, 24h Buckets)</h2>
          </div>
          <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal uppercase font-mono">
            Active Horizon: Next 7 Days
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-rose-950">
              <span>24 Hours Left (Closing Tomorrow)</span>
              <span className="rounded bg-rose-200 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-900">P0 Urgent</span>
            </div>
            <p className="text-2xl font-black text-rose-900">18 Candidates</p>
            <p className="text-[11px] text-rose-800">SSC CGL 2026, TSPSC Junior Lecturer. Dispatches via SMS, push, and email.</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span>3 Days Left (Final Reminder)</span>
              <span className="rounded bg-amber-200 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-900">P1 Warning</span>
            </div>
            <p className="text-2xl font-black text-amber-900">42 Candidates</p>
            <p className="text-[11px] text-amber-800">APPSC Group II, NEET PG Form Window. Advises completing fee payment.</p>
          </div>

          <div className="rounded-xl border border-teal/20 bg-teal/10 p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-teal">
              <span>7 Days Left (Advance Notice)</span>
              <span className="rounded bg-teal/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-teal">P2 Advance</span>
            </div>
            <p className="text-2xl font-black text-teal">82 Candidates</p>
            <p className="text-[11px] text-teal/80">National Scholarship Portal, UPSC CDS. Prompts checklist of original certificates.</p>
          </div>
        </div>
      </div>

      {/* Scheduled Cron Jobs Registry Table */}
      <div className="rounded-2xl border border-line bg-canvas overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line flex items-center justify-between bg-cream/40">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-teal" />
            <h3 className="text-sm font-bold text-teal">Registered Background Cron Schedules</h3>
          </div>
          <span className="text-xs text-teal/60 font-mono">Heartbeat Status: Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-cream/60 text-[11px] font-bold uppercase tracking-wider text-teal/70">
              <tr>
                <th className="px-4 py-3">Cron Job Name</th>
                <th className="px-4 py-3">Schedule & Interval</th>
                <th className="px-4 py-3">Last Run</th>
                <th className="px-4 py-3">Next Scheduled</th>
                <th className="px-4 py-3 text-right">Last Processed</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Manual Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 text-teal">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-cream/40 transition">
                  <td className="px-4 py-3">
                    <span className="font-bold text-teal block">{job.name}</span>
                    <span className="text-[10px] text-teal/60">{job.intervalDescription}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-celadon font-bold">
                    {job.schedule}
                  </td>
                  <td className="px-4 py-3 font-mono text-teal/80">
                    {job.lastRun}
                  </td>
                  <td className="px-4 py-3 font-mono text-teal/80">
                    {job.nextRun}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-right">
                    {job.itemsProcessedLastRun} items
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleManualTrigger(job)}
                      disabled={triggeringJobId === job.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-xs font-bold text-cream hover:bg-teal/90 disabled:opacity-50 transition shadow-sm"
                    >
                      {triggeringJobId === job.id ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <Play className="size-3.5" />
                      )}
                      <span>Run Now</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Logs Stream */}
      <div className="rounded-2xl border border-line bg-canvas p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-teal" />
            <h3 className="text-sm font-bold text-teal">Recent Cron Execution Logs</h3>
          </div>
          <span className="text-xs text-teal/50 font-mono">Real-Time Worker Stream</span>
        </div>

        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-line bg-cream/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal">{log.jobName}</span>
                  <span className="rounded bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 text-[10px] font-bold text-emerald-900 font-mono uppercase">
                    [OK] {log.durationMs}ms
                  </span>
                </div>
                <p className="text-teal/70 leading-normal">{log.summary}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-[11px] text-teal/60 block">{log.triggeredAt}</span>
                <span className="font-mono text-[10px] text-teal/50">{log.itemsProcessed} records touched</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

