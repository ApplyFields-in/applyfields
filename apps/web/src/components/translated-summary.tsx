'use client';

import React, { useState } from 'react';
import { Badge, Card } from '@applyfields/ui';
import { AlertCircle, Globe, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import type { SupportedLanguage } from '@/lib/i18n/translations';

interface TranslatedSummaryProps {
  summaryEn: string;
  summaryTe?: string | null;
  summaryHi?: string | null;
  officialNotificationUrl?: string | null;
}

export function TranslatedSummary({
  summaryEn,
  summaryTe,
  summaryHi,
  officialNotificationUrl,
}: TranslatedSummaryProps) {
  const { locale, t } = useLanguage();
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(locale || 'en');

  const currentText =
    activeLang === 'te'
      ? summaryTe || summaryEn
      : activeLang === 'hi'
        ? summaryHi || summaryEn
        : summaryEn;

  return (
    <Card className="p-5 border-line/80 bg-white shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-[#0e7bf4]" />
          <h3 className="text-sm font-bold text-[#082046]">Opportunity Overview &amp; Summary</h3>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center rounded-full bg-[#F0F4F8] p-1 border border-line/60">
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
              activeLang === 'en'
                ? 'bg-white text-[#0e7bf4] shadow-sm'
                : 'text-[#536780] hover:text-[#082046]'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('te')}
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
              activeLang === 'te'
                ? 'bg-white text-[#0e7bf4] shadow-sm'
                : 'text-[#536780] hover:text-[#082046]'
            }`}
          >
            తెలుగు
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('hi')}
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
              activeLang === 'hi'
                ? 'bg-white text-[#0e7bf4] shadow-sm'
                : 'text-[#536780] hover:text-[#082046]'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Summary Content */}
      <div className="text-xs sm:text-sm text-[#334a69] leading-relaxed whitespace-pre-line">
        {currentText}
      </div>

      {/* Authoritative Source Disclaimer */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="size-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">{t('disclaimer_title')}</span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {t('disclaimer_text')}
          </p>
          {officialNotificationUrl && (
            <a
              href={officialNotificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[11px] font-bold text-[#0e7bf4] underline hover:text-[#082046] mt-0.5"
            >
              Verify with Original Notification PDF →
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
