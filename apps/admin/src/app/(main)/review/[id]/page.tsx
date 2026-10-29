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
import { ReviewWorkspaceClient } from './review-workspace-client';

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

      <ReviewWorkspaceClient detail={d} />
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
