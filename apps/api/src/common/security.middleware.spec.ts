import { describe, expect, it } from 'vitest';
import { rateLimitHit } from './security.middleware.js';

describe('rateLimitHit', () => {
  it('allows up to the limit, blocks after, and resets after a minute', () => {
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimitHit('k', 3, t).ok).toBe(true);
    const blocked = rateLimitHit('k', 3, t + 1000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterS).toBe(59);
    expect(rateLimitHit('k', 3, t + 60_000).ok).toBe(true);
    expect(rateLimitHit('other', 3, t + 1000).ok).toBe(true); // separate key, separate count
  });
});
