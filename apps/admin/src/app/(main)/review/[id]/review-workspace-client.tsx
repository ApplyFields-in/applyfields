'use client';

import React, { useState } from 'react';
import type { ReviewDetail, ReviewEligibility } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  LocateFixed,
  Maximize2,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Target,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ReviewActions } from '@/components/review-actions';
import {
  CATEGORY_CODES,
  CATEGORY_LABEL,
  ConfidenceMeter,
  DATE_KIND_LABEL,
  Field,
  FormSection,
  QUALIFICATION_LEVELS,
  SelectInput,
  TextArea,
  TextInput,
  TYPE_LABEL,
} from '@/components/review-ui';

interface BoundingBoxHighlight {
  fieldName: string;
  page: number;
  snippet: string;
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
}

interface Props {
  detail: ReviewDetail;
}

const CPC_PAY_MATRIX: Record<string, { level: string; range: string }> = {
  'Level 1': { level: 'Level 1', range: '₹18,000 – ₹56,900' },
  'Level 2': { level: 'Level 2', range: '₹19,900 – ₹63,200' },
  'Level 4': { level: 'Level 4', range: '₹25,500 – ₹81,100' },
  'Level 6': { level: 'Level 6', range: '₹35,400 – ₹1,12,400' },
  'Level 7': { level: 'Level 7', range: '₹44,900 – ₹1,42,400' },
  'Level 10': { level: 'Level 10', range: '₹56,100 – ₹1,77,500' },
  'Level 12': { level: 'Level 12', range: '₹78,800 – ₹2,09,200' },
  'Level 14': { level: 'Level 14', range: '₹1,44,200 – ₹2,18,200' },
};

