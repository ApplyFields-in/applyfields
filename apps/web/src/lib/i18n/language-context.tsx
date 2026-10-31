'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  SUPPORTED_LANGUAGES,
  translations,
  type SupportedLanguage,
  type TranslationKey,
} from './translations';

interface LanguageContextType {
  locale: SupportedLanguage;
  language: SupportedLanguage;
  setLocale: (lang: SupportedLanguage) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  language: 'en',
  setLocale: () => {},
  setLanguage: () => {},
  t: (key: TranslationKey, fallback?: string) => fallback || key,
});

const STORAGE_KEY = 'applyfields_locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    // Read from localStorage or cookie
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && (saved === 'en' || saved === 'te' || saved === 'hi')) {
        setLocaleState(saved);
      }

      const handleLocaleEvent = (e: Event) => {
        const custom = e as CustomEvent<SupportedLanguage>;
        if (custom.detail && (custom.detail === 'en' || custom.detail === 'te' || custom.detail === 'hi')) {
          setLocaleState(custom.detail);
        } else {
          const current = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
          if (current && (current === 'en' || current === 'te' || current === 'hi')) {
            setLocaleState(current);
          }
        }
      };

      window.addEventListener('locale-changed', handleLocaleEvent);
      window.addEventListener('storage', handleLocaleEvent);

      return () => {
        window.removeEventListener('locale-changed', handleLocaleEvent);
        window.removeEventListener('storage', handleLocaleEvent);
      };
    }
  }, []);

  const setLocale = (lang: SupportedLanguage) => {
    setLocaleState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent('locale-changed', { detail: lang }));
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const langDict = translations[locale] || translations.en;
    const value = langDict[key];
    if (value) return value;
    return translations.en[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, language: locale, setLocale, setLanguage: setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
