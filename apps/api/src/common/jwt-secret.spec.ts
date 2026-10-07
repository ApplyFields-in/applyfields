import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { jwtAccessSecret } from './jwt-secret.js';

describe('jwtAccessSecret', () => {
  const original = { ...process.env };
  beforeEach(() => {
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.NODE_ENV;
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it('returns the configured secret when set', () => {
    process.env.JWT_ACCESS_SECRET = 'real-secret';
    expect(jwtAccessSecret()).toBe('real-secret');
  });

  it('falls back to the dev secret outside production', () => {
    expect(jwtAccessSecret()).toContain('dev');
  });

  it('throws in production when the secret is missing', () => {
    process.env.NODE_ENV = 'production';
    expect(() => jwtAccessSecret()).toThrow(/JWT_ACCESS_SECRET/);
  });
});
