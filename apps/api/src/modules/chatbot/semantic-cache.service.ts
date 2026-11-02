import { Injectable, Logger } from '@nestjs/common';
import type { ChatbotQueryResponse } from '@applyfields/types';

export interface CachedResponseEntry {
  response: ChatbotQueryResponse;
  created_at: number;
  expires_at: number;
  hits: number;
  normalized_query: string;
}

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_CACHE_SIZE = 5000;

@Injectable()
export class SemanticCacheService {
  private readonly logger = new Logger('SemanticCacheService');
  private readonly cache = new Map<string, CachedResponseEntry>();

  /**
   * Normalizes a user query into a canonical representation for semantic matching
   */
  normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generates a deterministic cache key based on opportunity scope and normalized question
   */
  generateKey(opportunitySlug: string | undefined | null, query: string): string {
    const scope = (opportunitySlug || 'global').toLowerCase().trim();
    const norm = this.normalizeQuery(query);
    return `cache:${scope}:${norm}`;
  }

  /**
   * Retrieves a cached response if valid and not expired
   */
  get(opportunitySlug: string | undefined | null, query: string): ChatbotQueryResponse | null {
    const key = this.generateKey(opportunitySlug, query);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires_at) {
      this.cache.delete(key);
      return null;
    }

    entry.hits += 1;
    this.logger.debug(`[SemanticCache] Cache HIT for key: ${key} (hits: ${entry.hits})`);

    // Return a clone marked with cached deterministic mode and sub-30ms latency
    return {
      ...entry.response,
      mode: 'deterministic',
    };
  }

  /**
   * Stores a response in cache with 12-hour TTL
   */
  set(
    opportunitySlug: string | undefined | null,
    query: string,
    response: ChatbotQueryResponse,
    ttlMs: number = DEFAULT_TTL_MS,
  ): void {
    // Evict oldest if exceeding max size
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const key = this.generateKey(opportunitySlug, query);
    const now = Date.now();

    this.cache.set(key, {
      response,
      created_at: now,
      expires_at: now + ttlMs,
      hits: 0,
      normalized_query: this.normalizeQuery(query),
    });

    this.logger.debug(`[SemanticCache] Cached response for key: ${key}`);
  }

  /**
   * Invalidates all cached entries for a specific opportunity (e.g. when an admin updates it)
   */
  invalidateOpportunity(opportunitySlug: string): number {
    const prefix = `cache:${opportunitySlug.toLowerCase().trim()}:`;
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.logger.log(`[SemanticCache] Invalidated ${count} entries for opportunity: ${opportunitySlug}`);
    return count;
  }

  /**
   * Returns cache metrics for admin observability
   */
  getMetrics(): { total_entries: number; total_hits: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    return {
      total_entries: this.cache.size,
      total_hits: totalHits,
    };
  }
}

