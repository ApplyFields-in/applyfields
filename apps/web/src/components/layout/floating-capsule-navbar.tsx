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
    <header className="sticky top-4 z-50 mx-auto w-full max-w-[1360px] px-2 sm:px-4 mb-5 sm:mb-8">
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1fr_auto_1fr] items-center">
        {/* Left: Brand + Nav Links */}
        <div className="flex min-w-0 items-center justify-start gap-2 sm:gap-4 rounded-[32px] border border-white bg-[#F0F4F8] px-3.5 py-2 sm:px-5 sm:py-2.5 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            {/* Origami-style ApplyFields Logo */}
            <Image src="/logo-mark.png" alt="ApplyFields Logo" width={36} height={36} unoptimized className="size-9 shrink-0 object-contain transition-transform group-hover:scale-105" />
            <span className="hidden whitespace-nowrap text-base sm:text-lg font-black tracking-tight text-[#082046] sm:inline">
              Apply<span className="text-[#0e7bf4]">Fields</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-xs font-bold text-[#435775] md:flex">
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
                isHome ? 'text-[#0e7bf4]' : 'hover:bg-white hover:text-[#082046]'
              }`}
            >
              <Home className="size-3.5" />
              <span>{t('nav_home', 'Home')}</span>
            </Link>
            <Link
              href="/community"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors ${
                isCommunity ? 'text-[#0e7bf4]' : 'hover:bg-white hover:text-[#082046]'
              }`}
            >
              <MessageSquare className="size-3.5" />
              <span>{t('nav_community', 'Community')}</span>
            </Link>
            <Link
              href="/documents"
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors hover:bg-white hover:text-[#082046]"
            >
              <FolderOpen className="size-3.5" />
              <span>{t('nav_documents', 'Resources')}</span>
            </Link>
          </nav>
        </div>

        {/* Center: Career / Apply / Services Mode Switcher Capsule */}
        <div className="flex items-center justify-center justify-self-center rounded-full border border-white bg-[#F0F4F8] p-1.5 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
          <div className="flex items-center gap-1 rounded-full bg-[#edf2f8] p-1 shadow-[inset_2px_2px_5px_#d8e0eb,inset_-2px_-2px_5px_#ffffff]">
            <Link
              href="/career"
              className={`flex min-w-[70px] sm:min-w-[74px] flex-col items-center gap-0.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                isCareer
                  ? 'bg-[#F0F4F8] text-[#0e7bf4] shadow-[3px_3px_7px_#d8e0eb,-3px_-3px_7px_#ffffff]'
                  : 'text-[#082046] hover:text-[#0e7bf4]'
              }`}
            >
              <Briefcase className="size-3.5 text-[#0e7bf4]" />
              <span>{t('nav_career', 'Career')}</span>
            </Link>
            <Link
              href="/apply"
              className={`flex min-w-[70px] sm:min-w-[74px] flex-col items-center gap-0.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                isApply
                  ? 'bg-[#F0F4F8] text-[#0e7bf4] shadow-[3px_3px_7px_#d8e0eb,-3px_-3px_7px_#ffffff]'
                  : 'text-[#082046] hover:text-[#0e7bf4]'
              }`}
            >
              <Send className="size-3.5 text-[#0e7bf4]" />
              <span>{t('nav_apply', 'Apply')}</span>
            </Link>
            <a
              href={SERVICE_PORTAL_URL}
              className="flex min-w-[70px] sm:min-w-[74px] flex-col items-center gap-0.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all text-[#082046] hover:text-[#0e7bf4] relative group"
              title="Citizen Services: MeeSeva, CSC, PAN, Aadhaar & Xerox"
            >
              <Printer className="size-3.5 text-[#0e7bf4]" />
              <span className="flex items-center gap-1">
                <span>Services</span>
                <span className="text-[8px] font-black uppercase text-[#0e7bf4] bg-[#e0edfb] px-1 py-0.2 rounded-full">New</span>
              </span>
            </a>
          </div>
        </div>

        {/* Right: Search + Notifications + Saved + User Avatar / Sign In */}
        <div className="flex items-center justify-end justify-self-end gap-1.5 sm:gap-2 rounded-[32px] border border-white bg-[#F0F4F8] px-3 sm:px-4 py-2 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
          {/* Search Input Pill */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <div className="flex w-32 sm:w-36 lg:w-44 items-center rounded-full bg-[#e8eef6] px-3 py-1.5 shadow-[inset_3px_3px_6px_#d5deea,inset_-3px_-3px_6px_#ffffff] transition-all focus-within:ring-2 focus-within:ring-[#0e7bf4]/20">
              <Search className="mr-1.5 size-3.5 shrink-0 text-[#526987]" />
              <input
                type="text"
                placeholder={t('nav_search', 'Search...')}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full bg-transparent text-xs text-[#082046] placeholder:text-[#71839b] outline-none"
              />
            </div>
          </form>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative rounded-full p-2 text-[#082046] transition-colors hover:bg-white hover:text-[#0e7bf4]"
            title={t('nav_notifications', 'Notifications')}
          >
            <Bell className="size-3.5 sm:size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-[#0e7bf4] rounded-full" />
          </Link>

          {/* Bookmarks / Saved */}
          <Link
            href="/saved"
            className="hidden sm:block rounded-full p-2 text-[#082046] transition-colors hover:bg-white hover:text-[#0e7bf4]"
            title={t('nav_saved', 'Saved Opportunities')}
          >
            <Bookmark className="size-3.5 sm:size-4" />
          </Link>

          {/* User Profile Pill & Dropdown / Sign in & Register */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label={`Account menu for ${displayName}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-[#ffffff]"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-[#0e7bf4] text-[11px] font-bold text-[#ffffff] shadow-sm">
                  {initials || <User className="size-3.5" aria-hidden="true" />}
                </div>
                <span className="hidden max-w-[100px] truncate text-sm font-medium text-[#082046] sm:inline">{displayName}</span>
                <ChevronDown className="size-3 text-[#435775]" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-[#d3ddeb] bg-[#ffffff] py-1.5 text-xs shadow-xl animate-in fade-in slide-in-from-top-1">
                  <div className="border-b border-[#e3eaf3] px-3.5 py-2">
                    <p className="truncate font-bold text-[#082046]">{displayName}</p>
                    <p className="truncate text-[11px] text-[#536780]">{user.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3.5 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <User className="size-3.5 text-[#536780]" /> {t('nav_profile', 'My Profile')}
                  </Link>
                  <Link href="/community" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3.5 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <MessageSquare className="size-3.5 text-[#536780]" /> {t('nav_community', 'Community Discussions')}
                  </Link>
                  <Link href="/applications" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3.5 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <Send className="size-3.5 text-[#536780]" /> {t('nav_applications', 'My Applications')}
                  </Link>
                  <Link href="/saved" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3.5 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <Bookmark className="size-3.5 text-[#536780]" /> {t('nav_saved', 'Saved Items')}
                  </Link>
                  <Link href="/account" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3.5 py-2 text-[#334a69] hover:bg-[#f4f7fb]">
                    <Settings className="size-3.5 text-[#536780]" /> Settings &amp; Security
                  </Link>
                  <a
                    href={PARTNER_PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-emerald-600 hover:bg-[#ecfdf5] font-semibold"
                  >
                    <Building2 className="size-3.5 text-emerald-600" /> Partner Portal (MeeSeva/CSC)
                  </a>
                  <div className="my-1 border-t border-[#e3eaf3]" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[#be123c] hover:bg-[#fff1f2]">
                    <LogOut className="size-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>

          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-2xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white shadow-clay-btn-azure transition hover:bg-[#0c6fdc] active:scale-95"
              >
                <User className="size-3.5" />
                <span>Sign in / Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
