import { describe, expect, it } from 'vitest';
import { searchQuerySchema, searchWords, suggestQuerySchema } from './search.service.js';

describe('searchWords', () => {
  it('keeps letters and digits only, lower-cased', () => {
    expect(searchWords('  SSC  CGL-2026!')).toEqual(['ssc', 'cgl', '2026']);
    expect(searchWords("o'reilly & (x:* | y)")).toEqual(['o', 'reilly', 'x', 'y']);
    expect(searchWords('తెలంగాణ jobs')).toEqual(['తెలంగాణ', 'jobs']); // vowel signs are marks, not letters
    expect(searchWords('  ')).toEqual([]);
  });

  it('caps the number of words', () => {
    expect(searchWords('a b c d e f g h i j')).toHaveLength(8);
  });
});

describe('searchQuerySchema', () => {
  it('fills defaults and drops empty form fields', () => {
    expect(searchQuerySchema.parse({ q: ' ssc ', state: '', qualification: '', deadline: '' })).toEqual({
      q: 'ssc',
      sort: 'relevance',
      limit: 20,
    });
  });

  it('normalises state and limit', () => {
    const r = searchQuerySchema.parse({ q: 'x', state: 'ts', limit: '6', type: 'service' });
    expect(r).toMatchObject({ state: 'TS', limit: 6, type: 'service' });
  });

  it('rejects unknown values', () => {
    expect(searchQuerySchema.safeParse({ type: 'job' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ state: 'Telangana' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
  });
});

describe('suggestQuerySchema', () => {
  it('fills defaults and trims input', () => {
    expect(suggestQuerySchema.parse({ q: '  ssc  ' })).toEqual({
      q: 'ssc',
      limit: 6,
    });
  });

  it('normalises limit and caps max query length', () => {
    expect(suggestQuerySchema.parse({ q: 'upsc', limit: '10' })).toEqual({
      q: 'upsc',
      limit: 10,
    });
    expect(suggestQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
  });
});
