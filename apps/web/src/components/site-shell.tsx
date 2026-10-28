'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { FloatingCapsuleNavbar } from '@/components/layout/floating-capsule-navbar';
import { DarkNavyFooter } from '@/components/layout/dark-navy-footer';
import { PasskeyEnrollModal } from '@/components/passkey-enroll-modal';
import { CookieConsentBanner } from '@/components/cookie-banner';
import { CompareProvider } from '@/components/opportunity-compare/compare-context';
import { CompareFloatingBar } from '@/components/opportunity-compare/compare-bar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { ToastNotificationProvider } from '@/components/toast-notification-provider';
import { CommandPalette } from '@/components/search/command-palette';
import { ReadingThemeInitializer } from '@/components/layout/reading-theme-initializer';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Landing pages that supply their own full-width hero/banner containers
  const isCustomBleed = pathname === '/' || pathname === '/apply' || pathname === '/career';

  return (
    <CompareProvider>
      <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-between text-[#082046]">
        <FloatingCapsuleNavbar />
        <main id="main" className="flex-1 w-full animate-rise pt-2 sm:pt-4 pb-16 sm:pb-0">
          {isCustomBleed ? (
            children
          ) : (
            <div className="mx-auto max-w-[1360px] px-4 pt-6 pb-12 sm:pt-8 sm:pb-16 sm:px-6 lg:px-8">
              {children}
            </div>
          )}
        </main>
        <DarkNavyFooter />
        <PasskeyEnrollModal />
        <CookieConsentBanner />
        <CompareFloatingBar />
        <MobileBottomNav />
        <ToastNotificationProvider />
        <CommandPalette />
        <ReadingThemeInitializer />
      </div>
    </CompareProvider>
  );
}

