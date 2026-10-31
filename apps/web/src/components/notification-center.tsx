'use client';

import type {
  MutableNotificationType,
  NotificationItem,
  NotificationList,
  NotificationPreferences,
  NotificationPreferencesInput,
} from '@applyfields/types';
import { Badge, buttonClass, Card, cn, EmptyState, SectionTitle } from '@applyfields/ui';
import { Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL, apiPost, apiPut } from '@/lib/api';
import { useWebPush } from '@/lib/push/use-web-push';
import { useLanguage } from '@/lib/i18n/language-context';

const TYPE_LABEL: Partial<Record<NotificationItem['type'], string>> = {
  closing_reminder: 'Reminder',
  admit_card: 'Admit card',
  answer_key: 'Answer key',
  result: 'Result',
  correction_window: 'Correction window',
  date_change: 'Date change',
  saved_item_changed: 'Update',
  system: 'ApplyFields',
};

const MUTABLE: { key: MutableNotificationType; label: string }[] = [
  { key: 'closing_reminder', label: 'Last date and exam date reminders' },
  { key: 'admit_card', label: 'Admit cards' },
  { key: 'answer_key', label: 'Answer keys' },
  { key: 'result', label: 'Results' },
  { key: 'correction_window', label: 'Correction windows' },
  { key: 'date_change', label: 'Date changes and extensions' },
  { key: 'saved_item_changed', label: 'Other updates to saved items' },
];

