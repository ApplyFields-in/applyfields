'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Pencil,
  X,
  AlertCircle,
  Check,
  Loader2,
  Languages,
} from 'lucide-react';
import type { UserProfile } from '@applyfields/types';
import { apiPut } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';

interface SkillsLanguagesSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (updated: UserProfile) => void;
}

export function SkillsLanguagesSection({
  profile,
  onProfileUpdate,
}: SkillsLanguagesSectionProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract skills & languages from special_conditions
  const rawConditions = profile?.special_conditions || [];
  const initialSkills = rawConditions
    .filter((c) => c.startsWith('skill:'))
    .map((c) => c.replace('skill:', ''));
  const initialLanguages = rawConditions
    .filter((c) => c.startsWith('lang:'))
    .map((c) => c.replace('lang:', ''));

  const [skills, setSkills] = useState<string[]>(
    initialSkills.length > 0 ? initialSkills : ['MS Excel', 'Data Entry', 'Accounting / Tally']
  );
  const [languages, setLanguages] = useState<string[]>(
    initialLanguages.length > 0 ? initialLanguages : ['English', 'Hindi']
  );

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const handleStartEdit = () => {
    setSkills(initialSkills.length > 0 ? initialSkills : ['MS Excel', 'Data Entry', 'Accounting / Tally']);
    setLanguages(initialLanguages.length > 0 ? initialLanguages : ['English', 'Hindi']);
    setError(null);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setNewSkill('');
  };

  const handleRemoveSkill = (item: string) => {
    setSkills(skills.filter((s) => s !== item));
  };

  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLanguage.trim();
    if (!trimmed || languages.includes(trimmed)) return;
    setLanguages([...languages, trimmed]);
    setNewLanguage('');
  };

  const handleRemoveLanguage = (item: string) => {
    setLanguages(languages.filter((l) => l !== item));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Keep other conditions intact (pincode, pref, etc.)
    const existing = profile?.special_conditions || [];
    const nonSkills = existing.filter(
      (c) => !c.startsWith('skill:') && !c.startsWith('lang:')
    );

    const updated = [
      ...nonSkills,
      ...skills.map((s) => `skill:${s}`),
      ...languages.map((l) => `lang:${l}`),
    ];

    const res = await apiPut<UserProfile>('/me/profile', {
      special_conditions: updated,
    });
    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to update skills & languages.');
    } else {
      onProfileUpdate(res.data);
      setEditing(false);
      showAppToast('Skills & languages updated successfully!');
    }
  };

  return (
    <section id="skills-languages-section" className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#0E7BF4]" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Skills, Certifications & Languages
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Helps qualify for typing exams, stenographer posts, technical officer positions, and language proficiency tests.
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
              <span>Edit Skills</span>
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
          {/* Technical Skills */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Technical & Vocational Competencies
            </span>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 rounded-xl bg-[#F8FBFF] text-[#082046] text-xs font-semibold border border-[#c4d2e3]/70"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills listed yet</span>
              )}
            </div>
          </div>

          {/* Languages */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
              <Languages className="size-3.5 text-[#0E7BF4]" />
              Languages Known
            </span>
            <div className="flex flex-wrap gap-2">
              {languages.length > 0 ? (
                languages.map((l) => (
                  <span
                    key={l}
                    className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    {l}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No languages listed yet</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* EDIT FORM MODE */
        <form onSubmit={handleSave} className="mt-5 space-y-6">
          {/* Technical Skills Editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Technical & Vocational Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#F8FBFF] text-[#082046] text-xs font-semibold border border-blue-200"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Stenography / Python / Typing 40 WPM"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shrink-0"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Languages Editor */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Languages Known
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {languages.map((l) => (
                <span
                  key={l}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                >
                  <span>{l}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(l)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="e.g. Kannada / Telugu / Hindi"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
              />
              <button
                type="button"
                onClick={handleAddLanguage}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shrink-0"
              >
                Add Language
              </button>
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
              <span>{saving ? 'Saving...' : 'Save Skills & Languages'}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
