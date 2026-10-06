'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Sidebar link that highlights itself when its page (or a sub-page) is open. */
export function NavLink({
  href,
  label,
  icon,
  exact = false,
  badge,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  badge?: ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200',
        active ? 'bg-cream text-teal shadow-clay' : 'text-cream/85 hover:translate-x-0.5 hover:bg-cream/10 hover:text-cream',
      )}
    >
      <span className="grid size-5 place-items-center [&>svg]:size-[18px]">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge}
    </Link>
  );
}
