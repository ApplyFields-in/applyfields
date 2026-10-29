'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Briefcase, Compass, Home, Settings, User } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      label: t('nav_home', 'Home'),
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: t('nav_apply', 'Apply'),
      href: '/apply',
      icon: Briefcase,
      isActive:
        pathname.startsWith('/apply') ||
        pathname.startsWith('/jobs') ||
        pathname.startsWith('/exams') ||
        pathname.startsWith('/scholarships') ||
        pathname.startsWith('/admissions'),
    },
    {
      label: t('nav_career', 'Career'),
      href: '/career',
      icon: Compass,
      isActive: pathname.startsWith('/career'),
    },
    {
      label: t('nav_saved', 'Saved'),
      href: '/saved',
      icon: Bookmark,
      isActive: pathname.startsWith('/saved'),
    },
    {
      label: t('nav_settings', 'Settings'),
      href: '/settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings') || pathname.startsWith('/account'),
    },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="print:hidden fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-[#dec9a5] bg-[#ffffff]/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(8,32,70,0.06)]"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center py-1.5 transition-colors relative ${
                item.isActive ? 'text-[#082046] font-bold' : 'text-[#536780] hover:text-[#082046]'
              }`}
            >
              {item.isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#082046]" />
              )}
              <Icon className={`size-5 transition-transform ${item.isActive ? 'scale-110 text-[#082046]' : ''}`} />
              <span className="mt-1 text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

