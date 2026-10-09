import type { AdminNotificationOverview, DeliveryStatus } from '@applyfields/types';
import { Badge, Card, cn, EmptyState, PageHeader } from '@applyfields/ui';
import { Bell, Inbox } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ApiOffline } from '@/components/admin-shell';
import { ManualAlertForm, RetryDeliveryButton } from '@/components/notifications-ui';
import { apiGet } from '@/lib/api';

export const metadata = { title: 'Notifications' };

const TABS: { key: DeliveryStatus | null; label: string }[] = [
  { key: null, label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'failed', label: 'Failed' },
];

const STATUS_TONE: Record<DeliveryStatus, 'teal' | 'celadon' | 'tea' | 'outline'> = {
  sent: 'teal',
  delivered: 'teal',
  pending: 'celadon',
  failed: 'outline',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

/** Internal Portal → Notifications: the email queue and manual alerts. GET /admin/notifications */
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await connection();
  const sp = await searchParams;
  const status = TABS.some((t) => t.key === sp.status) ? (sp.status as DeliveryStatus) : null;
  const data = await apiGet<AdminNotificationOverview>(`/admin/notifications${status ? `?status=${status}` : ''}`);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Notifications"
        description="Reminders, update alerts and manual alerts. Every notification is in-app; emails go through Resend and are retried up to 3 times."
        icon={<Bell />}
      />

      {data === null ? (
        <ApiOffline />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Emails sent', value: data.counts.sent + data.counts.delivered },
                { label: 'Pending', value: data.counts.pending },
                { label: 'Failed', value: data.counts.failed },
                { label: 'In-app (unread)', value: `${data.counts.in_app_total} (${data.counts.in_app_unread})` },
              ].map((s) => (
                <Card key={s.label} className="p-4">
                  <p className="text-xs font-semibold text-teal/80">{s.label}</p>
                  <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
                </Card>
              ))}
            </div>

            <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <Link
                  key={t.label}
                  href={t.key ? `/notifications?status=${t.key}` : '/notifications'}
                  aria-current={status === t.key ? 'page' : undefined}
                  className={cn(
                    'clay-press rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-clay',
                    status === t.key ? 'bg-teal text-cream' : 'bg-cream',
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            {data.items.length === 0 ? (
              <EmptyState icon={<Inbox />} title="No emails here" text="Emails appear here once a reminder, update or manual alert goes out." />
            ) : (
              <Card className="overflow-x-auto p-0">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs text-teal/80">
                    <tr className="border-b border-line">
                      <th className="px-4 py-3 font-semibold">Notification</th>
                      <th className="px-4 py-3 font-semibold">To</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">When</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((d) => (
                      <tr key={d.id} className="border-b border-line last:border-0 align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{d.title}</p>
                          <p className="text-xs text-teal/80">
                            {d.type.replace(/_/g, ' ')} · {d.channel}
                          </p>
                          {d.last_error && <p className="mt-1 text-xs text-teal/80">Error: {d.last_error}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs">{d.user_email ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                          <p className="mt-1 text-xs text-teal/80">
                            {d.attempts} attempt{d.attempts === 1 ? '' : 's'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs">{when(d.sent_at ?? d.created_at)}</td>
                        <td className="px-4 py-3">{d.status === 'failed' && <RetryDeliveryButton id={d.id} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          <ManualAlertForm />
        </div>
      )}
    </>
  );
}
