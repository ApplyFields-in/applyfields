'use client';

/**
 * Programs the college offers, as students see them on its Career Mode page.
 * Real data: institution_courses via GET/PUT/DELETE /career/colleges/partner/programs.
 * New programs are picked from the published course catalogue (GET /career/courses?q=).
 */
import React, { useEffect, useState } from 'react';
import { BookOpen, Edit3, Loader2, Plus, Save, Search, Trash2, X } from 'lucide-react';
import type { CourseSummary, InstitutionProgram, UpsertInstitutionProgramInput } from '@applyfields/types';
import { apiDelete, apiGet, apiPut } from '@/lib/api';

const PATH = '/career/colleges/partner/programs';
const MODES = ['regular', 'distance', 'online', 'part_time'] as const;
type Mode = (typeof MODES)[number];

/** Form state: text inputs, turned into numbers/null on save. */
type Draft = { seats: string; fee: string; feesText: string; months: string; admission: string; mode: Mode };

const toDraft = (p?: InstitutionProgram): Draft => ({
  seats: p?.seats?.toString() ?? '',
  fee: p?.fee_per_year?.toString() ?? '',
  feesText: p?.fees_text ?? '',
  months: p?.duration_months?.toString() ?? '',
  admission: p?.admission_process ?? '',
  mode: (MODES as readonly string[]).includes(p?.mode ?? '') ? (p!.mode as Mode) : 'regular',
});

const num = (v: string) => (v.trim() === '' ? null : Number(v));
const toInput = (d: Draft): UpsertInstitutionProgramInput => ({
  seats: num(d.seats),
  fee_per_year: num(d.fee),
  fees_text: d.feesText.trim() || null,
  duration_months: num(d.months),
  admission_process: d.admission.trim() || null,
  mode: d.mode,
});

