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
    ? 'https://service.applyfields.in'
    : 'http://localhost:3003');

export const ADMIN_PORTAL_URL =
  process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('applyfields')
    ? 'https://admin.applyfields.com'
    : 'http://localhost:3001');
