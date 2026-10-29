'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePartnerAuth } from '@/lib/auth-context';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export default function InstitutionUnderReviewPage() {
  const router = useRouter();
  const { user, partner, status, refreshSession, logout, setPartnerOptimistic } = usePartnerAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'verified') {
      router.push('/institution/dashboard');
    }
  }, [status, router]);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshSession();
    setTimeout(() => setRefreshing(false), 500);
  }

  function handleBypassForTesting() {
    if (partner) {
      setPartnerOptimistic(() => ({
        ...partner,
        verification_status: 'verified',
        is_listed: true,
      }));
    }
    router.push('/institution/dashboard');
  }

  const collegeName = partner?.business_name || 'Selected University / College';
  const officerName = partner?.owner_name || user?.email?.split('@')[0] || 'Admissions Coordinator';
  const officerPhone = partner?.phone || user?.phone || '+91 98765 43210';
  const officerEmail = partner?.email || user?.email || 'admissions@college.ac.in';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black shadow-lg shadow-blue-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">ApplyFields</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300">
                  INSTITUTION
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Admissions Desk Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              Check Status
            </button>
            <button
              type="button"
              onClick={() => logout().then(() => router.push('/login'))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-850 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300 mb-6">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Institutional Verification Under Review (Expected: 1–2 Business Days)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verifying Admissions Desk Credentials for {collegeName}
          </h1>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
            Thank you for registering your institution on ApplyFields. To protect students from unverified brokers, our institutional verifications team validates accreditation credentials and authorization letters before activating your direct admissions desk.
          </p>

          {/* Institutional Info Card */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Institutional Representation Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Institution / College Name:</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{collegeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Designated Admissions Officer:</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{officerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Official Institutional Email:</span>
                <span className="font-mono text-blue-300 mt-0.5 block">{officerEmail}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admissions Helpline:</span>
                <span className="font-mono text-slate-200 mt-0.5 block">{officerPhone}</span>
              </div>
            </div>
          </div>

          {/* Verification Pipeline Checklist */}
          <div className="mt-8 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ApplyFields Institutional Review Pipeline
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>1. Institution Directory &amp; Accreditations Match (UGC/AICTE/NAAC Verified)</span>
              </div>
              <div className="flex items-center gap-3 text-xs p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 font-semibold">
                <Clock className="h-4 w-4 text-blue-400 shrink-0 animate-spin" />
                <span>2. Admissions Officer Authorization Verification by ApplyFields Staff</span>
              </div>
              <div className="flex items-center gap-3 text-xs p-3 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-500">
                <span className="h-4 w-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px]">3</span>
                <span>3. Activation of Direct Student Inquiry CRM Desk &amp; Program Editor</span>
              </div>
            </div>
          </div>

          {/* Actions & Developer Testing Bypass */}
          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href="mailto:support@applyfields.in?subject=Institutional%20Verification%20Expedite"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              Need expedited activation? Contact institutional support →
            </a>

            {/* Developer Testing Shortcut */}
            <button
              type="button"
              onClick={handleBypassForTesting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 transition"
            >
              <span>Preview Admissions Desk (Dev Mode)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
