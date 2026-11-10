/** The API's real background jobs and their recent runs, for the admin "Scheduled tasks" page. */

export interface JobRun {
  at: string;
  ok: boolean;
  message: string;
}

export const JOBS = [
  { id: 'auto-close', name: 'Close expired listings', schedule: 'Every hour', offFlag: 'AUTO_CLOSE' },
  { id: 'notifications', name: 'Reminders & notification digests', schedule: 'Every 15 minutes (reminders 8 am–9 pm IST)', offFlag: 'NOTIFICATIONS' },
  { id: 'ingestion', name: 'Run due scrapers', schedule: 'Every hour (each source on its own interval)', offFlag: 'INGESTION_SCHEDULER' },
  { id: 'link-health', name: 'Check official links', schedule: 'Every day', offFlag: 'LINK_HEALTH' },
] as const;

export type JobId = (typeof JOBS)[number]['id'];

// ponytail: in memory, so history resets on each deploy/restart; store in a table if staff need longer history.
const runs = new Map<JobId, JobRun[]>();

export function recordJobRun(job: JobId, ok: boolean, message: string): void {
  const list = runs.get(job) ?? [];
  list.unshift({ at: new Date().toISOString(), ok, message });
  runs.set(job, list.slice(0, 20));
}

export function listJobs() {
  const disabled = process.env.NODE_ENV === 'test';
  return JOBS.map((j) => ({
    id: j.id,
    name: j.name,
    schedule: j.schedule,
    enabled: !disabled && process.env[j.offFlag] !== 'off',
    off_flag: j.offFlag,
    runs: runs.get(j.id) ?? [],
  }));
}
