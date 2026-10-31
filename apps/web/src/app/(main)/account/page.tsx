'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Settings,
  Crown,
  ShieldCheck,
  KeyRound,
  Bell,
  FolderLock,
  UserRound,
  CheckCircle2,
  ExternalLink,
  Store,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { MeResponse } from '@applyfields/types';
import { DigiLockerCard } from '@/components/digilocker-card';
import { PARTNER_PORTAL_URL } from '@/lib/urls';
import { AccessibilityReadingSettings } from '@/components/settings/accessibility-reading-settings';
import { AdvancedAccountSettings } from '@/components/settings/advanced-account-settings';
import { useLanguage } from '@/lib/i18n/language-context';

function AccountContent() {
  const { t } = useLanguage();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    function syncAccount() {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIsLoggedIn(true);
          setUserEmail(parsed.email || '');
          setUserName(parsed.full_name || '');
        } catch {
          // fallback
        }
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setUserName('');
      }

      if (localStorage.getItem('accessToken') || stored) {
        apiGet<MeResponse>('/me').then((res) => {
          if (res?.user) {
            setIsLoggedIn(true);
            setUserEmail(res.user.email || '');
            if (res.profile?.full_name) {
              setUserName(res.profile.full_name);
            }
          }
        });
      }
    }

    syncAccount();
    window.addEventListener('auth-changed', syncAccount);
    window.addEventListener('storage', syncAccount);

    return () => {
      window.removeEventListener('auth-changed', syncAccount);
      window.removeEventListener('storage', syncAccount);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <Settings className="size-4" />
          <span>{t('account_badge')}</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          {t('account_title')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          {t('account_desc')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column: Account details & Plus Card */}
        <div className="space-y-6">
          {/* Current Membership */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#536780]">{t('account_current_plan')}</span>
                <h2 className="text-xl font-bold text-[#082046]">{t('account_plan_free')}</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                {t('account_plan_active')}
              </span>
            </div>

            <div className="text-sm text-[#435775] space-y-1">
              <p>
                <strong>{t('account_label_account')}:</strong> {userEmail || t('account_guest_citizen')}
              </p>
              {userName && (
                <p>
                  <strong>{t('account_label_name')}:</strong> {userName}
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] shadow-sm transition-colors"
              >
                <Settings className="size-3.5" /> {t('account_btn_settings')}
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F0F4F8] px-4 py-2 text-xs font-semibold text-[#082046] hover:bg-[#dce7f3]"
              >
                <UserRound className="size-3.5" /> {t('account_btn_edit_profile')}
              </Link>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F0F4F8] px-4 py-2 text-xs font-semibold text-[#082046] hover:bg-[#dce7f3]"
              >
                <Bell className="size-3.5" /> {t('account_btn_notif_rules')}
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F0F4F8] px-4 py-2 text-xs font-semibold text-[#082046] hover:bg-[#dce7f3]"
              >
                <FolderLock className="size-3.5" /> {t('account_btn_doc_vault')}
              </Link>
            </div>
          </div>

          {/* Government DigiLocker Integration Card */}
          <DigiLockerCard />

          {/* Display, Language & Reading Accessibility Settings */}
          <AccessibilityReadingSettings />

          {/* Modern App Settings: Active Sessions, WhatsApp Matrix, Alert Cadence & DPDP Erasure */}
          <AdvancedAccountSettings />

          {/* Plus Tier Card */}
          <div className="rounded-3xl border border-[#b8d7ff] bg-gradient-to-br from-[#EAF3FF] to-white p-7 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="size-6 text-[#0e7bf4]" />
                  <h3 className="text-xl font-extrabold text-[#082046]">ApplyFields Plus</h3>
                </div>
                <p className="mt-1 text-xs text-[#536780]">
                  Optional power-pack for active aspirants · ₹50 / month
                </p>
              </div>
              <span className="rounded-full bg-[#082046] px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                Coming in v4
              </span>
            </div>

            <p className="text-sm text-[#334a69]">
              Everything on ApplyFields remains 100% free for everyone. Plus offers premium automations designed for candidates applying to multiple competitive examinations every month.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="flex items-start gap-2 text-xs text-[#082046]">
                <CheckCircle2 className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
                <span><strong>Instant WhatsApp &amp; SMS alerts</strong> for admit cards and last dates</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-[#082046]">
                <CheckCircle2 className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
                <span><strong>DigiLocker direct integration</strong> for 1-click certificate retrieval</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-[#082046]">
                <CheckCircle2 className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
                <span><strong>Assistance Center Discounts</strong> on form-filling at verified CSCs</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-[#082046]">
                <CheckCircle2 className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
                <span><strong>Unlimited Custom Reminders</strong> for up to 50 active recruitments</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled
                className="rounded-xl bg-[#0e7bf4]/50 cursor-not-allowed px-5 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                Join Plus Waitlist (₹50/mo)
              </button>
            </div>
          </div>

          {/* Security & Passkeys */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
              <KeyRound className="size-4 text-[#0e7bf4]" /> Security &amp; Credentials
            </h3>
            <p className="text-xs text-[#536780]">
              Passwordless login via WebAuthn / Passkeys (fingerprint, Face ID, or Windows Hello) allows secure sign-in without remembering passwords or waiting for SMS OTPs.
            </p>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-[#435775]">
              <span>Passkey Enrollment</span>
              <span className="font-semibold text-emerald-700">Supported on this browser</span>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Links & Partner Network */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#082046]">{t('account_for_centers')}</h3>
            <p className="text-xs text-[#536780]">
              {t('account_for_centers_desc')}
            </p>
            <a
              href={PARTNER_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061835] w-full justify-center"
            >
              <Store className="size-4 text-emerald-400" /> {t('account_btn_partner_portal')}
            </a>
          </div>

          <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-5 text-xs text-[#435775] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#082046]">
              <ShieldCheck className="size-4 text-[#0e7bf4]" /> {t('account_privacy_commitment')}
            </div>
            <p>
              {t('account_privacy_desc')}
            </p>
            <Link href="/help" className="inline-flex items-center gap-1 font-semibold text-[#0e7bf4] hover:underline">
              {t('account_help_support')} <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Account...</div>}>
      <AccountContent />
    </Suspense>
  );
}
