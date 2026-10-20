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
  applicantName: string;
  maskedUid: string;
  mobileLinked: string;
  targetUpdateField?: string;
  supportingDocType: string;
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
    applicantName: initialData?.applicantName || '',
    maskedUid: initialData?.maskedUid || '',
    mobileLinked: initialData?.mobileLinked || '',
    targetUpdateField: initialData?.targetUpdateField || 'Residential Address',
    supportingDocType: initialData?.supportingDocType || 'Electricity Bill (Latest)',
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
      data.maskedUid.trim().length >= 4 &&
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
    const clean = val.replace(/[^0-9X]/gi, '').toUpperCase();
    if (clean.length <= 4) return clean;
    if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
  }

  return (
    <div className="space-y-5 cut-corner-card rounded-[28px] border border-white bg-white p-6 shadow-clay-card text-[#082046]">
      {/* Header & Vault 1-Click Fill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#d5deea] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2 py-0.5 text-[11px] font-black uppercase text-[#0e7bf4]">
              UIDAI Facilitation
            </span>
            <span className="text-xs text-[#526987] font-semibold">Security Encrypted &amp; Masked</span>
          </div>
          <h3 className="text-sm font-black text-[#082046] mt-1">Aadhaar Center Assistance Intake</h3>
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
              <Sparkles className="h-3.5 w-3.5" /> 1-Click Vault Autofill
            </>
          )}
        </button>
      </div>

      {vaultAutofilled && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Candidate profile &amp; masked UID credentials mapped securely. Full UID numbers are never stored per UIDAI regulations.
          </span>
        </div>
      )}

      {/* Assistance Service Subtype */}
      <div>
        <label className="block text-xs font-bold text-[#526987] mb-1.5">
          Select Required Assistance Mode <span className="text-rose-500">*</span>
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
              className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors ${
                formData.serviceSubtype === item.id
                  ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#082046] shadow-sm font-bold'
                  : 'border-[#d5deea] bg-white text-[#526987] hover:border-[#0e7bf4]'
              }`}
            >
              <input
                type="radio"
                name="aadhaar_service_type"
                value={item.id}
                checked={formData.serviceSubtype === item.id}
                onChange={() => updateField('serviceSubtype', item.id as AadhaarIntakeData['serviceSubtype'])}
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

      {/* Masked Aadhaar & Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Applicant Name (As on Aadhaar) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-[#7896bc]" />
            <input
              type="text"
              required
              placeholder="Full name as printed on card"
              value={formData.applicantName}
              onChange={(e) => updateField('applicantName', e.target.value)}
              className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] pl-9 pr-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Masked Aadhaar Number (UID) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={14}
            placeholder="XXXX-XXXX-1234"
            value={formData.maskedUid}
            onChange={(e) => updateField('maskedUid', formatMaskedUid(e.target.value))}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] font-mono font-bold placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
          <p className="mt-1 text-[10px] text-[#526987]">
            For privacy, only enter masked format or last 4 digits (e.g. XXXX-XXXX-4567).
          </p>
        </div>
      </div>

      {/* Mobile Linked & Supporting Proof */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Active Mobile Number (For OTP Verification) <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={formData.mobileLinked}
            onChange={(e) => updateField('mobileLinked', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] font-mono font-bold placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Supporting Document Available
          </label>
          <select
            value={formData.supportingDocType}
            onChange={(e) => updateField('supportingDocType', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3 py-2 text-xs text-[#082046] focus:border-[#0e7bf4] outline-none font-medium shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
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

      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-[11px] text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <span>
          <strong>Important Note:</strong> ApplyFields operators facilitate official UIDAI portal filings and priority appointment tokens. In-person biometric captures (iris &amp; fingerprint scanning) must take place at the certified partner kiosk.
        </span>
      </div>
    </div>
  );
}
