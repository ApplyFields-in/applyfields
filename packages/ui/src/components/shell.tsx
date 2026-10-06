import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { MobileDrawer } from './mobile-drawer';
import { NavLink } from './nav-link';

/* ------------------------------------------------------------------ Logo */

export function Logo({ subtitle, inverse = false }: { subtitle?: string; inverse?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="ApplyFields home">
      <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden="true">
        <rect width="36" height="36" rx="11" className="fill-sea" />
        <path d="M10 25 L18 9 L26 25" className="stroke-cream" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.5 19.5 H22.5" className="stroke-celadon" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      <span className="leading-tight">
        <span className={cn('block text-[17px] font-extrabold tracking-tight', inverse ? 'text-cream' : 'text-teal')}>
          ApplyFields
        </span>
        {subtitle && (
          <span className={cn('block text-[11px] font-medium', inverse ? 'text-cream/75' : 'text-teal/80')}>
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ Sidebar */

export type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean; badge?: ReactNode };
export type NavGroup = { label?: string; items: NavItem[] };

export function Sidebar({
  groups,
  subtitle,
  footer,
}: {
  groups: NavGroup[];
  subtitle?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-teal text-cream">
      <div className="px-5 pb-4 pt-6">
        <Logo subtitle={subtitle} inverse />
      </div>
      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((group, i) => (
          <div key={group.label ?? i}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-cream/70">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {footer && <div className="border-t border-cream/15 p-3">{footer}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Shell */

/** Page frame: fixed sidebar on large screens, slide-in menu on phones, sticky top bar. */
export function Shell({
  sidebar,
  topbar,
  footer,
  children,
}: {
  sidebar: ReactNode;
  topbar: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">{sidebar}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* solid background on purpose: backdrop-blur would trap the phone menu (position: fixed) inside the header */}
        <header className="sticky top-0 z-30 border-b border-line bg-canvas">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <MobileDrawer>{sidebar}</MobileDrawer>
            </div>
            {topbar}
          </div>
        </header>
        <main id="main" className="flex-1 animate-rise px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
