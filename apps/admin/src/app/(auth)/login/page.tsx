'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AdminMeResponse } from '@applyfields/types';
import { Card, GoogleButton, Logo, cn } from '@applyfields/ui';
import { ArrowRight, ChevronLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldAlert, Smartphone } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { DEPARTMENTS, canOpenPath, departmentsForRoles } from '@/lib/nav';

type Method = 'google' | 'email' | 'phone';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(msg || 'Something went wrong. Please try again.');
  }
  return data as T;
}

function StaffLoginForm() {
  const router = useRouter();
  const from = useSearchParams().get('from');

  const [method, setMethod] = useState<Method>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null); // set once the code is sent → step 2
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMethod(next: Method) {
    setMethod(next);
    setIdentifier('');
    setPassword('');
    setCode('');
    setSentTo(null);
    setError(null);
  }

  /** After any successful sign-in: confirm staff access, then open that person's own dashboard. */
  async function enterPortal() {
    const res = await fetch(`${API_URL}/admin/me`, { credentials: 'include' });
    if (!res.ok) {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
      throw new Error(
        res.status === 403
          ? 'This account has no staff access. Ask a super admin to grant you a role.'
          : 'Signed in, but the staff portal could not confirm your session. Please try again.',
      );
    }
    const me = (await res.json()) as AdminMeResponse;
    const departments = departmentsForRoles(me.roles);
    const home = DEPARTMENTS[departments[0] ?? 'super_admin'].homePath;
    // Only same-site paths the user may open (no open redirect via ?from=).
    const safeFrom = from && from.startsWith('/') && !from.startsWith('//') && canOpenPath(departments, from.split('?')[0]);
    router.replace(safeFrom ? from : home);
    router.refresh();
  }

  async function run(task: () => Promise<void>) {
    setError(null);
    setLoading(true);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      const res = await post<{ sentTo: string }>('/auth/login/start', { identifier: identifier.trim(), password });
      setSentTo(res.sentTo);
      setCode('');
    });

  const verifyCode = () =>
    run(async () => {
      await post('/auth/login/verify', { identifier: identifier.trim(), password, code: code.trim() });
      await enterPortal();
    });

  // Google's button. The API checks the token with Google; the browser never vouches for the email.
  // existingOnly: a stranger's Google account must not get a new (citizen) account from the staff portal.
  const signInWithGoogle = (credential: string) =>
    run(async () => {
      await post('/auth/social-login', { provider: 'google', credential, existingOnly: true });
      await enterPortal();
    });

  const isPhone = method === 'phone';
  const inputClass =
    'h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400';

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#041226] via-[#082046] to-[#0a2855] p-4 text-white sm:p-8">
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Logo subtitle="Staff Operations Portal" inverse size="lg" />
          <p className="mt-2 text-xs font-medium text-slate-300">
            Your role decides which dashboard opens after sign-in.
          </p>
        </div>

        <Card className="rounded-3xl border border-slate-700/60 bg-[#0b254e]/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <div role="tablist" aria-label="Sign-in method" className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-slate-700 bg-slate-900/90 p-1 text-xs">
            {(
              [
                ['email', 'Email', <Mail key="e" className="size-3.5" />],
                ['phone', 'Phone', <Smartphone key="p" className="size-3.5" />],
                ['google', 'Google', <span key="g" className="font-black">G</span>],
              ] as const
            ).map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={method === id}
                onClick={() => switchMethod(id)}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 rounded-lg py-2 font-bold transition-all',
                  method === id ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white',
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300">
              <ShieldAlert className="mt-px size-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {method === 'google' ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-300">Use the Google account your staff role was granted to.</p>
              {GOOGLE_CLIENT_ID ? (
                <GoogleButton clientId={GOOGLE_CLIENT_ID} theme="filled_blue" text="signin_with" onCredential={(c) => void signInWithGoogle(c)} />
              ) : (
                <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
                  Google sign-in isn&apos;t set up. Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> here and{' '}
                  <code>GOOGLE_CLIENT_ID</code> on the API.
                </p>
              )}
              {loading && <Loader2 className="mx-auto size-5 animate-spin text-amber-400" />}
            </div>
          ) : !sentTo ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-xs font-semibold text-slate-200">
                  {isPhone ? 'Phone number' : 'Email'}
                </label>
                <input
                  id="identifier"
                  type={isPhone ? 'tel' : 'email'}
                  inputMode={isPhone ? 'tel' : 'email'}
                  autoComplete={isPhone ? 'tel' : 'username'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={isPhone ? '+91 90000 00000' : 'you@applyfields.com'}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputClass, 'pl-10 pr-11')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                {isPhone ? 'Continue: send SMS code' : 'Continue: email me a code'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verifyCode();
              }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white"
              >
                <ChevronLeft className="size-4" /> Back
              </button>
              <div className="text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-400">
                  <KeyRound className="size-6" />
                </div>
                <h2 className="text-lg font-bold">Enter the 6-digit code</h2>
                <p className="mt-1 text-xs text-slate-300">
                  Sent by {isPhone ? 'SMS' : 'email'} to <span className="font-mono">{sentTo}</span>. It expires in 10 minutes.
                </p>
              </div>
              <label htmlFor="code" className="sr-only">
                Verification code
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="mx-auto block h-12 w-full max-w-xs rounded-xl border border-slate-700 bg-slate-900/90 text-center font-mono text-lg font-bold tracking-[0.45em] text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />} Verify and sign in
              </button>
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={loading}
                className="block w-full text-center text-xs font-semibold text-amber-400 hover:underline disabled:opacity-60"
              >
                Send a new code
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#082046] text-white">
          <Loader2 className="size-6 animate-spin text-amber-400" />
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
