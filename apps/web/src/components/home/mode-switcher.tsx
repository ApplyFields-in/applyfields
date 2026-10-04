'use client';

import { cn } from '@applyfields/ui';
import {
  Award,
  Bot,
  BookOpen,
  Briefcase,
  Compass,
  FileText,
  GraduationCap,
  HandHelping,
  Landmark,
  Lightbulb,
  Route,
  School,
  University,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Tile = { href: string; label: string; hint: string; icon: LucideIcon; tone: string };

const APPLY: Tile[] = [
  { href: '/jobs', label: 'Government jobs', hint: 'Central, state, PSU, railways, police', icon: Briefcase, tone: 'bg-teal text-cream' },
  { href: '/exams', label: 'Exams', hint: 'JEE, NEET, CUET, SSC, UPSC…', icon: GraduationCap, tone: 'bg-sea text-cream' },
  { href: '/scholarships', label: 'Scholarships', hint: 'Central, state and NSP', icon: Award, tone: 'bg-celadon text-teal' },
  { href: '/services', label: 'Govt services', hint: 'PAN, passport, certificates', icon: Landmark, tone: 'bg-tea text-teal' },
  { href: '/admissions', label: 'Admissions', hint: 'Colleges, universities, courses', icon: School, tone: 'bg-celadon text-teal' },
  { href: '/documents', label: 'My documents', hint: 'Ready for every application', icon: FileText, tone: 'bg-tea text-teal' },
  { href: '/assistance', label: 'Find assistance', hint: 'Verified centres near you', icon: HandHelping, tone: 'bg-teal text-cream' },
  { href: '/career', label: 'Career mode', hint: 'Not sure what to choose?', icon: Compass, tone: 'bg-sea text-cream' },
];

const CAREER: Tile[] = [
  { href: '/career', label: 'Explore careers', hint: 'What each career really involves', icon: Compass, tone: 'bg-teal text-cream' },
  { href: '/career/roadmaps', label: 'Roadmaps', hint: 'Step-by-step, with progress', icon: Route, tone: 'bg-sea text-cream' },
  { href: '/career/skills', label: 'Skills', hint: 'What to learn next', icon: Lightbulb, tone: 'bg-celadon text-teal' },
  { href: '/career/courses', label: 'Courses', hint: 'B.Tech, MBBS, diploma, ITI…', icon: BookOpen, tone: 'bg-tea text-teal' },
  { href: '/career/colleges', label: 'Colleges', hint: 'Compare and shortlist', icon: University, tone: 'bg-celadon text-teal' },
  { href: '/career/guidance', label: 'Ask AI', hint: 'Career questions, answered', icon: Bot, tone: 'bg-tea text-teal' },
  { href: '/exams', label: 'Entrance exams', hint: 'For the path you choose', icon: GraduationCap, tone: 'bg-teal text-cream' },
  { href: '/scholarships', label: 'Scholarships', hint: 'Fund your studies', icon: Award, tone: 'bg-sea text-cream' },
];

/** Apply Mode / Career Mode switch (founder doc §3 and §5) with quick links. */
export function ModeSwitcher() {
  const [mode, setMode] = useState<'apply' | 'career'>('apply');
  const tiles = mode === 'apply' ? APPLY : CAREER;

  return (
    <section aria-labelledby="quick-links" className="rounded-card border border-line bg-cream p-5 shadow-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="quick-links" className="text-base font-bold">
            {mode === 'apply' ? 'What do you want to apply for?' : 'Plan your career'}
          </h2>
          <p className="text-sm text-teal/80">
            {mode === 'apply' ? 'Jobs, exams, scholarships, services and admissions.' : 'Careers, roadmaps, courses and colleges.'}
          </p>
        </div>
        <div role="tablist" aria-label="Mode" className="inline-flex rounded-full bg-tea p-1">
          {(['apply', 'career'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                mode === m ? 'bg-teal text-cream shadow-card' : 'text-teal hover:bg-cream/60',
              )}
            >
              {m === 'apply' ? 'Apply Mode' : 'Career Mode'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(({ href, label, hint, icon: Icon, tone }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-line bg-canvas p-4 transition-colors hover:border-teal/40"
          >
            <span className={cn('grid size-10 place-items-center rounded-xl', tone)}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold group-hover:underline">{label}</span>
              <span className="block text-xs text-teal/80">{hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
