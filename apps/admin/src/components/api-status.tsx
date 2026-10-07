'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

/**
 * Client-side API health indicator for Internal Portal.
 * Performs a non-blocking check on mount and keeps pages fast.
 */
export function ApiStatus() {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
        if (active) setOnline(res.ok);
      } catch {
        if (active) setOnline(false);
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <span
      title={API_URL}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-1 font-semibold text-teal"
    >
      <span
        className={`size-2 rounded-full ${online ? 'bg-sea' : 'bg-teal/30'}`}
        aria-hidden="true"
      />
      {online ? 'API connected' : 'API offline'}
    </span>
  );
}
