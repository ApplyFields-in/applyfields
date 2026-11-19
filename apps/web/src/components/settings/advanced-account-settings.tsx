'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Download,
  Laptop,
  LogOut,
  ShieldCheck,
  Smartphone,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { showAppToast } from '@/components/toast-notification-provider';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import type { UserSessionItem, UserDataExport } from '@applyfields/types';

export function AdvancedAccountSettings() {
  // -------------------------------------------------------------
  // A. Active Sessions & Cyber Cafe Auto-Logout State
  // -------------------------------------------------------------
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOutSessions, setLoggingOutSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await apiGet<UserSessionItem[]>('/me/sessions');
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutOtherSessions = async () => {
    setLoggingOutSessions(true);
    try {
      await apiPost('/me/sessions/logout-others', {});
      await loadSessions();
      showAppToast({
        message: 'Successfully logged out of all other terminals and public devices.',
        type: 'success',
      });
    } catch {
      showAppToast({
        message: 'Could not log out other sessions. Please try again.',
        type: 'info',
      });
    } finally {
      setLoggingOutSessions(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await apiDelete(`/me/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showAppToast({
        message: 'Session revoked successfully.',
        type: 'success',
      });
    } catch {
      showAppToast({
        message: 'Failed to revoke session.',
        type: 'info',
      });
    } finally {
      setRevokingSessionId(null);
    }
  };

  // -------------------------------------------------------------
  // C. Data Portability & Account Deletion Modal
  // -------------------------------------------------------------
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDataArchive = async () => {
    setIsExporting(true);
    try {
      const data = await apiGet<UserDataExport>('/me/export');
      if (!data) throw new Error('No data received from export endpoint');

      const blob = new Blob([JSON.stringify(data, null, 2)], {
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
    } catch {
      showAppToast({
        message: 'Failed to export data archive from server.',
        type: 'info',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmAccountDeletion = async () => {
    if (deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiPost<{ success: boolean; message?: string }>('/me/delete', {
        password: deletePassword.trim() || undefined,
      });

      if (res.error) {
        setDeleteError(res.error);
        setIsDeleting(false);
        return;
      }

      setShowDeleteModal(false);
      localStorage.clear();
      document.cookie = 'accessToken=; path=/; max-age=0;';
      document.cookie = 'refresh_token=; path=/; max-age=0;';
      showAppToast({
        message: 'Account and personal records have been completely erased under DPDP guidelines.',
        type: 'success',
      });
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Deletion failed. Check your password.');
      setIsDeleting(false);
    }
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
              className="inline-flex items-center min-h-[44px] gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>{loggingOutSessions ? 'Terminating...' : 'Log Out Other Sessions'}</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {loadingSessions ? (
            <div className="py-6 text-center text-xs text-[#536780]">
              Loading active sessions from server...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#536780]">
              No other active sessions detected.
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#f8fbff] p-3.5 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-white border border-slate-200 p-1.5 text-[#082046]">
                    {sess.isCurrent ? (
                      <Laptop className="size-4 text-emerald-600" />
                    ) : (
                      <Smartphone className="size-4 text-[#536780]" />
                    )}
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

                {!sess.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSingleSession(sess.id)}
                    disabled={revokingSessionId === sess.id}
                    className="inline-flex items-center min-h-[44px] gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none transition-colors self-end sm:self-auto cursor-pointer"
                  >
                    <X className="size-3.5" />
                    <span>{revokingSessionId === sess.id ? 'Revoking...' : 'Revoke'}</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notifications: in-app + push only. Email and SMS carry sign-up and password-reset codes, never alerts. */}
      <div className="rounded-xl border border-blue-100 bg-[#F0F7FF] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#082046]">
          <Bell className="size-4 text-[#0e7bf4] shrink-0" />
          <span>
            <strong>Notifications</strong> arrive in ApplyFields and as push alerts on your browser and phone. Email and
            SMS are only used for sign-up and password-reset codes.
          </span>
        </div>
        <a
          href="/notifications#preferences"
          className="inline-flex items-center gap-1 font-bold text-[#0e7bf4] hover:underline shrink-0"
        >
          Manage notifications →
        </a>
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
            disabled={isExporting}
            className="inline-flex items-center min-h-[44px] gap-2 rounded-xl border border-[#082046] bg-[#082046] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0c2e63] focus-visible:ring-2 focus-visible:ring-[#082046] focus-visible:outline-none transition-colors shrink-0 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="size-4" />
            <span>{isExporting ? 'Exporting Archive...' : 'Download Archive'}</span>
          </button>
        </div>

        <div id="delete-account" className="scroll-mt-24 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50/50 p-4 text-xs">
          <div>
            <p className="font-bold text-red-900">Account Deletion &amp; Data Erasure</p>
            <p className="text-[11px] text-red-700 mt-0.5">
              Permanently wipe your profile, saved examinations, and telemetry from all active database clusters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="inline-flex items-center min-h-[44px] gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Trash2 className="size-4" />
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
            className="w-full max-w-md rounded-2xl border border-red-300 bg-white shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-700">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle className="size-5.5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-red-900">Permanently Delete Account?</h4>
                <p className="text-xs text-red-700">This action is irreversible under DPDP guidelines.</p>
              </div>
            </div>

            <p className="text-xs text-[#435775] leading-relaxed">
              All stored education qualifications, saved opportunities, personalized notifications, and verification logs will be immediately and irreversibly purged from our server systems.
            </p>

            {deleteError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                {deleteError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="delete-account-password" className="text-[11px] font-bold uppercase text-[#536780]">
                Enter Your Password (or One-Time Code):
              </label>
              <input
                id="delete-account-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Account password"
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#082046] focus:border-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="delete-account-confirm" className="text-[11px] font-bold uppercase text-[#536780]">
                To confirm, type <strong className="text-red-700">DELETE</strong> below:
              </label>
              <input
                id="delete-account-confirm"
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold tracking-wider text-[#082046] focus:border-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus:outline-none transition-all"
              />
              {deleteConfirmationText.length > 0 && deleteConfirmationText !== 'DELETE' && (
                <p className="text-[11px] text-amber-700 font-medium">Please type DELETE in uppercase letters to enable the button.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#536780] hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                onClick={handleConfirmAccountDeletion}
                className="min-h-[44px] rounded-xl border border-red-600 bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Erasing Records...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

