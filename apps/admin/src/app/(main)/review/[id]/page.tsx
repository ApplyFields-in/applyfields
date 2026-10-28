import type { ApiHealth, FieldStatus, ReviewDetail, ReviewEligibility } from '@applyfields/types';
import { Badge, buttonClass, Card, EmptyState } from '@applyfields/ui';
import { ArrowLeft, CircleAlert, CircleCheck, ExternalLink, FileText, Send, TriangleAlert, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { ReviewActions } from '@/components/review-actions';
import {
  CATEGORY_CODES,
  CATEGORY_LABEL,
  ConfidenceMeter,
  DATE_KIND_LABEL,
  Field,
  formatFoundAt,
  FormSection,
  QUALIFICATION_LEVELS,
  SelectInput,
  TextArea,
  TextInput,
  TYPE_LABEL,
} from '@/components/review-ui';
import { apiGet } from '@/lib/api';

export const metadata = { title: 'Review draft' };

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const list = (values: string[]) => values.join(', ');

/**
 * Review one draft: the official PDF on the left, editable fields on the right.
 * Data: GET /api/v1/admin/review/:id.
 */
export default async function Page({ params }: PageProps<'/review/[id]'>) {
  await connection();
  const { id } = await params;
  const d = await apiGet<ReviewDetail>(`/admin/review/${encodeURIComponent(id)}`);

  if (!d) {
    // The API answered nothing: either it is down, or this draft doesn't exist.
    const health = await apiGet<ApiHealth>('/health');
    if (health) notFound();
    return <ApiOffline />;
  }

  const fs = d.field_status;
  const mainEligibility = d.eligibility.filter((e) => e.post_id === null);
  const postEligibility = d.eligibility.filter((e) => e.post_id !== null);

  return (
    <>
      <Link href="/review" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Review queue
      </Link>

      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="teal">{TYPE_LABEL[d.type]}</Badge>
          <Badge tone={d.status === 'draft' ? 'celadon' : 'tea'}>{d.status === 'draft' ? 'Draft' : d.status}</Badge>
          {d.needs_care && (
            <Badge tone="outline" className="bg-cream">
              <TriangleAlert aria-hidden="true" /> Check carefully
            </Badge>
          )}
          <span className="text-xs text-teal/70">Version {d.version}</span>
        </div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{d.title || 'Untitled draft'}</h1>
        <p className="mt-1 text-sm text-teal/80">
          {d.organization.name}
          {d.source.fetched_at && <> · found {formatFoundAt(d.source.fetched_at)}</>}
          {d.source.key && <> · source {d.source.key.toUpperCase()}</>}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ------------------------------------------------ left: the official PDF */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <PdfPanel pdf={d.pdf} officialPage={d.links.official_page_url} sourceUrl={d.source.url} />
        </div>

        {/* ------------------------------------------------ right: editable fields */}
        <div className="min-w-0 space-y-5" aria-label="Draft fields">
          <ReviewActions id={d.id} missing={d.missing} />

          <FormSection title="Basic information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" status={fs.title} empty={!d.title} className="sm:col-span-2">
                <TextInput name="title" defaultValue={d.title} />
              </Field>
              <Field label="Type">
                <SelectInput name="type" defaultValue={d.type} options={toOptions(TYPE_LABEL)} />
              </Field>
              <Field label="Category">
                <SelectInput name="category" defaultValue={d.category} options={toOptions(CATEGORY_LABEL)} />
              </Field>
              <Field label="Organisation" hint="Change the organisation in the Opportunities section.">
                <TextInput defaultValue={d.organization.name} readOnly aria-readonly="true" className="text-teal/70" />
              </Field>
              <Field label="Notification number" status={fs.notification_number}>
                <TextInput name="notification_number" defaultValue={d.notification_number ?? ''} />
              </Field>
              <Field label="Summary" status={fs.summary} className="sm:col-span-2">
                <TextArea name="summary" defaultValue={d.summary ?? ''} placeholder="2–3 plain sentences: who is hiring, for what, who can apply." />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Where & how many">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="States" status={fs.state_codes} hint="2-letter codes, ALL = All India">
                <TextInput name="state_codes" defaultValue={list(d.state_codes)} />
              </Field>
              <Field label="Districts" status={fs.districts}>
                <TextInput name="districts" defaultValue={list(d.districts)} />
              </Field>
              <Field label="Total vacancies" status={fs.vacancies_total} empty={d.vacancies_total === null}>
                <TextInput name="vacancies_total" type="number" min={0} defaultValue={d.vacancies_total ?? ''} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Important dates" note={<FieldStatusNote status={fs.dates} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Application opens" status={fs.application_start}>
                <TextInput name="application_start" type="date" defaultValue={d.application_start ?? ''} />
              </Field>
              <Field
                label="Last date"
                status={fs.application_end}
                empty={!d.application_end && fs.dates !== 'not_in_source'}
              >
                <TextInput name="application_end" type="date" defaultValue={d.application_end ?? ''} />
              </Field>
            </div>
            {d.dates.length > 0 && (
              <ul className="mt-4 space-y-2">
                {d.dates.map((date) => (
                  <li key={date.id} className="grid gap-2 rounded-2xl bg-canvas p-3 shadow-pressed sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                    <Field label="Kind">
                      <SelectInput name={`dates.${date.id}.kind`} defaultValue={date.kind} options={toOptions(DATE_KIND_LABEL)} className="bg-cream" />
                    </Field>
                    <Field label="Date">
                      <TextInput name={`dates.${date.id}.date`} type="date" defaultValue={date.date} className="bg-cream" />
                    </Field>
                    <Field label="Until">
                      <TextInput name={`dates.${date.id}.end_date`} type="date" defaultValue={date.end_date ?? ''} className="bg-cream" />
                    </Field>
                    <label className="flex h-10 items-center gap-2 text-xs font-semibold">
                      <input type="checkbox" name={`dates.${date.id}.is_tentative`} defaultChecked={date.is_tentative} className="size-4 accent-teal" />
                      Tentative
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>

          <FormSection title={`Posts (${d.posts.length})`} note={<FieldStatusNote status={fs.posts} />}>
            {d.posts.length === 0 ? (
              <p className="text-sm text-teal/80">No posts extracted. Single-post notifications can leave this empty.</p>
            ) : (
              <ul className="space-y-3">
                {d.posts.map((p) => (
                  <li key={p.id} className="grid gap-3 rounded-2xl bg-canvas p-3 shadow-pressed sm:grid-cols-2">
                    <Field label="Post name" className="sm:col-span-2">
                      <TextInput name={`posts.${p.id}.name`} defaultValue={p.name} className="bg-cream" />
                    </Field>
                    <Field label="Vacancies">
                      <TextInput name={`posts.${p.id}.vacancies_total`} type="number" min={0} defaultValue={p.vacancies_total ?? ''} className="bg-cream" />
                    </Field>
                    <Field label="Pay level">
                      <TextInput name={`posts.${p.id}.pay_level`} defaultValue={p.pay_level ?? ''} className="bg-cream" />
                    </Field>
                    <Field label="Salary (as written)" className="sm:col-span-2">
                      <TextInput name={`posts.${p.id}.salary_text`} defaultValue={p.salary_text ?? ''} className="bg-cream" />
                    </Field>
                    {p.vacancies_by_category && (
                      <p className="text-xs text-teal/80 sm:col-span-2">
                        By category:{' '}
                        {Object.entries(p.vacancies_by_category)
                          .map(([k, v]) => `${k} ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </FormSection>

          <FormSection title="Eligibility" note={<FieldStatusNote status={fs.eligibility} />}>
            {d.eligibility.length === 0 ? (
              <p className="text-sm text-teal/80">No eligibility extracted yet — fill it in from the PDF, or mark it “not in source”.</p>
            ) : (
              <div className="space-y-4">
                {mainEligibility.map((e) => (
                  <EligibilityFields key={e.id} e={e} heading="Applies to every post" />
                ))}
                {postEligibility.map((e) => (
                  <EligibilityFields key={e.id} e={e} heading={`Only for: ${d.posts.find((p) => p.id === e.post_id)?.name ?? 'a post'}`} />
                ))}
              </div>
            )}
          </FormSection>

          <FormSection title="Fees" note={<FieldStatusNote status={fs.fees} />}>
            <Field label="Fee (as written in the notification)" status={fs.fee_text}>
              <TextArea name="fee_text" defaultValue={d.fee_text ?? ''} className="min-h-16" />
            </Field>
            {d.fees.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {d.fees.map((f, i) => (
                  <li key={i}>
                    <Badge tone="tea">
                      {f.category}
                      {f.gender !== 'any' && ` · ${f.gender}`} · ₹{f.amount.toLocaleString('en-IN')}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>

          <FormSection title="Official links" note={<span className="text-xs text-teal/70">Must be on the organisation’s own domain</span>}>
            <div className="grid gap-4">
              <Field label="Notification PDF" status={fs.notification_pdf_url} empty={!d.links.notification_pdf_url && !d.links.official_page_url}>
                <TextInput name="notification_pdf_url" type="url" defaultValue={d.links.notification_pdf_url ?? ''} />
              </Field>
              <Field label="Official page" status={fs.official_page_url}>
                <TextInput name="official_page_url" type="url" defaultValue={d.links.official_page_url ?? ''} />
              </Field>
              <Field label="Apply link" status={fs.apply_url}>
                <TextInput name="apply_url" type="url" defaultValue={d.links.apply_url ?? ''} />
              </Field>
              <Field label="Official website" status={fs.official_website}>
                <TextInput name="official_website" type="url" defaultValue={d.links.official_website ?? ''} />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Source & extraction" note={<ConfidenceMeter value={d.source.confidence} />}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Info label="Source">{d.source.key?.toUpperCase() ?? '—'}</Info>
              <Info label="Found">{d.source.fetched_at ? formatFoundAt(d.source.fetched_at) : '—'}</Info>
              <Info label="Source page" wide>
                {d.source.url ? (
                  <a href={d.source.url} target="_blank" rel="noreferrer" className="break-all font-semibold underline-offset-2 hover:underline">
                    {d.source.url}
                  </a>
                ) : (
                  <span className="font-semibold">Missing</span>
                )}
              </Info>
              <Info label="Extractor">{d.source.extractor_version ?? '—'}</Info>
              <Info label="Parser engine">{d.source.ai_model ?? 'Standard Ingestion Pipeline'}</Info>
              <Info label="File hash (SHA-256)" wide>
                <code className="break-all font-mono text-xs">{d.source.content_hash ?? '—'}</code>
              </Info>
            </dl>
          </FormSection>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function PdfPanel({
  pdf,
  officialPage,
  sourceUrl,
}: {
  pdf: ReviewDetail['pdf'];
  officialPage: string | null;
  sourceUrl: string | null;
}) {
  const fallback = officialPage ?? sourceUrl;
  return (
    <Card className="flex flex-col p-3 xl:h-[calc(100dvh-8rem)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 pt-1">
        <p className="flex items-center gap-2 text-sm font-bold">
          <FileText className="size-4" aria-hidden="true" /> Official notification
          {pdf.kind === 'signed' && <Badge tone="tea">Our stored copy</Badge>}
          {pdf.kind === 'official' && <Badge tone="tea">From the official site</Badge>}
        </p>
        {pdf.url && (
          <a href={pdf.url} target="_blank" rel="noreferrer" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            <ExternalLink aria-hidden="true" /> Open in new tab
          </a>
        )}
      </div>
      {pdf.url ? (
        <>
          <iframe
            src={pdf.url}
            title="Official notification PDF"
            className="h-[70vh] w-full flex-1 rounded-2xl bg-canvas shadow-pressed xl:h-auto"
          />
          {pdf.kind === 'official' && (
            <p className="px-2 pt-2 text-[11px] text-teal/70">
              Some government sites block viewing inside other pages — use “Open in new tab” if this stays blank.
            </p>
          )}
        </>
      ) : (
        <EmptyState
          className="flex-1 justify-center"
          icon={<FileText />}
          title="No PDF for this draft"
          text="The scraper didn’t store a file. Check the official page instead."
          action={
            fallback ? (
              <a href={fallback} target="_blank" rel="noreferrer" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                <ExternalLink aria-hidden="true" /> Open official page
              </a>
            ) : undefined
          }
        />
      )}
    </Card>
  );
}

function EligibilityFields({ e, heading }: { e: ReviewEligibility; heading: string }) {
  const n = (k: string) => `eligibility.${e.id}.${k}`;
  return (
    <fieldset className="rounded-2xl bg-canvas p-4 shadow-pressed">
      <legend className="sr-only">{heading}</legend>
      <p className="mb-3 text-sm font-bold">{heading}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Minimum age">
          <TextInput name={n('age_min')} type="number" min={0} defaultValue={e.age_min ?? ''} className="bg-cream" />
        </Field>
        <Field label="Maximum age">
          <TextInput name={n('age_max')} type="number" min={0} defaultValue={e.age_max ?? ''} className="bg-cream" />
        </Field>
        <Field label="Age as on">
          <TextInput name={n('age_as_on_date')} type="date" defaultValue={e.age_as_on_date ?? ''} className="bg-cream" />
        </Field>
        <Field label="Qualification">
          <SelectInput
            name={n('qualification_level')}
            defaultValue={e.qualification_level ?? ''}
            className="bg-cream"
            options={[{ value: '', label: 'Not set' }, ...QUALIFICATION_LEVELS.map((q) => ({ value: q, label: q.replace('_', ' ') }))]}
          />
        </Field>
        <Field label="Streams / subjects" className="sm:col-span-2">
          <TextInput name={n('qualification_streams')} defaultValue={list(e.qualification_streams)} className="bg-cream" />
        </Field>
        <Field label="Minimum %">
          <TextInput name={n('min_percentage')} type="number" min={0} max={100} step="0.01" defaultValue={e.min_percentage ?? ''} className="bg-cream" />
        </Field>
        <Field label="Final-year students">
          <SelectInput
            name={n('final_year_allowed')}
            defaultValue={e.final_year_allowed === null ? '' : String(e.final_year_allowed)}
            className="bg-cream"
            options={[
              { value: '', label: 'Not mentioned' },
              { value: 'true', label: 'Can apply' },
              { value: 'false', label: 'Cannot apply' },
            ]}
          />
        </Field>
        <Field label="Gender">
          <SelectInput
            name={n('gender')}
            defaultValue={e.gender}
            className="bg-cream"
            options={[
              { value: 'any', label: 'Any' },
              { value: 'male', label: 'Male only' },
              { value: 'female', label: 'Female only' },
              { value: 'transgender', label: 'Transgender' },
            ]}
          />
        </Field>
        <Field label="Categories allowed" hint={`Empty = all · ${CATEGORY_CODES.join(', ')}`}>
          <TextInput name={n('categories_allowed')} defaultValue={list(e.categories_allowed)} className="bg-cream" />
        </Field>
        <Field label="Domicile states" hint="Empty = any state">
          <TextInput name={n('domicile_states')} defaultValue={list(e.domicile_states)} className="bg-cream" />
        </Field>
        <Field label="Family income limit (₹/year)">
          <TextInput name={n('income_max')} type="number" min={0} defaultValue={e.income_max ?? ''} className="bg-cream" />
        </Field>
        {e.age_relaxations.length > 0 && (
          <p className="text-xs text-teal/80 sm:col-span-3">
            Age relaxation:{' '}
            {e.age_relaxations.map((r) => `${r.category ?? r.condition ?? r.gender ?? 'Other'} +${r.years} yrs`).join(' · ')}
          </p>
        )}
        <Field label="Other conditions (one per line)" className="sm:col-span-3">
          <TextArea name={n('other_conditions')} defaultValue={e.other_conditions.join('\n')} className="min-h-16 bg-cream" />
        </Field>
        <Field label="Official wording" className="sm:col-span-3" empty={!e.official_text}>
          <TextArea name={n('official_text')} defaultValue={e.official_text ?? ''} className="bg-cream" />
        </Field>
      </div>
    </fieldset>
  );
}

function FieldStatusNote({ status }: { status: FieldStatus | undefined }) {
  if (!status || status === 'available') return null;
  const text = { not_in_source: 'Not in the notification', pending: 'Not extracted yet', not_applicable: 'Not applicable' }[status];
  return <Badge tone={status === 'pending' ? 'celadon' : 'outline'}>{text}</Badge>;
}

function Info({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold text-teal/70">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
