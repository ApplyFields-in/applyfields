import { Logo } from '@applyfields/ui';
import {
  Bell,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Login / Register layout with an interactive 3D opportunity showcase
 * using strictly the 5 ApplyFields theme palette colors.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1.15fr] bg-canvas">
      {/* 3D Visual Hero Showcase (Desktop) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-teal p-10 text-cream lg:flex select-none">
        {/* Ambient 3D lighting orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-sea/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 size-96 rounded-full bg-celadon/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/3 size-64 rounded-full bg-tea/15 blur-2xl"
        />

        {/* Brand Header */}
        <div className="relative z-10">
          <Logo inverse subtitle="Every opportunity. One place." />
        </div>

        {/* 3D Floating Showcase Stage */}
        <div className="relative z-10 my-auto py-6 [perspective:1000px]">
          <div className="mb-6 max-w-md">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-celadon/20 px-3 py-1 text-xs font-bold text-celadon border border-celadon/30 shadow-[0_2px_4px_rgba(0,0,0,0.15)] mb-3">
              <Sparkles className="size-3.5 text-celadon" />
              <span>India&apos;s Single Citizen Gateway</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-cream">
              One profile. <br />
              <span className="text-celadon underline decoration-celadon/40 underline-offset-4">
                Every opportunity.
              </span>
            </h2>
            <p className="mt-2 text-sm text-cream/75 leading-relaxed">
              Never miss government recruitments, exam dates, college admissions or scholarships.
            </p>
          </div>

          {/* 3D Layered Mock Cards */}
          <div className="relative h-64 w-full max-w-md">
            {/* Background 3D Card 1: Notification Alert */}
            <div className="absolute top-0 right-2 w-64 rounded-2xl border-2 border-cream/20 bg-teal/80 p-3.5 text-cream shadow-[0_12px_24px_-4px_rgba(0,0,0,0.35),0_4px_0_0_#1a936f] backdrop-blur-md transform rotate-6 hover:rotate-3 transition-transform duration-300">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="flex items-center gap-1.5 font-bold text-celadon">
                  <Bell className="size-3.5 animate-bounce" /> Tier 1 Admit Card
                </span>
                <span className="text-[10px] text-cream/70 font-mono">Today</span>
              </div>
              <p className="text-xs font-bold text-cream truncate">SSC CGL 2026 Examination</p>
              <p className="text-[11px] text-cream/70 mt-0.5">Official Portal: ssc.gov.in</p>
            </div>

            {/* Background 3D Card 2: Deadline Countdown */}
            <div className="absolute bottom-4 left-0 w-64 rounded-2xl border-2 border-cream/20 bg-sea/90 p-3.5 text-cream shadow-[0_16px_28px_-6px_rgba(0,0,0,0.4),0_4px_0_0_#114b5f] backdrop-blur-md transform -rotate-6 hover:-rotate-2 transition-transform duration-300">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-bold text-cream">
                  <Clock className="size-3.5" /> Closing Soon
                </span>
                <span className="rounded-full bg-cream/20 px-2 py-0.5 text-[10px] font-bold">
                  3 Days Left
                </span>
              </div>
              <p className="text-xs font-bold text-cream truncate">UPSC Civil Services 2026</p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-cream/80">
                <span>Vacancies: 1,056</span>
                <span className="font-semibold text-celadon">Free Alert Set ✓</span>
              </div>
            </div>

            {/* Foreground Main 3D Card: Match Profile Card */}
            <div className="absolute top-10 left-6 right-6 rounded-2xl border-2 border-cream/30 bg-cream p-4 text-teal shadow-[0_20px_35px_-8px_rgba(0,0,0,0.45),0_6px_0_0_#114b5f] transform -rotate-1 hover:rotate-0 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-tea/60 px-2.5 py-0.5 text-[11px] font-bold text-teal border border-line">
                  <GraduationCap className="size-3 text-teal" /> Central Recruitment
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sea">
                  <CheckCircle2 className="size-3.5 text-sea" /> 100% Eligible
                </span>
              </div>
              <h4 className="text-sm font-black text-teal leading-tight">
                Section Officer & Inspector Recruitment
              </h4>
              <p className="text-xs text-teal/75 mt-0.5">Pay Level 7: ₹44,900 – ₹1,42,400 / mo</p>
              <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
                <span className="font-semibold text-teal/70">14,582 Total Vacancies</span>
                <span className="font-bold text-sea flex items-center gap-1">
                  <TrendingUp className="size-3" /> Auto-Tracked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges Footer */}
        <div className="relative z-10 border-t border-cream/15 pt-4">
          <p className="text-xs text-cream/70 flex items-center gap-2">
            <span>🛡️ Official notifications directly from verified sources.</span>
            <span>•</span>
            <span>ApplyFields is not a government website.</span>
          </p>
        </div>
      </div>

      {/* Form Container (Right Side) */}
      <div className="flex flex-col items-center justify-center gap-6 p-4 sm:p-8 relative">
        {/* Subtle background ambient depth on right side */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-20 size-72 rounded-full bg-celadon/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-10 bottom-10 size-72 rounded-full bg-sea/10 blur-3xl"
        />

        <div className="lg:hidden">
          <Logo subtitle="Every opportunity. One place." />
        </div>
        <div className="relative z-10 w-full flex justify-center">{children}</div>
      </div>
    </div>
  );
}
