'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Key,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export default function InstitutionSettingsPage() {
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [instantSms, setInstantSms] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Admissions Desk &amp; Notification Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure real-time student lead alert preferences, counselling desk contact details, and institutional credentials.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300">
          Admissions notification settings saved!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Real-time Notification Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Bell className="h-4 w-4 text-blue-400" />
            <h2>Instant Student Inquiry Alerts</h2>
          </div>
          <p className="text-xs text-slate-400">
            Choose where to receive immediate alerts whenever a student submits an admission inquiry on ApplyFields.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-xs text-white block">WhatsApp Instant Lead Notification</span>
                  <span className="text-[11px] text-slate-400">Receive student name, contact and course directly on WhatsApp</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-400" />
                <div>
                  <span className="font-bold text-xs text-white block">Official Institutional Email Notification</span>
                  <span className="text-[11px] text-slate-400">Digest and instant notifications to admissions@cbit.ac.in</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <span className="font-bold text-xs text-white block">SMS Priority Alert (High Intent Leads)</span>
                  <span className="text-[11px] text-slate-400">Instant SMS alert for JEE/EAMCET top rankers inquiring about seats</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={instantSms}
                onChange={(e) => setInstantSms(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Security & Access */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <h2>Institutional Data Protection</h2>
          </div>
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              In accordance with the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>, student inquiry contact numbers shared through ApplyFields are encrypted and strictly intended for verified institutional admission counselling.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
          >
            <Save className="h-4 w-4" /> Save Alert Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
