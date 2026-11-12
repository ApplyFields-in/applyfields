'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Pencil,
  X,
  AlertCircle,
  Globe,
  Share2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import type { UserProfile } from '@applyfields/types';
import { apiPut } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';
import { INDIAN_STATES } from '@/app/(main)/profile/page';

const PREFERRED_LANGUAGES = [
  'English',
  'Hindi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Odia',
  'Malayalam',
  'Punjabi',
];

const JOB_TYPE_OPTIONS = [
  'Government Exam',
  'Government Job',
  'Central Government PSUs',
  'State Engineering Services',
  'Banking & Insurance',
  'Defense & Police',
  'Higher Technical Education',
  'Scholarships & Fellowships',
];

interface PreferencesSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (updated: UserProfile) => void;
}

export function PreferencesSection({
  profile,
  onProfileUpdate,
}: PreferencesSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Extract initial target job types from special_conditions
  const initialPrefs = (profile?.special_conditions || [])
    .filter((c) => c.startsWith('pref:'))
    .map((c) => c.replace('pref:', ''));

  const [stateCode, setStateCode] = useState(profile?.state_code || '');
  const [language, setLanguage] = useState(profile?.preferred_language || 'English');
  const [targetJobs, setTargetJobs] = useState<string[]>(
    initialPrefs.length > 0 ? initialPrefs : ['Government Exam', 'Government Job']
  );
  const [isPublic, setIsPublic] = useState<boolean>(profile?.is_public ?? false);
  const [handle, setHandle] = useState<string>(profile?.handle || '');

  const stateName = INDIAN_STATES.find((s) => s.code === (profile?.state_code || ''))?.name;
  const currentHandle = profile?.handle || handle || 'candidate';
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${currentHandle}`
    : `https://applyfields.com/u/${currentHandle}`;

  const handleStartEdit = () => {
    setStateCode(profile?.state_code || '');
    setLanguage(profile?.preferred_language || 'English');
    setTargetJobs(initialPrefs.length > 0 ? initialPrefs : ['Government Exam', 'Government Job']);
    setIsPublic(profile?.is_public ?? false);
    setHandle(profile?.handle || '');
    setError(null);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const toggleJobType = (t: string) => {
    if (targetJobs.includes(t)) {
      setTargetJobs(targetJobs.filter((item) => item !== t));
    } else {
      setTargetJobs([...targetJobs, t]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Keep non-pref special_conditions intact
    const existing = profile?.special_conditions || [];
    const nonPrefs = existing.filter((c) => !c.startsWith('pref:'));
    const updatedConditions = [...nonPrefs, ...targetJobs.map((t) => `pref:${t}`)];

    const cleanHandle = handle.trim()
      ? handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : undefined;

    const payload = {
      state_code: stateCode || undefined,
      preferred_language: language,
      special_conditions: updatedConditions,
      is_public: isPublic,
      handle: cleanHandle,
    };

    const res = await apiPut<UserProfile>('/me/profile', payload);
    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to update preferences.');
    } else {
      onProfileUpdate(res.data);
      setEditing(false);
      showAppToast('Preferences & privacy settings saved to server!');
    }
  };

  const handleCopyPublicLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      showAppToast('Public candidate portfolio link copied!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <section id="preferences-section" className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="size-5 text-[#0E7BF4]" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Preferences & Public Portfolio
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure preferred state notifications, communication language, and public candidate shareability.
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
              <span>Edit Preferences</span>
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
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Preferred State Feed
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {stateName || 'All India (National Focus)'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Preferred Language
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {profile?.preferred_language || 'English'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Public Profile Visibility
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    profile?.is_public
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {profile?.is_public ? 'Public' : 'Private (Off by default)'}
                </span>
                {profile?.is_public && profile.handle && (
                  <span className="text-xs font-mono text-slate-500">@{profile.handle}</span>
                )}
              </div>
            </div>
          </div>

          {/* Target Sectors */}
          <div className="p-4 rounded-2xl bg-[#ffffff] border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Target Sectors & Opportunity Types
            </span>
            <div className="flex flex-wrap gap-2">
              {targetJobs.length > 0 ? (
                targetJobs.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-xl bg-[#EDF2F8] text-[#082046] text-xs font-bold border border-slate-200"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No specific sectors selected</span>
              )}
            </div>
          </div>

          {/* Public Profile Share Bar if Public */}
          {profile?.is_public && profile.handle && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Share2 className="size-4 text-emerald-700" />
                  Your Public Portfolio URL
                </span>
                <span className="text-xs font-mono text-emerald-800 break-all">{publicUrl}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                >
                  {copiedLink ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
                <Link
                  href={`/u/${profile.handle}`}
                  target="_blank"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>View Public Page</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* EDIT FORM MODE */
        <form onSubmit={handleSave} className="mt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred State (Server Synced)
              </label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
              >
                <option value="">All India (National Focus)</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
              >
                {PREFERRED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Target Opportunity Sectors
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {JOB_TYPE_OPTIONS.map((opt) => {
                const selected = targetJobs.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleJobType(opt)}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                      selected
                        ? 'bg-[#0E7BF4] text-white border-[#0E7BF4]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Public Profile Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Make My Profile Public
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Off by default. When enabled, your verified degrees and exam ranks can be viewed at /u/[handle].
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="size-5 rounded text-[#0E7BF4] focus:ring-0 cursor-pointer"
              />
            </div>

            {isPublic && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Profile Handle
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-xl bg-slate-200/70 border border-r-0 border-slate-300 text-xs text-slate-600 font-mono">
                    applyfields.com/u/
                  </span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="karthik-reddy"
                    className="flex-1 rounded-r-xl border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0E7BF4]"
                  />
                </div>
              </div>
            )}
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
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
