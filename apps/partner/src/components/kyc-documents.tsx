'use client';

/** KYC files on the under-review pages: shows each document's status and lets the partner (re-)upload it. */
import { useState } from 'react';
import { CENTRE_KYC_DOCUMENTS, COLLEGE_KYC_DOCUMENTS } from '@applyfields/types/src/partner-documents';
import type { PartnerDetail } from '@applyfields/types';
import { FileCheck2, Loader2, Upload } from 'lucide-react';
import { uploadPartnerFile } from '@/lib/api';

const INSTITUTION_TYPES = new Set<string>(['college', 'university', 'training_institute']);

const STATUS = {
  pending: { label: 'Sent', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  verified: { label: 'Verified', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  rejected: { label: 'Re-upload', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
} as const;

export function KycDocuments({ partner, onUploaded }: { partner: PartnerDetail; onUploaded: () => Promise<void> | void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docs = INSTITUTION_TYPES.has(partner.type) ? COLLEGE_KYC_DOCUMENTS : CENTRE_KYC_DOCUMENTS;

  async function upload(kind: string, file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(kind);
    try {
      const res = await uploadPartnerFile(kind, file);
      if (res.error) setError(res.error);
      else await onUploaded();
    } catch {
      setError('Could not read the file. Try another one.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <FileCheck2 className="h-4 w-4 text-emerald-400" /> Verification documents
        </div>
        <p className="text-xs text-slate-400 mt-1">Photo or PDF, up to 10 MB each. Clear files speed up approval.</p>
      </div>

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}

      {docs.map((d) => {
        // API returns documents newest first, so find() gets the latest upload of each kind.
        const doc = partner.documents?.find((x) => x.document_kind === d.kind);
        const tag = doc ? STATUS[doc.status as keyof typeof STATUS] : null;
        const inputId = `kyc-${d.kind}`;
        return (
          <div key={d.kind} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">{d.label}</span>
                {d.optional && <span className="text-[11px] text-slate-500">(optional)</span>}
                {tag && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${tag.cls}`}>{tag.label}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{d.hint}</p>
              {doc?.status === 'rejected' && doc.reviewer_note && (
                <p className="text-xs text-rose-300 mt-1">Reviewer: {doc.reviewer_note}</p>
              )}
            </div>
            {doc?.status !== 'verified' && (
              <label
                htmlFor={inputId}
                className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 ${busy ? 'pointer-events-none opacity-50' : ''}`}
              >
                {busy === d.kind ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {busy === d.kind ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                <input
                  id={inputId}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="sr-only"
                  disabled={busy !== null}
                  onChange={(e) => {
                    void upload(d.kind, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
