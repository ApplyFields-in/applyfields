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

function AccountContent() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
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
    }

    apiGet<MeResponse>('/me').then((res) => {
      if (res?.user) {
        setIsLoggedIn(true);
        setUserEmail(res.user.email || '');
        if (res.profile?.full_name) {
          setUserName(res.profile.full_name);
        }
      }
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <Settings className="size-4" />
          <span>Account &amp; Subscription</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          Account &amp; Plans
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          Manage your membership tier, notification preferences, security credentials, and linked citizen services.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column: Account details & Plus Card */}
        <div className="space-y-6">
          {/* Current Membership */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#536780]">Current Plan</span>
                <h2 className="text-xl font-bold text-[#082046]">Free Citizen Plan</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                Active &amp; Free Forever
              </span>
            </div>

            <div className="text-sm text-[#435775] space-y-1">
              <p>
                <strong>Account:</strong> {userEmail || 'Guest Citizen (Not signed in)'}
              </p>
              {userName && (
                <p>
                  <strong>Name:</strong> {userName}
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F0F4F8] px-4 py-2 text-xs font-semibold text-[#082046] hover:bg-[#dce7f3]"
              >
                <UserRound className="size-3.5" /> Edit Profile
              </Link>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F0F4F8] px-4 py-2 text-xs font-semibold text-[#082046] hover:bg-[#dce7f3]"
              >
                <Bell className="size-3.5" /> Notification Rules
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F0F4F8] px-4 py-2 text-xs font-semibold text-[#082046] hover:bg-[#dce7f3]"
              >
                <FolderLock className="size-3.5" /> Document Vault
              </Link>
            </div>
          </div>

          {/* Government DigiLocker Integration Card */}
          <DigiLockerCard />

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
            <h3 className="text-sm font-bold text-[#082046]">For Centers &amp; Colleges</h3>
            <p className="text-xs text-[#536780]">
              Are you a MeeSeva, CSC, Cyber Cafe, or educational institution helping students apply?
            </p>
            <a
              href={PARTNER_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061835] w-full justify-center"
            >
              <Store className="size-4 text-emerald-400" /> Partner Network Portal
            </a>
          </div>

          <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-5 text-xs text-[#435775] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#082046]">
              <ShieldCheck className="size-4 text-[#0e7bf4]" /> Privacy Commitment
            </div>
            <p>
              ApplyFields never sells user contact information, search patterns, or documents to third parties or coaching institutes.
            </p>
            <Link href="/help" className="inline-flex items-center gap-1 font-semibold text-[#0e7bf4] hover:underline">
              Help Center &amp; Support <ArrowRight className="size-3" />
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
