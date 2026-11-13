'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Pencil,
  X,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Info,
} from 'lucide-react';
import type { UserProfile } from '@applyfields/types';
import { apiPut } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';
import { INDIAN_STATES } from '@/app/(main)/profile/page';

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
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

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
      setError(res.error || 'Failed to update address & domicile.');
    } else {
      onProfileUpdate(res.data);
      setEditing(false);
      showAppToast('Address & domicile details saved successfully!');
    }
  };

  return (
    <section id="address-domicile-section" className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-[#0E7BF4]" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Address & State Domicile
            </h3>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Pencil className="size-3.5" />
              <span>Edit Address</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <X className="size-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current State</label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                required
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Bengaluru Urban / Pune / Patna"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="e.g. 560001"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">
                State of Domicile *
              </label>
              <select
                value={domicileStateCode}
                onChange={(e) => setDomicileStateCode(e.target.value)}
                className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                required
              >
                <option value="">Select Domicile State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0E7BF4] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-xs"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              <span>{saving ? 'Saving...' : 'Save Address & Domicile'}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
