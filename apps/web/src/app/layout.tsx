import type { Metadata } from 'next';
// Font files ship with the app (no download from Google at runtime)
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/language-context';

export const metadata: Metadata = {
  title: {
    default: 'ApplyFields — Every opportunity. One place.',
    template: '%s · ApplyFields',
  },
  description:
    'Government jobs, exams, scholarships, admissions, government services and career guidance — in one place.',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

