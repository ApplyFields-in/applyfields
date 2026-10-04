import type { Metadata } from 'next';
// Font files ship with the app (no download from Google at runtime)
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ApplyFields — Every opportunity. One place.',
    template: '%s · ApplyFields',
  },
  description:
    'Government jobs, exams, scholarships, admissions, government services and career guidance — in one place.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
