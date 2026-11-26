import { timingSafeEqual } from 'node:crypto';

/**
 * Our Next.js apps (web, admin, partner, service) reach the API through Vercel, so req.ip is Vercel's
 * address for every user. Their proxy.ts forwards the real caller in x-af-client-ip, together with
 * PROXY_SHARED_SECRET in x-af-proxy-key so nobody else can set it. Same secret on Render and Vercel.
 */
export const PROXY_KEY_HEADER = 'x-af-proxy-key';
export const CLIENT_IP_HEADER = 'x-af-client-ip';

type Req = { headers: Record<string, string | string[] | undefined>; ip?: string };

function fromOurProxy(req: Req, secret: string | undefined): boolean {
  const got = req.headers[PROXY_KEY_HEADER];
  if (!secret || typeof got !== 'string') return false;
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The real caller's IP. Never trusts x-forwarded-for: Render only appends to it, and Render's edge is
 * Cloudflare, so req.ip ('trust proxy' 1) is a rotating Cloudflare address, not the caller (seen in
 * prod 2026-11-26: one client spread over 5+ rate-limit buckets). Cloudflare sets CF-Connecting-IP to
 * the real caller and overwrites any value a client sends.
 */
export function clientIp(req: Req, secret = process.env.PROXY_SHARED_SECRET): string | undefined {
  if (fromOurProxy(req, secret)) {
    const ip = req.headers[CLIENT_IP_HEADER];
    if (typeof ip === 'string' && ip) return ip;
  }
  const edge = req.headers['cf-connecting-ip'];
  if (typeof edge === 'string' && edge) return edge;
  return req.ip;
}

/** A server-rendered page calling from our own Next server (key, no user IP): not a visitor to limit. */
export function isOurServerRender(req: Req, secret = process.env.PROXY_SHARED_SECRET): boolean {
  return fromOurProxy(req, secret) && !req.headers[CLIENT_IP_HEADER];
}
