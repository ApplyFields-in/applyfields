'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonClass } from '@applyfields/ui';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import { PixelAvatar } from '@/components/pixel-avatars';
import { apiGet, apiPost } from '@/lib/api';
import type { MeResponse, UserSummary } from '@applyfields/types';

export function TopNavAuth() {
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [avatarId, setAvatarId] = useState<string>('pixel-scholar');
  const [displayName, setDisplayName] = useState<string>('');

  const syncAuth = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const storedUserRaw = localStorage.getItem('currentUser');

    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw) as UserSummary;
        setUser(parsed);
        const nameFallback = parsed.email ? parsed.email.split('@')[0] : parsed.phone || 'Citizen';
        setDisplayName(nameFallback);
      } catch {
        // parse failure fallback
      }
    }

    // Verify and sync profile avatar with backend using httpOnly cookie
    const me = await apiGet<MeResponse>('/me');
    if (me && me.user) {
      setUser(me.user);
      if (me.profile?.avatar_url) {
        setAvatarId(me.profile.avatar_url);
      }
      if (me.profile?.full_name?.trim()) {
        setDisplayName(me.profile.full_name.trim());
      } else if (me.user.email) {
        setDisplayName(me.user.email.split('@')[0]);
      }
    } else {
      setUser(null);
      setAvatarId('pixel-scholar');
      setDisplayName('');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      await syncAuth();
      if (mounted) {
        setHasChecked(true);
      }
    }

    init();

    function handleAuthEvent() {
      syncAuth();
    }

    window.addEventListener('auth-changed', handleAuthEvent);
    window.addEventListener('storage', handleAuthEvent);

    return () => {
      mounted = false;
      window.removeEventListener('auth-changed', handleAuthEvent);
      window.removeEventListener('storage', handleAuthEvent);
    };
  }, [syncAuth]);

  async function handleLogout() {
    await apiPost('/auth/logout');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('auth-changed'));
    }

    setUser(null);
    router.push('/login');
  }

  // Before client mount and initial check, render default buttons to avoid hydration mismatch
  if (!hasChecked) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={buttonClass({ variant: 'secondary', className: 'hidden sm:inline-flex' })}>
          <LogIn aria-hidden="true" /> Log in
        </Link>
        <Link href="/register" className={buttonClass()}>
          <UserPlus aria-hidden="true" /> Register
        </Link>
      </div>
    );
  }

  // When logged in as a citizen
  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* Tactile Citizen Profile pill */}
        <Link
          href="/profile"
          title="Go to Citizen Profile"
          className="flex items-center gap-2 rounded-full border border-line bg-cream px-2 py-1 pr-3 shadow-xs hover:border-sea/60 hover:bg-tea/30 active:translate-y-0.5 transition-all group"
        >
          <div className="size-7 rounded-full bg-tea/40 border border-line overflow-hidden flex items-center justify-center shrink-0">
            <PixelAvatar avatarId={avatarId} size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-teal max-w-[120px] sm:max-w-[150px] truncate leading-tight group-hover:text-sea transition-colors">
              {displayName || 'Citizen Profile'}
            </span>
            <span className="text-[10px] font-bold text-sea/80 leading-tight hidden sm:block">
              Citizen Account
            </span>
          </div>
        </Link>

        {/* Tactile Log Out button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Log out of your account"
          className="h-9 px-3 rounded-xl border border-line bg-cream text-teal/80 hover:text-teal hover:bg-tea/30 text-xs font-bold active:translate-y-0.5 transition-all flex items-center gap-1.5 shadow-xs"
        >
          <LogOut className="size-3.5 text-sea" />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    );
  }

  // Not logged in
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className={buttonClass({ variant: 'secondary', className: 'hidden sm:inline-flex' })}>
        <LogIn aria-hidden="true" /> Log in
      </Link>
      <Link href="/register" className={buttonClass()}>
        <UserPlus aria-hidden="true" /> Register
      </Link>
    </div>
  );
}
