'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Pencil,
  X,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Check,
  Info,
  } from 'lucide-react';
import type { UserProfile } from '@applyfields/types';
import { apiPut } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';
import { INDIAN_STATES } from '@/app/(main)/profile/page';
import { Spinner } from '@applyfields/ui';

interface AddressDomicileSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (updated: UserProfile) => void;
}

export function AddressDomicileSection({
  profile,
  onProfileUpdate,
}: AddressDomicileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const initialPincode =
    profile?.special_conditions?.find((c) => c.startsWith('pincode:'))?.replace('pincode:', '') || '';

  const [stateCode, setStateCode] = useState(profile?.state_code || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [pinCode, setPinCode] = useState(initialPincode);
  const [domicileStateCode, setDomicileStateCode] = useState(profile?.domicile_state_code || '');

  const stateName = INDIAN_STATES.find((s) => s.code === (profile?.state_code || ''))?.name;
  const domicileName = INDIAN_STATES.find((s) => s.code === (profile?.domicile_state_code || ''))?.name;

  const handleStartEdit = () => {
    setStateCode(profile?.state_code || '');
    setDistrict(profile?.district || '');
    setPinCode(initialPincode);
    setDomicileStateCode(profile?.domicile_state_code || '');
    setError(null);
    setFieldErrors({});
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
    setFieldErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!stateCode) {
      errors.stateCode = 'Please select your current residence state.';
    }
    if (!district.trim()) {
      errors.district = 'District name is required for local employment matching.';
    }
    if (pinCode.trim() && !/^\d{6}$/.test(pinCode.trim())) {
      errors.pinCode = 'PIN code must be exactly 6 numerical digits.';
    }
    if (!domicileStateCode) {
      errors.domicileStateCode = 'State of domicile is mandatory for reservation quota eligibility.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});

    // Keep non-pincode special_conditions intact
    const existing = profile?.special_conditions || [];
    const filtered = existing.filter((c) => !c.startsWith('pincode:'));
    if (pinCode.trim()) {
      filtered.push(`pincode:${pinCode.trim()}`);
    }

    const payload = {
      state_code: stateCode || undefined,
      district: district.trim() || undefined,
      domicile_state_code: domicileStateCode || undefined,
      special_conditions: filtered,
    };

    const res = await apiPut<UserProfile>('/me/profile', payload);
    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error || "We couldn't save your address & domicile details. Please check your connection and try again.");
    } else {
      onProfileUpdate(res.data);
      setEditing(false);
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 4500);
      showAppToast({ message: 'Address & domicile details saved successfully!', type: 'success' });
    }
  };

  return (
    <section id="address-domicile-section" className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="size-5 text-[#0E7BF4]" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Address & State Domicile
            </h3>
            {savedJustNow && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="size-3.5" />
                Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Determines state-level public service commission reservation (KPSC, APPSC, MPSC, etc.) and native quota.
          </p>
        </div>

        <div>
          {!editing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center min-h-[44px] gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0E7BF4] focus-visible:outline-none transition-colors shadow-2xs"
            >
              <Pencil className="size-3.5" />
              <span>Edit Address</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center min-h-[44px] gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none transition-colors"
            >
              <X className="size-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="size-4.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* VIEW MODE */}
      {!editing ? (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Current Residence State
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {stateName || <span className="text-slate-400 italic">Not set</span>}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                District
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {profile?.district || <span className="text-slate-400 italic">Not set</span>}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                PIN Code
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 block">
                {initialPincode || <span className="text-slate-400 italic">Not set</span>}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                State of Domicile (Native)
              </span>
              <span className="text-sm font-bold text-amber-950 block">
                {domicileName || <span className="text-amber-600/70 italic">Not set (Action required)</span>}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="size-4 text-[#0E7BF4] shrink-0 mt-0.5" />
            <p>
              Your <strong>State of Domicile</strong> unlocks 85% state quota seats in NEET/CET counseling and exclusive local recruitment notifications under state government departments.
            </p>
          </div>
        </div>
      ) : (
        /* EDIT FORM MODE */
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="address-state" className="block text-xs font-semibold text-slate-700 mb-1">
                Current State <span className="text-rose-500">*</span>
              </label>
              <select
                id="address-state"
                value={stateCode}
                onChange={(e) => {
                  setStateCode(e.target.value);
                  if (fieldErrors.stateCode) setFieldErrors((prev) => ({ ...prev, stateCode: '' }));
                }}
                className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.stateCode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                aria-invalid={!!fieldErrors.stateCode}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
              {fieldErrors.stateCode && (
                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="size-3 shrink-0" />
                  {fieldErrors.stateCode}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address-district" className="block text-xs font-semibold text-slate-700 mb-1">
                District <span className="text-rose-500">*</span>
              </label>
              <input
                id="address-district"
                type="text"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  if (fieldErrors.district) setFieldErrors((prev) => ({ ...prev, district: '' }));
                }}
                placeholder="e.g. Bengaluru Urban / Pune / Patna"
                className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.district ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                aria-invalid={!!fieldErrors.district}
              />
              {fieldErrors.district && (
                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="size-3 shrink-0" />
                  {fieldErrors.district}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address-pincode" className="block text-xs font-semibold text-slate-700 mb-1">
                PIN Code
              </label>
              <input
                id="address-pincode"
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value);
                  if (fieldErrors.pinCode) setFieldErrors((prev) => ({ ...prev, pinCode: '' }));
                }}
                placeholder="e.g. 560001"
                className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.pinCode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
                aria-invalid={!!fieldErrors.pinCode}
              />
              {fieldErrors.pinCode ? (
                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="size-3 shrink-0" />
                  {fieldErrors.pinCode}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">6 digits for regional center mapping</p>
              )}
            </div>

            <div>
              <label htmlFor="address-domicile" className="block text-xs font-semibold text-amber-800 mb-1">
                State of Domicile <span className="text-rose-500">*</span>
              </label>
              <select
                id="address-domicile"
                value={domicileStateCode}
                onChange={(e) => {
                  setDomicileStateCode(e.target.value);
                  if (fieldErrors.domicileStateCode) setFieldErrors((prev) => ({ ...prev, domicileStateCode: '' }));
                }}
                className={`w-full min-h-[44px] rounded-xl border bg-amber-50/40 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.domicileStateCode ? 'border-rose-400' : 'border-amber-300'
                }`}
                aria-invalid={!!fieldErrors.domicileStateCode}
              >
                <option value="">Select Domicile State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
              {fieldErrors.domicileStateCode && (
                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="size-3 shrink-0" />
                  {fieldErrors.domicileStateCode}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center min-h-[44px] gap-2 px-6 py-2.5 rounded-xl bg-[#0E7BF4] text-white text-xs font-semibold hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-[#0E7BF4] focus-visible:outline-none disabled:opacity-50 transition-colors shadow-xs"
            >
              {saving && <Spinner size={16} />}
              <span>{saving ? 'Saving...' : 'Save Address & Domicile'}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
