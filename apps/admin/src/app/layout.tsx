import type { Metadata } from 'next';
// Font files ship with the app (no download from Google at runtime)
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ApplyFields Internal Portal',
    template: '%s · ApplyFields Internal Portal',
  },
  description: 'Internal tools for the ApplyFields team.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
