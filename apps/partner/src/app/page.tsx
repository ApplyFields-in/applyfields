'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePartnerAuth } from '@/lib/auth-context';
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
    <div className="min-h-screen bg-[#F0F4F8] text-[#082046] selection:bg-[#38bdf8] selection:text-[#082046]">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-[#082046] via-[#0e7bf4] to-[#082046] px-4 py-2 text-center text-xs font-semibold text-white tracking-wide">
        🚀 ApplyFields Partner Network is now live across Telangana, Andhra Pradesh, Karnataka &amp; Maharashtra!
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[#d5deea] bg-[#F0F4F8]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt="ApplyFields Logo"
              width={38}
              height={38}
              className="size-9 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-[#082046]">
                  Apply<span className="text-[#0e7bf4]">Fields</span>
                </span>
                <span className="rounded-md bg-[#e0edfb] px-2 py-0.5 text-xs font-black uppercase tracking-wider text-[#0e7bf4] border border-[#38bdf8]/30">
                  Partner Portal
                </span>
              </div>
              <p className="text-[11px] text-[#526987] font-semibold">Operator &amp; Merchant Network</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loading && status !== 'unauthenticated' ? (
              <Link
                href={isPending ? '/under-review' : '/dashboard'}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0e7bf4] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#0c6fdc] shadow-clay-btn-azure"
              >
                Go to Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-[#c4d2e3] bg-white px-4 py-2 text-sm font-bold text-[#082046] transition hover:bg-slate-50 shadow-sm"
                >
                  Partner Sign In
                </Link>
                <Link
                  href="/institution/onboard"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#0e7bf4]/30 bg-[#e0edfb] px-3.5 py-2 text-xs font-bold text-[#0e7bf4] hover:bg-[#d0e5fb] transition"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>College Portal</span>
                </Link>
                <Link
                  href="/onboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00a884] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#009172] shadow-md shadow-[#00a884]/25"
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,123,244,0.08),rgba(255,255,255,0))]" />

        <div className="relative mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mt-2 text-4xl font-black tracking-tight text-[#082046] sm:text-6xl lg:text-7xl">
            Turn your digital center into a{' '}
            <span className="bg-gradient-to-r from-[#0e7bf4] via-[#00a884] to-[#082046] bg-clip-text text-transparent">
              high-earning citizen hub.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#435775] sm:text-xl leading-relaxed">
            Join the ApplyFields Partner Network. Receive pre-scheduled citizen appointments for PAN cards, Aadhaar services, MeeSeva certificates, and high-speed Xerox jobs with zero waiting lines.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#00a884] px-7 py-3.5 text-base font-bold text-white transition-all hover:bg-[#009172] shadow-lg shadow-[#00a884]/25 active:scale-[0.99]"
            >
              Register Kiosk / CSC Shop
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/institution/onboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#082046] to-[#0e7bf4] px-7 py-3.5 text-base font-bold text-white transition-all hover:opacity-95 shadow-lg shadow-[#082046]/20 active:scale-[0.99]"
            >
              <Building2 className="h-5 w-5" />
              <span>College Admissions Desk (Founder Doc §21)</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#c4d2e3] bg-white px-6 py-3.5 text-base font-bold text-[#082046] transition hover:bg-slate-50 shadow-sm"
            >
              Sign In to Desk
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 rounded-3xl border border-white bg-white/90 p-6 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.15),-8px_-8px_20px_rgba(255,255,255,0.95)] sm:grid-cols-4 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-black text-[#00a884]">1,480+</div>
              <div className="text-xs text-[#526987] font-bold mt-1">Verified Centers</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#0e7bf4]">₹34,500</div>
              <div className="text-xs text-[#526987] font-bold mt-1">Avg. Monthly Boost</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#00a884]">100%</div>
              <div className="text-xs text-[#526987] font-bold mt-1">Reserved Time Slots</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#0e7bf4]">4.9 ★</div>
              <div className="text-xs text-[#526987] font-bold mt-1">Operator Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Center Types We Support */}
      <section className="border-t border-[#d5deea] bg-white py-20">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0e7bf4]">Who Can Join</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#082046] sm:text-4xl">
              Tailored workspaces for all digital entrepreneurs
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* MeeSeva */}
            <div className="rounded-3xl border border-[#d5deea] bg-[#F0F4F8] p-6 transition hover:border-[#0e7bf4]/50 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00a884]/15 text-[#00a884]">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#082046]">MeeSeva Centers</h3>
              <p className="mt-2 text-sm text-[#526987] leading-relaxed">
                Caste, Income, Residence, Encumbrance Certificates, Land Records &amp; State citizen utility bill payments.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#00a884]">Certificates</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#00a884]">Revenue Dept</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#00a884]">Utility Desk</span>
              </div>
            </div>

            {/* CSC Digital Seva */}
            <div className="rounded-3xl border border-[#d5deea] bg-[#F0F4F8] p-6 transition hover:border-[#0e7bf4]/50 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0e7bf4]/15 text-[#0e7bf4]">
                <Fingerprint className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#082046]">CSC / Digital Seva Hubs</h3>
              <p className="mt-2 text-sm text-[#526987] leading-relaxed">
                Aadhaar address update, PVC card orders, PM Kisan, Ayushman Bharat, PAN card issuance &amp; Banking Kiosk services.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#0e7bf4]">Aadhaar Updates</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#0e7bf4]">PAN Services</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#0e7bf4]">VLE Desks</span>
              </div>
            </div>

            {/* Xerox & Printing */}
            <div className="rounded-3xl border border-[#d5deea] bg-[#F0F4F8] p-6 transition hover:border-[#0e7bf4]/50 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0284c7]/15 text-[#0284c7]">
                <Printer className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#082046]">Xerox &amp; Scanning Desks</h3>
              <p className="mt-2 text-sm text-[#526987] leading-relaxed">
                Bulk syllabus printing, college project spiral binding, color photostat, document scanning &amp; lamination jobs.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#0284c7]">Bulk Print</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#0284c7]">Spiral Binding</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#0284c7]">Color Xerox</span>
              </div>
            </div>

            {/* Cyber Cafe & Application Assistance */}
            <div className="rounded-3xl border border-[#d5deea] bg-[#F0F4F8] p-6 transition hover:border-[#0e7bf4]/50 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b]/15 text-[#d97706]">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#082046]">Application Assistance Desks</h3>
              <p className="mt-2 text-sm text-[#526987] leading-relaxed">
                Online registration for SSC, UPSC, State Police, Railway exams, photo resizing, signature compression &amp; admit card printouts.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#d97706]">Exam Forms</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#d97706]">Photo Resizing</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#d97706]">Hall Tickets</span>
              </div>
            </div>

            {/* Passport Studio */}
            <div className="rounded-3xl border border-[#d5deea] bg-[#F0F4F8] p-6 transition hover:border-[#0e7bf4]/50 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9333ea]/15 text-[#9333ea]">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#082046]">Passport Photo Studios</h3>
              <p className="mt-2 text-sm text-[#526987] leading-relaxed">
                Instant white-background biometric passport size photos matching Indian Embassy, US Visa, and OCI specifications.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#9333ea]">Passport Photos</span>
                <span className="rounded-full bg-white border border-[#d5deea] px-2.5 py-0.5 text-xs font-bold text-[#9333ea]">Visa Specs</span>
              </div>
            </div>

            {/* GPS Discovery & Footfall Guarantee */}
            <div className="rounded-3xl border border-[#00a884]/40 bg-gradient-to-br from-[#e6f8f3] to-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00a884] text-white font-bold">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-black text-[#00a884]">GPS Distance Discovery</h3>
              <p className="mt-2 text-sm text-[#435775] leading-relaxed">
                Citizens find you on <span className="font-mono text-[#00a884] font-bold">service.applyfields.in</span> based on real-time distance from their home, college, or workplace.
              </p>
              <div className="mt-4">
                <Link
                  href="/onboard"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00a884] hover:underline"
                >
                  Join in 3 minutes <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-[#d5deea] bg-[#F0F4F8] py-20">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0e7bf4]">Operator Workflow</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#082046] sm:text-4xl">
              How ApplyFields Works for Your Center
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white bg-white p-6 shadow-[6px_8px_20px_-8px_rgba(8,32,70,0.1)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0edfb] text-[#0e7bf4] font-black text-sm">
                1
              </div>
              <h3 className="mt-4 text-lg font-black text-[#082046]">Register Center</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#526987] leading-relaxed">
                Submit your center name, category, shop address, GPS pinpoint, and trade/CSC license.
              </p>
            </div>

            <div className="rounded-3xl border border-white bg-white p-6 shadow-[6px_8px_20px_-8px_rgba(8,32,70,0.1)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0edfb] text-[#0e7bf4] font-black text-sm">
                2
              </div>
              <h3 className="mt-4 text-lg font-black text-[#082046]">Staff Verification</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#526987] leading-relaxed">
                ApplyFields verification officers audit your credentials and verify your storefront within hours.
              </p>
            </div>

            <div className="rounded-3xl border border-white bg-white p-6 shadow-[6px_8px_20px_-8px_rgba(8,32,70,0.1)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0edfb] text-[#0e7bf4] font-black text-sm">
                3
              </div>
              <h3 className="mt-4 text-lg font-black text-[#082046]">Set Hours &amp; Slots</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#526987] leading-relaxed">
                Define your working shifts, capacity per 30-min window, and service price menu with custom rates.
              </p>
            </div>

            <div className="rounded-3xl border border-white bg-white p-6 shadow-[6px_8px_20px_-8px_rgba(8,32,70,0.1)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0edfb] text-[#0e7bf4] font-black text-sm">
                4
              </div>
              <h3 className="mt-4 text-lg font-black text-[#082046]">Serve &amp; Grow</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#526987] leading-relaxed">
                Citizens arrive on their reserved time with pre-filled forms and uploaded documents ready to print.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="border-t border-[#0d2a58] bg-gradient-to-br from-[#082046] via-[#0d2a58] to-[#082046] py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 space-y-4">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Ready to upgrade your digital shop?
          </h2>
          <p className="text-[#a8c1de] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Join thousands of verified digital operators boosting their monthly income with scheduled citizen appointments.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link
              href="/onboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#00a884] px-8 py-3.5 text-base font-bold text-white transition hover:bg-[#009172] shadow-xl shadow-[#00a884]/30"
            >
              Start Registration Wizard
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0d2a58] bg-[#082046] py-8 text-xs text-[#a8c1de]">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ApplyFields Technologies Inc. · Dedicated Operator Portal (`partners.applyfields.com`)</p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <a href="http://localhost:3000" className="hover:text-white transition">Citizen Portal</a>
            <a href="http://localhost:3003" className="hover:text-white transition">Services Hub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
