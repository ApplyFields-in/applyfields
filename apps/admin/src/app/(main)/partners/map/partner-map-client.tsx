'use client';

import type { AdminPartnerItem } from '@applyfields/types';
import { Badge, Card, buttonClass, cn } from '@applyfields/ui';
import Link from 'next/link';
import { useState } from 'react';

const TONE = { verified: 'celadon', pending: 'tea', rejected: 'outline' } as const;

/**
 * Pins placed by lat/lng inside the bounding box of the centres themselves (no map tiles, no key).
 * ponytail: plain projection, fine for a state-sized area; swap for Leaflet/OSM tiles if staff need roads.
 */
export function PartnerMapClient({ partners, total }: { partners: AdminPartnerItem[]; total: number }) {
  const [status, setStatus] = useState<'all' | AdminPartnerItem['verification_status']>('all');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const shown = partners.filter(
    (p) =>
      (status === 'all' || p.verification_status === status) &&
      (!query || [p.business_name, p.city, p.district, p.owner_name].some((v) => v?.toLowerCase().includes(query))),
  );
  const pinned = shown.filter((p) => p.latitude != null && p.longitude != null);
  const selected = partners.find((p) => p.id === selectedId) ?? null;

  const lats = pinned.map((p) => p.latitude!);
  const lngs = pinned.map((p) => p.longitude!);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  // 8% padding; a single pin (zero span) sits in the middle.
  const pos = (lat: number, lng: number) => ({
    left: `${maxLng > minLng ? 8 + ((lng - minLng) / (maxLng - minLng)) * 84 : 50}%`,
    top: `${maxLat > minLat ? 8 + ((maxLat - lat) / (maxLat - minLat)) * 84 : 50}%`,
  });

  const count = (s: AdminPartnerItem['verification_status']) => partners.filter((p) => p.verification_status === s).length;
  const noPin = partners.filter((p) => p.latitude == null || p.longitude == null).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Partners', total],
          ['Verified', count('verified')],
          ['Pending KYC', count('pending')],
          ['No GPS pin', noPin],
        ].map(([label, n]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold text-teal/70">{label}</p>
            <p className="mt-1 text-2xl font-black text-teal">{n}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, city, district, owner"
          aria-label="Search partners"
          className="h-10 min-w-0 flex-1 rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label="Verification status"
          className="h-10 rounded-xl bg-cream px-3 text-sm shadow-pressed outline-none"
        >
          <option value="all">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative min-h-[420px] overflow-hidden bg-canvas lg:col-span-2">
          {pinned.length === 0 ? (
            <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-teal/70">
              No centres with a GPS pin match. Centres add the pin from their app or website settings.
            </p>
          ) : (
            pinned.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                style={pos(p.latitude!, p.longitude!)}
                aria-label={`${p.business_name}, ${p.verification_status}`}
                className={cn(
                  'absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-clay',
                  p.id === selectedId ? 'z-20 bg-teal text-cream' : p.verification_status === 'verified' ? 'bg-celadon text-teal' : 'bg-tea text-teal',
                )}
              >
                {p.business_name.split(' ').slice(0, 2).join(' ')}
              </button>
            ))
          )}
        </Card>

        <Card className="space-y-3 p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <Badge tone="outline">{selected.type.replace(/_/g, ' ')}</Badge>
                <Badge tone={TONE[selected.verification_status]}>{selected.verification_status}</Badge>
              </div>
              <h2 className="font-bold text-teal">{selected.business_name}</h2>
              <p className="text-xs text-teal/80">
                {[selected.address, selected.city, selected.district, selected.state_code].filter(Boolean).join(', ') || 'No address'}
              </p>
              <dl className="space-y-1 text-xs text-teal">
                <div className="flex justify-between gap-2"><dt className="text-teal/70">Owner</dt><dd>{selected.owner_name ?? '—'}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-teal/70">Phone</dt><dd>{selected.phone ?? '—'}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-teal/70">KYC documents</dt><dd>{selected.documents_count}</dd></div>
                <div className="flex justify-between gap-2">
                  <dt className="text-teal/70">Rating</dt>
                  <dd>{selected.rating_count ? `${selected.rating_avg.toFixed(1)} (${selected.rating_count})` : 'No reviews'}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`/partners/${selected.id}`} className={buttonClass({ size: 'sm' })}>
                  KYC &amp; status
                </Link>
                {selected.latitude != null && selected.longitude != null && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    Open in Maps
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-teal/70">Tap a pin to see the centre.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
