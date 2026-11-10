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
