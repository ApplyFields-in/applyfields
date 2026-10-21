'use client';

import type { SavedItemType, SaveResult } from '@applyfields/types';
import { cn } from '@applyfields/ui';
import { Bell, BellOff, Bookmark, BookmarkCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiDelete, apiPut } from '@/lib/api';
import { trackEvent } from '@/lib/analytics/tracker';

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

  async function toggle() {
    setBusy(true);
    const path = `/saved/${itemType}/${encodeURIComponent(slug)}`;
    const res = saved ? await apiDelete<SaveResult>(path) : await apiPut<SaveResult>(path, {});
    setBusy(false);
    if (res.status === 401) return router.push('/login');
    if (res.data) {
      setSaved(res.data.saved);
      if (res.data.saved) {
        trackEvent('opportunity_save', {
          entity_type: 'opportunity',
          entity_id: slug,
          metadata: { title, item_type: itemType },
        });
      }
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      title={saved ? 'Saved — click to remove' : 'Save and get reminders'}
      className={cn(
        'clay-press grid size-8 shrink-0 place-items-center rounded-full shadow-clay disabled:opacity-60',
        saved ? 'bg-teal text-cream' : 'bg-cream hover:bg-tea',
      )}
    >
      {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
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
