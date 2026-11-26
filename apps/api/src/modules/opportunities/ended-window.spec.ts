import { afterEach, describe, expect, it, vi } from 'vitest';
import { endedWindowDays, staleEndedWhere } from './opportunities.service.js';

/** The red window: an ended job auto-archives `windowDays` after its deadline. */
describe('staleEndedWhere', () => {
  it('cuts off exactly windowDays before today, same `lt` edge as auto-close', () => {
    const today = new Date(Date.UTC(2026, 10, 26)); // 2026-11-26
    expect(staleEndedWhere(today, 14)).toEqual({
      status: 'closed',
      OR: [
        { application_end: { lt: new Date(Date.UTC(2026, 10, 12)) } }, // 2026-11-12
        { application_end: null, closed_at: { lt: new Date(Date.UTC(2026, 10, 12)) } },
      ],
    });
  });
});

describe('endedWindowDays', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('defaults to 14 when unset or invalid', () => {
    vi.stubEnv('ENDED_WINDOW_DAYS', '');
    expect(endedWindowDays()).toBe(14);
    vi.stubEnv('ENDED_WINDOW_DAYS', '0');
    expect(endedWindowDays()).toBe(14);
    vi.stubEnv('ENDED_WINDOW_DAYS', '-5');
    expect(endedWindowDays()).toBe(14);
    vi.stubEnv('ENDED_WINDOW_DAYS', '7.5');
    expect(endedWindowDays()).toBe(14);
  });

  it('uses a positive integer override', () => {
    vi.stubEnv('ENDED_WINDOW_DAYS', '30');
    expect(endedWindowDays()).toBe(30);
  });
});
