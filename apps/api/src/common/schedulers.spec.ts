import { afterEach, describe, expect, it, vi } from 'vitest';
import { schedulerOff } from './schedulers.js';

describe('schedulerOff', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('runs only where nothing switches it off', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SCHEDULERS', '');
    vi.stubEnv('NOTIFICATIONS', '');
    expect(schedulerOff('NOTIFICATIONS')).toBe(false);
  });

  it('SCHEDULERS=off stops every timer; each flag still stops its own', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SCHEDULERS', 'off');
    expect(schedulerOff('NOTIFICATIONS')).toBe(true);
    expect(schedulerOff('AUTO_CLOSE')).toBe(true);
    vi.stubEnv('SCHEDULERS', '');
    vi.stubEnv('AUTO_CLOSE', 'off');
    expect(schedulerOff('AUTO_CLOSE')).toBe(true);
    expect(schedulerOff('LINK_HEALTH')).toBe(false);
  });

  it('is always off in tests', () => {
    vi.stubEnv('NODE_ENV', 'test');
    expect(schedulerOff('NOTIFICATIONS')).toBe(true);
  });
});
