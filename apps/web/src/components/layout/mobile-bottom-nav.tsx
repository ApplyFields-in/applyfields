'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ComponentType } from 'react';
import { Bookmark, Home, LogIn, Search, User } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { openCommandPalette } from '@/components/search/command-palette';

/** Phones: Home · Search · Saved · Sign in (Profile once signed in). Career/Apply sit in the top capsule. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const signedIn = useSignedIn();

  const itemClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center py-1.5 transition-colors relative ${
      active ? 'text-[#082046] font-bold' : 'text-[#536780] hover:text-[#082046]'
    }`;

  const inner = (Icon: ComponentType<{ className?: string }>, label: string, active: boolean) => (
    <>
      {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#082046]" />}
      <Icon className={`size-5 transition-transform ${active ? 'scale-110 text-[#082046]' : ''}`} />
      <span className="mt-1 text-[10px] tracking-tight">{label}</span>
    </>
  );

  const isHome = pathname === '/';
  const isSaved = pathname.startsWith('/saved');
  const isSearch = pathname.startsWith('/search');
  const isAccount = ['/profile', '/settings', '/account', '/login'].some((p) => pathname.startsWith(p));

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="print:hidden fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(8,32,70,0.06)]"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        <Link href="/" data-tour="home" className={itemClass(isHome)} aria-current={isHome ? 'page' : undefined}>
          {inner(Home, t('nav_home', 'Home'), isHome)}
        </Link>
        <button type="button" onClick={openCommandPalette} data-tour="search" className={itemClass(isSearch)}>
          {inner(Search, t('nav_search_short', 'Search'), isSearch)}
        </button>
        <Link href="/saved" data-tour="saved" className={itemClass(isSaved)} aria-current={isSaved ? 'page' : undefined}>
          {inner(Bookmark, t('nav_saved', 'Saved'), isSaved)}
        </Link>
        {signedIn ? (
          <Link href="/profile" data-tour="profile" className={itemClass(isAccount)} aria-current={isAccount ? 'page' : undefined}>
            {inner(User, t('nav_profile_short', 'Profile'), isAccount)}
          </Link>
        ) : (
          <Link href="/login" data-tour="profile" className={itemClass(isAccount)}>
            {inner(LogIn, t('nav_sign_in', 'Sign in'), isAccount)}
          </Link>
        )}
      </div>
    </nav>
  );
}

/** Same signal the top navbar uses: a stored session, refreshed on 'auth-changed' and other tabs' changes. */
function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const sync = () =>
      setSignedIn(Boolean(localStorage.getItem('accessToken') || localStorage.getItem('currentUser')));
    sync();
    window.addEventListener('auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return signedIn;
}
