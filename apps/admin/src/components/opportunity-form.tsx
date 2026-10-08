'use client';

import { useState, useTransition } from 'react';
import type {
  AgeRelaxation,
  CategoryCode,
  DateKind,
  Gender,
  OpportunityCategory,
  OpportunityInput,
  OpportunityStatus,
  OpportunityType,
  OrganizationOption,
  ReviewDate,
  ReviewDetail,
  ReviewPost,
} from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  EyeOff,
  FileText,
  Plus,
  RotateCw,
  Save,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  publishOpportunityAction,
  saveOpportunityAction,
  createOpportunityAction,
  setOpportunityStatusAction,
} from '@/lib/actions';
import {
  CATEGORY_CODES,
  CATEGORY_LABEL,
  DATE_KIND_LABEL,
  Field,
  FormSection,
  QUALIFICATION_LEVELS,
  SelectInput,
  TextArea,
  TextInput,
  TYPE_LABEL,
} from './review-ui';
import { StatusBadge } from './opportunities-ui';

interface OpportunityFormProps {
  initialData?: ReviewDetail | null;
  organizations: OrganizationOption[];
  mode: 'create' | 'edit';
}

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export function OpportunityForm({ initialData, organizations, mode }: OpportunityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Core Form State
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [type, setType] = useState<OpportunityType>(initialData?.type ?? 'govt_job');
  const [category, setCategory] = useState<OpportunityCategory>(initialData?.category ?? 'central_govt');
  const [orgId, setOrgId] = useState(initialData?.organization?.id ?? organizations[0]?.id ?? '');
  const [notifNumber, setNotifNumber] = useState(initialData?.notification_number ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [stateCodes, setStateCodes] = useState(initialData?.state_codes?.join(', ') ?? 'ALL');
  const [districts, setDistricts] = useState(initialData?.districts?.join(', ') ?? '');
  const [vacanciesTotal, setVacanciesTotal] = useState<string>(
    initialData?.vacancies_total !== null && initialData?.vacancies_total !== undefined
      ? String(initialData.vacancies_total)
      : '',
  );
  const [feeText, setFeeText] = useState(initialData?.fee_text ?? '');
  const [appStart, setAppStart] = useState(initialData?.application_start ?? '');
  const [appEnd, setAppEnd] = useState(initialData?.application_end ?? '');

  // Links
  const [notifPdfUrl, setNotifPdfUrl] = useState(initialData?.links?.notification_pdf_url ?? '');
  const [officialPageUrl, setOfficialPageUrl] = useState(initialData?.links?.official_page_url ?? '');
  const [applyUrl, setApplyUrl] = useState(initialData?.links?.apply_url ?? '');
  const [officialWebsite, setOfficialWebsite] = useState(initialData?.links?.official_website ?? '');

  // Eligibility
  const mainElig = initialData?.eligibility?.find((e) => e.post_id === null);
  const [ageMin, setAgeMin] = useState(mainElig?.age_min ? String(mainElig.age_min) : '');
  const [ageMax, setAgeMax] = useState(mainElig?.age_max ? String(mainElig.age_max) : '');
  const [qualLevel, setQualLevel] = useState(mainElig?.qualification_level ?? '');
  const [qualStreams, setQualStreams] = useState(mainElig?.qualification_streams?.join(', ') ?? '');
  const [categoriesAllowed, setCategoriesAllowed] = useState(
    mainElig?.categories_allowed?.join(', ') ?? '',
  );
  const [ageAsOn, setAgeAsOn] = useState(mainElig?.age_as_on_date ?? '');
  const [relaxText, setRelaxText] = useState(
    (mainElig?.age_relaxations ?? [])
      .filter((r) => r.category && !r.gender && !r.condition)
      .map((r) => `${r.category} ${r.years}`)
      .join(', '),
  );
  const [gender, setGender] = useState<Gender>(mainElig?.gender ?? 'any');
  const [domicile, setDomicile] = useState(mainElig?.domicile_states?.join(', ') ?? '');
  const [incomeMax, setIncomeMax] = useState(mainElig?.income_max != null ? String(mainElig.income_max) : '');
  const [finalYear, setFinalYear] = useState(
    mainElig?.final_year_allowed == null ? '' : mainElig.final_year_allowed ? 'yes' : 'no',
  );
  const [minPct, setMinPct] = useState(mainElig?.min_percentage != null ? String(mainElig.min_percentage) : '');
  const [officialText, setOfficialText] = useState(mainElig?.official_text ?? '');

  // Dynamic Posts
  const [posts, setPosts] = useState<
    Array<{ id?: string; name: string; vacancies_total: string; pay_level: string; salary_text: string }>
  >(
    initialData?.posts && initialData.posts.length > 0
      ? initialData.posts.map((p) => ({
          id: p.id,
          name: p.name,
          vacancies_total: p.vacancies_total !== null ? String(p.vacancies_total) : '',
          pay_level: p.pay_level ?? '',
          salary_text: p.salary_text ?? '',
        }))
      : [{ name: '', vacancies_total: '', pay_level: '', salary_text: '' }],
  );

  // Dynamic Dates
  const [dates, setDates] = useState<
    Array<{ id?: string; kind: DateKind; date: string; end_date: string; is_tentative: boolean }>
  >(
    initialData?.dates && initialData.dates.length > 0
      ? initialData.dates.map((d) => ({
          id: d.id,
          kind: d.kind,
          date: d.date,
          end_date: d.end_date ?? '',
          is_tentative: d.is_tentative,
        }))
      : [],
  );

  const addPost = () => setPosts([...posts, { name: '', vacancies_total: '', pay_level: '', salary_text: '' }]);
  const removePost = (index: number) => setPosts(posts.filter((_, i) => i !== index));

  const addDate = () =>
    setDates([
      ...dates,
      { kind: 'exam_date', date: new Date().toISOString().slice(0, 10), end_date: '', is_tentative: false },
    ]);
  const removeDate = (index: number) => setDates(dates.filter((_, i) => i !== index));

  const list = (s: string, upper = false) =>
    s
      .split(',')
      .map((x) => (upper ? x.trim().toUpperCase() : x.trim()))
      .filter(Boolean);

  /** "OBC 3, SC 5, PWBD 10" → category relaxations; null if any entry is unreadable. */
  const parseRelaxations = (): AgeRelaxation[] | null => {
    const out: AgeRelaxation[] = [];
    for (const part of list(relaxText)) {
      const m = /^([A-Za-z]+)\s*[:+\s]\s*(\d+(?:\.\d+)?)$/.exec(part);
      const code = m?.[1].toUpperCase() as CategoryCode | undefined;
      if (!m || !code || !(CATEGORY_CODES as readonly string[]).includes(code)) return null;
      out.push({ category: code, years: Number(m[2]) });
    }
    // relaxations with a gender or free-text condition aren't editable here — keep them as they are
    const kept = (mainElig?.age_relaxations ?? []).filter((r) => !r.category || r.gender || r.condition);
    return [...out, ...kept];
  };

  const buildPayload = (relaxations: AgeRelaxation[]): OpportunityInput => {
    return {
      title: title.trim(),
      type,
      category,
      organization_id: orgId,
      notification_number: notifNumber.trim() || null,
      summary: summary.trim() || null,
      state_codes: stateCodes
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
      districts: districts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      vacancies_total: vacanciesTotal ? Number.parseInt(vacanciesTotal, 10) : null,
      fee_text: feeText.trim() || null,
      application_start: appStart || null,
      application_end: appEnd || null,
      notification_pdf_url: notifPdfUrl.trim() || null,
      official_page_url: officialPageUrl.trim() || null,
      apply_url: applyUrl.trim() || null,
      official_website: officialWebsite.trim() || null,
      source_url: initialData?.source?.url ?? null,
      field_status: initialData?.field_status ?? {},
      eligibility: {
        age_min: ageMin ? Number.parseInt(ageMin, 10) : null,
        age_max: ageMax ? Number.parseInt(ageMax, 10) : null,
        qualification_level: qualLevel || null,
        qualification_streams: list(qualStreams),
        min_percentage: minPct ? Number(minPct) : null,
        final_year_allowed: finalYear === '' ? null : finalYear === 'yes',
        gender,
        domicile_states: list(domicile, true),
        categories_allowed: list(categoriesAllowed, true),
        income_max: incomeMax ? Number.parseInt(incomeMax, 10) : null,
        other_conditions: mainElig?.other_conditions ?? [],
        official_text: officialText.trim() || null,
        age_as_on_date: ageAsOn || null,
        age_relaxations: relaxations,
      },
      posts: posts
        .filter((p) => p.name.trim())
        .map((p) => ({
          id: p.id,
          name: p.name.trim(),
          vacancies_total: p.vacancies_total ? Number.parseInt(p.vacancies_total, 10) : null,
          pay_level: p.pay_level.trim() || null,
          salary_text: p.salary_text.trim() || null,
        })),
      dates: dates
        .filter((d) => d.date)
        .map((d) => ({
          id: d.id,
          kind: d.kind,
          date: d.date,
          end_date: d.end_date || null,
          is_tentative: d.is_tentative,
          note: null,
        })),
    };
  };

  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const relaxations = parseRelaxations();
    if (!relaxations) {
      setErrorMsg('Age relaxations: write them like "OBC 3, SC 5, PWBD 10" (codes: GEN, OBC, SC, ST, EWS, PWBD, EXS).');
      return;
    }
    startTransition(async () => {
      const payload = buildPayload(relaxations);
      if (mode === 'create') {
        const res = await createOpportunityAction(payload);
        if (res.ok && res.data) {
          router.push(`/opportunities/${res.data.id}`);
        } else {
          setErrorMsg(res.error ?? 'Failed to create opportunity');
        }
      } else if (initialData?.id) {
        const res = await saveOpportunityAction(initialData.id, payload);
        if (res.ok) {
          setSuccessMsg('Changes saved successfully');
          router.refresh();
        } else {
          setErrorMsg(res.error ?? 'Failed to save changes');
        }
      }
    });
  };

  const handlePublish = () => {
    if (!initialData?.id) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await publishOpportunityAction(initialData.id);
      if (res.ok) {
        setSuccessMsg('Opportunity published and live on website!');
        router.refresh();
      } else {
        setErrorMsg(res.error ?? 'Cannot publish draft');
      }
    });
  };

  const handleSetStatus = (status: OpportunityStatus) => {
    if (!initialData?.id) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    let reason: string | undefined;
    if (status === 'archived') {
      const r = prompt('Reason for archiving/rejecting this opportunity:');
      if (!r) return;
      reason = r;
    }
    startTransition(async () => {
      const res = await setOpportunityStatusAction(initialData.id, status, reason);
      if (res.ok) {
        setSuccessMsg(`Status updated to ${status}`);
        router.refresh();
      } else {
        setErrorMsg(res.error ?? 'Failed to change status');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to opportunities
        </Link>
        {initialData && (
          <div className="flex items-center gap-2">
            <StatusBadge status={initialData.status} />
            <span className="font-mono text-xs text-teal/70">Version {initialData.version}</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <Card tone="tea" className="flex items-start gap-3 p-4">
          <AlertCircle className="size-5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-bold text-red-900">Action failed</p>
            <p className="text-red-800">{errorMsg}</p>
          </div>
        </Card>
      )}

      {successMsg && (
        <Card tone="teal" className="flex items-start gap-3 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-celadon" aria-hidden="true" />
          <p className="text-sm font-bold text-cream">{successMsg}</p>
        </Card>
      )}

      {/* Action Bar */}
      <Card className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 border-teal/20 bg-cream/95 p-4 shadow-md backdrop-blur">
        <div>
          <h2 className="text-base font-bold text-teal">
            {mode === 'create' ? 'Create new opportunity' : title || 'Edit opportunity'}
          </h2>
          <p className="text-xs text-teal/70">
            {mode === 'create'
              ? 'Starts as a draft. You can publish once required fields are complete.'
              : `Current status: ${initialData?.status.toUpperCase()}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={buttonClass({ variant: 'primary', size: 'sm' })}
          >
            <Save className="size-4" aria-hidden="true" />
            {isPending ? 'Saving...' : mode === 'create' ? 'Create draft' : 'Save changes'}
          </button>

          {mode === 'edit' && initialData && (
            <>
              {initialData.status === 'draft' && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPending}
                  className={buttonClass({ variant: 'accent', size: 'sm' })}
                >
                  <Send className="size-4" aria-hidden="true" /> Publish to live site
                </button>
              )}

              {initialData.status === 'published' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSetStatus('draft')}
                    disabled={isPending}
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    <EyeOff className="size-4" aria-hidden="true" /> Unpublish (move to draft)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus('closed')}
                    disabled={isPending}
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    <Clock className="size-4" aria-hidden="true" /> Mark closed
                  </button>
                </>
              )}

              {initialData.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => handleSetStatus('archived')}
                  disabled={isPending}
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  <Archive className="size-4" aria-hidden="true" /> Archive
                </button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Main Form Fields */}
      <div className="space-y-6">
        <FormSection title="1. Overview & Classification">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opportunity Title *" className="sm:col-span-2">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. UPSC Combined Defence Services (CDS) Examination I 2026"
              />
            </Field>

            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OpportunityType)}
                className="h-10 w-full rounded-full border border-teal/15 bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
              >
                {toOptions(TYPE_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as OpportunityCategory)}
                className="h-10 w-full rounded-full border border-teal/15 bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
              >
                {toOptions(CATEGORY_LABEL).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Recruiting Organisation *">
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="h-10 w-full rounded-full border border-teal/15 bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} {org.short_name ? `(${org.short_name})` : ''} [{org.level}]
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Official Notification Number">
              <TextInput
                value={notifNumber}
                onChange={(e) => setNotifNumber(e.target.value)}
                placeholder="e.g. 05/2026-CDS-I"
              />
            </Field>

            <Field label="Summary / Description" className="sm:col-span-2">
              <TextArea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief explanation of post, who can apply, and key benefits."
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="2. Location & Vacancies">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="States (comma-separated or ALL)">
              <TextInput
                value={stateCodes}
                onChange={(e) => setStateCodes(e.target.value)}
                placeholder="ALL, or AP, TS, KA..."
              />
            </Field>

            <Field label="Districts (optional)">
              <TextInput
                value={districts}
                onChange={(e) => setDistricts(e.target.value)}
                placeholder="District names"
              />
            </Field>

            <Field label="Total Vacancies">
              <TextInput
                type="number"
                min="0"
                value={vacanciesTotal}
                onChange={(e) => setVacanciesTotal(e.target.value)}
                placeholder="e.g. 457"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="3. Important Dates">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Application Start Date">
              <TextInput
                type="date"
                value={appStart}
                onChange={(e) => setAppStart(e.target.value)}
              />
            </Field>

            <Field label="Application Last Date *">
              <TextInput
                type="date"
                value={appEnd}
                onChange={(e) => setAppEnd(e.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal/70">
                Additional Dates (Exam, Admit Card, Answer Key)
              </span>
              <button
                type="button"
                onClick={addDate}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                <Plus className="size-3.5" aria-hidden="true" /> Add date
              </button>
            </div>

            {dates.map((d, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl bg-canvas p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end"
              >
                <Field label="Kind">
                  <select
                    value={d.kind}
                    onChange={(e) => {
                      const updated = [...dates];
                      updated[index].kind = e.target.value as DateKind;
                      setDates(updated);
                    }}
                    className="h-10 w-full rounded-full border border-teal/15 bg-cream px-3 text-xs focus:border-teal focus:outline-none"
                  >
                    {toOptions(DATE_KIND_LABEL).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Date">
                  <TextInput
                    type="date"
                    value={d.date}
                    onChange={(e) => {
                      const updated = [...dates];
                      updated[index].date = e.target.value;
                      setDates(updated);
                    }}
                    className="bg-cream"
                  />
                </Field>

                <Field label="End Date (optional)">
                  <TextInput
                    type="date"
                    value={d.end_date}
                    onChange={(e) => {
                      const updated = [...dates];
                      updated[index].end_date = e.target.value;
                      setDates(updated);
                    }}
                    className="bg-cream"
                  />
                </Field>

                <label className="flex h-10 items-center gap-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={d.is_tentative}
                    onChange={(e) => {
                      const updated = [...dates];
                      updated[index].is_tentative = e.target.checked;
                      setDates(updated);
                    }}
                    className="size-4 accent-teal"
                  />
                  Tentative
                </label>

                <button
                  type="button"
                  onClick={() => removeDate(index)}
                  className="flex h-10 w-10 items-center justify-center text-red-600 hover:text-red-800"
                  title="Remove date"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection title="4. Posts & Vacancy Breakdown">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal/70">
                Designated Posts ({posts.length})
              </span>
              <button
                type="button"
                onClick={addPost}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                <Plus className="size-3.5" aria-hidden="true" /> Add post
              </button>
            </div>

            {posts.map((post, idx) => (
              <div key={idx} className="grid gap-3 rounded-2xl bg-canvas p-4 sm:grid-cols-2">
                <Field label="Post Name" className="sm:col-span-2">
                  <div className="flex gap-2">
                    <TextInput
                      value={post.name}
                      onChange={(e) => {
                        const updated = [...posts];
                        updated[idx].name = e.target.value;
                        setPosts(updated);
                      }}
                      placeholder="e.g. Assistant Section Officer (ASO)"
                      className="bg-cream"
                    />
                    {posts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePost(idx)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center text-red-600 hover:text-red-800"
                        title="Remove post"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </Field>

                <Field label="Vacancies">
                  <TextInput
                    type="number"
                    min="0"
                    value={post.vacancies_total}
                    onChange={(e) => {
                      const updated = [...posts];
                      updated[idx].vacancies_total = e.target.value;
                      setPosts(updated);
                    }}
                    className="bg-cream"
                  />
                </Field>

                <Field label="Pay Level / Grade Pay">
                  <TextInput
                    value={post.pay_level}
                    onChange={(e) => {
                      const updated = [...posts];
                      updated[idx].pay_level = e.target.value;
                      setPosts(updated);
                    }}
                    placeholder="e.g. Level 7 (44900-142400)"
                    className="bg-cream"
                  />
                </Field>

                <Field label="Salary Text (as officially stated)" className="sm:col-span-2">
                  <TextInput
                    value={post.salary_text}
                    onChange={(e) => {
                      const updated = [...posts];
                      updated[idx].salary_text = e.target.value;
                      setPosts(updated);
                    }}
                    placeholder="e.g. ₹44,900 – ₹1,42,400 + allowances"
                    className="bg-cream"
                  />
                </Field>
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection title="5. Eligibility Criteria">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum Age">
              <TextInput
                type="number"
                min="14"
                max="70"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                placeholder="e.g. 18"
              />
            </Field>

            <Field label="Maximum Age">
              <TextInput
                type="number"
                min="14"
                max="70"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                placeholder="e.g. 30"
              />
            </Field>

            <Field label="Minimum Qualification Level">
              <select
                value={qualLevel}
                onChange={(e) => setQualLevel(e.target.value)}
                className="h-10 w-full rounded-full border border-teal/15 bg-canvas px-3 text-sm focus:border-teal focus:outline-none"
              >
                <option value="">Any / Not specified</option>
                {QUALIFICATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl.toUpperCase()}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Allowed Streams / Degrees">
              <TextInput
                value={qualStreams}
                onChange={(e) => setQualStreams(e.target.value)}
                placeholder="e.g. Any Graduate, Engineering, B.Com"
              />
            </Field>

            <Field label="Age calculated as on" hint="The cut-off date from the notification. Empty = today.">
              <TextInput type="date" value={ageAsOn} onChange={(e) => setAgeAsOn(e.target.value)} />
            </Field>

            <Field label="Age relaxation (years)" hint="e.g. OBC 3, SC 5, ST 5, PWBD 10, EXS 3">
              <TextInput
                value={relaxText}
                onChange={(e) => setRelaxText(e.target.value)}
                placeholder="OBC 3, SC 5, ST 5"
              />
            </Field>

            <Field label="Final-year students can apply?">
              <SelectInput
                value={finalYear}
                onChange={(e) => setFinalYear(e.target.value)}
                options={[
                  { value: '', label: 'Not stated' },
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No — must have passed' },
                ]}
              />
            </Field>

            <Field label="Minimum percentage">
              <TextInput
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={minPct}
                onChange={(e) => setMinPct(e.target.value)}
                placeholder="e.g. 50"
              />
            </Field>

            <Field label="Gender">
              <SelectInput
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                options={[
                  { value: 'any', label: 'Any gender' },
                  { value: 'male', label: 'Male only' },
                  { value: 'female', label: 'Female only' },
                  { value: 'transgender', label: 'Transgender only' },
                ]}
              />
            </Field>

            <Field label="Domicile states" hint="Empty = no domicile rule">
              <TextInput value={domicile} onChange={(e) => setDomicile(e.target.value)} placeholder="AP, TS" />
            </Field>

            <Field label="Categories allowed" hint="Empty = all categories">
              <TextInput
                value={categoriesAllowed}
                onChange={(e) => setCategoriesAllowed(e.target.value)}
                placeholder="SC, ST, OBC"
              />
            </Field>

            <Field label="Max annual family income (₹)" hint="Empty = no income limit">
              <TextInput
                type="number"
                min="0"
                value={incomeMax}
                onChange={(e) => setIncomeMax(e.target.value)}
                placeholder="e.g. 250000"
              />
            </Field>

            <Field label="Official eligibility wording" className="sm:col-span-2">
              <TextArea
                value={officialText}
                onChange={(e) => setOfficialText(e.target.value)}
                placeholder="Paste the eligibility paragraph from the notification."
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="6. Application Fees">
          <Field label="Fee Breakdown Text">
            <TextArea
              value={feeText}
              onChange={(e) => setFeeText(e.target.value)}
              placeholder="e.g. General/OBC: ₹100, SC/ST/PwBD/Female: Exempted"
            />
          </Field>
        </FormSection>

        <FormSection title="7. Official URLs & Verification Links">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Notification PDF URL">
              <TextInput
                type="url"
                value={notifPdfUrl}
                onChange={(e) => setNotifPdfUrl(e.target.value)}
                placeholder="https://.../notice.pdf"
              />
            </Field>

            <Field label="Official Page URL">
              <TextInput
                type="url"
                value={officialPageUrl}
                onChange={(e) => setOfficialPageUrl(e.target.value)}
                placeholder="https://upsc.gov.in/notices/..."
              />
            </Field>

            <Field label="Online Application Portal URL">
              <TextInput
                type="url"
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                placeholder="https://upsconline.nic.in/..."
              />
            </Field>

            <Field label="Official Organisation Website">
              <TextInput
                type="url"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                placeholder="https://upsc.gov.in"
              />
            </Field>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
