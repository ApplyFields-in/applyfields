'use client';

import { useEffect, useState } from 'react';

/**
 * Real reachability of a portal URL, checked from this browser.
 * no-cors: we can't read the response, but the request only resolves if the site answered
 * (a missing DNS record or a down server rejects).
 */
export function PortalStatus({ url, upLabel = 'Live' }: { url: string; upLabel?: string }) {
  const [state, setState] = useState<'checking' | 'up' | 'down'>('checking');

  useEffect(() => {
    let active = true;
    fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(10_000) })
      .then(() => active && setState('up'))
      .catch(() => active && setState('down'));
    return () => {
      active = false;
    };
  }, [url]);

  return <StatusDot state={state} upLabel={upLabel} title={url} />;
}

export function StatusDot({
  state,
  upLabel = 'Live',
  title,
}: {
  state: 'checking' | 'up' | 'down';
  upLabel?: string;
  title?: string;
}) {
  const style =
    state === 'up'
      ? { text: 'text-emerald-700', dot: 'bg-emerald-500 animate-pulse', label: upLabel }
      : state === 'down'
        ? { text: 'text-red-700', dot: 'bg-red-500', label: 'Unreachable' }
        : { text: 'text-slate-500', dot: 'bg-slate-300', label: 'Checking…' };
  return (
    <span title={title} className={`inline-flex items-center gap-1 text-[11px] font-bold ${style.text}`}>
      <span className={`size-2 rounded-full ${style.dot}`} aria-hidden="true" /> {style.label}
    </span>
  );
}
