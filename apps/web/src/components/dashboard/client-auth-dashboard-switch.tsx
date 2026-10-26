'use client';

import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { HomeSummary } from '@applyfields/types';
import { LoggedInDashboard } from '@/components/dashboard/logged-in-dashboard';

interface ClientAuthDashboardSwitchProps {
  home: HomeSummary | null;
  publicDashboard: ReactNode;
  initialLoggedIn?: boolean;
}

export function ClientAuthDashboardSwitch({
  home,
  publicDashboard,
  initialLoggedIn = false,
}: ClientAuthDashboardSwitchProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [userName, setUserName] = useState('');

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('currentUser');
    const isParamAuth = typeof window !== 'undefined' && window.location.search.includes('auth=true');
    if (stored || isParamAuth) {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIsLoggedIn(true);
          if (parsed.full_name) {
            setUserName(parsed.full_name.split(' ')[0]);
          } else if (parsed.email) {
            setUserName(parsed.email.split('@')[0]);
          }
        } catch {
          setIsLoggedIn(true);
        }
      } else {
        setIsLoggedIn(true);
        setUserName('');
      }
    } else {
      setIsLoggedIn(initialLoggedIn);
    }
  }, [initialLoggedIn]);

  useEffect(() => {
    // Check auth on mount
    checkAuth();

    function handleAuthEvent() {
      checkAuth();
    }
    window.addEventListener('auth-changed', handleAuthEvent);
    window.addEventListener('storage', handleAuthEvent);

    return () => {
      window.removeEventListener('auth-changed', handleAuthEvent);
      window.removeEventListener('storage', handleAuthEvent);
    };
  }, [checkAuth]);

  // When user is logged in, show UI matching Images 1, 2, and 3
  if (isLoggedIn) {
    return (
      <div className="mx-auto max-w-[1360px] px-4 pt-2 sm:px-6 lg:px-8">
        <LoggedInDashboard initialHomeData={home} userName={userName} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
      {publicDashboard}
    </div>
  );
}

