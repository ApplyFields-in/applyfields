'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type SupportedLocale = 'en' | 'te' | 'hi' | 'kn' | 'mr';

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'te', label: 'Telugu', nativeLabel: 'Telugu' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'Hindi' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'Kannada' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'Marathi' },
];

export interface TranslationDictionary {
  myBookings: string;
  findCenters: string;
  cart: string;
  signIn: string;
  signOut: string;
  partnerDesk: string;
  activeTokens: string;
  allBookings: string;
  readyCompleted: string;
  needsCorrection: string;
  counterPin: string;
  queueStatus: string;
  estimatedWait: string;
  downloadSlip: string;
  shareWhatsApp: string;
  reschedule: string;
  uploadCorrection: string;
  languageSelect: string;
}

const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    myBookings: 'My Bookings',
    findCenters: 'Find Centers',
    cart: 'Cart',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    partnerDesk: 'Partner Desk Login',
    activeTokens: 'Active Appointments',
    allBookings: 'All Bookings',
    readyCompleted: 'Ready & Completed',
    needsCorrection: 'Needs Correction',
    counterPin: 'Counter Presence PIN',
    queueStatus: 'Queue Status',
    estimatedWait: 'Estimated Wait',
    downloadSlip: 'Download Token Slip',
    shareWhatsApp: 'Share on WhatsApp',
    reschedule: 'Reschedule',
    uploadCorrection: 'Upload Replacement Document',
    languageSelect: 'Select Language',
  },
  te: {
    myBookings: 'Naa Bookinglu',
    findCenters: 'Kendralanu Kanugonandi',
    cart: 'Cart',
    signIn: 'Sign In Avvandi',
    signOut: 'Sign Out',
    partnerDesk: 'Partner Desk Login',
    activeTokens: 'Prastuta Bookinglu',
    allBookings: 'Anni Bookinglu',
    readyCompleted: 'Poorti Ayinavi',
    needsCorrection: 'Savarana Avasaram',
    counterPin: 'Counter Presence PIN',
    queueStatus: 'Varasa Kramam',
    estimatedWait: 'Aagavalasina Samayam',
    downloadSlip: 'Slip Download Cheyandi',
    shareWhatsApp: 'WhatsApp lo Share Cheyandi',
    reschedule: 'Samayam Marchandi',
    uploadCorrection: 'Sari Chesina Patram Upload Cheyandi',
    languageSelect: 'Bhasha Enchukondi',
  },
  hi: {
    myBookings: 'Meri Bookings',
    findCenters: 'Kendra Khojein',
    cart: 'Cart',
    signIn: 'Sign In Karein',
    signOut: 'Sign Out',
    partnerDesk: 'Partner Desk Login',
    activeTokens: 'Sakriya Bookings',
    allBookings: 'Sabhi Bookings',
    readyCompleted: 'Taiyar Aur Poorn',
    needsCorrection: 'Sudhar Aavashyak',
    counterPin: 'Counter Presence PIN',
    queueStatus: 'Katar Ki Sthiti',
    estimatedWait: 'Anumanit Samay',
    downloadSlip: 'Slip Download Karein',
    shareWhatsApp: 'WhatsApp Par Bhejein',
    reschedule: 'Samay Badlein',
    uploadCorrection: 'Sudhar Dastavej Upload Karein',
    languageSelect: 'Bhasha Chunein',
  },
  kn: {
    myBookings: 'Nanna Bookinggalu',
    findCenters: 'Kendragalannu Huduki',
    cart: 'Cart',
    signIn: 'Sign In Maadi',
    signOut: 'Sign Out',
    partnerDesk: 'Partner Desk Login',
    activeTokens: 'Sakriya Bookinggalu',
    allBookings: 'Ella Bookinggalu',
    readyCompleted: 'Siddhavagide',
    needsCorrection: 'Tiddupadi Bekagide',
    counterPin: 'Counter Presence PIN',
    queueStatus: 'Sarathiya Sthiti',
    estimatedWait: 'Kayuttiruva Samaya',
    downloadSlip: 'Slip Download Maadi',
    shareWhatsApp: 'WhatsApp nalli Hanchikolli',
    reschedule: 'Samaya Badalisi',
    uploadCorrection: 'Tiddidada Dakhaleyannu Upload Maadi',
    languageSelect: 'Bhashe Aayke Maadi',
  },
  mr: {
    myBookings: 'Majhya Bookings',
    findCenters: 'Kendre Shodha',
    cart: 'Cart',
    signIn: 'Sign In Kara',
    signOut: 'Sign Out',
    partnerDesk: 'Partner Desk Login',
    activeTokens: 'Sakriya Bookings',
    allBookings: 'Sarva Bookings',
    readyCompleted: 'Tayar Aani Purna',
    needsCorrection: 'Durusti Aavashyak',
    counterPin: 'Counter Presence PIN',
    queueStatus: 'Rangeni Sthiti',
    estimatedWait: 'Andajit Vel',
    downloadSlip: 'Slip Download Kara',
    shareWhatsApp: 'WhatsApp Var Pathva',
    reschedule: 'Vel Badla',
    uploadCorrection: 'Durust Dastavej Upload Kara',
    languageSelect: 'Bhasha Nivada',
  },
};

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (lang: SupportedLocale) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key, fallback) => fallback || key,
});

const STORAGE_KEY = 'applyfields_service_locale';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved && ['en', 'te', 'hi', 'kn', 'mr'].includes(saved)) {
        setLocaleState(saved);
      }
    }
  }, []);

  const setLocale = (lang: SupportedLocale) => {
    setLocaleState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
      window.dispatchEvent(new CustomEvent('locale-changed', { detail: lang }));
    }
  };

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
