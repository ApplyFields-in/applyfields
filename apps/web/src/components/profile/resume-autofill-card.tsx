'use client';

import { useRef, useState } from 'react';
import { Download, FileCheck2, RefreshCw, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import type { UserResumeDocument } from '@applyfields/types';

/** One value found in the resume. `current` is what the profile has now ('' = empty). */
export interface AutofillRow {
  key: string;
  label: string;
  value: string;
  current: string;
}

interface Props {
  savedResume: UserResumeDocument | null;
  busy: boolean;
  rows: AutofillRow[];
  onUpload: (file: File) => void;
  onDownload: () => void;
  onDelete: () => void;
  onApply: (keys: Set<string>) => void;
  onDismiss: () => void;
}

/**
 * Upload a resume → review everything it found → fill the whole profile in one click.
 * Empty profile fields are ticked by default; fields that already have a value are not,
 * so nothing the citizen typed is overwritten unless they choose it.
 */
export function ResumeAutofillCard({ savedResume, busy, rows, onUpload, onDownload, onDelete, onApply, onDismiss }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  // Keys the citizen flipped away from the default (default = ticked when the profile field is empty)
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const checked = new Set(rows.filter((r) => !r.current !== flipped.has(r.key)).map((r) => r.key));

  const toggle = (key: string) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div id="resume" className="bg-white rounded-3xl border border-blue-100 p-6 sm:p-7 shadow-sm">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,.txt,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setFlipped(new Set());
            onUpload(file);
          }
          e.target.value = '';
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="size-9 shrink-0 rounded-xl bg-blue-50 text-[#0e7bf4] flex items-center justify-center">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Fill your profile from your resume</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a PDF, Word (.docx), photo or text resume. We read your name, date of birth, address,
              education and skills — you check them, then save everything at once.
            </p>
          </div>
        </div>
        {savedResume && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownload}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
            >
              <Download className="size-3" /> Download
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
            >
              <RefreshCw className={`size-3 ${busy ? 'animate-spin' : ''}`} /> Replace
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Remove saved resume"
              className="p-1.5 text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {savedResume ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-600">
          <FileCheck2 className="size-4 text-[#0e7bf4]" />
          <span className="font-semibold text-slate-800">{savedResume.file_name || 'Resume'}</span>
          {savedResume.size_bytes ? <span>· {Math.round(savedResume.size_bytes / 1024)} KB</span> : null}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="mt-4 w-full py-5 rounded-2xl border border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 flex flex-col items-center gap-1 text-xs text-slate-600"
        >
          <UploadCloud className="size-5 text-[#0e7bf4]" />
          <span className="font-semibold text-slate-800">
            {busy ? 'Reading your resume…' : 'Upload your resume'}
          </span>
          <span className="text-[11px] text-slate-400">PDF, DOCX, JPG/PNG or TXT · up to 5 MB</span>
        </button>
      )}

      {rows.length > 0 && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-xs font-bold text-slate-800">Found in your resume — tick what to save</p>
          <ul className="mt-3 divide-y divide-blue-100">
            {rows.map((r) => (
              <li key={r.key}>
                <label className="flex items-start gap-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked.has(r.key)}
                    onChange={() => toggle(r.key)}
                    className="mt-0.5 size-4 accent-[#0e7bf4]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium text-slate-500">{r.label}</span>
                    <span className="block text-sm font-semibold text-slate-900 break-words">{r.value}</span>
                    {r.current && (
                      <span className="block text-[11px] text-amber-700">Now: {r.current}</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Dismiss
            </button>
            <button
              type="button"
              disabled={busy || checked.size === 0}
              onClick={() => onApply(checked)}
              className="px-4 py-2 rounded-xl bg-[#0e7bf4] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 shadow-xs"
            >
              {busy ? 'Saving…' : `Save ${checked.size} to my profile`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
