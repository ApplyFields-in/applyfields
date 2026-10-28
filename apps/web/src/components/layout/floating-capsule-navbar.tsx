'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  Home,
  LogOut,
  Send,
  Search,
  Bell,
  Bookmark,
  FolderOpen,
  User,
  Settings,
  ChevronDown,
  MessageSquare,
  Building2,
  Printer,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type { MeResponse, UserSummary } from '@applyfields/types';
import { useLanguage } from '@/lib/i18n/language-context';
import { PARTNER_PORTAL_URL, SERVICE_PORTAL_URL } from '@/lib/urls';
import { openCommandPalette } from '@/components/search/command-palette';

export function FloatingCapsuleNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const [user, setUser] = useState<UserSummary | null>(null);
  const [displayName, setDisplayName] = useState<string>('Account');
  const [initials, setInitials] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const isCareer = pathname.startsWith('/career');
  const isApply = pathname.startsWith('/apply') || pathname.startsWith('/jobs') || pathname.startsWith('/exams') || pathname.startsWith('/scholarships') || pathname.startsWith('/admissions');
  const isHome = pathname === '/';
  const isCommunity = pathname.startsWith('/community');

  const syncAuth = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const storedUserRaw = localStorage.getItem('currentUser');
    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw) as UserSummary & { full_name?: string };
        setUser(parsed);
        const name = parsed.full_name || parsed.email?.split('@')[0] || 'Account';
        setDisplayName(name);
        const parts = name.trim().split(' ');
        setInitials(name === 'Account' ? '' : parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase());
      } catch {
        // fallback
      }
    }

    // Also sync from backend /me
    const me = await apiGet<MeResponse>('/me');
    if (me && me.user) {
      setUser(me.user);
      localStorage.setItem('currentUser', JSON.stringify(me.user));
      const name = me.profile?.full_name?.trim() || me.user.email?.split('@')[0] || 'Account';
      setDisplayName(name);
      const parts = name.trim().split(' ');
      setInitials(name === 'Account' ? '' : parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase());
    } else {
      // Session expired or unauthenticated — clear ghost user from navbar and storage
      setUser(null);
      setDisplayName('');
      setInitials('');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
    }
  }, []);

  useEffect(() => {
    syncAuth();

    function handleAuthEvent() {
      syncAuth();
    }
    window.addEventListener('auth-changed', handleAuthEvent);
    window.addEventListener('storage', handleAuthEvent);

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('auth-changed', handleAuthEvent);
      window.removeEventListener('storage', handleAuthEvent);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [syncAuth]);

  async function handleLogout() {
    await apiPost('/auth/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event('auth-changed'));
    }
    setUser(null);
    setDisplayName('');
    setInitials('');
    setDropdownOpen(false);
    router.push('/');
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  }

  return (
    <header className="sticky top-4 sm:top-6 z-50 mx-auto w-full max-w-[1460px] px-3 sm:px-6 mb-7 sm:mb-10">
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_auto_1fr] items-center">
        {/* Left: Brand + Nav Links */}
        <div className="flex min-w-0 items-center justify-start gap-4 sm:gap-6 rounded-[40px] border border-white bg-[#F0F4F8] px-5 py-3.5 sm:px-7 sm:py-4 shadow-[10px_14px_32px_-10px_rgba(8,32,70,0.24),-8px_-8px_24px_rgba(255,255,255,0.95)]">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {/* Origami-style ApplyFields Logo */}
            <Image src="/logo-mark.png" alt="ApplyFields Logo" width={48} height={48} unoptimized className="size-11 sm:size-12 shrink-0 object-contain transition-transform group-hover:scale-105" />
            <span className="hidden whitespace-nowrap text-xl sm:text-2xl font-black tracking-tight text-[#082046] sm:inline">
              Apply<span className="text-[#0e7bf4]">Fields</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 text-sm sm:text-base font-extrabold text-[#435775] md:flex">
            <Link
              href="/"
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors ${
                isHome ? 'text-[#0e7bf4] bg-white/70 shadow-sm' : 'hover:bg-white hover:text-[#082046]'
              }`}
            >
              <Home className="size-4 sm:size-4.5" />
              <span>{t('nav_home', 'Home')}</span>
            </Link>
            <Link
              href="/community"
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors ${
                isCommunity ? 'text-[#0e7bf4] bg-white/70 shadow-sm' : 'hover:bg-white hover:text-[#082046]'
              }`}
            >
              <MessageSquare className="size-4 sm:size-4.5" />
              <span>{t('nav_community', 'Community')}</span>
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors hover:bg-white hover:text-[#082046]"
            >
              <FolderOpen className="size-4 sm:size-4.5" />
              <span>{t('nav_documents', 'Resources')}</span>
            </Link>
          </nav>
        </div>

        {/* Center: Career / Apply / Services Mode Switcher Capsule */}
        <div className="flex items-center justify-center justify-self-center rounded-full border border-white bg-[#F0F4F8] p-2.5 shadow-[10px_14px_32px_-10px_rgba(8,32,70,0.24),-8px_-8px_24px_rgba(255,255,255,0.95)]">
          <div className="flex items-center gap-2 rounded-full bg-[#edf2f8] p-2 shadow-[inset_2px_2px_6px_#d8e0eb,inset_-2px_-2px_6px_#ffffff]">
            <Link
              href="/career"
              className={`flex min-w-[84px] sm:min-w-[96px] flex-col items-center gap-1 rounded-full px-3.5 py-2.5 text-xs sm:text-sm font-extrabold transition-all ${
                isCareer
                  ? 'bg-[#F0F4F8] text-[#0e7bf4] shadow-[3px_3px_8px_#d8e0eb,-3px_-3px_8px_#ffffff]'
                  : 'text-[#082046] hover:text-[#0e7bf4]'
              }`}
            >
              <Briefcase className="size-4 sm:size-4.5 text-[#0e7bf4]" />
              <span>{t('nav_career', 'Career')}</span>
            </Link>
            <Link
              href="/apply"
              className={`flex min-w-[84px] sm:min-w-[96px] flex-col items-center gap-1 rounded-full px-3.5 py-2.5 text-xs sm:text-sm font-extrabold transition-all ${
                isApply
                  ? 'bg-[#F0F4F8] text-[#0e7bf4] shadow-[3px_3px_8px_#d8e0eb,-3px_-3px_8px_#ffffff]'
                  : 'text-[#082046] hover:text-[#0e7bf4]'
              }`}
            >
              <Send className="size-4 sm:size-4.5 text-[#0e7bf4]" />
              <span>{t('nav_apply', 'Apply')}</span>
            </Link>
            <a
              href={SERVICE_PORTAL_URL}
              className="flex min-w-[84px] sm:min-w-[96px] flex-col items-center gap-1 rounded-full px-3.5 py-2.5 text-xs sm:text-sm font-extrabold transition-all text-[#082046] hover:text-[#0e7bf4] relative group"
              title="Citizen Services: MeeSeva, CSC, PAN, Aadhaar & Xerox"
            >
              <Printer className="size-4 sm:size-4.5 text-[#0e7bf4]" />
              <span className="flex items-center gap-1">
                <span>Services</span>
                <span className="text-[10px] font-black uppercase text-[#0e7bf4] bg-[#e0edfb] px-1.5 py-0.5 rounded-full">New</span>
              </span>
            </a>
          </div>
        </div>

        {/* Right: Search + Notifications + Saved + User Avatar / Sign In */}
        <div className="flex items-center justify-end justify-self-end gap-2.5 sm:gap-3.5 rounded-[40px] border border-white bg-[#F0F4F8] px-5 sm:px-6 py-3 sm:py-3.5 shadow-[10px_14px_32px_-10px_rgba(8,32,70,0.24),-8px_-8px_24px_rgba(255,255,255,0.95)]">
          {/* Search Input Pill with Ctrl+K shortcut badge */}
          <button
            type="button"
            onClick={openCommandPalette}
            className="relative hidden md:flex items-center w-40 sm:w-48 lg:w-60 rounded-full bg-[#e8eef6] px-4 py-2.5 shadow-[inset_3px_3px_6px_#d5deea,inset_-3px_-3px_6px_#ffffff] transition-all hover:bg-[#dce7f3] text-left cursor-pointer"
            title="Search everything (Ctrl + K)"
          >
            <Search className="mr-2 size-4 sm:size-4.5 shrink-0 text-[#526987]" />
            <span className="w-full text-xs sm:text-sm text-[#71839b] truncate">
              {t('nav_search', 'Search opportunities...')}
            </span>
            <kbd className="hidden lg:inline-flex items-center rounded border border-[#c4d2e3] bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#526987]">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative rounded-full p-2.5 sm:p-3 text-[#082046] transition-colors hover:bg-white hover:text-[#0e7bf4]"
            title={t('nav_notifications', 'Notifications')}
          >
            <Bell className="size-4.5 sm:size-5" />
            <span className="absolute top-2.5 right-2.5 size-2 bg-[#0e7bf4] rounded-full" />
          </Link>

          {/* Bookmarks / Saved */}
          <Link
            href="/saved"
            className="hidden sm:block rounded-full p-2.5 sm:p-3 text-[#082046] transition-colors hover:bg-white hover:text-[#0e7bf4]"
            title={t('nav_saved', 'Saved Opportunities')}
          >
            <Bookmark className="size-4.5 sm:size-5" />
          </Link>

          {/* User Profile Pill & Dropdown / Sign in & Register */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label={`Account menu for ${displayName}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-[#ffffff]"
              >
                <div className="flex size-10 sm:size-11 items-center justify-center rounded-full bg-[#0e7bf4] text-sm sm:text-base font-extrabold text-[#ffffff] shadow-sm">
                  {initials || <User className="size-4.5" aria-hidden="true" />}
                </div>
                <span className="hidden max-w-[130px] truncate text-sm sm:text-base font-bold text-[#082046] sm:inline">{displayName}</span>
                <ChevronDown className="size-3.5 text-[#435775]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 z-50 mt-2.5 w-60 rounded-2xl border border-[#d3ddeb] bg-[#ffffff] py-2 text-sm shadow-xl animate-in fade-in slide-in-from-top-1">
                  <div className="border-b border-[#e3eaf3] px-4 py-2.5">
                    <p className="truncate font-bold text-[#082046]">{displayName}</p>
                    <p className="truncate text-xs text-[#536780]">{user.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <User className="size-4 text-[#536780]" /> {t('nav_profile', 'My Profile')}
                  </Link>
                  <Link href="/community" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <MessageSquare className="size-4 text-[#536780]" /> {t('nav_community', 'Community Discussions')}
                  </Link>
                  <Link href="/applications" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <Send className="size-4 text-[#536780]" /> {t('nav_applications', 'My Applications')}
                  </Link>
                  <Link href="/saved" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <Bookmark className="size-4 text-[#536780]" /> {t('nav_saved', 'Saved Items')}
                  </Link>
                  <Link href="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <Settings className="size-4 text-[#536780]" /> Settings &amp; Security
                  </Link>
                  <a
                    href={PARTNER_PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-emerald-600 hover:bg-[#ecfdf5] font-semibold"
                  >
                    <Building2 className="size-4 text-emerald-600" /> Partner Portal (MeeSeva/CSC)
                  </a>
                  <div className="my-1 border-t border-[#e3eaf3]" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[#be123c] hover:bg-[#fff1f2] font-semibold">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>

          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-2xl bg-[#0e7bf4] px-6 py-3 text-sm sm:text-base font-extrabold text-white shadow-clay-btn-azure transition hover:bg-[#0c6fdc] active:scale-95"
              >
                <User className="size-4.5" />
                <span>Sign in / Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
