'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackServiceEvent } from '@/lib/analytics/tracker';

/** One anonymous page_view per page (path only, never the query string). Only with analytics consent. */
export function PageViewTracker() {
  const path = usePathname();
  useEffect(() => {
    if (path) trackServiceEvent('page_view', { metadata: { site: 'service', path: path.slice(0, 200) } });
  }, [path]);
  return null;
}
