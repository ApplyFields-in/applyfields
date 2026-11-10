'use client';

import { Badge, Card, EmptyState } from '@applyfields/ui';
import { CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiGetWithStatus } from '@/lib/api';

interface JobRun {
  at: string;
  ok: boolean;
  message: string;
}
interface Job {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  off_flag: string;
  runs: JobRun[];
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** The API's real background jobs (GET /admin/scheduled-tasks). History is kept since the API last started. */
export function ScheduledTasksClient() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiGetWithStatus<{ items: Job[] }>('/admin/scheduled-tasks');
    setJobs(res.data?.items ?? []);
    setError(res.ok ? null : 'Could not load background jobs. Is the API running and up to date?');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch; state is set after the await
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-teal/80">
          Run history is kept in memory since the API last started (a deploy or a Render restart clears it).
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="clay-press inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-teal shadow-clay"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>

      {error && (
        <Card tone="tea" className="p-4 text-sm font-semibold text-teal">
          {error}
        </Card>
      )}

      {jobs === null ? (
        <p className="text-sm text-teal/70">Loading…</p>
      ) : jobs.length === 0 ? (
        <EmptyState icon={<Clock />} title="No jobs reported" text="The API did not return any background jobs." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => {
            const last = job.runs[0];
            return (
              <Card key={job.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-teal">{job.name}</p>
                    <p className="mt-0.5 text-xs text-teal/75">{job.schedule}</p>
                  </div>
                  {!job.enabled ? (
                    <Badge tone="outline">Off ({job.off_flag}=off)</Badge>
                  ) : !last ? (
                    <Badge tone="tea">Waiting for first run</Badge>
                  ) : last.ok ? (
                    <Badge tone="celadon">Last run OK</Badge>
                  ) : (
                    <Badge tone="teal">Last run failed</Badge>
                  )}
                </div>
                {job.runs.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {job.runs.slice(0, 5).map((r) => (
                      <li key={r.at} className="flex items-start gap-2 text-xs text-teal">
                        {r.ok ? (
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-label="OK" />
                        ) : (
                          <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" aria-label="Failed" />
                        )}
                        <span className="w-28 shrink-0 text-teal/70">{when(r.at)}</span>
                        <span className="min-w-0 break-words">{r.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
