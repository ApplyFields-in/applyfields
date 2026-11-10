'use client';

import type { OpenReminderStatus, SavedItemType, SaveResult } from '@applyfields/types';
import { cn } from '@applyfields/ui';
import { Bell, BellOff, BellRing, Bookmark, BookmarkCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiDelete, apiPut } from '@/lib/api';
import { trackEvent } from '@/lib/analytics/tracker';
import { showAppToast } from '@/components/toast-notification-provider';

/** Bookmark toggle on every card. Logged out → login page. */
export function SaveButton({
  itemType,
  slug,
  title,
  initial = false,
}: {
  itemType: SavedItemType;
  slug: string;
  title: string;
  initial?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [bursting, setBursting] = useState(false);

  async function toggle() {
    setBusy(true);
    const path = `/saved/${itemType}/${encodeURIComponent(slug)}`;
    const res = saved ? await apiDelete<SaveResult>(path) : await apiPut<SaveResult>(path, {});
    setBusy(false);
    if (res.status === 401) return router.push('/login');
    if (res.data) {
      setSaved(res.data.saved);
      if (res.data.saved) {
        setBursting(true);
        setTimeout(() => setBursting(false), 800);
        trackEvent('opportunity_save', {
          entity_type: 'opportunity',
          entity_id: slug,
          metadata: { title, item_type: itemType },
        });
        showAppToast({
          message: `Saved to your opportunities.`,
          actionLabel: 'View Saved →',
          actionHref: '/saved',
          type: 'success',
        });
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          window.dispatchEvent(
            new CustomEvent('show-push-permission-prompt', {
              detail: { title, slug },
            }),
          );
        }
      } else {
        showAppToast({
          message: `Removed from saved items.`,
          type: 'remove',
        });
      }
      router.refresh();
    } else {
      // Never fail silently: a demo listing isn't in the database (404), anything else is a real error.
      showAppToast({
        message:
          res.status === 404
            ? 'This is a demo listing, so it can’t be saved. Real listings save normally.'
            : res.error || 'Could not save right now. Please try again.',
        type: 'info',
      });
    }
  }


  return (
    <div className="relative inline-flex items-center justify-center">
      <style>{`
        @keyframes save-confetti-particle {
          0% { transform: rotate(var(--deg)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--deg)) translateY(-20px) scale(0); opacity: 0; }
        }
      `}</style>
      {bursting && (
        <span className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center" aria-hidden="true">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <span
              key={i}
              className="absolute size-1.5 rounded-full"
              style={{
                ['--deg' as string]: `${deg}deg`,
                backgroundColor: ['#1A936F', '#88D498', '#114B5F', '#C6DABF'][i % 4],
                animation: 'save-confetti-particle 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              }}
            />
          ))}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
        title={saved ? 'Saved — click to remove' : 'Save and get reminders'}
        className={cn(
          'clay-press grid size-8 shrink-0 place-items-center rounded-full shadow-clay disabled:opacity-60 transition-transform active:scale-95',
          saved ? 'bg-teal text-cream' : 'bg-cream hover:bg-tea',
        )}
      >
        {saved ? <BookmarkCheck className="size-4 animate-in zoom-in-50 duration-200" /> : <Bookmark className="size-4" />}
      </button>
    </div>
  );
}

/**
 * "Remind me when applications open" — ApplyFields Plus only. `initial` is null when signed out.
 * Shown only while application_start is in the future (the caller checks).
 */
export function OpenReminderButton({
  slug,
  opensOn,
  initial,
}: {
  slug: string;
  opensOn: string;
  initial: OpenReminderStatus | null;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const day = new Date(`${opensOn}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  async function toggle() {
    if (!state) return router.push('/login');
    if (!state.plus) {
      return showAppToast({
        message: 'Opening-day reminders are part of ApplyFields Plus.',
        actionLabel: 'See Plus →',
        actionHref: '/account',
        type: 'info',
      });
    }
    setBusy(true);
    const path = `/saved/opportunity/${encodeURIComponent(slug)}/open-reminder`;
    const res = state.on ? await apiDelete<OpenReminderStatus>(path) : await apiPut<OpenReminderStatus>(path, {});
    setBusy(false);
    if (res.data) {
      setState(res.data);
      showAppToast({ message: res.data.on ? `We'll remind you on ${day} when applications open.` : 'Opening-day reminder removed.', type: res.data.on ? 'success' : 'remove' });
    } else {
      showAppToast({ message: res.error || 'Could not set the reminder. Please try again.', type: 'info' });
    }
  }

  const on = Boolean(state?.on);
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      title={`Applications open on ${day}`}
      className={cn(
        'clay-press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-clay disabled:opacity-60',
        on ? 'bg-teal text-cream' : 'bg-cream hover:bg-tea',
      )}
    >
      {on ? <BellRing className="size-3.5" aria-hidden="true" /> : <Bell className="size-3.5" aria-hidden="true" />}
      {on ? `Reminding you on ${day}` : `Remind me when it opens (${day})`}
      {!state?.plus && <span className="rounded-full bg-celadon px-1.5 text-[10px] font-bold text-teal">Plus</span>}
    </button>
  );
}

/** On the Saved page: reminders on/off for one saved item. */
export function ReminderToggle({ slug, initial }: { slug: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await apiPut<SaveResult>(`/saved/opportunity/${encodeURIComponent(slug)}`, { reminder_enabled: !on });
    setBusy(false);
    if (res.data) setOn(res.data.reminder_enabled);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      className="clay-press inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-semibold shadow-clay disabled:opacity-60"
    >
      {on ? <Bell className="size-3.5" aria-hidden="true" /> : <BellOff className="size-3.5" aria-hidden="true" />}
      {on ? 'Reminders on' : 'Reminders off'}
    </button>
  );
}
