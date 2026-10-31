'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/language-context';

export function CommunityPageHeader() {
  const { t } = useLanguage();

  return (
    <div className="rounded-3xl border border-line/60 bg-gradient-to-br from-cream/40 via-canvas to-cream/20 p-6 sm:p-8 shadow-sm">
      <div className="max-w-2xl space-y-2">
        <span className="inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal">
          {t('community_badge', 'ApplyFields Community')}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-teal sm:text-3xl">
          {t('community_title', 'Candidate Discussions & Peer Q&A')}
        </h1>
        <p className="text-xs sm:text-sm text-teal/80 leading-relaxed">
          {t('community_desc', 'Ask questions regarding upcoming examination dates, hall ticket downloads, cutoff predictions, and syllabus breakdowns. Share verified notifications and connect with fellow aspirants.')}
        </p>
      </div>
    </div>
  );
}
