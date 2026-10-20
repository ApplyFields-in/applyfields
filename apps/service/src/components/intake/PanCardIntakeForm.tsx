'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, User, FileText, Check, UploadCloud } from 'lucide-react';

export interface PanIntakeData {
  applicationType: 'new_pan_citizen' | 'pan_correction_update' | 'instant_epan' | 'reprint_lost_pan';
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  mobileNumber: string;
  email: string;
  identityProofType: string;
  addressProofType: string;
  autofilledFromVault?: boolean;
}

interface PanCardIntakeFormProps {
  initialData?: Partial<PanIntakeData>;
  onChange: (data: PanIntakeData) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function PanCardIntakeForm({
  initialData,
  onChange,
  onValidationChange,
}: PanCardIntakeFormProps) {
  const [formData, setFormData] = useState<PanIntakeData>({
    applicationType: initialData?.applicationType || 'new_pan_citizen',
    fullName: initialData?.fullName || '',
    fatherName: initialData?.fatherName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    gender: initialData?.gender || 'male',
    mobileNumber: initialData?.mobileNumber || '',
    email: initialData?.email || '',
    identityProofType: initialData?.identityProofType || 'Aadhaar Card',
    addressProofType: initialData?.addressProofType || 'Aadhaar Card',
    autofilledFromVault: initialData?.autofilledFromVault || false,
  });

  const [vaultAutofilled, setVaultAutofilled] = useState(Boolean(initialData?.autofilledFromVault));

  function updateField<K extends keyof PanIntakeData>(field: K, value: PanIntakeData[K]) {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
    validate(updated);
  }

  function validate(data: PanIntakeData) {
    const isValid = Boolean(
      data.fullName.trim() &&
      data.fatherName.trim() &&
      data.dateOfBirth &&
      data.mobileNumber.trim().length >= 10
    );
    onValidationChange?.(isValid);
  }

  function handleVaultAutofill() {
    const autofilled: PanIntakeData = {
      ...formData,
      fullName: 'Arvind V. Kumar',
      fatherName: 'Venkata Raman Kumar',
      dateOfBirth: '1998-05-14',
      gender: 'male',
      mobileNumber: '+91 98765 43210',
      email: 'arvind.kumar@example.com',
      identityProofType: 'Aadhaar Card (Verified in Vault)',
      addressProofType: 'Aadhaar Card (Verified in Vault)',
      autofilledFromVault: true,
    };
    setFormData(autofilled);
    setVaultAutofilled(true);
    onChange(autofilled);
    validate(autofilled);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header & Vault 1-Click Fill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              PAN 49A / CR Intake
            </span>
            <span className="text-xs text-slate-400">Official Form 49A Standards</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">PAN Card Application Requirements</h3>
        </div>

        <button
          type="button"
          onClick={handleVaultAutofill}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            vaultAutofilled
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 shadow-sm'
          }`}
        >
          {vaultAutofilled ? (
            <>
              <Check className="h-3.5 w-3.5" /> Autofilled from Vault
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> 1-Click Vault Autofill
            </>
          )}
        </button>
      </div>

      {vaultAutofilled && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50 px-3.5 py-2 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>
            Verified credentials &amp; Identity records mapped directly from your Document Vault.
          </span>
        </div>
      )}

      {/* Application Subtype */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Select Service Type <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { id: 'new_pan_citizen', label: 'New PAN Card (Form 49A Citizen)', desc: 'For first-time applicants' },
            { id: 'pan_correction_update', label: 'Correction / Changes in PAN', desc: 'Name, DOB, or father name changes' },
            { id: 'instant_epan', label: 'Instant e-PAN via Aadhaar', desc: 'Paperless 10-minute digital token' },
            { id: 'reprint_lost_pan', label: 'Reprint Lost / Damaged Card', desc: 'Same details, fresh PVC card' },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                formData.applicationType === item.id
                  ? 'border-cyan-500/50 bg-cyan-950/20 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="pan_app_type"
                value={item.id}
                checked={formData.applicationType === item.id}
                onChange={() => updateField('applicationType', item.id as PanIntakeData['applicationType'])}
                className="mt-0.5 accent-cyan-400"
              />
              <div>
                <div className="font-semibold text-slate-200">{item.label}</div>
                <div className="text-[11px] text-slate-500">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Name & Father Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Applicant Full Name (As on Aadhaar) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              placeholder="e.g. Arvind V. Kumar"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Father&apos;s Full Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Father's full name for PAN print"
            value={formData.fatherName}
            onChange={(e) => updateField('fatherName', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* DOB & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Date of Birth <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Gender <span className="text-rose-400">*</span>
          </label>
          <select
            value={formData.gender}
            onChange={(e) => updateField('gender', e.target.value as PanIntakeData['gender'])}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Transgender / Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Mobile Number <span className="text-rose-400">*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={formData.mobileNumber}
            onChange={(e) => updateField('mobileNumber', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Proof Documents Mapping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Proof of Identity (POI)
          </label>
          <select
            value={formData.identityProofType}
            onChange={(e) => updateField('identityProofType', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
            <option value="Voter ID Card">Voter ID / EPIC Card</option>
            <option value="Indian Passport">Passport of India</option>
            <option value="Driving License">Driving License</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Proof of Address (POA)
          </label>
          <select
            value={formData.addressProofType}
            onChange={(e) => updateField('addressProofType', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
            <option value="Electricity Bill">Electricity Bill (Past 3 Months)</option>
            <option value="Bank Passbook">Bank Account Passbook with Photo</option>
            <option value="Water Bill">Municipal Water Bill</option>
          </select>
        </div>
      </div>

      {/* Physical Documents to bring reminder */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-cyan-400" /> Documents checklist to bring for your appointment:
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
          <li>2 recent passport-size colour photographs (white background)</li>
          <li>Original physical Aadhaar Card for operator biometric or biometric signature verification</li>
          <li>Existing PAN card copy (only if applying for update/correction)</li>
        </ul>
      </div>
    </div>
  );
}
