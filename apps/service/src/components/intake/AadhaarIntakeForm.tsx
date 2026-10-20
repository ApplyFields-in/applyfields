'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, User, FileText, Check, AlertCircle } from 'lucide-react';

export interface AadhaarIntakeData {
  serviceSubtype:
    | 'address_update_assistance'
    | 'pvc_card_order'
    | 'name_correction_support'
    | 'biometric_slot_guidance'
    | 'mobile_linking_token';
  maskedUid: string;
  applicantName: string;
  mobileLinked: string;
  targetUpdateField: string;
  supportingDocType: string;
  hasPhysicalBiometricsReq: boolean;
  autofilledFromVault?: boolean;
}

interface AadhaarIntakeFormProps {
  initialData?: Partial<AadhaarIntakeData>;
  onChange: (data: AadhaarIntakeData) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function AadhaarIntakeForm({
  initialData,
  onChange,
  onValidationChange,
}: AadhaarIntakeFormProps) {
  const [formData, setFormData] = useState<AadhaarIntakeData>({
    serviceSubtype: initialData?.serviceSubtype || 'address_update_assistance',
    maskedUid: initialData?.maskedUid || '',
    applicantName: initialData?.applicantName || '',
    mobileLinked: initialData?.mobileLinked || '',
    targetUpdateField: initialData?.targetUpdateField || 'Residential Address',
    supportingDocType: initialData?.supportingDocType || 'Electricity Bill (Latest)',
    hasPhysicalBiometricsReq: initialData?.hasPhysicalBiometricsReq ?? false,
    autofilledFromVault: initialData?.autofilledFromVault || false,
  });

  const [vaultAutofilled, setVaultAutofilled] = useState(Boolean(initialData?.autofilledFromVault));

  function updateField<K extends keyof AadhaarIntakeData>(field: K, value: AadhaarIntakeData[K]) {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
    validate(updated);
  }

  function validate(data: AadhaarIntakeData) {
    const isValid = Boolean(
      data.applicantName.trim() &&
      data.maskedUid.replace(/\D/g, '').length >= 4 &&
      data.mobileLinked.trim().length >= 10
    );
    onValidationChange?.(isValid);
  }

  function handleVaultAutofill() {
    const autofilled: AadhaarIntakeData = {
      ...formData,
      applicantName: 'Arvind V. Kumar',
      maskedUid: 'XXXX-XXXX-8492',
      mobileLinked: '+91 98765 43210',
      targetUpdateField: 'Residential Address',
      supportingDocType: 'Electricity Bill (Verified in Vault)',
      autofilledFromVault: true,
    };
    setFormData(autofilled);
    setVaultAutofilled(true);
    onChange(autofilled);
    validate(autofilled);
  }

  function formatMaskedUid(val: string) {
    // Only accept digits or keep XXXX-XXXX format
    const clean = val.replace(/[^0-9X]/gi, '').toUpperCase();
    if (clean.length <= 4) return clean;
    if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header & Vault 1-Click Fill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
              UIDAI Facilitation
            </span>
            <span className="text-xs text-slate-400">Security Encrypted &amp; Masked</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">Aadhaar Center Assistance Intake</h3>
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
            Candidate profile &amp; masked UID credentials mapped securely. Full UID numbers are never stored per UIDAI regulations.
          </span>
        </div>
      )}

      {/* Assistance Service Subtype */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Select Required Assistance Mode <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { id: 'address_update_assistance', label: 'Online Address Update Assistance', desc: 'POA upload & digital portal filing' },
            { id: 'pvc_card_order', label: 'Official PVC Smart Card Order', desc: 'Secure weatherproof card delivered to home' },
            { id: 'name_correction_support', label: 'Demographic Name/DOB Correction', desc: 'Document verification & prep' },
            { id: 'biometric_slot_guidance', label: 'Biometric / Iris / Fingerprint Slot', desc: 'Direct token for mandatory in-center scan' },
            { id: 'mobile_linking_token', label: 'Mobile Number Seeding Token', desc: 'OTP verification preparation' },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                formData.serviceSubtype === item.id
                  ? 'border-cyan-500/50 bg-cyan-950/20 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="aadhaar_service_type"
                value={item.id}
                checked={formData.serviceSubtype === item.id}
                onChange={() => updateField('serviceSubtype', item.id as AadhaarIntakeData['serviceSubtype'])}
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

      {/* Masked Aadhaar & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Applicant Name (As on Aadhaar) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              placeholder="Full name as printed on card"
              value={formData.applicantName}
              onChange={(e) => updateField('applicantName', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Masked Aadhaar Number (UID) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={14}
            placeholder="XXXX-XXXX-1234"
            value={formData.maskedUid}
            onChange={(e) => updateField('maskedUid', formatMaskedUid(e.target.value))}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            For privacy, only enter masked format or last 4 digits (e.g. XXXX-XXXX-4567).
          </p>
        </div>
      </div>

      {/* Mobile Linked & Supporting Proof */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Active Mobile Number (For OTP Verification) <span className="text-rose-400">*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={formData.mobileLinked}
            onChange={(e) => updateField('mobileLinked', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Supporting Document Available
          </label>
          <select
            value={formData.supportingDocType}
            onChange={(e) => updateField('supportingDocType', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="Electricity Bill (Latest)">Electricity / Utility Bill (Past 3 Months)</option>
            <option value="Bank Passbook / Statement">Bank Passbook with Stamped Photo</option>
            <option value="Voter ID Card">Voter ID / Election Identity Card</option>
            <option value="Ration / Food Security Card">Ration Card / Food Security Card</option>
            <option value="Registered Rent Agreement">Registered Rent Agreement</option>
            <option value="Gazette Notification">Gazette Notification (Name Change)</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-[11px] text-amber-300 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <span>
          <strong>Important Note:</strong> ApplyFields operators facilitate official UIDAI portal filings and priority appointment tokens. In-person biometric captures (iris &amp; fingerprint scanning) must take place at the certified partner kiosk.
        </span>
      </div>
    </div>
  );
}
