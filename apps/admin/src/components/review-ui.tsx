import type { DateKind, FieldStatus, OpportunityCategory, OpportunityType } from '@applyfields/types';
import { Badge, cn } from '@applyfields/ui';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/* ------------------------------------------------------------------ labels */

export const TYPE_LABEL: Record<OpportunityType, string> = {
  govt_job: 'Government job',
  exam: 'Exam',
  scholarship: 'Scholarship',
  admission: 'Admission',
};

export const CATEGORY_LABEL: Record<OpportunityCategory, string> = {
  central_govt: 'Central government',
  state_govt: 'State government',
  district: 'District',
  panchayat: 'Panchayat',
  municipal: 'Municipal',
  psu: 'PSU',
  railways: 'Railways',
  banking: 'Banking',
  defence: 'Defence',
  police: 'Police',
  entrance: 'Entrance',
  competitive: 'Competitive',
  recruitment: 'Recruitment',
  central: 'Central',
  state: 'State',
  college: 'College',
  university: 'University',
  course: 'Course',
  other: 'Other',
};

export const DATE_KIND_LABEL: Record<DateKind, string> = {
  notification_date: 'Notification',
  application_start: 'Application opens',
  application_end: 'Last date',
  fee_last_date: 'Fee last date',
  correction_window: 'Correction window',
  admit_card: 'Admit card',
  exam_date: 'Exam',
  answer_key: 'Answer key',
  result: 'Result',
  interview: 'Interview',
  counselling: 'Counselling',
  other: 'Other',
};

export const QUALIFICATION_LEVELS = ['10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd'] as const;
export const CATEGORY_CODES = ['GEN', 'OBC', 'SC', 'ST', 'EWS', 'PWBD', 'EXS'] as const;

const FIELD_STATUS_LABEL: Record<FieldStatus, string> = {
  available: 'Available',
  not_in_source: 'Not in source',
  pending: 'Pending',
  not_applicable: 'Not applicable',
};

/** "6 Oct, 09:30" in India time — absolute, so server and browser render the same text. */
export function formatFoundAt(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}

export function formatDay(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(iso),
  );
}

/* ------------------------------------------------------------------ badges */

/** Confidence as a small meter: green ≥ 80 %, light 60–79 %, warning below 60 % or unknown. */
export function ConfidenceMeter({ value, className }: { value: number | null; className?: string }) {
  const pct = value === null ? null : Math.round(value * 100);
  const tone = pct === null || pct < 60 ? 'bg-teal/35' : pct < 80 ? 'bg-celadon' : 'bg-sea';
  return (
    <div className={cn('flex items-center gap-2', className)} title="Extractor confidence">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-teal/10 shadow-pressed" aria-hidden="true">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct ?? 0}%` }} />
      </div>
      <span className="w-9 text-xs font-bold tabular-nums">{pct === null ? '—' : `${pct}%`}</span>
    </div>
  );
}

export function FieldStatusBadge({ status }: { status: FieldStatus | undefined }) {
  if (!status || status === 'available') return null;
  return (
    <Badge tone={status === 'pending' ? 'celadon' : 'outline'} className="text-[11px]">
      {FIELD_STATUS_LABEL[status]}
    </Badge>
  );
}

/* ------------------------------------------------------------------ form pieces */

const inputBase =
  'w-full rounded-2xl bg-canvas px-3.5 text-sm shadow-pressed outline-none transition-shadow placeholder:text-teal/60 focus:shadow-clay';

/** A labelled field. `status` shows the field_status badge; `empty` highlights a value the reviewer must fill or mark. */
export function Field({
  label,
  status,
  empty,
  hint,
  className,
  children,
}: {
  label: string;
  status?: FieldStatus;
  empty?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-teal/80">
        {label}
        <FieldStatusBadge status={status} />
        {empty && !status && <Badge tone="celadon" className="text-[11px]">Missing</Badge>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-teal/70">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(inputBase, 'h-10', className)} />;
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cn(inputBase, 'min-h-24 py-2.5 leading-relaxed', className)} />;
}

export function SelectInput({
  options,
  className,
  ...rest
}: { options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cn(inputBase, 'h-10 appearance-none pr-8', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** A form section card with a title and an optional right-side note. */
export function FormSection({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-card bg-cream p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {note}
      </div>
      {children}
    </section>
  );
}