const rupees = (n: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')} / year`);
const years = (m: number | null) => (m == null ? '—' : m % 12 === 0 ? `${m / 12} years` : `${m} months`);

const INPUT =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none';

function ProgramForm({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...draft, [k]: e.target.value });
  return (
    <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold text-slate-400">
      <label className="space-y-1">
        <span>Seats (intake)</span>
        <input type="number" min={0} inputMode="numeric" value={draft.seats} onChange={set('seats')} className={INPUT} />
      </label>
      <label className="space-y-1">
        <span>Fee per year (₹)</span>
        <input type="number" min={0} inputMode="numeric" value={draft.fee} onChange={set('fee')} className={INPUT} />
      </label>
      <label className="space-y-1">
        <span>Duration (months)</span>
        <input type="number" min={1} max={120} inputMode="numeric" value={draft.months} onChange={set('months')} className={INPUT} />
      </label>
      <label className="space-y-1">
        <span>Mode</span>
        <select value={draft.mode} onChange={set('mode')} className={INPUT}>
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m.replace('_', ' ')}
            </option>
          ))}
        </select>
      </label>
      <label className="col-span-2 space-y-1">
        <span>Fee note (optional, e.g. &quot;+ hostel ₹60,000&quot;)</span>
        <input maxLength={200} value={draft.feesText} onChange={set('feesText')} className={INPUT} />
      </label>
      <label className="col-span-2 space-y-1">
        <span>Admission process (entrance exam, counselling, cutoffs)</span>
        <textarea rows={3} maxLength={1000} value={draft.admission} onChange={set('admission')} className={INPUT} />
      </label>
    </div>
  );
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<InstitutionProgram[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft());

  // Add flow: search the catalogue, pick a course, fill the details.
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseSummary[]>([]);
  const [picked, setPicked] = useState<CourseSummary | null>(null);

  const load = () =>
    apiGet<InstitutionProgram[]>(PATH).then((res) => {
      setPrograms(res.data ?? []);
      setError(res.data ? null : res.error || 'Could not load programs.');
    });

  useEffect(() => {
    void load();
  }, []);

  // Catalogue search (debounced). Results only show while there is a 2+ letter query.
  const searching = adding && query.trim().length >= 2;
  const shown = searching ? results : [];
  useEffect(() => {
    if (!searching) return;
    const t = setTimeout(async () => {
      const res = await apiGet<CourseSummary[]>(`/career/courses?q=${encodeURIComponent(query.trim())}`);
      const have = new Set((programs ?? []).map((p) => p.course_id));
      setResults((res.data ?? []).filter((c) => !have.has(c.id)).slice(0, 8));
    }, 300);
    return () => clearTimeout(t);
  }, [searching, query, programs]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function save(courseId: string, d: Draft) {
    setBusy(true);
    const res = await apiPut<InstitutionProgram>(`${PATH}/${courseId}`, toInput(d));
    setBusy(false);
    if (!res.data) return setError(res.error || 'Could not save the program.');
    setError(null);
    await load();
    setEditingId(null);
    setAdding(false);
    setPicked(null);
    setQuery('');
    flash(`Saved ${res.data.short_name || res.data.name}.`);
  }

  async function remove(p: InstitutionProgram) {
    if (!window.confirm(`Remove ${p.name} from your college page?`)) return;
    setBusy(true);
    const res = await apiDelete<{ removed: boolean }>(`${PATH}/${p.course_id}`);
    setBusy(false);
    if (!res.data) return setError(res.error || 'Could not remove the program.');
    await load();
    flash(`Removed ${p.short_name || p.name}.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Programs &amp; seats</h1>
          <p className="mt-1 text-xs text-slate-400">
            The courses your college offers, with seats and fees. Students see these on your college page in Career Mode.
          </p>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setPicked(null);
              setDraft(toDraft());
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Add program</span>
          </button>
        )}
      </div>

      {toast && (
        <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2.5 text-xs font-bold text-emerald-300">
          {toast}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-2.5 text-xs font-semibold text-rose-300">
          {error}
        </div>
      )}

      {adding && (
        <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">{picked ? picked.name : 'Find the course'}</h2>
            <button type="button" onClick={() => setAdding(false)} aria-label="Cancel" className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          {!picked ? (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science, MBA, B.Pharm"
                  className={`${INPUT} pl-9`}
                />
              </div>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
                {shown.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setPicked(c);
                      setDraft({ ...toDraft(), months: c.duration_months?.toString() ?? '' });
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs hover:bg-slate-800/60"
                  >
                    <span className="font-semibold text-white">{c.name}</span>
                    <span className="shrink-0 text-slate-500">{c.level.toUpperCase()}</span>
                  </button>
                ))}
                {searching && shown.length === 0 && (
                  <p className="px-4 py-3 text-xs text-slate-500">
                    No matching course in the catalogue (or you already offer it). Ask ApplyFields to add a missing course.
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <ProgramForm draft={draft} onChange={setDraft} />
              <button
                type="button"
                disabled={busy}
                onClick={() => void save(picked.id, draft)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Add to my college
              </button>
            </>
          )}
        </div>
      )}

      {programs === null ? (
        <p className="text-xs text-slate-400">Loading programs…</p>
      ) : programs.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-white">No programs yet</p>
          <p className="mt-1 text-xs text-slate-400">Add the courses you offer so students can find them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {programs.map((p) => {
            const editing = editingId === p.course_id;
            return (
              <div key={p.course_id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-300">
                      {p.level} · {p.mode.replace('_', ' ')}
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-white">{p.name}</h3>
                  </div>
                  {!editing && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => {
                          setEditingId(p.course_id);
                          setDraft(toDraft(p));
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        disabled={busy}
                        onClick={() => void remove(p)}
                        className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {editing ? (
                  <>
                    <ProgramForm draft={draft} onChange={setDraft} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void save(p.course_id, draft)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <dt className="text-slate-500">Seats</dt>
                    <dd className="font-semibold text-white">{p.seats ?? '—'}</dd>
                    <dt className="text-slate-500">Fee</dt>
                    <dd className="font-semibold text-white">{rupees(p.fee_per_year)}</dd>
                    <dt className="text-slate-500">Duration</dt>
                    <dd className="font-semibold text-white">{years(p.duration_months)}</dd>
                    {p.fees_text && (
                      <>
                        <dt className="text-slate-500">Fee note</dt>
                        <dd className="text-slate-300">{p.fees_text}</dd>
                      </>
                    )}
                    {p.admission_process && (
                      <>
                        <dt className="col-span-2 text-slate-500">Admission</dt>
                        <dd className="col-span-2 whitespace-pre-line text-slate-300">{p.admission_process}</dd>
                      </>
                    )}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
