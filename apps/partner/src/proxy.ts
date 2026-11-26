import { NextResponse, type NextRequest } from 'next/server';

// Browser calls to /api/v1 are rewritten (next.config) to the API, which would otherwise see Vercel's
// IP for every user and rate-limit them all as one. Tell it the real caller; the shared secret is how
// the API knows this header came from us (apps/api/src/common/client-ip.ts). Vercel overwrites
// x-real-ip / x-forwarded-for, so a visitor can't fake them. Same file in admin, partner, service.
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete('x-af-proxy-key');
  headers.delete('x-af-client-ip');
  const secret = process.env.PROXY_SHARED_SECRET;
  const ip =
    request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (secret && ip) {
    headers.set('x-af-proxy-key', secret);
    headers.set('x-af-client-ip', ip);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: '/api/v1/:path*' };
