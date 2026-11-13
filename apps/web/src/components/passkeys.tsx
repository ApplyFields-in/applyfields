'use client';

/**
 * Passkeys on the citizen website: sign in with fingerprint / face / device PIN (WebAuthn).
 * The device keeps the private key; the API stores only the public key and checks a signature
 * on every sign-in (apps/api/src/modules/auth/passkeys.service.ts).
 */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { Fingerprint, KeyRound, Loader2, Trash2 } from 'lucide-react';
import type { AuthResponse } from '@applyfields/types';
import { apiDelete, apiGet, apiPost } from '@/lib/api';

type Passkey = {
  id: string;
  name: string | null;
  device_type: string | null;
  backed_up: boolean;
  last_used_at: string | null;
  created_at: string;
};

/** The person closed the fingerprint/face prompt: not an error worth shouting about. */
function friendly(err: unknown, fallback: string): string {
  const name = (err as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'AbortError') return 'Passkey request was cancelled.';
  if (name === 'InvalidStateError') return 'This device already has a passkey for your account.';
  return (err as Error)?.message || fallback;
}

/** WebAuthn support, read on the client only (false during the server render, so hydration matches). */
const noSubscribe = () => () => {};
const useWebAuthn = () => useSyncExternalStore(noSubscribe, browserSupportsWebAuthn, () => false);

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'never';

/** "Sign in with a passkey" on /login. No email needed: the device offers its own passkey for this site. */
export function PasskeySignInButton({
  redirectTo,
  onError,
  onSuccess,
}: {
  redirectTo: string;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const supported = useWebAuthn();
  if (!supported) return null;

  async function signIn() {
    onError(null);
    setBusy(true);
    try {
      const start = await apiPost<{ options: PublicKeyCredentialRequestOptionsJSON; challengeToken: string }>(
        '/auth/passkey/login/options',
      );
      if (!start.data) throw new Error(start.error || 'Could not start passkey sign-in.');
      const response = await startAuthentication({ optionsJSON: start.data.options });
      const res = await apiPost<AuthResponse>('/auth/passkey/login/verify', {
        response,
        challengeToken: start.data.challengeToken,
        rememberMe: true,
      });
      if (!res.data) throw new Error(res.error || 'Passkey sign-in failed.');
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('auth-changed'));
      onSuccess('Signed in with your passkey! Redirecting...');
      setTimeout(() => router.push(redirectTo), 600);
    } catch (err) {
      onError(friendly(err, 'Passkey sign-in failed.'));
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void signIn()}
      disabled={busy}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border-2 border-line bg-cream text-sm font-semibold text-teal transition hover:border-sea/40 hover:bg-paper disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4 text-sea" />}
      Sign in with a passkey
    </button>
  );
}

/** Account page: add, list and remove passkeys. */
export function PasskeysCard() {
  const supported = useWebAuthn();
  const [list, setList] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => apiGet<Passkey[]>('/auth/passkeys').then((r) => setList(r ?? []));
  useEffect(() => {
    void load();
  }, []);

  async function add() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const start = await apiPost<{ options: PublicKeyCredentialCreationOptionsJSON; challengeToken: string }>(
        '/auth/passkey/register/options',
      );
      if (!start.data) throw new Error(start.error || 'Could not start adding a passkey.');
      const response = await startRegistration({ optionsJSON: start.data.options });
      const name = /android|iphone|ipad|mobile/i.test(navigator.userAgent) ? 'Phone' : 'Computer';
      const res = await apiPost<Passkey>('/auth/passkey/register/verify', {
        response,
        challengeToken: start.data.challengeToken,
        name,
      });
      if (!res.data) throw new Error(res.error || 'Could not add the passkey.');
      setNotice('Passkey added. Next time, choose "Sign in with a passkey".');
      await load();
    } catch (err) {
      setError(friendly(err, 'Could not add the passkey.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Passkey) {
    if (!window.confirm(`Remove the passkey "${p.name ?? 'Passkey'}"? You can still sign in with your password or Google.`)) return;
    setBusy(true);
    const res = await apiDelete<{ removed: true }>(`/auth/passkeys/${p.id}`);
    setBusy(false);
    if (!res.data) return setError(res.error || 'Could not remove the passkey.');
    await load();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-bold text-[#082046]">
        <KeyRound className="size-4 text-[#0e7bf4]" /> Passkeys
      </h3>
      <p className="text-xs text-[#536780]">
        Sign in with your fingerprint, face or screen lock instead of a password. Your fingerprint or face never
        leaves your device.
      </p>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{notice}</p>}

      {list && list.length > 0 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {list.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-xs">
              <div>
                <p className="font-semibold text-[#082046]">
                  {p.name ?? 'Passkey'}
                  {p.backed_up && <span className="ml-2 font-normal text-[#536780]">synced</span>}
                </p>
                <p className="text-[#536780]">
                  Added {day(p.created_at)} · last used {day(p.last_used_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(p)}
                disabled={busy}
                aria-label={`Remove passkey ${p.name ?? ''}`}
                className="grid size-9 place-items-center rounded-lg text-[#536780] hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {supported ? (
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#082046] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#061835] disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Fingerprint className="size-4" />}
          {list && list.length > 0 ? 'Add another passkey' : 'Add a passkey'}
        </button>
      ) : (
        <p className="text-xs text-[#536780]">This browser doesn&apos;t support passkeys.</p>
      )}
    </div>
  );
}
