'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PreferencesResponse } from '@applyfields/types';
import { apiGet } from '@/lib/api';
import { isOnboarded, markOnboarded } from './onboarded';

/**
 * On Home: a signed-in person who has never finished or skipped setup goes to /welcome.
 * Remembered per account on this browser; a failed request never redirects.
 */
export function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (!localStorage.getItem('currentUser') || isOnboarded()) return;
    } catch {
      return;
    }
    let cancelled = false;
    void apiGet<PreferencesResponse>('/me/preferences', undefined, { cache: 'no-store' }).then((res) => {
      if (cancelled || !res) return; // API down / signed out: leave Home alone
      if (res.preferences?.onboarded_at) {
        markOnboarded();
      } else {
        router.replace('/welcome');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
