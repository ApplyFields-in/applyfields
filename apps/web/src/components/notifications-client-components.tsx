'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, LogIn } from 'lucide-react';
import { buttonClass, EmptyState, PageHeader } from '@applyfields/ui';
import { useLanguage } from '@/lib/i18n/language-context';

export function NotificationsPageHeader() {
  const { t } = useLanguage();

  return (
    <PageHeader
      eyebrow={t('saved_eyebrow', 'My space')}
      title={t('notif_title', 'Notifications')}
      description={t(
        'notif_desc',
        'Reminders, admit cards, results and date changes for what you saved — only the ones you choose.',
      )}
      icon={<Bell />}
    />
  );
}

export function NotificationsLoginRequired() {
  const { t } = useLanguage();

  return (
    <EmptyState
      icon={<LogIn />}
      title={t('notif_login_title', 'Log in to see your notifications')}
      text={t(
        'notif_login_desc',
        'Save jobs and exams to get reminders before the last date and alerts when admit cards and results are out.',
      )}
      action={
        <Link href="/login" className={buttonClass({ size: 'sm' })}>
          {t('nav_sign_in', 'Log in')}
        </Link>
      }
    />
  );
}
