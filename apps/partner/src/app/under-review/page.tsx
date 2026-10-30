'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePartnerAuth } from '@/lib/auth-context';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function UnderReviewPage() {
  const router = useRouter();
  const { user, partner, status, refreshSession, logout, setPartnerOptimistic } = usePartnerAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'verified') {
      router.push('/dashboard');
    }
  }, [status, router]);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshSession();
    setTimeout(() => setRefreshing(false), 500);
  }

  // Developer / testing shortcut to instantly preview dashboard as verified
  function handleBypassForTesting() {
    if (partner) {
      setPartnerOptimistic(() => ({
        ...partner,
        verification_status: 'verified',
        is_listed: true,
      }));
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20">
              <Zap className="size-4 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">ApplyFields Partner Network</span>
              <p className="text-[10px] text-slate-400">KYC Verification Gate</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking...' : 'Check Status'}
            </button>

            <button
              type="button"
              onClick={() => logout().then(() => router.push('/login'))}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Holding Card */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Application Under Review
                </h1>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                  Verification Pending
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ApplyFields staff verification officers are inspecting your registration credentials.
              </p>
            </div>
          </div>

          {/* Timeline tracker */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Live Review Progress
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Center Profile Submitted</div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Basic details, center classification, and GPS coordinates successfully logged.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs ring-2 ring-amber-500/40">
                  <Clock className="h-4 w-4 animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-300">
                    KYC & Trade License Document Audit
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verifying official center ID code and storefront exterior photo matching state records.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 opacity-60">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold text-xs">
                  3
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-300">Geographic Desk Approval</div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Admin regional desk in <span className="text-slate-300">{partner?.district || 'your district'}</span> checks proximity radius.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 opacity-60">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold text-xs">
                  4
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-300">
                    Storefront Activated on Citizen Portal
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your center will be listed on <span className="font-mono text-emerald-400">service.applyfields.in</span> for bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Details Summary Card */}
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-850 p-5 text-xs space-y-3">
            <div className="flex items-center justify-between font-bold text-white border-b border-slate-800 pb-2.5">
              <span>Center Application Record</span>
              <span className="font-mono text-emerald-400">ID: {partner?.id?.slice(0, 8) || 'REF-84920'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400">Center Name:</span>
                <div className="font-bold text-white text-sm mt-0.5">
                  {partner?.business_name || 'Your Registered Center'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Type:</span>
                <div className="font-semibold text-emerald-400 uppercase mt-0.5">
                  {partner?.type || 'meeseva'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Contact Number:</span>
                <div className="text-slate-200 mt-0.5">{partner?.phone || user?.phone || 'Not provided'}</div>
              </div>
              <div>
                <span className="text-slate-400">Location:</span>
                <div className="text-slate-200 mt-0.5">
                  {partner?.city || 'Ameerpet'}, {partner?.state_code || 'TG'} ({partner?.pincode || '500016'})
                </div>
              </div>
            </div>

            {partner?.latitude && partner?.longitude && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-emerald-400 font-mono text-[11px]">
                <MapPin className="h-3.5 w-3.5" />
                LAT: {partner.latitude}, LNG: {partner.longitude}
              </div>
            )}
          </div>

          {/* Need help bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              <span className="text-slate-300">Have questions about verification?</span>
            </div>
            <a
              href="https://wa.me/919999999999?text=Hello%20ApplyFields%20Partner%20Desk%2C%20checking%20on%20my%20center%20verification"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Contact Partner Support (WhatsApp) <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Test Sandbox Preview Bypass */}
          <div className="mt-8 border-t border-slate-800 pt-6 text-center">
            <p className="text-[11px] text-slate-500 mb-3">
              Developer & Operator Preview Mode: Want to explore the verified operator workspace immediately?
            </p>
            <button
              type="button"
              onClick={handleBypassForTesting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 transition border border-emerald-500/20"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Preview Operator Dashboard Workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
