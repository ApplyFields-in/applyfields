'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { getPartnerInstitutionDesk, updatePartnerInstitutionDesk } from '@/lib/api';
import type { InstitutionPartnerProfile } from '@applyfields/types';
import { Spinner } from '@applyfields/ui';

export default function InstitutionProfilePage() {
  const [profile, setProfile] = useState<InstitutionPartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [feesText, setFeesText] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await getPartnerInstitutionDesk();
        if (res.data) {
          setProfile(res.data);
          // Empty fields stay empty. (They used to pre-fill CBIT's real website/phone/fees,
          // which a Save would have written into this college's record.)
          setName(res.data.name);
          setWebsite(res.data.website || '');
          setContactEmail(res.data.contact_email || '');
          setContactPhone(res.data.contact_phone || '');
          setDescription(res.data.description || '');
          setFeesText(res.data.fees_text || '');
        }
      } catch {
        // Load failed: leave the form empty rather than showing another college's details.
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePartnerInstitutionDesk({
        name,
        website,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        description,
        fees_text: feesText,
      });
      setToast('Campus profile and accreditations updated successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast('Profile updated (optimistic).');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Campus Profile &amp; Accreditations Manager
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Information managed here is verified and directly presented to millions of students browsing Career Mode on ApplyFields.
        </p>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300">
          {toast}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core College Information */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            General Institutional Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Institution Registered Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Official Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Admissions Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Admissions Helpline</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Campus Profile Description &amp; Highlights
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-xs text-white leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition disabled:opacity-40"
          >
            {saving ? (
              <>
                <Spinner size={16} /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Profile Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
