'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/tracker';

export function OpportunityAnalyticsTracker({
  id,
  slug,
  type,
}: {
  id: string;
  slug: string;
  type: string;
}) {
  useEffect(() => {
    if (id || slug) {
      trackEvent('opportunity_view', {
        entity_type: 'opportunity',
        entity_id: id || slug,
        metadata: { slug, type },
      });
    }
  }, [id, slug, type]);

  return null;
}

export function SearchAnalyticsTracker({
  query,
  totalResults,
}: {
  query: string;
  totalResults: number;
}) {
  useEffect(() => {
    if (query?.trim()) {
      trackEvent('search', {
        entity_type: 'search',
        metadata: { query: query.trim(), total_results: totalResults },
      });
    }
  }, [query, totalResults]);

  return null;
}

export function ExternalApplyLink({
  opportunityId,
  opportunitySlug,
  href,
  className,
  children,
}: {
  opportunityId: string;
  opportunitySlug: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent('external_apply_click', {
          entity_type: 'opportunity',
          entity_id: opportunityId || opportunitySlug,
          metadata: { apply_url: href, slug: opportunitySlug },
        });
      }}
      className={className}
    >
      {children}
    </a>
  );
}
