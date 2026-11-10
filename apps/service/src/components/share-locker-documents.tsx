'use client';

import type { UserDocumentSummary } from '@applyfields/types';
import { FileText, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { listMyDocuments } from '@/lib/api';

const MAIN_WEB_URL =
  process.env.NEXT_PUBLIC_MAIN_WEB_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://applyfields.com' : 'http://localhost:3000');

/**
 * Pick Document Locker files the centre may open for this booking. Shared after the booking is
 * created (PUT /bookings/:id/documents); the centre's access ends a week after the appointment.
 */
export function ShareLockerDocuments({
  signedIn,
  selected,
  onChange,
}: {
  signedIn: boolean;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [docs, setDocs] = useState<UserDocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await listMyDocuments();
    if (res.data) setDocs(res.data.items);
    else setError(res.error || 'Could not load your documents.');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on sign-in; state is set after the await
    if (signedIn) void load();
  }, [signedIn, load]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-3 rounded-[28px] border border-white bg-white p-5 shadow-clay-card text-[#082046]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold">Share documents with the centre (optional)</p>
        {signedIn && (
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0e7bf4]">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        )}
      </div>
      {!signedIn ? (
        <p className="text-[11px] text-slate-500">Sign in to share files from your Document Locker, or bring them to the centre.</p>
      ) : error ? (
        <p role="alert" className="text-[11px] font-semibold text-rose-600">{error}</p>
      ) : !docs ? (
        <p className="text-[11px] text-slate-500">Loading your documents…</p>
      ) : docs.length === 0 ? (
        <p className="text-[11px] text-slate-500">Your Document Locker is empty.</p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li key={d.id}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-[#F0F4F8] px-3 py-2 text-xs">
                <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} className="accent-[#0e7bf4]" />
                <FileText className="h-4 w-4 shrink-0 text-[#0E7BF4]" />
                <span className="truncate font-semibold">{d.title || d.document_type_name || d.file_name || d.document_type_code}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {signedIn && (
        <a href={`${MAIN_WEB_URL}/documents`} target="_blank" rel="noreferrer" className="inline-block text-[11px] font-bold text-[#0e7bf4]">
          Add files to your Document Locker →
        </a>
      )}
      <p className="text-[10px] text-slate-500">Only this centre can open them, and only until a week after your visit. Every view is logged.</p>
    </div>
  );
}
