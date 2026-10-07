const DEV_FALLBACK = 'applyfields_dev_jwt_access_secret_32bytes_min_key';

/**
 * The JWT access-token secret. Required in production: the API refuses to
 * start (or verify/sign) rather than fall back to a public, source-committed
 * secret that would let anyone forge an admin token. Dev keeps the fallback.
 */
export function jwtAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_ACCESS_SECRET must be set in production');
  }
  return DEV_FALLBACK;
}
