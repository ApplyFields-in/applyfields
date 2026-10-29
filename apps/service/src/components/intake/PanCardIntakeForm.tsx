'use client';

import React, { useState } from 'react';
import { ShieldCheck, User, FileText, Check, UploadCloud } from 'lucide-react';

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
    <div className="space-y-5 cut-corner-card rounded-[28px] border border-white bg-white p-6 shadow-clay-card text-[#082046]">
      {/* Header & Vault 1-Click Fill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#d5deea] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2 py-0.5 text-[11px] font-black uppercase text-[#0e7bf4]">
              PAN 49A / CR Intake
            </span>
            <span className="text-xs text-[#526987] font-semibold">Official Form 49A Standards</span>
          </div>
          <h3 className="text-sm font-black text-[#082046] mt-1">PAN Card Application Requirements</h3>
        </div>

        <button
          type="button"
          onClick={handleVaultAutofill}
          className={`cut-corner-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            vaultAutofilled
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              : 'bg-[#0e7bf4] text-white shadow-clay-btn-azure hover:bg-[#0c6fdc]'
          }`}
        >
          {vaultAutofilled ? (
            <>
              <Check className="h-3.5 w-3.5" /> Autofilled from Vault
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> 1-Click Vault Autofill
            </>
          )}
        </button>
      </div>

      {vaultAutofilled && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Verified credentials &amp; Identity records mapped directly from your Document Vault.
          </span>
        </div>
      )}

      {/* Application Subtype */}
      <div>
        <label className="block text-xs font-bold text-[#526987] mb-1.5">
          Select Service Type <span className="text-rose-500">*</span>
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
              className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors ${
                formData.applicationType === item.id
                  ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#082046] shadow-sm font-bold'
                  : 'border-[#d5deea] bg-white text-[#526987] hover:border-[#0e7bf4]'
              }`}
            >
              <input
                type="radio"
                name="pan_app_type"
                value={item.id}
                checked={formData.applicationType === item.id}
                onChange={() => updateField('applicationType', item.id as PanIntakeData['applicationType'])}
                className="mt-0.5 accent-[#0e7bf4]"
              />
              <div>
                <div className="font-bold text-[#082046]">{item.label}</div>
                <div className="text-[11px] text-[#526987]">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Name & Father Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Applicant Full Name (As on Aadhaar) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-[#7896bc]" />
            <input
              type="text"
              required
              placeholder="e.g. Arvind V. Kumar"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] pl-9 pr-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Father&apos;s Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Father's full name for PAN print"
            value={formData.fatherName}
            onChange={(e) => updateField('fatherName', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>
      </div>

      {/* DOB & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3 py-2 text-xs text-[#082046] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Gender <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.gender}
            onChange={(e) => updateField('gender', e.target.value as PanIntakeData['gender'])}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3 py-2 text-xs text-[#082046] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Transgender / Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Aadhaar-Linked Mobile <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. 9876543210"
            value={formData.mobileNumber}
            onChange={(e) => updateField('mobileNumber', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-mono font-bold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>
      </div>

      {/* Proof of Identity & Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#d5deea] pt-4">
        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Proof of Identity (POI)
          </label>
          <select
            value={formData.identityProofType}
            onChange={(e) => updateField('identityProofType', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3 py-2 text-xs text-[#082046] focus:border-[#0e7bf4] outline-none font-medium shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          >
            <option value="Aadhaar Card">Aadhaar Card (Recommended)</option>
            <option value="Voter ID">Voter Identity Card</option>
            <option value="Passport">Passport</option>
            <option value="Driving License">Driving License</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Proof of Address (POA)
          </label>
          <select
            value={formData.addressProofType}
            onChange={(e) => updateField('addressProofType', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3 py-2 text-xs text-[#082046] focus:border-[#0e7bf4] outline-none font-medium shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          >
            <option value="Aadhaar Card">Aadhaar Card (Recommended)</option>
            <option value="Electricity Bill">Electricity Bill (Past 3 months)</option>
            <option value="Bank Passbook">Bank Account Passbook / Statement</option>
            <option value="Domicile Certificate">State Domicile Certificate</option>
          </select>
        </div>
      </div>
    </div>
  );
}
