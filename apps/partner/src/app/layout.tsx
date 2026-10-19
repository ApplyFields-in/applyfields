import type { Metadata } from 'next';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { PartnerAuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: {
    default: 'ApplyFields Partner Portal · Operator Desk',
    template: '%s · ApplyFields Partner Portal',
  },
  description:
    'Dedicated operator workspace for MeeSeva centers, CSC digital seva hubs, Xerox printing shops, and application desks across India.',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
        <PartnerAuthProvider>{children}</PartnerAuthProvider>
      </body>
    </html>
  );
}
