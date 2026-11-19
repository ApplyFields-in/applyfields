'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileCheck2, RefreshCw, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import type {
  ExtractedEducationItem,
  ExtractedResumeProfile,
  ResumeApiResponse,
  UserEducation,
  UserProfile,
  UserResumeDocument,
} from '@applyfields/types';
import { API_URL, apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { convertFileToBase64 } from '@/lib/resume-parser';
import { showAppToast } from '@/components/toast-notification-provider';
import { INDIAN_STATES } from '@/app/(main)/profile/page';
import { EDUCATION_LEVEL_LABELS } from '@/components/profile/education-section';

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const prefixed = (conds: string[], p: string) =>
  conds.filter((c) => c.startsWith(p)).map((c) => c.slice(p.length));

/** Turns what the API read from the resume into review rows, compared with the current profile. */
function buildRows(
  found: ExtractedResumeProfile | undefined,
  quals: ExtractedEducationItem[],
  profile: UserProfile | null,
  educations: UserEducation[],
): AutofillRow[] {
  const rows: AutofillRow[] = [];
  const conds = profile?.special_conditions || [];
  const add = (key: string, label: string, value: string | null | undefined, current: string | null | undefined) => {
    if (value) rows.push({ key, label, value, current: current || '' });
  };
  if (found) {
    add('full_name', 'Full name', found.full_name, profile?.full_name);
    add('date_of_birth', 'Date of birth', found.date_of_birth, profile?.date_of_birth?.slice(0, 10));
    add('gender', 'Gender', found.gender, profile?.gender);
    const stateName = (code: string | null | undefined) => INDIAN_STATES.find((s) => s.code === code)?.name || code;
    add('state_code', 'State', found.state_code && stateName(found.state_code), profile?.state_code && stateName(profile.state_code));
    add('district', 'District', found.district, profile?.district);
    add('pin_code', 'PIN code', found.pin_code, prefixed(conds, 'pincode:')[0]);
    // Skills/languages are merged, never replaced — so only new ones are listed, ticked by default
    const have = (p: string) => new Set(prefixed(conds, p).map((s) => s.toLowerCase()));
    const skills = have('skill:');
    const langs = have('lang:');
    add('skills', 'New skills', found.skills.filter((s) => !skills.has(s.toLowerCase())).join(', '), '');
    add('languages', 'New languages', found.languages.filter((l) => !langs.has(l.toLowerCase())).join(', '), '');
  }
  quals.forEach((q, i) => {
    const existing = educations.find((e) => e.level === q.level);
    const describe = (d: { degree?: string | null; stream?: string | null; institution_name?: string | null; board_or_university?: string | null; year_of_passing?: number | null; score?: number | null }) =>
      [d.degree && d.stream ? `${d.degree} in ${d.stream}` : d.degree || d.stream, d.institution_name || d.board_or_university, d.year_of_passing, d.score != null ? `Score ${d.score}` : null]
        .filter(Boolean)
        .join(' · ');
    add(`edu:${i}`, EDUCATION_LEVEL_LABELS[q.level] || q.level, describe(q) || q.level, existing && (describe(existing) || 'Already added'));
  });
  return rows;
}

/** Profile-page wiring for the card: upload → POST /me/resume → review rows → PUT /me/profile + POST /me/education. */
export function ResumeAutofill({
  profile,
  educations,
  onProfileUpdate,
  onEducationsChange,
}: {
  profile: UserProfile | null;
  educations: UserEducation[];
  onProfileUpdate: (p: UserProfile) => void;
  onEducationsChange: (e: UserEducation[]) => void;
}) {
  const [savedResume, setSavedResume] = useState<UserResumeDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<ResumeApiResponse | null>(null);

  useEffect(() => {
    apiGet<{ resume: UserResumeDocument | null }>('/me/resume').then((r) => setSavedResume(r?.resume ?? null));
  }, []);

  const rows = found ? buildRows(found.profile, found.qualifications || [], profile, educations) : [];

  const onUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return showAppToast('File exceeds the 5 MB limit.');
    setBusy(true);
    try {
      const res = await apiPost<ResumeApiResponse>('/me/resume', {
        fileName: file.name,
        mimeType: file.type || MIME_BY_EXT[file.name.split('.').pop()?.toLowerCase() || ''] || 'application/pdf',
        fileBase64: await convertFileToBase64(file),
      });
      if (!res.data) return showAppToast(res.error || 'Could not read this resume.');
      setSavedResume(res.data.resume);
      setFound(res.data);
      if (buildRows(res.data.profile, res.data.qualifications || [], profile, educations).length === 0) {
        showAppToast('Resume saved, but no profile details could be read from it.');
      }
    } catch {
      showAppToast('Could not read this resume.');
    } finally {
      setBusy(false);
    }
  };

  const onApply = async (keys: Set<string>) => {
    if (!found) return;
    const p = found.profile;
    setBusy(true);
    try {
      if (p) {
        const payload: Record<string, unknown> = {};
        if (keys.has('full_name')) payload.full_name = p.full_name;
        if (keys.has('date_of_birth')) payload.date_of_birth = p.date_of_birth;
        if (keys.has('gender')) payload.gender = p.gender;
        if (keys.has('state_code')) payload.state_code = p.state_code;
        if (keys.has('district')) payload.district = p.district;
        let conds = profile?.special_conditions || [];
        const before = conds;
        if (keys.has('pin_code')) conds = [...conds.filter((c) => !c.startsWith('pincode:')), `pincode:${p.pin_code}`];
        const merge = (pre: string, items: string[]) => {
          const have = new Set(prefixed(conds, pre).map((s) => s.toLowerCase()));
          conds = [...conds, ...items.filter((s) => !have.has(s.toLowerCase())).map((s) => pre + s)];
        };
        if (keys.has('skills')) merge('skill:', p.skills);
        if (keys.has('languages')) merge('lang:', p.languages);
        if (conds !== before) payload.special_conditions = conds;
        if (Object.keys(payload).length > 0) {
          const res = await apiPut<UserProfile>('/me/profile', payload);
          if (!res.data) return showAppToast(res.error || 'Could not save profile details.');
          onProfileUpdate(res.data);
        }
      }
      const next = [...educations];
      let failed = 0;
      for (const [i, q] of (found.qualifications || []).entries()) {
        if (!keys.has(`edu:${i}`)) continue;
        const { confidence: _c, ...edu } = q;
        const res = await apiPost<UserEducation>('/me/education', {
          ...edu,
          degree: edu.degree || undefined,
          stream: edu.stream || undefined,
          board_or_university: edu.board_or_university || undefined,
          institution_name: edu.institution_name || undefined,
          year_of_passing: edu.year_of_passing ?? undefined,
          score: edu.score ?? undefined,
        });
        if (res.data) next.unshift(res.data);
        else failed++;
      }
      onEducationsChange(next);
      setFound(null);
      showAppToast(failed ? `Saved, but ${failed} qualification(s) could not be added.` : 'Profile updated from your resume.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResumeAutofillCard
      savedResume={savedResume}
      busy={busy}
      rows={rows}
      onUpload={onUpload}
      onDownload={() => window.open(`${API_URL}/me/resume/download`, '_blank')}
      onDelete={async () => {
        if (!confirm('Remove your saved resume?')) return;
        const res = await apiDelete('/me/resume');
        if (res.error) return showAppToast(res.error);
        setSavedResume(null);
        setFound(null);
      }}
      onApply={onApply}
      onDismiss={() => setFound(null)}
    />
  );
}

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
