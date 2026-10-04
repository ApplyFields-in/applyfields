import { Logo } from '@applyfields/ui';
import { CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

/** Login / register pages: no sidebar, brand panel on the left. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.15fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-teal p-10 text-cream lg:flex">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-sea/50" />
        <div aria-hidden="true" className="absolute -bottom-28 -left-10 size-72 rounded-full bg-celadon/20" />
        <div className="relative">
          <Logo inverse subtitle="Every opportunity. One place." />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold">One profile. Every opportunity.</h2>
          <ul className="mt-6 space-y-3">
            {[
              'Jobs, exams and scholarships matched to you',
              'Reminders before every last date',
              'Your documents, ready for every application',
              'Career roadmaps for students',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CircleCheck className="size-5 text-celadon" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-cream/75">ApplyFields is not a government website.</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-6 p-4 sm:p-8">
        <div className="lg:hidden">
          <Logo subtitle="Every opportunity. One place." />
        </div>
        {children}
      </div>
    </div>
  );
}
