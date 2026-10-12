'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n/translations';
import { useLanguage } from '@/lib/i18n/language-context';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch Language / భాష మార్చండి / भाषा बदलें"
        className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#082046] shadow-[inset_1px_1px_3px_#e2e8f0] transition-colors hover:bg-white hover:text-[#0e7bf4]"
      >
        <Globe className="size-3.5 text-[#0e7bf4]" />
        <span>{activeLang.nativeName}</span>
        <ChevronDown className="size-3 text-[#526987]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-36 rounded-2xl border border-[#d3ddeb] bg-white py-1 shadow-xl animate-in fade-in slide-in-from-top-1 text-xs">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#71839b]">
            Select Language
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left transition-colors hover:bg-[#F0F4F8] ${
                  isSelected ? 'font-bold text-[#0e7bf4]' : 'text-[#082046]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </span>
                {isSelected && <Check className="size-3.5 text-[#0e7bf4]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
