'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Download,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Check,
  AlertTriangle,
  FileText,
  Sliders,
} from 'lucide-react';
import { showAppToast } from '@/components/toast-notification-provider';

interface SessionItem {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export function AdvancedAccountSettings() {
  // -------------------------------------------------------------
  // A. Active Sessions & Cyber Cafe Auto-Logout State
  // -------------------------------------------------------------
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'sess-current',
      device: 'Chrome on Windows 11',
      location: 'Hyderabad, Telangana, India',
      ip: '157.48.21.90',
      lastActive: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'sess-cyber',
      device: 'Edge on Windows 10 (Public Terminal / Center)',
      location: 'Vijayawada, Andhra Pradesh, India',
      ip: '103.24.112.5',
      lastActive: '2 days ago',
      isCurrent: false,
    },
  ]);
  const [loggingOutSessions, setLoggingOutSessions] = useState(false);

  const handleLogoutOtherSessions = () => {
    setLoggingOutSessions(true);
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      setLoggingOutSessions(false);
      showAppToast({
        message: 'Successfully logged out of all other terminals and public devices.',
        type: 'success',
      });
    }, 600);
  };

  // -------------------------------------------------------------
  // B. WhatsApp & Notification Matrix State
  // -------------------------------------------------------------
  const [matrix, setMatrix] = useState({
    urgentDeadlines: { whatsapp: true, inApp: true, email: true },
    admitCard: { whatsapp: true, inApp: true, email: true },
    resultsAndKeys: { whatsapp: true, inApp: true, email: false },
    categorySchemes: { whatsapp: false, inApp: true, email: false },
  });
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');

  const toggleMatrix = (
    row: keyof typeof matrix,
    channel: 'whatsapp' | 'inApp' | 'email'
  ) => {
    setMatrix((prev) => ({
      ...prev,
      [row]: {
        ...prev[row],
        [channel]: !prev[row][channel],
      },
    }));
    showAppToast({ message: 'Notification preferences updated.' });
  };

  // -------------------------------------------------------------
  // D. Job Alert Cadence & Target Threshold
  // -------------------------------------------------------------
  const [alertCadence, setAlertCadence] = useState<'instant' | 'weekly'>('weekly');
  const [minSalaryThreshold, setMinSalaryThreshold] = useState('40000');
  const [strictDegreeMatch, setStrictDegreeMatch] = useState(true);

  // -------------------------------------------------------------
  // C. Data Portability & Account Deletion Modal
  // -------------------------------------------------------------
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportDataArchive = () => {
    const archiveData = {
      platform: 'ApplyFields National Opportunity Portal',
      exported_at: new Date().toISOString(),
      compliance: 'Indian Digital Personal Data Protection (DPDP) Act 2023',
      profile_summary: {
        note: 'All entered profile qualifications, domicile, preferences, and saved opportunities',
      },
      export_version: '1.0',
    };

    const blob = new Blob([JSON.stringify(archiveData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applyfields-data-archive-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAppToast({
      message: 'Personal data archive downloaded successfully.',
      type: 'success',
    });
  };

  const handleConfirmAccountDeletion = () => {
    if (deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setShowDeleteModal(false);
      localStorage.clear();
      showAppToast({
        message: 'Account and personal records scheduled for complete erasure under DPDP guidelines.',
        type: 'remove',
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* Setting A: Active Sessions & Cyber Cafe Auto-Logout */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
              <Laptop className="size-4 text-[#0e7bf4]" /> Active Terminals &amp; Session Management
            </h3>
            <p className="text-xs text-[#536780]">
              Protect your account when applying from cyber cafes, university lab computers, or MeeSeva kiosks.
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleLogoutOtherSessions}
              disabled={loggingOutSessions}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>{loggingOutSessions ? 'Terminating...' : 'Log Out Other Sessions'}</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#f8fbff] p-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-white border border-slate-200 p-1.5 text-[#082046]">
                  {sess.isCurrent ? <Laptop className="size-4 text-emerald-600" /> : <Smartphone className="size-4 text-[#536780]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#082046]">{sess.device}</p>
                    {sess.isCurrent && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        Current Device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#536780] mt-0.5">
                    {sess.location} · IP: {sess.ip} · {sess.lastActive}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Setting B: WhatsApp & Multi-Channel Notification Matrix */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
            <Bell className="size-4 text-[#0e7bf4]" /> Notification Delivery Matrix
          </h3>
          <p className="text-xs text-[#536780]">
            Choose exactly which channels receive critical examination timelines and recruitment updates.
          </p>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#76562d] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 pr-4">Timeline Event</th>
                <th className="py-2.5 px-3 text-center">WhatsApp Alerts</th>
                <th className="py-2.5 px-3 text-center">In-App Notice</th>
                <th className="py-2.5 px-3 text-center">Email Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 pr-4 font-semibold text-[#082046]">
                  Final Closing Deadlines (48h Notice)
                  <p className="text-[11px] font-normal text-[#536780]">Urgent notifications before form closing</p>
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.urgentDeadlines.whatsapp}
                    onChange={() => toggleMatrix('urgentDeadlines', 'whatsapp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.urgentDeadlines.inApp}
                    onChange={() => toggleMatrix('urgentDeadlines', 'inApp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.urgentDeadlines.email}
                    onChange={() => toggleMatrix('urgentDeadlines', 'email')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
              </tr>

              <tr>
                <td className="py-3 pr-4 font-semibold text-[#082046]">
                  Admit Card &amp; Exam City Intimation
                  <p className="text-[11px] font-normal text-[#536780]">Hall ticket release links &amp; roll status</p>
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.admitCard.whatsapp}
                    onChange={() => toggleMatrix('admitCard', 'whatsapp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.admitCard.inApp}
                    onChange={() => toggleMatrix('admitCard', 'inApp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.admitCard.email}
                    onChange={() => toggleMatrix('admitCard', 'email')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
              </tr>

              <tr>
                <td className="py-3 pr-4 font-semibold text-[#082046]">
                  Official Answer Keys &amp; Results
                  <p className="text-[11px] font-normal text-[#536780]">Cutoff lists, merit status &amp; scorecards</p>
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.resultsAndKeys.whatsapp}
                    onChange={() => toggleMatrix('resultsAndKeys', 'whatsapp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.resultsAndKeys.inApp}
                    onChange={() => toggleMatrix('resultsAndKeys', 'inApp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.resultsAndKeys.email}
                    onChange={() => toggleMatrix('resultsAndKeys', 'email')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
              </tr>

              <tr>
                <td className="py-3 pr-4 font-semibold text-[#082046]">
                  Category-Specific Scholarships &amp; Schemes
                  <p className="text-[11px] font-normal text-[#536780]">State &amp; Central post-matric schemes</p>
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.categorySchemes.whatsapp}
                    onChange={() => toggleMatrix('categorySchemes', 'whatsapp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.categorySchemes.inApp}
                    onChange={() => toggleMatrix('categorySchemes', 'inApp')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={matrix.categorySchemes.email}
                    onChange={() => toggleMatrix('categorySchemes', 'email')}
                    className="size-4 accent-[#082046] cursor-pointer"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quiet Hours Settings */}
        <div className="rounded-xl border border-slate-200 bg-[#f8fbff] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#76562d]" />
              <p className="text-xs font-bold text-[#082046]">Quiet Hours (Do Not Disturb)</p>
            </div>
            <p className="text-[11px] text-[#536780]">
              Suppress non-urgent WhatsApp and SMS messages during sleep and night study hours.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-[#082046] font-semibold">
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
              />
              <span>to</span>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
              />
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => {
                  setQuietHoursEnabled(e.target.checked);
                  showAppToast({
                    message: e.target.checked ? 'Quiet hours activated.' : 'Quiet hours disabled.',
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#082046]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Setting D: Job Alert Frequency & Match Criteria */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
            <Sliders className="size-4 text-[#0e7bf4]" /> Alert Cadence &amp; Eligibility Thresholds
          </h3>
          <p className="text-xs text-[#536780]">
            Filter incoming recruitment alerts to match your exact qualification and target compensation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          {/* Dispatch Cadence */}
          <div className="space-y-2 rounded-xl border border-slate-200 p-3.5 bg-[#f8fbff]">
            <p className="font-bold text-[#082046]">Alert Dispatch Frequency</p>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#243b5b]">
                <input
                  type="radio"
                  name="cadence"
                  checked={alertCadence === 'instant'}
                  onChange={() => {
                    setAlertCadence('instant');
                    showAppToast({ message: 'Alerts set to Instant Delivery' });
                  }}
                  className="accent-[#082046]"
                />
                <span>Instant Alerts (As soon as gazette notification is live)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#243b5b]">
                <input
                  type="radio"
                  name="cadence"
                  checked={alertCadence === 'weekly'}
                  onChange={() => {
                    setAlertCadence('weekly');
                    showAppToast({ message: 'Alerts set to Weekly Sunday Digest' });
                  }}
                  className="accent-[#082046]"
                />
                <span>Weekly Sunday Morning Digest (Curated 10 recruitments)</span>
              </label>
            </div>
          </div>

          {/* Salary Filter */}
          <div className="space-y-2 rounded-xl border border-slate-200 p-3.5 bg-[#f8fbff]">
            <p className="font-bold text-[#082046]">Target Compensation Threshold</p>
            <select
              value={minSalaryThreshold}
              onChange={(e) => {
                setMinSalaryThreshold(e.target.value);
                showAppToast({ message: 'Compensation threshold updated' });
              }}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-[#082046] focus:outline-none"
            >
              <option value="0">All Compensation Tiers</option>
              <option value="25000">Minimum ₹25,000 / month (Pay Level 4+)</option>
              <option value="40000">Minimum ₹40,000 / month (Pay Level 6+)</option>
              <option value="60000">Minimum ₹60,000 / month (Group A / Officer Entry)</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-[#435775]">
              <input
                type="checkbox"
                checked={strictDegreeMatch}
                onChange={(e) => setStrictDegreeMatch(e.target.checked)}
                className="accent-[#082046]"
              />
              <span>Only alert when my exact degree specialization is eligible</span>
            </label>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Setting C: Data Portability & Account Erasure (DPDP Act) */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#0e7bf4]" /> Data Governance &amp; DPDP Compliance
          </h3>
          <p className="text-xs text-[#536780]">
            ApplyFields complies with the Digital Personal Data Protection (DPDP) Act 2023. You have full ownership of your records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-[#f8fbff] p-4 text-xs">
          <div>
            <p className="font-bold text-[#082046]">Download Personal Data Archive</p>
            <p className="text-[11px] text-[#536780] mt-0.5">
              Export all saved qualifications, tracked deadlines, and registered document references as a portable JSON archive.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportDataArchive}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#082046] bg-[#082046] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c2e63] transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Download Archive</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs">
          <div>
            <p className="font-bold text-red-900">Account Deletion &amp; Data Erasure</p>
            <p className="text-[11px] text-red-700 mt-0.5">
              Permanently wipe your profile, saved examinations, and telemetry from all active database clusters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#082046]/45 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-md rounded-xl border border-red-300 bg-white shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-700">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-red-900">Permanently Delete Account?</h4>
                <p className="text-xs text-red-700">This action is irreversible under DPDP guidelines.</p>
              </div>
            </div>

            <p className="text-xs text-[#435775] leading-relaxed">
              All stored education qualifications, saved opportunities, personalized notifications, and verification logs will be immediately and irreversibly purged from our systems.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[#536780]">
                To confirm, type <strong className="text-red-700">DELETE</strong> below:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-[#082046] focus:border-red-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#536780] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                onClick={handleConfirmAccountDeletion}
                className="rounded-md border border-red-600 bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

