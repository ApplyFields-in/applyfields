'use client';

import { useState, useTransition } from 'react';
import type {
  GovServiceDetail,
  GovServiceInput,
  GovServiceProcessStep,
  OpportunityStatus,
  OrganizationLevel,
  RequiredDocument,
} from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Landmark,
  Plus,
  RotateCw,
  Save,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createServiceAction,
  deleteServiceAction,
  publishServiceAction,
  saveServiceAction,
  setServiceStatusAction,
} from '@/lib/actions';
import { StatusBadge } from './opportunities-ui';
import { Field, FormSection, SelectInput, TextArea, TextInput } from './review-ui';

interface ServiceFormProps {
  initialData?: GovServiceDetail | null;
  mode: 'create' | 'edit';
}

export function ServiceForm({ initialData, mode }: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Identity & Certificates');
  const [authorityName, setAuthorityName] = useState(initialData?.authority_name ?? '');
  const [authorityLevel, setAuthorityLevel] = useState<OrganizationLevel>(
    initialData?.authority_level ?? 'central',
  );
  const [stateCodesText, setStateCodesText] = useState(
    initialData?.state_codes?.join(', ') ?? 'ALL',
  );
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [whoNeedsIt, setWhoNeedsIt] = useState(initialData?.who_needs_it ?? '');
  const [eligibilityText, setEligibilityText] = useState(initialData?.eligibility_text ?? '');
  const [feeText, setFeeText] = useState(initialData?.fee_text ?? '');
  const [processingTimeText, setProcessingTimeText] = useState(
    initialData?.processing_time_text ?? '',
  );
  const [officialUrl, setOfficialUrl] = useState(initialData?.official_url ?? '');
  const [applyUrl, setApplyUrl] = useState(initialData?.apply_url ?? '');
  const [assistanceAvailable, setAssistanceAvailable] = useState(
    initialData?.assistance_available ?? false,
  );

  // Required documents array
  const [documents, setDocuments] = useState<RequiredDocument[]>(
    initialData?.required_documents ?? [
      { name: 'Proof of Identity (Aadhaar / Voter ID / Passport)', mandatory: true, spec: null },
      { name: 'Proof of Address', mandatory: true, spec: null },
    ],
  );

  // Process steps array
  const [steps, setSteps] = useState<GovServiceProcessStep[]>(
    initialData?.process_steps ?? [
      { step: 1, title: 'Visit official portal', description: 'Open the official department website.', portal: 'official' },
      { step: 2, title: 'Fill application form', description: 'Enter applicant details and upload required documents.', portal: 'official' },
      { step: 3, title: 'Pay prescribed fee', description: 'Pay the government fee online.', portal: 'official' },
    ],
  );

  const getPayload = (): GovServiceInput => ({
    name: name.trim(),
    category: category.trim() || null,
    organization_id: null,
    authority_name: authorityName.trim() || null,
    authority_level: authorityLevel,
    state_codes: stateCodesText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    description: description.trim() || null,
    who_needs_it: whoNeedsIt.trim() || null,
    eligibility_text: eligibilityText.trim() || null,
    fee_text: feeText.trim() || null,
    fees: [],
    processing_time_text: processingTimeText.trim() || null,
    official_url: officialUrl.trim() || null,
    apply_url: applyUrl.trim() || null,
    assistance_available: assistanceAvailable,
    required_documents: documents.filter((d) => Boolean(d.name.trim())),
    process_steps: steps.map((s, idx) => ({ ...s, step: idx + 1 })),
  });

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const payload = getPayload();
      if (mode === 'create') {
        const res = await createServiceAction(payload);
        if (res.ok) {
          setSuccess('Created draft service successfully');
          router.push(`/services/${res.data?.id}`);
          router.refresh();
        } else {
          setError(res.error ?? 'Failed to create service');
        }
      } else {
        const res = await saveServiceAction(initialData!.id, payload);
        if (res.ok) {
          setSuccess('Service saved successfully');
          router.refresh();
        } else {
          setError(res.error ?? 'Failed to save service');
        }
      }
    });
  };

  const handlePublish = () => {
    if (!initialData) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      // Save latest first
      const saveRes = await saveServiceAction(initialData.id, getPayload());
      if (!saveRes.ok) {
        setError(saveRes.error ?? 'Failed to save before publish');
        return;
      }
      const res = await publishServiceAction(initialData.id);
      if (res.ok) {
        setSuccess('Service published live to web!');
        router.refresh();
      } else {
        setError(res.error ?? 'Publish failed');
      }
    });
  };

  const handleStatusChange = (status: OpportunityStatus) => {
    if (!initialData) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await setServiceStatusAction(initialData.id, status);
      if (res.ok) {
        setSuccess(`Status changed to ${status}`);
        router.refresh();
      } else {
        setError(res.error ?? 'Failed to change status');
      }
    });
  };

  const handleDelete = () => {
    if (!initialData || !confirm('Are you sure you want to delete this draft service?')) return;
    startTransition(async () => {
      const res = await deleteServiceAction(initialData.id);
      if (res.ok) {
        router.push('/services');
        router.refresh();
      } else {
        setError(res.error ?? 'Delete failed');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="rounded-full border border-teal/15 p-2 text-teal hover:bg-tea/50"
            title="Back to services"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-teal">
                {mode === 'create' ? 'New Government Service' : name || 'Edit Service'}
              </h1>
              {initialData && <StatusBadge status={initialData.status} />}
            </div>
            {initialData && (
              <span className="font-mono text-xs text-teal/60">/services/{initialData.slug}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {initialData?.status === 'draft' && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className={buttonClass({ variant: 'primary', size: 'md' })}
            >
              <Send className="size-4" /> Publish Live
            </button>
          )}

          {initialData?.status === 'published' && (
            <button
              type="button"
              onClick={() => handleStatusChange('draft')}
              disabled={isPending}
              className={buttonClass({ variant: 'secondary', size: 'md' })}
            >
              <EyeOff className="size-4" /> Unpublish to Draft
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={buttonClass({ variant: 'secondary', size: 'md' })}
          >
            <Save className="size-4" /> {isPending ? 'Saving...' : 'Save Service'}
          </button>

          {initialData && initialData.status === 'draft' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="clay-press inline-flex h-10 items-center justify-center rounded-full border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-teal/20 bg-celadon/50 p-4 text-xs font-bold text-teal">
          <CheckCircle2 className="size-4 text-sea shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Form Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Service Core Data */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <FormSection title="1. Service Overview">
              <div className="space-y-4">
                <Field label="Service Name *" hint="Official name as known by citizens">
                  <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. PAN Card (New / Correction)"
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Category" hint="Classification for browsing">
                    <SelectInput
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      options={[
                        { value: 'Identity & Certificates', label: 'Identity & Certificates' },
                        { value: 'Revenue & Land', label: 'Revenue & Land' },
                        { value: 'Transport & Vehicles', label: 'Transport & Vehicles' },
                        { value: 'Social Welfare & Pensions', label: 'Social Welfare & Pensions' },
                        { value: 'Business & Licenses', label: 'Business & Licenses' },
                        { value: 'Utility & Municipal', label: 'Utility & Municipal' },
                        { value: 'General', label: 'General' },
                      ]}
                    />
                  </Field>

                  <Field label="States (comma separated)" hint="e.g. ALL or AP, TS">
                    <TextInput
                      value={stateCodesText}
                      onChange={(e) => setStateCodesText(e.target.value)}
                      placeholder="ALL"
                    />
                  </Field>
                </div>

                <Field label="Description *" hint="Clear summary of what this service is">
                  <TextArea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What the citizen gets by applying for this service..."
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Who Needs It?" hint="Target audience / use-case">
                    <TextArea
                      rows={2}
                      value={whoNeedsIt}
                      onChange={(e) => setWhoNeedsIt(e.target.value)}
                      placeholder="e.g. Any individual needing a tax identification number..."
                    />
                  </Field>

                  <Field label="Eligibility Criteria" hint="Who qualifies">
                    <TextArea
                      rows={2}
                      value={eligibilityText}
                      onChange={(e) => setEligibilityText(e.target.value)}
                      placeholder="e.g. All Indian citizens and entities..."
                    />
                  </Field>
                </div>
              </div>
            </FormSection>
          </Card>

          {/* Required Documents */}
          <Card className="p-5">
            <FormSection
              title="2. Required Documents Checklist"
              note={
                <button
                  type="button"
                  onClick={() =>
                    setDocuments([...documents, { name: '', mandatory: true, spec: null }])
                  }
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  <Plus className="size-3.5" /> Add document
                </button>
              }
            >
              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 p-2.5">
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => {
                        const next = [...documents];
                        next[idx].name = e.target.value;
                        setDocuments(next);
                      }}
                      placeholder="Document name (e.g. Proof of Identity)"
                      className="h-8 flex-1 rounded-lg border border-line bg-canvas px-2.5 text-xs focus:border-teal focus:outline-none"
                    />
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-teal">
                      <input
                        type="checkbox"
                        checked={doc.mandatory}
                        onChange={(e) => {
                          const next = [...documents];
                          next[idx].mandatory = e.target.checked;
                          setDocuments(next);
                        }}
                        className="rounded accent-teal"
                      />
                      Mandatory
                    </label>
                    <button
                      type="button"
                      onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                      className="text-teal/60 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </FormSection>
          </Card>

          {/* Process Steps */}
          <Card className="p-5">
            <FormSection
              title="3. Step-by-Step Process"
              note={
                <button
                  type="button"
                  onClick={() =>
                    setSteps([
                      ...steps,
                      { step: steps.length + 1, title: '', description: '', portal: 'official' },
                    ])
                  }
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  <Plus className="size-3.5" /> Add step
                </button>
              }
            >
              <div className="space-y-3">
                {steps.map((st, idx) => (
                  <div key={idx} className="rounded-xl border border-line bg-canvas/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-teal text-cream text-xs font-bold">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                        className="text-teal/60 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const next = [...steps];
                        next[idx].title = e.target.value;
                        setSteps(next);
                      }}
                      placeholder="Step Title"
                      className="h-8 w-full rounded-lg border border-line bg-canvas px-2.5 text-xs font-bold focus:border-teal focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      value={st.description}
                      onChange={(e) => {
                        const next = [...steps];
                        next[idx].description = e.target.value;
                        setSteps(next);
                      }}
                      placeholder="Step detailed instructions"
                      className="w-full rounded-lg border border-line bg-canvas p-2 text-xs focus:border-teal focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </FormSection>
          </Card>
        </div>

        {/* Right 1 Col: Authority, Fees & Links */}
        <div className="space-y-6">
          <Card className="p-5">
            <FormSection title="Authority & Jurisdiction">
              <div className="space-y-3">
                <Field label="Authority Name" hint="e.g. Income Tax Department / MeeSeva">
                  <TextInput
                    value={authorityName}
                    onChange={(e) => setAuthorityName(e.target.value)}
                    placeholder="Authority name"
                  />
                </Field>

                <Field label="Jurisdiction Level">
                  <SelectInput
                    value={authorityLevel}
                    onChange={(e) => setAuthorityLevel(e.target.value as OrganizationLevel)}
                    options={[
                      { value: 'central', label: 'Central (All India)' },
                      { value: 'state', label: 'State Government' },
                      { value: 'district', label: 'District Administration' },
                      { value: 'local', label: 'Local Body / Municipality' },
                    ]}
                  />
                </Field>
              </div>
            </FormSection>
          </Card>

          <Card className="p-5">
            <FormSection title="Official Fee & Timeline">
              <div className="space-y-3">
                <Field label="Fee Details" hint="e.g. ₹107 (dispatch to Indian address)">
                  <TextInput
                    value={feeText}
                    onChange={(e) => setFeeText(e.target.value)}
                    placeholder="Fee in ₹"
                  />
                </Field>

                <Field label="Processing Time" hint="e.g. 15 working days">
                  <TextInput
                    value={processingTimeText}
                    onChange={(e) => setProcessingTimeText(e.target.value)}
                    placeholder="e.g. 10 to 15 days"
                  />
                </Field>
              </div>
            </FormSection>
          </Card>

          <Card className="p-5">
            <FormSection title="Official Links">
              <div className="space-y-3">
                <Field label="Official Portal URL *" hint="Authoritative government portal">
                  <TextInput
                    value={officialUrl}
                    onChange={(e) => setOfficialUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>

                <Field label="Direct Application URL" hint="Direct form link if available">
                  <TextInput
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </Field>

                <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-teal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assistanceAvailable}
                    onChange={(e) => setAssistanceAvailable(e.target.checked)}
                    className="rounded accent-teal size-4"
                  />
                  <span>Assistance available via MeeSeva / CSC partners</span>
                </label>
              </div>
            </FormSection>
          </Card>
        </div>
      </div>
    </div>
  );
}
