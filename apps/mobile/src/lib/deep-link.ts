/**
 * Shared website links open in the app (Android App Links / iOS Universal Links / applyfields:// scheme).
 * The website's paths differ from the app's routes, so map them here before Expo Router resolves them.
 */
const RULES: [RegExp, (slug: string) => string][] = [
  [/^\/(?:jobs|exams|scholarships|admissions)\/([^/?#]+)/, (slug) => `/opportunity/${slug}`],
  [/^\/career\/colleges\/([^/?#]+)/, (slug) => `/college/${slug}`],
  [/^\/services\/([^/?#]+)/, (slug) => `/service/${slug}`],
];

/** Path part of an https://… or applyfields://… link ("applyfields://jobs/x" has host "jobs"). */
export function webPath(link: string): string {
  const m = link.match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)(.*)$/i);
  if (!m) return link.startsWith('/') ? link : `/${link}`;
  const [, host, rest] = m;
  return /^https?:/i.test(link) ? rest || '/' : `/${host}${rest}`;
}

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const p = webPath(path);
    for (const [re, to] of RULES) {
      const m = p.match(re);
      if (m) return to(m[1]);
    }
    // Other website pages have no app screen yet: open the home tab instead of "not found".
    return /^https?:/i.test(path) ? '/' : path;
  } catch {
    return '/';
  }
}

/**
 * Where a notification opens in the app (push tap and the Alerts list). Links are the website
 * URLs/paths the notification engine stores. null = no matching screen (stay on / open Alerts).
 */
export function notificationRoute(link: string | null | undefined): string | null {
  if (!link) return null;
  const chat = link.match(/\/bookings\/([0-9a-f-]{36})\?(?:.*&)?chat=1/i); // centre wrote in the booking chat
  if (chat) return `/chat/${chat[1]}`;
  const opp = link.match(/^\/(?:jobs|exams|scholarships|admissions)\/([^/?#]+)/);
  if (opp) return `/opportunity/${opp[1]}`;
  const service = link.match(/^\/services?\/([^/?#]+)/);
  if (service) return `/service/${service[1]}`;
  if (/\/(my-)?bookings\b/.test(link)) return '/bookings'; // booking updates on the service site
  return null;
}
