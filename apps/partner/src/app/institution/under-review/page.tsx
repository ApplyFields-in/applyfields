'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KycDocuments } from '@/components/kyc-documents';
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
  const officerPhone = partner?.phone || user?.phone || 'Not added yet';
  const officerEmail = partner?.email || user?.email || 'admissions@college.ac.in';

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#082046] selection:bg-blue-500 selection:text-[#082046]">
      {/* Header */}
      <header className="border-b border-[#d5deea] bg-white px-4 py-4 sm:px-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0e7bf4] to-[#0c6fdc] text-white font-black shadow-lg shadow-[#0e7bf4]/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#082046] text-base tracking-tight">ApplyFields</span>
                <span className="rounded bg-[#e0edfb] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0e7bf4]">
                  INSTITUTION
                </span>
              </div>
              <p className="text-[11px] text-[#536780]">Admissions Desk Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d5deea] bg-white px-3 py-1.5 text-xs font-semibold text-[#243b5b] hover:bg-[#e3eaf3] hover:text-[#082046] transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#0e7bf4]' : ''}`} />
              Check Status
            </button>
            <button
              type="button"
              onClick={() => logout().then(() => router.push('/login'))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d5deea] bg-[#F7F9FC] px-3 py-1.5 text-xs font-semibold text-[#536780] hover:text-rose-600 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d5deea] bg-white p-6 sm:p-10 shadow-[0_1px_2px_rgba(8,32,70,0.04),0_12px_32px_-16px_rgba(8,32,70,0.18)] backdrop-blur-xl">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 mb-6">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Institutional Verification Under Review (Expected: 1–2 Business Days)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082046] tracking-tight">
            Verifying Admissions Desk Credentials for {collegeName}
          </h1>

          <p className="mt-3 text-sm text-[#243b5b] leading-relaxed max-w-2xl">
            Thank you for registering your institution on ApplyFields. To protect students from unverified brokers, our institutional verifications team validates accreditation credentials and authorization letters before activating your direct admissions desk.
          </p>

          {/* Institutional Info Card */}
          <div className="mt-8 rounded-2xl border border-[#d5deea] bg-[#F0F4F8] p-5 sm:p-6 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#536780]">
              Submitted Institutional Representation Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#8a9bb3] block">Institution / College Name:</span>
                <span className="font-bold text-[#082046] text-sm mt-0.5 block">{collegeName}</span>
              </div>
              <div>
                <span className="text-[#8a9bb3] block">Designated Admissions Officer:</span>
                <span className="font-bold text-[#082046] text-sm mt-0.5 block">{officerName}</span>
              </div>
              <div>
                <span className="text-[#8a9bb3] block">Official Institutional Email:</span>
                <span className="font-mono text-[#0e7bf4] mt-0.5 block">{officerEmail}</span>
              </div>
              <div>
                <span className="text-[#8a9bb3] block">Admissions Helpline:</span>
                <span className="font-mono text-[#082046] mt-0.5 block">{officerPhone}</span>
              </div>
            </div>
          </div>

          {/* Verification Pipeline Checklist */}
          <div className="mt-8 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#536780]">
              ApplyFields Institutional Review Pipeline
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs p-3 rounded-xl border border-[#00a884]/25 bg-[#00a884]/5 text-[#00876a] font-semibold">
                <CheckCircle2 className="h-4 w-4 text-[#00876a] shrink-0" />
                <span>1. Institution Directory &amp; Accreditations Match (UGC/AICTE/NAAC Verified)</span>
              </div>
              <div className="flex items-center gap-3 text-xs p-3 rounded-xl border border-[#0e7bf4]/30 bg-[#e0edfb] text-[#0e7bf4] font-semibold">
                <Clock className="h-4 w-4 text-[#0e7bf4] shrink-0 animate-spin" />
                <span>2. Admissions Officer Authorization Verification by ApplyFields Staff</span>
              </div>
              <div className="flex items-center gap-3 text-xs p-3 rounded-xl border border-[#d5deea] bg-[#F7F9FC] text-[#8a9bb3]">
                <span className="h-4 w-4 rounded-full border border-[#c9d6e6] flex items-center justify-center text-[9px]">3</span>
                <span>3. Activation of Direct Student Inquiry CRM Desk &amp; Program Editor</span>
              </div>
            </div>
          </div>

          {partner && <KycDocuments partner={partner} onUploaded={refreshSession} />}

          {/* Actions & Developer Testing Bypass */}
          <div className="mt-10 pt-6 border-t border-[#d5deea] flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href="mailto:support@applyfields.in?subject=Institutional%20Verification%20Expedite"
              className="text-xs font-semibold text-[#0e7bf4] hover:text-[#0c6fdc] transition"
            >
              Need expedited activation? Contact institutional support →
            </a>

            {/* Developer testing shortcut: development builds only */}
            {process.env.NODE_ENV !== 'production' && (
            <button
              type="button"
              onClick={handleBypassForTesting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0c6fdc] shadow-md shadow-[#0e7bf4]/20 transition"
            >
              <span>Preview Admissions Desk (Dev Mode)</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
