import type { NextFunction, Request, Response } from 'express';

/**
 * Security headers for a JSON API (what helmet would set that matters here).
 * The API serves no HTML, so the CSP blocks everything a browser might try to render.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.removeHeader('X-Powered-By');
  next();
}

/** Requests allowed per IP per minute. Sign-in/codes are tight to slow password guessing. */
export const RATE_LIMITS = { auth: 20, default: 600 } as const;
const WINDOW_MS = 60_000;

// ponytail: in-memory fixed window per API instance; move to Redis if Render runs >1 instance.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimitHit(key: string, limit: number, now = Date.now()): { ok: boolean; retryAfterS: number } {
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 50_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterS: 0 };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, retryAfterS: Math.ceil((entry.resetAt - now) / 1000) };
}

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS' || process.env.NODE_ENV === 'test') return next();
  // Password/code guessing targets only; refresh/logout/me stay on the general limit.
  const isAuth = /^\/api\/v1\/auth\/(register|otp|login|passkey\/login|password|social-login)/.test(req.path);
  const bucket = isAuth ? 'auth' : 'default';
  const { ok, retryAfterS } = rateLimitHit(`${bucket}:${req.ip}`, RATE_LIMITS[bucket]);
  if (ok) return next();
  res.setHeader('Retry-After', String(retryAfterS));
  res.status(429).json({ statusCode: 429, message: 'Too many requests. Please wait a minute and try again.' });
}
