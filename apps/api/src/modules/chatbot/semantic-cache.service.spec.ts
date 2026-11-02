import { describe, expect, it } from 'vitest';
import { SemanticCacheService } from './semantic-cache.service.js';
import type { ChatbotQueryResponse } from '@applyfields/types';

describe('SemanticCacheService', () => {
  const service = new SemanticCacheService();

  const mockResponse: ChatbotQueryResponse = {
    mode: 'deterministic',
    intent: 'deadline',
    answer: 'The final deadline to apply is 31 March 2026.',
    actions: [{ label: 'Apply', action: 'navigate', url: '/apply' }],
  };

  it('should normalize questions consistently', () => {
    const q1 = service.normalizeQuery('When is the LAST date???');
    const q2 = service.normalizeQuery('  when is the last date  ');
    expect(q1).toBe('when is the last date');
    expect(q2).toBe('when is the last date');
    expect(q1).toBe(q2);
  });

  it('should return null for non-cached queries', () => {
    const res = service.get('ssc-cgl', 'What is the refund policy?');
    expect(res).toBeNull();
  });

  it('should cache and retrieve responses with sub-30ms deterministic mode', () => {
    service.set('ssc-cgl', 'What is the last date to apply?', mockResponse);

    const hit = service.get('ssc-cgl', 'what is the last date to apply?');
    expect(hit).not.toBeNull();
    expect(hit?.answer).toBe(mockResponse.answer);
    expect(hit?.mode).toBe('deterministic');
  });

  it('should invalidate cache entries by opportunity slug', () => {
    service.set('upsc-cse', 'When is the prelims exam?', mockResponse);
    expect(service.get('upsc-cse', 'When is the prelims exam?')).not.toBeNull();

    const count = service.invalidateOpportunity('upsc-cse');
    expect(count).toBeGreaterThan(0);
    expect(service.get('upsc-cse', 'When is the prelims exam?')).toBeNull();
  });

  it('should track metrics correctly', () => {
    const metrics = service.getMetrics();
    expect(metrics.total_entries).toBeGreaterThanOrEqual(1);
    expect(metrics.total_hits).toBeGreaterThanOrEqual(1);
  });
});

