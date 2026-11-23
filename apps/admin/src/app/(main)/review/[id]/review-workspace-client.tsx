'use client';

import { useState, type ReactNode } from 'react';
import type { FieldStatus, ReviewDetail, ReviewEligibility } from '@applyfields/types';
import { buttonClass, Card, cn, EmptyState } from '@applyfields/ui';
import { CircleAlert, CircleCheck, ExternalLink, FileText, TriangleAlert } from 'lucide-react';
import { ReviewActions } from '@/components/review-actions';
import {
  CATEGORY_LABEL,
  ConfidenceMeter,
  DATE_KIND_LABEL,
  FieldStatusBadge,
  formatDay,
  FormSection,
  TYPE_LABEL,
} from '@/components/review-ui';

/**
 * Checking one draft: the official PDF on the left, what the extractor read on the right.
 * Read-only on purpose: corrections go through "Full editor", so nothing typed here can be lost,
 * and every value shown is what is stored (blank = not found), never a filled-in guess.
 */
export function ReviewWorkspaceClient({ detail: d }: { detail: ReviewDetail }) {
  const [tab, setTab] = useState<'pdf' | 'raw'>('pdf');
  const fs = d.field_status;
  const checks = buildChecks(d);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* LEFT: the official notification */}
      <div className="xl:sticky xl:top-24 xl:self-start">
        <Card className="flex flex-col p-3 xl:h-[calc(100dvh-8rem)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div role="tablist" aria-label="Notification view" className="flex gap-1 rounded-full bg-canvas p-1">
              {(['pdf', 'raw'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    tab === t ? 'bg-teal text-cream' : 'text-teal/70 hover:text-teal',
                  )}
                >
                  {t === 'pdf' ? 'Official PDF' : 'What the extractor read'}
                </button>
              ))}
            </div>
            {d.pdf.url && (
              <a href={d.pdf.url} target="_blank" rel="noreferrer" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                <ExternalLink aria-hidden="true" /> Open in new tab
              </a>
            )}
          </div>

          {tab === 'raw' ? (
            <RawData raw={d.raw} />
          ) : d.pdf.url ? (
            <>
              <iframe src={d.pdf.url} title="Official notification PDF" className="h-[70vh] w-full flex-1 rounded-2xl bg-canvas xl:h-auto" />
              {d.pdf.kind === 'official' && (
                <p className="px-2 pt-2 text-[11px] text-teal/70">
                  Some government sites block showing their PDF inside other pages. Use “Open in new tab” if this stays blank.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              className="flex-1 justify-center"
              icon={<FileText />}
              title="No PDF for this draft"
              text="The scraper didn’t keep a file. Check the official page instead."
              action={
                d.links.official_page_url || d.source.url ? (
                  <a
                    href={(d.links.official_page_url ?? d.source.url)!}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    <ExternalLink aria-hidden="true" /> Open official page
                  </a>
                ) : undefined
              }
            />
          )}
        </Card>
      </div>

      {/* RIGHT: what was extracted */}
      <div className="min-w-0 space-y-5">
        <ReviewActions id={d.id} missing={d.missing} noticeUrl={d.links.notification_pdf_url} />

        <p className="rounded-2xl bg-canvas px-4 py-3 text-xs text-teal/80">
          Check each value against the PDF. To correct anything, use <strong>Full editor</strong> above. Blank means the
          extractor didn’t find it.
        </p>

        {checks.length > 0 && (
          <FormSection title="Checks">
            <ul className="space-y-2 text-sm">
              {checks.map((c) => (
                <li key={c.text} className="flex items-start gap-2">
                  {c.ok ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                  )}
                  <span>
                    <span className="sr-only">{c.ok ? 'OK: ' : 'Check: '}</span>
                    {c.text}
                  </span>
                </li>
              ))}
            </ul>
          </FormSection>
        )}

        <FormSection title="Basic information">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Title" wide status={fs.title}>{d.title}</Info>
            <Info label="Type">{TYPE_LABEL[d.type]}</Info>
            <Info label="Category">{CATEGORY_LABEL[d.category]}</Info>
            <Info label="Organisation">{d.organization.name}</Info>
            <Info label="Notification number" status={fs.notification_number}>{d.notification_number}</Info>
            <Info label="Summary" wide status={fs.summary}>{d.summary}</Info>
          </dl>
        </FormSection>

        <FormSection title="Where & how many">
          <dl className="grid gap-4 sm:grid-cols-3">
            <Info label="States" status={fs.state_codes}>{d.state_codes.join(', ')}</Info>
            <Info label="Districts" status={fs.districts}>{d.districts.join(', ')}</Info>
            <Info label="Total vacancies" status={fs.vacancies_total}>{d.vacancies_total?.toLocaleString('en-IN')}</Info>
          </dl>
        </FormSection>

        <FormSection title="Important dates" note={<FieldStatusBadge status={fs.dates} />}>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Application opens" status={fs.application_start}>{d.application_start && formatDay(d.application_start)}</Info>
            <Info label="Last date" status={fs.application_end}>{d.application_end && formatDay(d.application_end)}</Info>
            {d.dates.map((dt) => (
              <Info key={dt.id} label={DATE_KIND_LABEL[dt.kind] ?? dt.kind}>
                {formatDay(dt.date)}
                {dt.end_date && ` – ${formatDay(dt.end_date)}`}
                {dt.is_tentative && ' (tentative)'}
                {dt.note && <span className="block text-xs text-teal/70">{dt.note}</span>}
              </Info>
            ))}
          </dl>
        </FormSection>

        <FormSection title={`Posts (${d.posts.length})`} note={<FieldStatusBadge status={fs.posts} />}>
          {d.posts.length === 0 ? (
            <Blank />
          ) : (
            <ul className="divide-y divide-teal/10">
              {d.posts.map((p) => (
                <li key={p.id} className="py-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">{p.name}</span>
                    <span className="shrink-0 tabular-nums">{p.vacancies_total ?? '–'} posts</span>
                  </div>
                  <p className="text-xs text-teal/70">
                    {[
                      p.pay_level,
                      p.salary_text ??
                        (p.salary_min ? `₹${p.salary_min.toLocaleString('en-IN')}${p.salary_max ? `–${p.salary_max.toLocaleString('en-IN')}` : ''}` : null),
                      p.vacancies_by_category &&
                        Object.entries(p.vacancies_by_category)
                          .map(([k, v]) => `${k} ${v}`)
                          .join(' · '),
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No pay or category split found'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        <FormSection title="Eligibility" note={<FieldStatusBadge status={fs.eligibility} />}>
          {d.eligibility.length === 0 ? (
            <Blank />
          ) : (
            <div className="space-y-4">
              {d.eligibility.map((e) => (
                <Eligibility
                  key={e.id}
                  e={e}
                  heading={e.post_id ? `Only for: ${d.posts.find((p) => p.id === e.post_id)?.name ?? 'one post'}` : 'Applies to every post'}
                />
              ))}
            </div>
          )}
        </FormSection>

        <FormSection title="Fees" note={<FieldStatusBadge status={fs.fees} />}>
          {d.fees.length === 0 ? (
            d.fee_text ? <p className="text-sm">{d.fee_text}</p> : <Blank />
          ) : (
            <ul className="space-y-1 text-sm">
              {d.fees.map((f, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {f.category === 'ALL' ? 'Everyone' : f.category}
                    {f.gender !== 'any' && ` (${f.gender})`}
                  </span>
                  <span className="tabular-nums">{f.amount === 0 ? 'No fee' : `₹${f.amount.toLocaleString('en-IN')}`}</span>
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        {d.selection_process.length > 0 && (
          <FormSection title="Selection process">
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {d.selection_process.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </FormSection>
        )}

        <FormSection title="Official links">
          <dl className="grid gap-4">
            <Info label="Notification PDF" status={fs.notification_pdf_url}><Url href={d.links.notification_pdf_url} /></Info>
            <Info label="Official page" status={fs.official_page_url}><Url href={d.links.official_page_url} /></Info>
            <Info label="Apply link" status={fs.apply_url}><Url href={d.links.apply_url} /></Info>
          </dl>
        </FormSection>

        <FormSection title="Source" note={<ConfidenceMeter value={d.source.confidence} />}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Info label="Scraper">{d.source.key?.toUpperCase()}</Info>
            <Info label="AI model">{d.source.ai_model}</Info>
            <Info label="Found on" wide><Url href={d.source.url} /></Info>
          </dl>
        </FormSection>
      </div>
    </div>
  );
}

/** Real checks only: things we can compute from the stored values. */
function buildChecks(d: ReviewDetail): Array<{ ok: boolean; text: string }> {
  const out = d.missing.map((m) => ({ ok: false, text: `Missing before publishing: ${m}` }));
  if (d.application_start && d.application_end && d.application_start > d.application_end) {
    out.push({ ok: false, text: 'The last date is before the opening date.' });
  }
  const split = d.posts.reduce(
    (n, p) => n + Object.values(p.vacancies_by_category ?? {}).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0),
    0,
  );
  if (split > 0 && d.vacancies_total !== null) {
    out.push(
      split === d.vacancies_total
        ? { ok: true, text: `Category-wise posts add up to the total (${d.vacancies_total}).` }
        : { ok: false, text: `Category-wise posts add up to ${split}, but the total says ${d.vacancies_total}.` },
    );
  }
  if (d.needs_care) out.push({ ok: false, text: 'Low extractor confidence: check every value carefully.' });
  if (out.length === 0) out.push({ ok: true, text: 'Nothing missing. Compare the values with the PDF, then publish.' });
  return out;
}

function Eligibility({ e, heading }: { e: ReviewEligibility; heading: string }) {
  const age =
    e.age_min !== null || e.age_max !== null
      ? `${e.age_min ?? '?'}–${e.age_max ?? '?'} years${e.age_as_on_date ? ` as on ${formatDay(e.age_as_on_date)}` : ''}`
      : null;
  return (
    <div className="rounded-2xl bg-canvas p-4">
      <p className="mb-3 text-sm font-bold">{heading}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Info label="Age">{age}</Info>
        <Info label="Qualification">
          {[e.qualification_level?.replace('_', ' '), e.qualification_streams.join(', ')].filter(Boolean).join(' · ')}
        </Info>
        <Info label="Minimum %">{e.min_percentage !== null && `${e.min_percentage}%`}</Info>
        <Info label="Final-year students">{e.final_year_allowed === null ? null : e.final_year_allowed ? 'Can apply' : 'Cannot apply'}</Info>
        <Info label="Gender">{e.gender === 'any' ? 'Any' : e.gender}</Info>
        <Info label="Categories">{e.categories_allowed.length ? e.categories_allowed.join(', ') : 'All'}</Info>
        <Info label="Domicile">{e.domicile_states.length ? e.domicile_states.join(', ') : 'Any state'}</Info>
        <Info label="Family income limit">{e.income_max !== null && `₹${e.income_max.toLocaleString('en-IN')}/year`}</Info>
        <Info label="Age relaxation" wide>
          {e.age_relaxations.map((r) => `${r.category ?? r.condition ?? r.gender ?? 'Other'} +${r.years} yrs`).join(' · ')}
        </Info>
        {e.other_conditions.length > 0 && <Info label="Other conditions" wide>{e.other_conditions.join('; ')}</Info>}
        {e.official_text && (
          <Info label="Official wording" wide>
            <span className="whitespace-pre-line text-xs">{e.official_text}</span>
          </Info>
        )}
      </dl>
    </div>
  );
}

const STATUS_TEXT: Partial<Record<FieldStatus, string>> = {
  not_in_source: 'Not in the notification',
  pending: 'Not extracted yet',
  not_applicable: 'Not applicable',
};

/** One read-only value; empty shows why (field status) instead of a guess. */
function Info({ label, wide, status, children }: { label: string; wide?: boolean; status?: FieldStatus; children?: ReactNode }) {
  const empty = children === null || children === undefined || children === false || children === '';
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold text-teal/70">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">
        {empty ? <Blank text={(status && STATUS_TEXT[status]) || undefined} /> : children}
      </dd>
    </div>
  );
}

function Blank({ text = 'Not found' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-800">
      <CircleAlert className="size-3" aria-hidden="true" /> {text}
    </span>
  );
}

function Url({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="break-all text-[#0e7bf4] hover:underline">
      {href}
    </a>
  );
}

/** Exactly what the scraper read from the PDF and what the AI returned. */
function RawData({ raw }: { raw: ReviewDetail['raw'] }) {
  if (!raw) {
    return <p className="p-6 text-center text-xs text-teal/70">This draft wasn’t made by a scraper, so there is no raw data.</p>;
  }
  const json = raw.extraction == null ? null : JSON.stringify(raw.extraction, null, 2);
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto text-xs">
      <a href={raw.document_url} target="_blank" rel="noopener noreferrer" className="truncate font-mono text-[11px] text-[#0e7bf4] hover:underline">
        {raw.document_url}
      </a>
      {raw.error && <p className="rounded-lg bg-amber-50 p-2 text-amber-900">{raw.error}</p>}
      <section className="flex min-h-48 flex-1 flex-col">
        <h3 className="mb-1 font-bold text-teal/70">AI output{json ? '' : ': none'}</h3>
        {json && <pre className="flex-1 overflow-auto whitespace-pre-wrap rounded-lg bg-canvas p-3 font-mono text-[11px]">{json}</pre>}
      </section>
      <section className="flex min-h-48 flex-1 flex-col">
        <h3 className="mb-1 font-bold text-teal/70">
          PDF text{raw.extracted_text ? ` (${raw.extracted_text.length.toLocaleString('en-IN')} characters)` : ': none (scanned PDF or older draft)'}
        </h3>
        {raw.extracted_text && (
          <pre className="flex-1 overflow-auto whitespace-pre-wrap rounded-lg bg-canvas p-3 font-mono text-[11px]">{raw.extracted_text}</pre>
        )}
      </section>
    </div>
  );
}
