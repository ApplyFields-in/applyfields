'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { FloatingCapsuleNavbar } from '@/components/layout/floating-capsule-navbar';
import { DarkNavyFooter } from '@/components/layout/dark-navy-footer';
import { PasskeyEnrollModal } from '@/components/passkey-enroll-modal';
import { CookieConsentBanner } from '@/components/cookie-banner';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Landing pages that supply their own full-width hero/banner containers
  const isCustomBleed = pathname === '/' || pathname === '/apply' || pathname === '/career';

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-between text-[#082046]">
      <FloatingCapsuleNavbar />
      <main id="main" className="flex-1 w-full animate-rise">
        {isCustomBleed ? (
          children
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        )}
      </main>
      <DarkNavyFooter />
      <PasskeyEnrollModal />
      <CookieConsentBanner />
    </div>
  );
}

