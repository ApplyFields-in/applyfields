import type { NotificationList, NotificationPreferences } from '@applyfields/types';
import { buttonClass, EmptyState, PageHeader } from '@applyfields/ui';
import { Bell, LogIn } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { connection } from 'next/server';
import { NotificationInbox, NotificationSettings } from '@/components/notification-center';
import { ApiOffline } from '@/components/opportunity';
import { apiGetAsUser } from '@/lib/server-api';

export const metadata = { title: 'Notifications' };

/** Notification centre — GET /api/v1/notifications and /notifications/preferences. */
export default async function Page() {
  await connection();
  const header = (
    <PageHeader
      eyebrow="My space"
      title="Notifications"
      description="Reminders, admit cards, results and date changes for what you saved — only the ones you choose."
      icon={<Bell />}
    />
  );

  if (!(await cookies()).has('accessToken')) {
    return (
      <>
        {header}
        <EmptyState
          icon={<LogIn />}
          title="Log in to see your notifications"
          text="Save jobs and exams to get reminders before the last date and alerts when admit cards and results are out."
          action={
            <Link href="/login" className={buttonClass({ size: 'sm' })}>
              Log in
            </Link>
          }
        />
      </>
    );
  }

  const [list, prefs] = await Promise.all([
    apiGetAsUser<NotificationList>('/notifications'),
    apiGetAsUser<NotificationPreferences>('/notifications/preferences'),
  ]);

  return (
    <>
      {header}
      {list === null || prefs === null ? (
        <ApiOffline />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <NotificationInbox initial={list} />
          <NotificationSettings initial={prefs} />
        </div>
      )}
    </>
  );
}
