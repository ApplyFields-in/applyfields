/**
 * App language (English · Telugu · Hindi). Changing it persists the locale and
 * re-renders every screen that reads it, so useApi re-fetches and the API — via
 * the Accept-Language header — returns opportunity, service and career content
 * in the chosen language. The same three codes the website uses ('en'/'te'/'hi').
 */
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { loadLocale, setLocale as persistLocale } from './api';

export type Locale = 'en' | 'te' | 'hi';

export const LANGUAGES: { code: Locale; nativeName: string; name: string }[] = [
  { code: 'en', nativeName: 'English', name: 'English' },
  { code: 'te', nativeName: 'తెలుగు', name: 'Telugu' },
  { code: 'hi', nativeName: 'हिन्दी', name: 'Hindi' },
];

interface LocaleValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Pull the saved locale into memory before the first data fetch.
  useEffect(() => {
    void loadLocale().then((saved) => setLocaleState(saved as Locale));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next); // flips the useApi dependency, so screens re-fetch
    void persistLocale(next); // updates the request header + SecureStore
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleValue {
  const ctx = use(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}
