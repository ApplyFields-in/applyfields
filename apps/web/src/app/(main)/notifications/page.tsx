import type { NotificationList, NotificationPreferences } from '@applyfields/types';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { NotificationInbox, NotificationSettings } from '@/components/notification-center';
import { ApiOffline } from '@/components/opportunity';
import { apiGetAsUser } from '@/lib/server-api';
import {
  NotificationsLoginRequired,
  NotificationsPageHeader,
} from '@/components/notifications-client-components';

export const metadata = { title: 'Notifications' };

/** Notification centre — GET /api/v1/notifications and /notifications/preferences. */
export default async function Page() {
  await connection();

  if (!(await cookies()).has('accessToken')) {
    return (
      <>
        <NotificationsPageHeader />
        <NotificationsLoginRequired />
      </>
    );
  }

  const [list, prefs] = await Promise.all([
    apiGetAsUser<NotificationList>('/notifications'),
    apiGetAsUser<NotificationPreferences>('/notifications/preferences'),
  ]);

  return (
    <>
      <NotificationsPageHeader />
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