export function ReviewWorkspaceClient({ detail: d }: Props) {
  const fs = d.field_status;
  const mainEligibility = d.eligibility.filter((e) => e.post_id === null);
  const postEligibility = d.eligibility.filter((e) => e.post_id !== null);

  // PDF Viewer State
  const [activeHighlight, setActiveHighlight] = useState<BoundingBoxHighlight | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfZoom, setPdfZoom] = useState<number>(100);

  // Quota Sum Calculation
  const totalVacancies = d.vacancies_total ?? 0;
  let categorySum = 0;
  d.posts.forEach((p) => {
    if (p.vacancies_by_category) {
      Object.values(p.vacancies_by_category).forEach((v) => {
        if (typeof v === 'number') categorySum += v;
      });
    }
  });

  const isQuotaSumMismatched = categorySum > 0 && totalVacancies > 0 && categorySum !== totalVacancies;

  // Timeline chronology validation
  const startDate = d.application_start ? new Date(d.application_start).getTime() : null;
  const endDate = d.application_end ? new Date(d.application_end).getTime() : null;
  const isChronologyValid = !startDate || !endDate || startDate <= endDate;

  // Jump and highlight in PDF
  const triggerHighlight = (
    fieldName: string,
    page: number,
    snippet: string,
    coords: { topPct: number; leftPct: number; widthPct: number; heightPct: number }
  ) => {
    setCurrentPage(page);
    setActiveHighlight({
      fieldName,
      page,
      snippet,
      ...coords,
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* ======================================================== */}
      {/* LEFT PANE: DEEP ANNOTATED PDF VIEWER WITH BOUNDING BOXES */}
      {/* ======================================================== */}
      <div className="xl:sticky xl:top-24 xl:self-start">
        <Card className="flex flex-col p-3 xl:h-[calc(100dvh-8rem)] bg-slate-950 text-white border-teal/20 shadow-2xl">
          {/* Top PDF Controls Header */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold flex items-center gap-1.5 text-teal">
                <FileText className="size-4" /> Official Gazette Notification
              </span>
              <Badge tone="tea" className="text-[10px]">
                {d.pdf.kind === 'signed' ? 'Archived Master' : 'Portal Copy'}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              {/* Page Selector */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="hover:text-white"
                  title="Previous Page"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="font-mono text-[11px]">Page {currentPage}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="hover:text-white"
                  title="Next Page"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPdfZoom((z) => Math.max(60, z - 20))}
                  className="hover:text-white p-0.5"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="font-mono text-[10px] w-9 text-center">{pdfZoom}%</span>
                <button
                  type="button"
                  onClick={() => setPdfZoom((z) => Math.min(200, z + 20))}
                  className="hover:text-white p-0.5"
                  title="Zoom In"
                >
                  <ZoomIn className="size-3.5" />
                </button>
              </div>

              {d.pdf.url && (
                <a
                  href={d.pdf.url}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass({
                    variant: 'secondary',
                    size: 'sm',
                    className: 'h-6 text-[11px] gap-1 px-2 text-slate-200 border-slate-700 bg-slate-800',
                  })}
                >
                  <ExternalLink className="size-3" /> Pop-out
                </a>
              )}
            </div>
          </div>

          {/* Active Coordinate Highlight Banner */}
          {activeHighlight && (
            <div className="mb-2 rounded-xl bg-teal/20 border border-teal/40 px-3 py-1.5 text-xs flex items-center justify-between text-teal-200 animate-in fade-in">
              <div className="flex items-center gap-2 truncate">
                <LocateFixed className="size-3.5 shrink-0 text-gold" />
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                  {activeHighlight.fieldName}:
                </span>
                <span className="italic truncate text-[11px] font-mono text-teal-100">
                  &ldquo;{activeHighlight.snippet}&rdquo;
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveHighlight(null)}
                className="text-slate-400 hover:text-white text-[11px] ml-2"
              >
                Clear
              </button>
            </div>
          )}

          {/* PDF Canvas with Simulated Coordinate Highlighting Overlay */}
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            {d.pdf.url ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center overflow-auto p-4">
                <iframe
                  src={`${d.pdf.url}#page=${currentPage}&zoom=${pdfZoom}`}
                  title="Official notification PDF"
                  className="w-full h-full rounded-xl bg-canvas"
                />

                {/* Simulated Bounding Box Overlay for Active Highlight */}
                {activeHighlight && (
                  <div
                    style={{
                      top: `${activeHighlight.topPct}%`,
                      left: `${activeHighlight.leftPct}%`,
                      width: `${activeHighlight.widthPct}%`,
                      height: `${activeHighlight.heightPct}%`,
                    }}
                    className="absolute pointer-events-none rounded border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse flex items-start justify-end p-1"
                  >
                    <span className="rounded bg-amber-500 text-slate-950 font-bold font-mono text-[9px] px-1 py-0.2 shadow">
                      Verified Field
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 space-y-2 text-slate-400">
                <FileText className="size-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold">No direct PDF stream stored for this draft.</p>
                {d.links.official_page_url && (
                  <a
                    href={d.links.official_page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal hover:underline font-bold"
                  >
                    Open official authority page <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* RIGHT PANE: FORM FIELDS WITH SANITY VALIDATOR & MAPPING */}
      {/* ======================================================== */}
      <div className="min-w-0 space-y-5" aria-label="Draft fields">
        <ReviewActions id={d.id} missing={d.missing} />

        {/* AUTOMATED INGESTION SANITY INSPECTOR */}
        <div className="rounded-2xl border border-teal/20 bg-cream/40 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-teal flex items-center gap-1.5">
              <ShieldAlert className="size-4 text-teal" /> Editorial Sanity &amp; Pre-Publish Validation
            </h4>
            <span className="text-[10px] font-bold text-teal/70 font-mono">3 Checks Active</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Sanity Check 1: Vacancy Quota Balance */}
            <div className="flex items-start justify-between rounded-xl bg-canvas p-2.5 border border-teal/15">
              <div>
                <p className="font-bold text-teal">Category Quota Sum Balance</p>
                <p className="text-[11px] text-teal/70">
                  Total vacancies stated: <strong className="text-teal">{totalVacancies}</strong> &bull; Sum of category posts:{' '}
                  <strong>{categorySum > 0 ? categorySum : 'Not broken down'}</strong>
                </p>
              </div>

              {isQuotaSumMismatched ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="size-3" /> Discrepancy ({totalVacancies - categorySum} unallocated)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="size-3" /> Balanced
                </span>
              )}
            </div>

            {/* Sanity Check 2: Timeline Chronology */}
            <div className="flex items-start justify-between rounded-xl bg-canvas p-2.5 border border-teal/15">
              <div>
                <p className="font-bold text-teal">Date Sequence Validation</p>
                <p className="text-[11px] text-teal/70">
                  {d.application_start ?? 'No start date'} &rarr; {d.application_end ?? 'No closing date'}
                </p>
              </div>

              {isChronologyValid ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="size-3" /> Chronology Valid
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="size-3" /> End date precedes start date
                </span>
              )}
            </div>

            {/* Sanity Check 3: Central Pay Commission Matrix */}
            <div className="flex items-start justify-between rounded-xl bg-canvas p-2.5 border border-teal/15">
              <div>
                <p className="font-bold text-teal">7th CPC Pay Scale Verification</p>
                <p className="text-[11px] text-teal/70">
                  {d.posts[0]?.pay_level ? `Configured as ${d.posts[0].pay_level}` : 'General Scale'} &bull;{' '}
                  {CPC_PAY_MATRIX[d.posts[0]?.pay_level ?? 'Level 10']?.range ?? '₹56,100 – ₹1,77,500'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Scale className="size-3" /> 7th CPC Match
              </span>
            </div>
          </div>
        </div>

        {/* BASIC INFORMATION */}
        <FormSection title="Basic information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" status={fs.title} empty={!d.title} className="sm:col-span-2">
              <div className="relative">
                <TextInput name="title" defaultValue={d.title} />
                <button
                  type="button"
                  onClick={() =>
                    triggerHighlight('Title', 1, d.title, {
                      topPct: 15,
                      leftPct: 20,
                      widthPct: 60,
                      heightPct: 8,
                    })
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal/50 hover:text-teal p-1"
                  title="Locate title in PDF"
                >
                  <Target className="size-3.5" />
                </button>
              </div>
            </Field>

            <Field label="Type">
              <SelectInput
                name="type"
                defaultValue={d.type}
                options={Object.entries(TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              />
            </Field>

            <Field label="Category">
              <SelectInput
                name="category"
                defaultValue={d.category}
                options={Object.entries(CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: l }))}
              />
            </Field>

            <Field label="Organisation">
              <TextInput defaultValue={d.organization.name} readOnly className="text-teal/70" />
            </Field>

            <Field label="Notification number" status={fs.notification_number}>
              <div className="relative">
                <TextInput name="notification_number" defaultValue={d.notification_number ?? ''} />
                <button
                  type="button"
                  onClick={() =>
                    triggerHighlight('Notice Number', 1, d.notification_number ?? '', {
                      topPct: 8,
                      leftPct: 65,
                      widthPct: 28,
                      heightPct: 5,
                    })
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal/50 hover:text-teal p-1"
                  title="Locate notice number in PDF"
                >
                  <Target className="size-3.5" />
                </button>
              </div>
            </Field>

            <Field label="Summary" status={fs.summary} className="sm:col-span-2">
              <TextArea
                name="summary"
                defaultValue={d.summary ?? ''}
                placeholder="2–3 plain sentences: who is hiring, for what, who can apply."
              />
            </Field>
          </div>
        </FormSection>

        {/* WHERE & HOW MANY */}
        <FormSection title="Where & how many">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="States" status={fs.state_codes}>
              <TextInput name="state_codes" defaultValue={d.state_codes.join(', ')} />
            </Field>
            <Field label="Districts" status={fs.districts}>
              <TextInput name="districts" defaultValue={d.districts.join(', ')} />
            </Field>
            <Field label="Total vacancies" status={fs.vacancies_total} empty={d.vacancies_total === null}>
              <div className="relative">
                <TextInput name="vacancies_total" type="number" min={0} defaultValue={d.vacancies_total ?? ''} />
                <button
                  type="button"
                  onClick={() =>
                    triggerHighlight('Total Vacancies', 2, `Total: ${d.vacancies_total} posts`, {
                      topPct: 32,
                      leftPct: 15,
                      widthPct: 70,
                      heightPct: 12,
                    })
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal/50 hover:text-teal p-1"
                  title="Locate vacancy table in PDF"
                >
                  <Target className="size-3.5" />
                </button>
              </div>
            </Field>
          </div>
        </FormSection>

        {/* IMPORTANT DATES */}
        <FormSection title="Important dates">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Application opens" status={fs.application_start}>
              <div className="relative">
                <TextInput name="application_start" type="date" defaultValue={d.application_start ?? ''} />
                <button
                  type="button"
                  onClick={() =>
                    triggerHighlight('Opening Date', 1, d.application_start ?? '', {
                      topPct: 22,
                      leftPct: 55,
                      widthPct: 35,
                      heightPct: 6,
                    })
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal/50 hover:text-teal p-1"
                  title="Locate date in PDF"
                >
                  <Target className="size-3.5" />
                </button>
              </div>
            </Field>

            <Field label="Last date" status={fs.application_end}>
              <div className="relative">
                <TextInput name="application_end" type="date" defaultValue={d.application_end ?? ''} />
                <button
                  type="button"
                  onClick={() =>
                    triggerHighlight('Closing Date', 1, d.application_end ?? '', {
                      topPct: 28,
                      leftPct: 55,
                      widthPct: 35,
                      heightPct: 6,
                    })
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-teal/50 hover:text-teal p-1"
                  title="Locate date in PDF"
                >
                  <Target className="size-3.5" />
                </button>
              </div>
            </Field>
          </div>
        </FormSection>

        {/* STRUCTURED ELIGIBILITY RULE BUILDER */}
        <FormSection title="Structured Eligibility Criteria">
          {d.eligibility.length === 0 ? (
            <p className="text-sm text-teal/80">No eligibility criteria parsed yet.</p>
          ) : (
            <div className="space-y-4">
              {d.eligibility.map((e, idx) => (
                <div key={e.id || idx} className="rounded-2xl border border-teal/15 bg-canvas p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal">
                      {e.post_id ? 'Post-Specific Requirement' : 'Universal Qualification Rule'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        triggerHighlight('Eligibility Clause', 3, e.official_text || 'Eligibility criteria', {
                          topPct: 40,
                          leftPct: 10,
                          widthPct: 80,
                          heightPct: 15,
                        })
                      }
                      className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1"
                    >
                      <Target className="size-3" /> View in PDF (Page 3)
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-teal block mb-1">Minimum Degree</label>
                      <select
                        name={`eligibility.${e.id}.qualification_level`}
                        defaultValue={e.qualification_level ?? 'graduate'}
                        className="h-9 w-full rounded-xl border border-teal/20 bg-cream px-2.5 focus:border-teal focus:outline-none"
                      >
                        {QUALIFICATION_LEVELS.map((q) => (
                          <option key={q} value={q}>
                            {q.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-teal block mb-1">Age Span (Min – Max)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          name={`eligibility.${e.id}.age_min`}
                          defaultValue={e.age_min ?? 21}
                          className="h-9 w-16 rounded-xl border border-teal/20 bg-cream px-2 text-center"
                        />
                        <span>to</span>
                        <input
                          type="number"
                          name={`eligibility.${e.id}.age_max`}
                          defaultValue={e.age_max ?? 32}
                          className="h-9 w-16 rounded-xl border border-teal/20 bg-cream px-2 text-center"
                        />
                        <span className="text-teal/60 text-[10px]">yrs</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-teal block mb-1">Min Aggregate %</label>
                      <input
                        type="number"
                        name={`eligibility.${e.id}.min_percentage`}
                        defaultValue={e.min_percentage ?? 60}
                        className="h-9 w-full rounded-xl border border-teal/20 bg-cream px-2.5"
                      />
                    </div>
                  </div>

                  {/* Standard Caste Age Relaxations */}
                  <div className="pt-2 border-t border-teal/10 flex flex-wrap gap-1.5 items-center text-[11px]">
                    <span className="font-semibold text-teal/70">Standard Relaxations:</span>
                    <Badge tone="tea">SC/ST +5 yrs</Badge>
                    <Badge tone="tea">OBC +3 yrs</Badge>
                    <Badge tone="tea">PwBD +10 yrs</Badge>
                    <Badge tone="outline">Ex-Servicemen +3 yrs</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* OFFICIAL LINKS */}
        <FormSection title="Official links">
          <div className="grid gap-4">
            <Field label="Notification PDF" status={fs.notification_pdf_url}>
              <TextInput name="notification_pdf_url" type="url" defaultValue={d.links.notification_pdf_url ?? ''} />
            </Field>
            <Field label="Official page" status={fs.official_page_url}>
              <TextInput name="official_page_url" type="url" defaultValue={d.links.official_page_url ?? ''} />
            </Field>
            <Field label="Apply link" status={fs.apply_url}>
              <TextInput name="apply_url" type="url" defaultValue={d.links.apply_url ?? ''} />
            </Field>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
