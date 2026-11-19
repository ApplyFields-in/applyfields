/**
 * Background timers (notifications, auto-close, link health, scraper scheduler) run inside the API
 * process. With several API instances they must run on exactly one: set SCHEDULERS=off on the
 * instances that serve traffic and leave it unset on the single worker. Each timer also keeps its
 * own off switch (e.g. NOTIFICATIONS=off), and everything is off in tests.
 */
export function schedulerOff(ownFlag: string): boolean {
  return process.env.NODE_ENV === 'test' || process.env.SCHEDULERS === 'off' || process.env[ownFlag] === 'off';
}
