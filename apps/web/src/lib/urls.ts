/**
 * Cross-App Ecosystem URL configuration
 * Maps subdomains cleanly between production and local dev
 */

export const PARTNER_PORTAL_URL =
  process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('applyfields.com')
    ? 'https://partners.applyfields.com'
    : 'http://localhost:3002');

export const SERVICE_PORTAL_URL =
  process.env.NEXT_PUBLIC_SERVICE_PORTAL_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('applyfields')
    ? 'https://service.applyfields.com'
    : 'http://localhost:3003');

export const ADMIN_PORTAL_URL =
  process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('applyfields')
    ? 'https://admin.applyfields.com'
    : 'http://localhost:3001');

/**
 * "Services" links: open the services portal signed in as the same account. The two sites are on
 * different domains (cookies can't be shared), so we pass a 60-second, single-use code in the URL
 * fragment (never sent to servers or in Referer) and the portal's /sso page trades it for a session.
 * Signed out, or ctrl/middle-click → a plain link.
 */
export async function goToServicePortal(e: { preventDefault(): void; button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean }) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (!localStorage.getItem('currentUser')) return;
  e.preventDefault();
  const { apiPost } = await import('./api');
  const res = await apiPost<{ code: string }>('/auth/handoff');
  window.location.assign(
    res.data?.code ? `${SERVICE_PORTAL_URL}/sso#code=${encodeURIComponent(res.data.code)}` : SERVICE_PORTAL_URL,
  );
}
