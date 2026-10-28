'use client';

import React, { useState, useEffect } from 'react';
import {
  Languages,
  Type,
  SunMedium,
  Eye,
  Check,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import type { SupportedLanguage } from '@/lib/i18n/translations';
import { showAppToast } from '@/components/toast-notification-provider';

export type TextScale = 'normal' | 'medium' | 'large';
export type ReadingTheme = 'default' | 'sepia' | 'high-contrast';

const TEXT_SCALE_MAP: Record<TextScale, { label: string; scale: string; fontSize: string }> = {
  normal: { label: 'Normal (100%)', scale: '100%', fontSize: '16px' },
  medium: { label: 'Medium (115%)', scale: '115%', fontSize: '18px' },
  large: { label: 'Large (130%)', scale: '130%', fontSize: '20px' },
};

const READING_THEMES: Record<ReadingTheme, { label: string; desc: string; icon: any; previewBg: string; previewText: string; previewBorder: string }> = {
  default: {
    label: 'Modern Clean',
    desc: 'Standard daylight interface with crisp contrast',
    icon: SunMedium,
    previewBg: 'bg-[#ffffff]',
    previewText: 'text-[#082046]',
    previewBorder: 'border-[#dec9a5]',
  },
  sepia: {
    label: 'Warm Sepia',
    desc: 'Soft warm tint that reduces eye strain during late-night study sessions',
    icon: Eye,
    previewBg: 'bg-[#f4ebd0]',
    previewText: 'text-[#432c12]',
    previewBorder: 'border-[#cbb387]',
  },
  'high-contrast': {
    label: 'High-Contrast Navy',
    desc: 'Deep navy background with maximum legible text contrast',
    icon: Moon,
    previewBg: 'bg-[#08182e]',
    previewText: 'text-[#ffffff]',
    previewBorder: 'border-[#38bdf8]',
  },
};

export function AccessibilityReadingSettings() {
  const { locale, setLocale } = useLanguage();
  const [textScale, setTextScale] = useState<TextScale>('normal');
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('default');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load text scale
    const savedScale = (localStorage.getItem('applyfields_text_scale') as TextScale) || 'normal';
    if (TEXT_SCALE_MAP[savedScale]) {
      setTextScale(savedScale);
      applyTextScale(savedScale);
    }

    // Load reading theme
    const savedTheme = (localStorage.getItem('applyfields_reading_theme') as ReadingTheme) || 'default';
    if (READING_THEMES[savedTheme]) {
      setReadingTheme(savedTheme);
      applyReadingTheme(savedTheme);
    }
  }, []);

  const applyTextScale = (scale: TextScale) => {
    setTextScale(scale);
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = TEXT_SCALE_MAP[scale].fontSize;
      localStorage.setItem('applyfields_text_scale', scale);
      window.dispatchEvent(new CustomEvent('text-scale-changed', { detail: scale }));
    }
  };

  const applyReadingTheme = (theme: ReadingTheme) => {
    setReadingTheme(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reading-theme', theme);
      localStorage.setItem('applyfields_reading_theme', theme);
      window.dispatchEvent(new CustomEvent('reading-theme-changed', { detail: theme }));
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLocale(lang);
    showAppToast({
      message: `Language updated to ${lang === 'te' ? 'Telugu (తెలుగు)' : lang === 'hi' ? 'Hindi (हिन्दी)' : 'English'}`,
      type: 'success',
    });
  };

  return (
    <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Eye className="size-5 text-[#0e7bf4]" />
        <div>
          <h2 className="text-lg font-bold text-[#082046]">Display, Language &amp; Reading Comfort</h2>
          <p className="text-xs text-[#536780]">
            Customize language, font magnification, and reading modes for comfortable late-night sessions.
          </p>
        </div>
      </div>

      {/* 1. Language Option */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#76562d] flex items-center gap-1.5">
          <Languages className="size-3.5 text-[#0e7bf4]" /> Preferred Language:
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[
            { key: 'en' as SupportedLanguage, label: 'English', sub: 'Standard interface' },
            { key: 'te' as SupportedLanguage, label: 'తెలుగు (Telugu)', sub: 'ఆంధ్రప్రదేశ్ & తెలంగాణ' },
            { key: 'hi' as SupportedLanguage, label: 'हिन्दी (Hindi)', sub: 'उत्तर भारत व केंद्र सरकार' },
          ].map((l) => {
            const isActive = locale === l.key;
            return (
              <button
                key={l.key}
                type="button"
                onClick={() => handleLanguageChange(l.key)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#082046] bg-[#F4E8D1] shadow-xs'
                    : 'border-[#dec9a5] bg-[#f8f5ef] hover:bg-white text-[#243b5b]'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-bold text-[#082046]">{l.label}</span>
                  {isActive && <Check className="size-4 text-[#082046]" />}
                </div>
                <span className="text-[11px] text-[#536780] mt-0.5">{l.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Text Resizing Controls (A- / A / A+) */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-[#76562d] flex items-center gap-1.5">
          <Type className="size-3.5 text-[#0e7bf4]" /> Text Size &amp; Magnification:
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          {(['normal', 'medium', 'large'] as TextScale[]).map((scale) => {
            const isActive = textScale === scale;
            return (
              <button
                key={scale}
                type="button"
                onClick={() => {
                  applyTextScale(scale);
                  showAppToast({ message: `Text size set to ${TEXT_SCALE_MAP[scale].label}` });
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#082046] bg-[#082046] text-[#ffffff] shadow-sm'
                    : 'border-[#dec9a5] bg-[#f8f5ef] text-[#082046] hover:bg-white'
                }`}
              >
                <span>{TEXT_SCALE_MAP[scale].label}</span>
                {isActive && <Check className="size-3.5 text-amber-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. High-Contrast / Warm Sepia Reading Mode */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold uppercase tracking-wider text-[#76562d] flex items-center gap-1.5">
          <Eye className="size-3.5 text-[#0e7bf4]" /> Reading Theme &amp; Glare Reduction:
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(READING_THEMES) as ReadingTheme[]).map((themeKey) => {
            const item = READING_THEMES[themeKey];
            const isActive = readingTheme === themeKey;
            const Icon = item.icon;

            return (
              <button
                key={themeKey}
                type="button"
                onClick={() => {
                  applyReadingTheme(themeKey);
                  showAppToast({ message: `Reading theme set to ${item.label}` });
                }}
                className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#082046] ring-2 ring-[#082046]/20 bg-[#f8f5ef]'
                    : 'border-[#dec9a5]/70 bg-white hover:border-[#dec9a5]'
                }`}
              >
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="size-4 text-[#76562d]" />
                      <span className="text-xs font-bold text-[#082046]">{item.label}</span>
                    </div>
                    {isActive && <Check className="size-4 text-[#082046]" />}
                  </div>

                  {/* Visual Preview Box */}
                  <div className={`rounded-md border p-2 text-[10px] ${item.previewBg} ${item.previewText} ${item.previewBorder}`}>
                    Aa Sample Notification Text
                  </div>

                  <p className="text-[11px] text-[#536780] leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

