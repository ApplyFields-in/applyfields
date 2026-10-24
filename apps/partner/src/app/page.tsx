'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePartnerAuth } from '@/lib/auth-context';
import { ScrollToTopButton } from '@applyfields/ui';
import {
  ArrowRight,
  Award,
  Building2,
  CalendarCheck,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  MapPin,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function PartnerLandingPage() {
  const { status, partner, loading } = usePartnerAuth();
  const router = useRouter();

  // If user is already verified partner, offer quick redirect or banner
  const isVerified = status === 'verified';
  const isPending = status === 'pending_verification';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-center text-xs font-semibold text-white tracking-wide">
        🚀 ApplyFields Partner Network is now live across Telangana, Andhra Pradesh, Karnataka & Maharashtra!
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">ApplyFields</span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-400 ring-1 ring-emerald-500/30">
                  Partner Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Operator & Merchant Network</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loading && status !== 'unauthenticated' ? (
              <Link
                href={isPending ? '/under-review' : '/dashboard'}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                Go to Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
                >
                  Partner Sign In
                </Link>
                <Link
                  href="/institution/onboard"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>College Portal</span>
                </Link>
                <Link
                  href="/onboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  Register Center
                  <ArrowRight className="h-4 w-4" />
                </Link>

              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built like Swiggy Partner for MeeSeva, CSCs & Cyber Hubs</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Turn your digital center into a{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              high-earning citizen hub.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl leading-relaxed">
            Join the ApplyFields Partner Network. Receive pre-scheduled citizen appointments for PAN cards, Aadhaar services, MeeSeva certificates, and high-speed Xerox jobs with zero waiting lines.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/25 active:scale-[0.99]"
            >
              Register Kiosk / CSC Shop
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/institution/onboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 text-base font-bold text-white transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.99]"
            >
              <Building2 className="h-5 w-5" />
              <span>College Admissions Desk (Founder Doc §21)</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              Sign In to Desk
            </Link>
          </div>


          {/* Social Proof Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-800/40 p-6 backdrop-blur-sm sm:grid-cols-4 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-black text-emerald-400">1,480+</div>
              <div className="text-xs text-slate-400 mt-1">Verified Centers</div>
            </div>
            <div>
              <div className="text-3xl font-black text-cyan-400">₹34,500</div>
              <div className="text-xs text-slate-400 mt-1">Avg. Monthly Boost</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Reserved Time Slots</div>
            </div>
            <div>
              <div className="text-3xl font-black text-cyan-400">4.9 ★</div>
              <div className="text-xs text-slate-400 mt-1">Operator Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Center Types We Support */}
      <section className="border-t border-slate-800 bg-slate-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Who Can Join</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tailored workspaces for all digital entrepreneurs
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* MeeSeva */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-emerald-500/50 hover:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">MeeSeva Centers</h3>
              <p className="mt-2 text-sm text-slate-400">
                Caste, Income, Residence, Encumbrance Certificates, Land Records & State citizen utility bill payments.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-emerald-300">Certificates</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-emerald-300">Revenue Dept</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-emerald-300">Utility Desk</span>
              </div>
            </div>

            {/* CSC Digital Seva */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-emerald-500/50 hover:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <Fingerprint className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">CSC / Digital Seva Hubs</h3>
              <p className="mt-2 text-sm text-slate-400">
                Aadhaar address update, PVC card orders, PM Kisan, Ayushman Bharat, PAN card issuance & Banking Kiosk services.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-teal-300">Aadhaar Updates</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-teal-300">PAN Services</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-teal-300">VLE Desks</span>
              </div>
            </div>

            {/* Xerox & Printing */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-emerald-500/50 hover:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Printer className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Xerox & Scanning Desks</h3>
              <p className="mt-2 text-sm text-slate-400">
                Bulk syllabus printing, college project spiral binding, color photostat, document scanning & lamination jobs.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-cyan-300">Bulk Print</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-cyan-300">Spiral Binding</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-cyan-300">Color Xerox</span>
              </div>
            </div>

            {/* Cyber Cafe & Application Assistance */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-emerald-500/50 hover:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Application Assistance Desks</h3>
              <p className="mt-2 text-sm text-slate-400">
                Online registration for SSC, UPSC, State Police, Railway exams, photo resizing, signature compression & admit card printouts.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-amber-300">Exam Forms</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-amber-300">Photo Resizing</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-amber-300">Hall Tickets</span>
              </div>
            </div>

            {/* Passport Studio */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-emerald-500/50 hover:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Passport Photo Studios</h3>
              <p className="mt-2 text-sm text-slate-400">
                Instant white-background biometric passport size photos matching Indian Embassy, US Visa, and OCI specifications.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-purple-300">Passport Photos</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-purple-300">Visa Specs</span>
              </div>
            </div>

            {/* GPS Discovery & Footfall Guarantee */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-emerald-300">GPS Distance Discovery</h3>
              <p className="mt-2 text-sm text-slate-300">
                Citizens find you on <span className="font-mono text-emerald-400">service.applyfields.in</span> based on real-time distance from their home, college, or workplace.
              </p>
              <div className="mt-4">
                <Link
                  href="/onboard"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Join in 3 minutes <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-slate-800 bg-slate-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Operator Workflow</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How ApplyFields Works for Your Center
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                1
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Register Center</h3>
              <p className="mt-2 text-sm text-slate-400">
                Submit your center name, category, shop address, GPS pinpoint, and trade/CSC license.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                2
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Staff Verification</h3>
              <p className="mt-2 text-sm text-slate-400">
                ApplyFields verification officers audit your credentials and verify your storefront within hours.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                3
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Set Hours & Slots</h3>
              <p className="mt-2 text-sm text-slate-400">
                Define your working shifts, capacity per 30-min window, and service price menu with custom rates.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                4
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Serve & Grow</h3>
              <p className="mt-2 text-sm text-slate-400">
                Citizens arrive on their reserved time with pre-filled forms and uploaded documents ready to print.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="border-t border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to upgrade your digital shop?
          </h2>
          <p className="mt-4 text-slate-300">
            Join thousands of verified digital operators boosting their monthly income with scheduled appointments.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-base font-bold text-slate-950 transition hover:bg-emerald-400 shadow-xl shadow-emerald-500/20"
            >
              Start Registration Wizard
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ApplyFields Technologies Inc. · Dedicated Operator Portal (`partners.applyfields.com`)</p>
          <ScrollToTopButton className="text-slate-400 hover:text-white border-slate-800 hover:border-slate-700 hover:bg-slate-900" />
        </div>
      </footer>
    </div>
  );
}

