'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, User, FileText, Check, AlertCircle } from 'lucide-react';

export interface MeesevaIntakeData {
  certificateType:
    | 'income_certificate'
    | 'caste_certificate'
    | 'residence_domicile'
    | 'ews_certificate'
    | 'obc_ncl';
  beneficiaryName: string;
  rationCardNumber?: string;
  mandal: string;
  villageWard: string;
  annualIncome?: string;
  casteCategory?: string;
  autofilledFromVault?: boolean;
}

interface MeesevaIntakeFormProps {
  initialData?: Partial<MeesevaIntakeData>;
  onChange: (data: MeesevaIntakeData) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function MeesevaIntakeForm({
  initialData,
  onChange,
  onValidationChange,
}: MeesevaIntakeFormProps) {
  const [formData, setFormData] = useState<MeesevaIntakeData>({
    certificateType: initialData?.certificateType || 'income_certificate',
    beneficiaryName: initialData?.beneficiaryName || '',
    rationCardNumber: initialData?.rationCardNumber || '',
    mandal: initialData?.mandal || '',
    villageWard: initialData?.villageWard || '',
    annualIncome: initialData?.annualIncome || '',
    casteCategory: initialData?.casteCategory || 'BC-B',
    autofilledFromVault: initialData?.autofilledFromVault || false,
  });

  const [vaultAutofilled, setVaultAutofilled] = useState(Boolean(initialData?.autofilledFromVault));

  function updateField<K extends keyof MeesevaIntakeData>(field: K, value: MeesevaIntakeData[K]) {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
    validate(updated);
  }

  function validate(data: MeesevaIntakeData) {
    const isValid = Boolean(
      data.beneficiaryName.trim() &&
      data.mandal.trim() &&
      data.villageWard.trim()
    );
    onValidationChange?.(isValid);
  }

  function handleVaultAutofill() {
    const autofilled: MeesevaIntakeData = {
      ...formData,
      beneficiaryName: 'Arvind V. Kumar',
      rationCardNumber: 'WAP084920491024',
      mandal: 'Serilingampally',
      villageWard: 'Gachibowli Ward 104',
      annualIncome: '95,000',
      casteCategory: 'BC-B (Telangana State List)',
      autofilledFromVault: true,
    };
    setFormData(autofilled);
    setVaultAutofilled(true);
    onChange(autofilled);
    validate(autofilled);
  }

  return (
    <div className="space-y-5 cut-corner-card rounded-[28px] border border-white bg-white p-6 shadow-clay-card text-[#082046]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#d5deea] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2 py-0.5 text-[11px] font-black uppercase text-[#0e7bf4]">
              State Government &amp; MeeSeva
            </span>
            <span className="text-xs text-[#526987] font-semibold">Revenue &amp; Citizen Welfare</span>
          </div>
          <h3 className="text-sm font-black text-[#082046] mt-1">Official Certificate Issuance Intake</h3>
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
            Ration card number and domicile address populated directly from your verified Document Vault.
          </span>
        </div>
      )}

      {/* Certificate Category */}
      <div>
        <label className="block text-xs font-bold text-[#526987] mb-1.5">
          Select Certificate Type <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {[
            { id: 'income_certificate', label: 'Income Certificate', desc: 'Fee waiver & scholarship eligibility' },
            { id: 'caste_certificate', label: 'Caste / Community Cert', desc: 'Integrated SC/ST/BC certificate' },
            { id: 'residence_domicile', label: 'Residence / Domicile', desc: 'Local status verification' },
            { id: 'ews_certificate', label: 'EWS Certificate', desc: 'Economically Weaker Section' },
            { id: 'obc_ncl', label: 'OBC Non-Creamy Layer', desc: 'Central Govt reservation format' },
          ].map((item) => (
            <label
              key={item.id}
              className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors ${
                formData.certificateType === item.id
                  ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#082046] shadow-sm font-bold'
                  : 'border-[#d5deea] bg-white text-[#526987] hover:border-[#0e7bf4]'
              }`}
            >
              <input
                type="radio"
                name="meeseva_cert_type"
                value={item.id}
                checked={formData.certificateType === item.id}
                onChange={() => updateField('certificateType', item.id as MeesevaIntakeData['certificateType'])}
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

      {/* Beneficiary Name & Ration Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Beneficiary Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-[#7896bc]" />
            <input
              type="text"
              required
              placeholder="Candidate / Citizen full name"
              value={formData.beneficiaryName}
              onChange={(e) => updateField('beneficiaryName', e.target.value)}
              className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] pl-9 pr-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Ration Card / Food Security Card No.
          </label>
          <input
            type="text"
            placeholder="e.g. WAP084920491024 (Optional)"
            value={formData.rationCardNumber}
            onChange={(e) => updateField('rationCardNumber', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] font-mono font-bold placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>
      </div>

      {/* Location (Mandal, Village/Ward, Income) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Mandal / Tehsil <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Serilingampally"
            value={formData.mandal}
            onChange={(e) => updateField('mandal', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Village / Municipal Ward <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Gachibowli Ward 104"
            value={formData.villageWard}
            onChange={(e) => updateField('villageWard', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-semibold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#526987] mb-1">
            Annual Family Income (₹)
          </label>
          <input
            type="text"
            placeholder="e.g. 95,000"
            value={formData.annualIncome}
            onChange={(e) => updateField('annualIncome', e.target.value)}
            className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] px-3.5 py-2 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] outline-none font-mono font-bold shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
          />
        </div>
      </div>

      {/* Physical docs notice */}
      <div className="rounded-2xl border border-[#d5deea] bg-[#edf2f8] p-4 text-[11px] text-[#526987] space-y-1 shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]">
        <div className="font-bold text-[#082046] flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[#0e7bf4]" /> Documents required for MeeSeva application:
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-[#526987] font-medium">
          <li>Aadhaar cards of applicant and parent/guardian</li>
          <li>Ration card or Food Security Card copy</li>
          <li>Previous school Transfer Certificate (TC) or study certificates (Classes 1–10)</li>
          <li>Recent electricity bill or property tax receipt</li>
        </ul>
      </div>
    </div>
  );
}
