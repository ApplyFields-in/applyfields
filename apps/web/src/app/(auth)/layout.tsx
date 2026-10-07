import { Logo } from '@applyfields/ui';
import { Award, Briefcase, GraduationCap, Landmark, School, Search, Send, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

// sample feed for the brand panel — illustrative, not live data
const FEED = [
  { icon: <Briefcase className="size-4" />, title: 'SSC CGL 2026', meta: 'Government job · Graduates' },
  { icon: <GraduationCap className="size-4" />, title: 'UPSC Civil Services', meta: 'Exam · Prelims in May' },
  { icon: <Award className="size-4" />, title: 'Post-Matric Scholarship', meta: 'Scholarship · SC/ST/OBC' },
  { icon: <School className="size-4" />, title: 'AP EAPCET Counselling', meta: 'Admissions · Engineering' },
  { icon: <Landmark className="size-4" />, title: 'Income Certificate', meta: 'Government service · MeeSeva' },
  { icon: <Briefcase className="size-4" />, title: 'RRB NTPC', meta: 'Government job · 12th pass' },
];

// rising wave: Explore (bottom-left) → Apply → Grow (top-right); equal-length halves
const WAVE = 'M60 180 C 120 180, 140 115, 200 115 S 280 50, 340 50';

// spark travels 0→0.8 of the cycle, rests on Grow, then restarts; `at` = arrival time
// labelY is in SVG units so labels always sit next to their dot at any panel width
const STOPS = [
  { cx: 60, cy: 180, at: 0, labelY: 194, icon: <Search className="size-3.5" />, label: 'Explore', hint: 'Find what fits you' },
  { cx: 200, cy: 115, at: 0.4, labelY: 129, icon: <Send className="size-3.5" />, label: 'Apply', hint: 'On the official site' },
  { cx: 340, cy: 50, at: 0.8, labelY: 0, icon: <TrendingUp className="size-3.5" />, label: 'Grow', hint: 'Track every step' },
];

/** Login / Register layout: animated brand panel on the left, form on the right. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1.15fr] bg-canvas overflow-hidden">
      {/* Brand panel (desktop): Explore → Apply → Grow journey + opportunity feed */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-teal p-10 text-cream lg:flex select-none">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-sea/35 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-celadon/20 blur-3xl" />
        {/* oversized drifting logo mark as a watermark */}
        <img
          src="/logo-mark.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-1/4 w-[28rem] opacity-[0.07] animate-[drift_14s_ease-in-out_infinite]"
        />

        <div className="relative z-10">
          <Logo inverse subtitle="Every opportunity. One place." />
        </div>

        <div className="relative z-10 my-auto w-full max-w-xl py-8">
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.05] tracking-tight">
            Explore. Apply.
            <br />
            <span className="bg-gradient-to-r from-celadon to-sea bg-clip-text text-transparent">Grow.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
            Jobs, exams, scholarships and admissions from official sources — matched to your profile, with every
            deadline tracked for you.
          </p>

          {/* the journey: a spark travels the logo's wave through the three steps */}
          <div className="mt-10">
            <svg viewBox="0 0 400 240" className="w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="journey" x1="0" x2="1">
                  <stop offset="0" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#0e7bf4" />
                </linearGradient>
              </defs>
              <path id="journey-path" d={WAVE} fill="none" stroke="url(#journey)" strokeWidth="3" strokeLinecap="round" />
              <path d={WAVE} fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="2 8">
                <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="2s" repeatCount="indefinite" />
              </path>
              {STOPS.map((s) => {
                const kt = `0;${s.at};${s.at + 0.15};1`;
                return (
                  <g key={s.label}>
                    <circle cx={s.cx} cy={s.cy} r="7" fill="none" stroke="#38bdf8" strokeWidth="2">
                      <animate attributeName="r" values="7;7;24;24" keyTimes={kt} dur="7s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;0.9;0;0" keyTimes={kt} dur="7s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={s.cx} cy={s.cy} r="7" fill="#082046" stroke="#38bdf8" strokeWidth="2.5" />
                    <foreignObject x={s.cx - 60} y={s.labelY} width="120" height="40">
                      <div className="flex flex-col items-center text-center">
                        <span className="flex items-center gap-1 text-[13px] font-extrabold text-cream">
                          <span className="text-celadon">{s.icon}</span>
                          {s.label}
                        </span>
                        <span className="whitespace-nowrap text-[10px] text-cream/55">{s.hint}</span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
              <circle r="7" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px #38bdf8)' }}>
                <animateMotion dur="7s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear">
                  <mpath href="#journey-path" />
                </animateMotion>
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.04;0.92;1" dur="7s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </div>

        {/* opportunity feed — scrolls forever, pauses on hover */}
        <div className="relative z-10 -mx-10">
          <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <div className="flex w-max gap-3 animate-[marquee_200s_linear_infinite] hover:[animation-play-state:paused]">
              {[...FEED, ...FEED].map((o, i) => (
                <div
                  key={i}
                  className="flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-cream/10 bg-cream/[0.06] p-3 backdrop-blur-sm"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sea/25 text-celadon">{o.icon}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-cream">{o.title}</span>
                    <span className="block truncate text-[11px] text-cream/55">{o.meta}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 px-10 text-[11px] text-cream/45">
            ApplyFields is not a government website. Always apply through the official link.
          </p>
        </div>
      </div>

      {/* Form Container (Right Side) */}
      <div
        className="flex flex-col items-center justify-center gap-6 p-4 sm:p-8 relative overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Subtle background ambient depth on right side */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-20 size-72 rounded-full bg-celadon/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-10 bottom-10 size-72 rounded-full bg-sea/10 blur-3xl"
        />

        <a href="/" aria-label="ApplyFields home" className="relative z-10">
          <img src="/logo.png" alt="ApplyFields — Explore Apply Grow" className="h-24 sm:h-28 w-auto object-contain" />
        </a>
        <div className="relative z-10 w-full flex justify-center">{children}</div>
      </div>
    </div>
  );
}
