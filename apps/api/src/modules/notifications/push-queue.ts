import { Queue, Worker, type JobsOptions } from 'bullmq';

/**
 * Push delivery queue (BullMQ on Redis). notifyChunk() adds one job per ≤1000 freshly created
 * notifications; a worker sends them (Expo 100 per request, browsers 20 at a time). Jobs live in
 * Redis, so a deploy or crash no longer drops pushes still waiting to go out, and a separate
 * worker process (dist/worker.js) keeps browser-push encryption off the API's CPU.
 * Off when REDIS_URL is unset: pushes then go out in-process like before.
 */
export const PUSH_QUEUE = 'push';

export type PushRow = { id: string; user_id: string; type: string; title: string; body: string | null; link: string | null };
export type PushJob = { rows: PushRow[] };

export const PUSH_JOB_OPTS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: 1000, // keep the last 1000 failures to look at
};

const redisUrl = () => (process.env.NODE_ENV === 'test' ? undefined : process.env.REDIS_URL?.trim() || undefined);

export function createPushQueue(): Queue<PushJob> | null {
  const url = redisUrl();
  return url ? new Queue<PushJob>(PUSH_QUEUE, { connection: { url } }) : null;
}

/** Consumer; runs wherever REDIS_URL is set and PUSH_WORKER isn't 'off'. */
export function createPushWorker(send: (rows: PushRow[]) => Promise<void>): Worker<PushJob> | null {
  const url = redisUrl();
  if (!url || process.env.PUSH_WORKER === 'off') return null;
  return new Worker<PushJob>(PUSH_QUEUE, (job) => send(job.data.rows), { connection: { url } });
}
