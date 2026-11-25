'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import type { PushPublicKeyResponse, PushSubscriptionInput } from '@applyfields/types';
import { apiGet, apiPost } from '@/lib/api';
import { BellIcon } from '@applyfields/ui';

/** Same steps as the citizen site's useWebPush (apps/web/src/lib/push), trimmed to "turn on". */
async function enablePush(): Promise<string | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'This browser cannot show notifications. We will still email you.';
  }
  if ((await Notification.requestPermission()) !== 'granted') {
    return 'Notifications are blocked for this site. Allow them in your browser settings.';
  }
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  const key = await apiGet<PushPublicKeyResponse>('/notifications/push-public-key');
  if (!key.data?.publicKey) return 'Could not turn on notifications right now. Try again later.';
  const raw = atob(key.data.publicKey.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (key.data.publicKey.length % 4)) % 4));
  const sub = (
    await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)),
    })
  ).toJSON();
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return 'Could not turn on notifications right now.';
  const body: PushSubscriptionInput = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    user_agent: navigator.userAgent,
  };
  const saved = await apiPost('/notifications/push-subscribe', body);
  return saved.error ? 'Could not turn on notifications right now.' : null;
}

/** On the review pages: get a browser notification the moment staff approve or reject (email comes too). */
export function NotifyMeButton() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') return;
    void navigator.serviceWorker.getRegistration().then((r) => r?.pushManager.getSubscription()).then((s) => setOn(Boolean(s)));
  }, []);

  if (on) {
    return (
      <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#00876a]">
        <BellIcon ring size={16} /> We will notify you on this device and by email when your application is reviewed.
      </p>
    );
  }
  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const err = await enablePush().catch(() => 'Could not turn on notifications right now.');
          setBusy(false);
          setMsg(err);
          if (!err) setOn(true);
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-[#0e7bf4]/40 bg-white px-4 py-2.5 text-xs font-bold text-[#0e7bf4] hover:bg-[#e0edfb] disabled:opacity-50"
      >
        <Bell className="size-4" /> {busy ? 'Turning on…' : 'Notify me on this device when approved'}
      </button>
      {msg && <p className="mt-2 text-xs text-[#536780]">{msg}</p>}
    </div>
  );
}
