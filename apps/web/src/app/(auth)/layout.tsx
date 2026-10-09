import { Logo } from '@applyfields/ui';
import { Briefcase, ClipboardList, GraduationCap, Landmark, School } from 'lucide-react';
import type { ReactNode } from 'react';
import { PeopleCycle } from '@/components/people-cycle';

const TOPICS = [
  { icon: GraduationCap, title: 'Scholarships', hint: 'Fund your future', at: 'left-[7%] top-[14%] -rotate-6' },
  { icon: ClipboardList, title: 'Exams', hint: 'Stay updated', at: 'right-[6%] top-[9%] rotate-6' },
  { icon: School, title: 'Admissions', hint: 'Get into college', at: 'right-[4%] top-[43%] -rotate-3' },
  { icon: Briefcase, title: 'Jobs', hint: 'Build your career', at: 'left-[5%] top-[55%] rotate-3' },
  { icon: Landmark, title: 'And more', hint: 'Certificates & services', at: 'right-[7%] bottom-[11%] rotate-2' },
];

/** Login / Register: form on the left, people the site serves on the right. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper p-3 sm:p-6">
      {/* overflow-clip (not hidden) so the sticky illustration still sticks to the page scroll */}
      <div className="grid w-full max-w-[1180px] overflow-clip rounded-[2rem] bg-cream shadow-[0_40px_80px_-40px_rgb(8_32_70/0.35)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="px-5 py-8 sm:px-10 sm:py-10 lg:px-14">
          <Logo size="lg" />
          <div className="mt-8 w-full max-w-md">{children}</div>
        </div>

        <div aria-hidden="true" className="relative hidden min-h-[640px] select-none bg-tea lg:block">
          {/* capped to the screen height so long forms (register) don't blow the character up */}
          <div className="sticky top-6 h-[min(100%,calc(100dvh-3rem))] overflow-hidden">
            <div className="absolute left-1/2 top-[45%] aspect-square w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-sea/20" />
            <div className="absolute left-1/2 top-[45%] aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream/60" />

            <div className="absolute inset-x-0 bottom-[5%] h-[78%]">
              <PeopleCycle />
            </div>

            {TOPICS.map(({ icon: Icon, title, hint, at }) => (
              <div
                key={title}
                className={`absolute z-10 flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 shadow-[0_18px_36px_-18px_rgb(8_32_70/0.35)] ${at}`}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-tea text-sea">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-teal">{title}</span>
                  <span className="block text-xs text-teal/55">{hint}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-teal/45">
        ApplyFields is not a government website. Always apply through the official link.
      </p>
    </div>
  );
}
