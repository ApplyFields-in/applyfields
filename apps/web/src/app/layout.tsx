import type { Metadata } from 'next';
// Font files ship with the app (no download from Google at runtime)
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/language-context';
import { PipApplyProvider } from '@/context/pip-apply-context';
import { PipApplyCompanion } from '@/components/apply/pip-apply-companion';
import { RealtimeNotificationToast } from '@/components/realtime-notification-toast';
import { NotificationPermissionPrompt } from '@/components/notification-permission-prompt';
import { FloatingAiAssistant } from '@/components/chat/floating-ai-assistant';
import { ScrollToTop } from '@applyfields/ui';
import { PageViewTracker } from '@/components/page-view-tracker';
import { OfflineScreen } from '@/components/offline-screen';
import { SITE_URL } from '@/lib/urls';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ApplyFields — Every opportunity. One place.',
    template: '%s · ApplyFields',
  },
  description:
    'Government jobs, exams, scholarships, admissions, government services and career guidance — in one place.',
  openGraph: { siteName: 'ApplyFields', locale: 'en_IN', type: 'website' },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  // Safari's own "Open / Get" app banner on iPhone, once the app is on the App Store.
  ...(process.env.NEXT_PUBLIC_IOS_APP_STORE_ID ? { itunes: { appId: process.env.NEXT_PUBLIC_IOS_APP_STORE_ID } } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <LanguageProvider>
          <PipApplyProvider>
            {children}
            <PageViewTracker />
            <RealtimeNotificationToast />
            <NotificationPermissionPrompt />
            <PipApplyCompanion />
            <FloatingAiAssistant />
            <ScrollToTop />
            <OfflineScreen />
          </PipApplyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}


