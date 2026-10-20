'use client';

import React, { useState } from 'react';
import { ShieldCheck, Sparkles, User, FileText, Check, Landmark } from 'lucide-react';

export interface MeesevaIntakeData {
  certificateType:
    | 'caste_certificate'
    | 'income_certificate'
    | 'residence_domicile'
    | 'ews_certificate'
    | 'obc_ncl';
  beneficiaryName: string;
  rationCardNumber: string;
  mandal: string;
  villageWard: string;
  annualIncome: string;
  supportingDocType: string;
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
    annualIncome: initialData?.annualIncome || '85,000',
    supportingDocType: initialData?.supportingDocType || 'Ration Card / Food Security Card',
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
      supportingDocType: 'Food Security Card (Verified in Vault)',
      autofilledFromVault: true,
    };
    setFormData(autofilled);
    setVaultAutofilled(true);
    onChange(autofilled);
    validate(autofilled);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              State Government &amp; MeeSeva
            </span>
            <span className="text-xs text-slate-400">Revenue &amp; Citizen Welfare</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">Official Certificate Issuance Intake</h3>
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
            Ration card number and domicile address populated directly from your verified Document Vault.
          </span>
        </div>
      )}

      {/* Certificate Category */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Select Certificate Type <span className="text-rose-400">*</span>
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
              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                formData.certificateType === item.id
                  ? 'border-emerald-500/50 bg-emerald-950/20 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="meeseva_cert_type"
                value={item.id}
                checked={formData.certificateType === item.id}
                onChange={() => updateField('certificateType', item.id as MeesevaIntakeData['certificateType'])}
                className="mt-0.5 accent-emerald-400"
              />
              <div>
                <div className="font-semibold text-slate-200">{item.label}</div>
                <div className="text-[11px] text-slate-500">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Beneficiary Name & Ration Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Beneficiary Full Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              required
              placeholder="Candidate / Citizen full name"
              value={formData.beneficiaryName}
              onChange={(e) => updateField('beneficiaryName', e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Ration Card / Food Security Card No.
          </label>
          <input
            type="text"
            placeholder="e.g. WAP084920491024 (Optional)"
            value={formData.rationCardNumber}
            onChange={(e) => updateField('rationCardNumber', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Location (Mandal, Village/Ward, Income) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Mandal / Tehsil <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Serilingampally"
            value={formData.mandal}
            onChange={(e) => updateField('mandal', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Village / Municipal Ward <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Gachibowli Ward 104"
            value={formData.villageWard}
            onChange={(e) => updateField('villageWard', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Annual Family Income (₹)
          </label>
          <input
            type="text"
            placeholder="e.g. 95,000"
            value={formData.annualIncome}
            onChange={(e) => updateField('annualIncome', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Physical docs notice */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-emerald-400" /> Documents required for MeeSeva application:
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
          <li>Aadhaar cards of applicant and parent/guardian</li>
          <li>Ration card or Food Security Card copy</li>
          <li>Previous school Transfer Certificate (TC) or study certificates (Classes 1–10)</li>
          <li>Recent electricity bill or property tax receipt</li>
        </ul>
      </div>
    </div>
  );
}
