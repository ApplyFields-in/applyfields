'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bookmark, ExternalLink } from 'lucide-react';
import type { OpportunityCard, OpportunityType } from '@applyfields/types';
import { formatDate } from '@/lib/format';
import { apiPut, apiDelete } from '@/lib/api';
import { useLanguage } from '@/lib/i18n/language-context';

export interface ExtendedOpportunityCard extends Omit<OpportunityCard, 'type'> {
  type: OpportunityType | 'service';
}

export function HorizontalOpportunityCard({
  item,
  officialDomain,
}: {
  item: ExtendedOpportunityCard;
  officialDomain?: string;
}) {
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(Boolean(item.saved));

  // Determine official domain from item or known patterns
  const domain =
    officialDomain ||
    (item.organization?.toLowerCase().includes('banking') || item.title?.toLowerCase().includes('ibps')
      ? 'ibps.in'
      : item.organization?.toLowerCase().includes('railway') || item.title?.toLowerCase().includes('rrb')
        ? 'rrbcdg.gov.in'
        : item.organization?.toLowerCase().includes('ssc') || item.title?.toLowerCase().includes('cgl')
          ? 'ssc.gov.in'
          : item.organization?.toLowerCase().includes('nta') || item.title?.toLowerCase().includes('cuet') || item.title?.toLowerCase().includes('neet')
            ? 'exams.nta.ac.in'
            : item.organization?.toLowerCase().includes('kpsc')
              ? 'kpsc.kar.nic.in'
              : item.organization?.toLowerCase().includes('scholarship') || item.title?.toLowerCase().includes('scholarship')
                ? 'scholarships.gov.in'
                : item.type === 'service'
                  ? 'passportindia.gov.in'
                  : 'official.gov.in');

  // Human-readable type label
  const typeLabel =
    item.type === 'govt_job'
      ? t('card_type_govt_job')
      : item.type === 'exam'
        ? t('card_type_exam')
        : item.type === 'scholarship'
          ? t('card_type_scholarship')
          : item.type === 'admission'
            ? t('card_type_admission')
            : t('card_type_service');

  // Eligibility chips
  const eligibilityLabel =
    item.qualification?.toLowerCase().includes('graduate') || item.qualification?.toLowerCase().includes('bachelor')
      ? t('card_qual_graduate')
      : item.qualification?.toLowerCase().includes('12th')
        ? t('card_qual_12th')
        : item.type === 'scholarship'
          ? t('card_qual_income')
          : item.type === 'service'
            ? t('card_qual_citizen')
            : item.qualification || t('card_qual_eligible');

  const linkHref =
    item.type === 'govt_job'
      ? `/jobs/${item.slug}`
      : item.type === 'exam'
        ? `/exams/${item.slug}`
        : item.type === 'scholarship'
          ? `/scholarships/${item.slug}`
          : item.type === 'admission'
            ? `/admissions/${item.slug}`
            : `/services/${item.slug}`;

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    const nextState = !isSaved;
    setIsSaved(nextState);

    if (nextState) {
      await apiPut(`/saved/opportunity/${item.slug}`);
    } else {
      await apiDelete(`/saved/opportunity/${item.slug}`);
    }
  }

  const deadlineFormatted = item.last_date ? formatDate(item.last_date) : t('card_rolling');
  const daysText =
    typeof item.days_left === 'number'
      ? item.days_left > 0
        ? ` · ${item.days_left}${t('card_days_left_short')}`
        : ` · ${t('card_closing_today')}`
      : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Info Column */}
      <div className="space-y-2 min-w-0 flex-1">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {typeLabel}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0e7bf4] flex items-center gap-1">
            <span>✓</span>
            <span>{eligibilityLabel}</span>
          </span>
        </div>

        {/* Opportunity Title & Source */}
        <div>
          <Link
            href={linkHref}
            className="font-bold text-base text-slate-900 hover:text-[#0e7bf4] transition-colors leading-snug line-clamp-1"
          >
            {item.title}
          </Link>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {t('card_source')}: {item.organization || 'Official Portal'}
          </p>
        </div>
      </div>

      {/* Right Metrics & Actions (Matching Images 2 & 5) */}
      <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
        {/* Official Route */}
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('card_official_route')}</p>
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-700 hover:text-[#0e7bf4] flex items-center gap-1 mt-0.5 font-mono"
          >
            <span>{domain}</span>
            <ExternalLink className="size-3 text-slate-400" />
          </a>
        </div>

        {/* Deadline */}
        <div className="text-left min-w-[100px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('card_deadline')}</p>
          <p className="text-xs font-semibold text-slate-800 mt-0.5">
            {deadlineFormatted}
            <span className="text-slate-500 font-normal">{daysText}</span>
          </p>
        </div>

        {/* Bookmark Action */}
        <button
          type="button"
          onClick={toggleSave}
          aria-label={isSaved ? t('card_remove_saved') : t('card_save_item')}
          className={`p-2 rounded-xl transition-colors ${
            isSaved ? 'text-[#0e7bf4] bg-blue-50' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bookmark className={`size-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* View Details Action */}
        <Link
          href={linkHref}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shrink-0"
        >
          {t('card_view_details')}
        </Link>
      </div>
    </div>
  );
}