const DAY_CHOICES = [30, 14, 7, 3, 1, 0];

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function NotificationInbox({ initial }: { initial: NotificationList }) {
  const { t } = useLanguage();
  const [list, setList] = useState(initial);

  async function read(id?: string) {
    const res = await apiPost(id ? `/notifications/${id}/read` : '/notifications/read-all');
    if (res.status >= 400) return;
    setList((l) => ({
      unread: id ? Math.max(0, l.unread - (l.items.find((i) => i.id === id && !i.read) ? 1 : 0)) : 0,
      items: l.items.map((i) => (!id || i.id === id ? { ...i, read: true } : i)),
    }));
    window.dispatchEvent(new Event('notifications-read'));
  }

  if (list.items.length === 0) {
    return (
      <EmptyState
        icon={<Bell />}
        title={t('notif_empty_title', 'No notifications yet')}
        text={t(
          'notif_empty_desc',
          'Save a job or exam and we’ll remind you before the last date, and tell you when its admit card or result is out.',
        )}
        action={
          <Link href="/jobs" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            {t('saved_explore_btn', 'Browse government jobs')}
          </Link>
        }
      />
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle
        title={list.unread ? `${list.unread} ${t('notif_unread', 'unread')}` : t('notif_all_caught_up', 'All caught up')}
        action={
          list.unread > 0 && (
            <button type="button" onClick={() => read()} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              <CheckCheck className="size-4" aria-hidden="true" /> {t('notif_mark_all_read', 'Mark all read')}
            </button>
          )
        }
      />
      <ul className="divide-y divide-line">
        {list.items.map((n) => (
          <li key={n.id} className={cn('flex items-start gap-3 py-3', n.read && 'opacity-70')}>
            <span
              className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-sea')}
              aria-label={n.read ? undefined : 'Unread'}
            />
            <div className="min-w-0 flex-1">
              {n.link ? (
                <Link href={n.link} onClick={() => !n.read && read(n.id)} className="font-semibold leading-snug hover:underline">
                  {n.title}
                </Link>
              ) : (
                <p className="font-semibold leading-snug">{n.title}</p>
              )}
              {n.body && <p className="mt-0.5 text-sm text-teal/80">{n.body}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-teal/80">
                <Badge tone="outline">{TYPE_LABEL[n.type] ?? 'Update'}</Badge>
                {timeAgo(n.created_at)}
                {!n.read && (
                  <button type="button" onClick={() => read(n.id)} className="font-semibold underline">
                    {t('notif_mark_read', 'Mark read')}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function NotificationSettings({ initial }: { initial: NotificationPreferences }) {
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const push = useWebPush();

  async function save(next: NotificationPreferences) {
    setPrefs(next);
    setState('saving');
    const body: NotificationPreferencesInput = {
      email_enabled: next.email_enabled,
      push_enabled: next.push_enabled,
      muted_types: next.muted_types,
      reminder_days_before: next.reminder_days_before,
    };
    const res = await apiPut<NotificationPreferences>('/notifications/preferences', body);
    if (res.data) {
      setPrefs(res.data);
      setState('saved');
    } else setState('error');
  }

  const toggleType = (t: MutableNotificationType) =>
    save({
      ...prefs,
      muted_types: prefs.muted_types.includes(t) ? prefs.muted_types.filter((m) => m !== t) : [...prefs.muted_types, t],
    });
  const toggleDay = (d: number) => {
    const has = prefs.reminder_days_before.includes(d);
    if (!has && prefs.reminder_days_before.length >= 5) return;
    save({
      ...prefs,
      reminder_days_before: has ? prefs.reminder_days_before.filter((x) => x !== d) : [...prefs.reminder_days_before, d],
    });
  };

  return (
    <Card id="preferences" className="scroll-mt-24 p-4 sm:p-5">
      <SectionTitle
        title={t('notif_prefs_title', 'Choose what you get')}
        action={
          <span role="status" className="text-xs text-teal/80">
            {state === 'saving' ? t('profile_btn_saving', 'Saving…') : state === 'saved' ? t('btn_saved', 'Saved') : state === 'error' ? 'Could not save — try again' : ''}
          </span>
        }
      />

      <div className="space-y-3">
        {/* Web Push Notification Toggle */}
        <label className="flex items-start gap-3 rounded-2xl bg-canvas p-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-teal"
            checked={push.isSubscribed && (prefs.push_enabled ?? true)}
            disabled={push.isLoading || !push.isSupported}
            onChange={async (e) => {
              if (e.target.checked) {
                const res = await push.subscribe();
                if (res.ok) save({ ...prefs, push_enabled: true });
              } else {
                await push.unsubscribe();
                save({ ...prefs, push_enabled: false });
              }
            }}
          />
          <span className="text-sm">
            <span className="font-semibold flex items-center gap-2">
              Browser & Device Push Alerts
              <Badge tone={prefs.is_subscribed ? 'teal' : 'outline'}>
                {prefs.is_subscribed ? '⚡ Instant' : '12h Digest'}
              </Badge>
            </span>
            <span className="block text-teal/80 mt-0.5 text-xs">
              {!push.isSupported
                ? 'Web Push is not supported in this browser window.'
                : push.permission === 'denied'
                  ? 'Notifications are blocked in your browser settings. Unblock to receive alerts.'
                  : prefs.is_subscribed
                    ? 'Subscribed account: You receive instant notifications as soon as jobs, admit cards, or results are published.'
                    : 'Standard account: Free 12-hour consolidated digests at 9 AM & 9 PM IST.'}
            </span>
          </span>
        </label>

        {/* Email Notification Toggle */}
        <label className="flex items-start gap-3 rounded-2xl bg-canvas p-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-teal"
            checked={prefs.email_enabled && prefs.email_available}
            disabled={!prefs.email_available}
            onChange={(e) => save({ ...prefs, email_enabled: e.target.checked })}
          />
          <span className="text-sm">
            <span className="font-semibold">Also send these by email</span>
            <span className="block text-teal/80 mt-0.5 text-xs">
              {prefs.email_available
                ? 'Every email has an unsubscribe link.'
                : 'Add and verify an email address in your account to get emails.'}
            </span>
          </span>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold">Notify me about</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MUTABLE.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-teal"
                checked={!prefs.muted_types.includes(t.key)}
                onChange={() => toggleType(t.key)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold">Remind me this many days before a last date or exam</legend>
        <div className="flex flex-wrap gap-2">
          {DAY_CHOICES.map((d) => {
            const on = prefs.reminder_days_before.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d)}
                className={cn('clay-press rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-clay', on ? 'bg-teal text-cream' : 'bg-cream')}
              >
                {d === 0 ? 'On the day' : d === 1 ? '1 day' : `${d} days`}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-teal/80">Up to 5. Reminders are sent between 8 am and 9 pm.</p>
      </fieldset>
    </Card>
  );
}

/** The bell in the top bar: a dot when there are unread notifications (logged in only). */
export function NotificationBellDot() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => {
      if (!localStorage.getItem('currentUser')) return setUnread(0);
      // plain fetch, not apiGet: a 401 here must not trigger a refresh → 'auth-changed' → reload loop
      void fetch(`${API_URL}/notifications`, { credentials: 'include', cache: 'no-store' })
        .then((r) => (r.ok ? (r.json() as Promise<NotificationList>) : null))
        .then((l) => setUnread(l?.unread ?? 0))
        .catch(() => setUnread(0));
    };
    load();
    window.addEventListener('auth-changed', load);
    window.addEventListener('notifications-read', load);
    return () => {
      window.removeEventListener('auth-changed', load);
      window.removeEventListener('notifications-read', load);
    };
  }, []);

  if (!unread) return null;
  return (
    <>
      <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-sea" aria-hidden="true" />
      <span className="sr-only">{unread} unread</span>
    </>
  );
}
