'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, LogIn } from 'lucide-react';
import { buttonClass, cn, EmptyState, PageHeader } from '@applyfields/ui';
import { useLanguage } from '@/lib/i18n/language-context';
import type { OpportunityType, SavedList } from '@applyfields/types';
import { PrintExportButton } from '@/components/print-export-button';

type Filter = OpportunityType | 'service';

export function SavedPageHeader() {
  const { t } = useLanguage();

  return (
    <PageHeader
      eyebrow={t('saved_eyebrow', 'My space')}
      title={t('saved_title', 'Saved Opportunities')}
      description={t(
        'saved_desc',
        'Jobs, exams, scholarships, admissions and services you saved. We remind you before the last date and tell you when there’s an update.',
      )}
      icon={<Bookmark />}
    />
  );
}

export function SavedLoginRequired() {
  const { t } = useLanguage();

  return (
    <EmptyState
      icon={<LogIn />}
      title={t('saved_login_title', 'Log in to see what you saved')}
      text={t(
        'saved_login_desc',
        'Save opportunities and get reminders before the last date, plus admit cards and results as they come out.',
      )}
      action={
        <Link href="/login" className={buttonClass({ size: 'sm' })}>
          {t('nav_sign_in', 'Log in')}
        </Link>
      }
    />
  );
}

export function SavedPageNav({
  filters,
  activeFilter,
  data,
  itemsCount,
}: {
  filters: { key: Filter; label: string }[];
  activeFilter: Filter | null;
  data: SavedList;
  itemsCount: number;
}) {
  const { t } = useLanguage();

  const getFilterLabel = (key: Filter, fallback: string) => {
    switch (key) {
      case 'govt_job':
        return t('footer_gov_jobs', fallback);
      case 'exam':
        return t('footer_exams', fallback);
      case 'scholarship':
        return t('footer_scholarships', fallback);
      case 'admission':
        return t('footer_admissions', fallback);
      case 'service':
        return t('footer_services', fallback);
      default:
        return fallback;
    }
  };

  const kindOf = (i: SavedList['items'][number]): Filter => i.card?.type ?? 'service';
  const count = (f: Filter) => data.items.filter((i) => kindOf(i) === f).length;
  const chip = (active: boolean) =>
    cn(
      'clay-press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-clay',
      active ? 'bg-teal text-cream' : 'bg-cream',
    );

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Filter saved items" className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
        <Link href="/saved" className={chip(!activeFilter)} aria-current={!activeFilter ? 'page' : undefined}>
          {t('apps_all_filter', 'All')} ({data.total})
        </Link>
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/saved?type=${f.key}`}
            className={chip(activeFilter === f.key)}
            aria-current={activeFilter === f.key ? 'page' : undefined}
          >
            {getFilterLabel(f.key, f.label)} ({count(f.key)})
          </Link>
        ))}
      </nav>

      {itemsCount > 0 && (
        <PrintExportButton
          label={t('saved_export_btn', 'Export Saved Report / PDF')}
          documentTitle="My Saved Opportunities & Applications Report - ApplyFields"
        />
      )}
    </div>
  );
}

export function SavedEmptyState({ hasFilter }: { hasFilter: boolean }) {
  const { t } = useLanguage();

  return (
    <EmptyState
      icon={<Bookmark />}
      title={hasFilter ? t('saved_empty_title', 'Nothing saved here yet') : t('saved_empty_title', 'Nothing saved yet')}
      text={t(
        'saved_empty_desc',
        'Tap the bookmark on any job, exam, scholarship or admission to save it and get reminders.',
      )}
      action={
        <Link href="/jobs" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          {t('saved_explore_btn', 'Browse government jobs')}
        </Link>
      }
    />
  );
}
