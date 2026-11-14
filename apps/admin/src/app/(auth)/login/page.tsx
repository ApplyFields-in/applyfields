'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AdminMeResponse } from '@applyfields/types';
import { GoogleButton, Logo, cn } from '@applyfields/ui';
import { ChevronLeft, Eye, EyeOff, Loader2, Mail, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';
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

const input =
  'h-11 w-full rounded-xl border border-[#c9d6e6] bg-white px-3.5 text-sm text-[#082046] placeholder:text-[#8a9bb3] transition focus:border-[#0e7bf4] focus:outline-none focus:ring-4 focus:ring-[#0e7bf4]/15';
const primary =
  'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0e7bf4] px-4 text-sm font-bold text-white transition hover:bg-[#0c6fdc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0e7bf4]/30 disabled:opacity-50';

/** The navy side: a stack of official notices, the top one stamped. What staff do here, drawn. */
function CheckedNotices() {
  const sheet = 'absolute inset-0 rounded-2xl bg-white shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]';
  return (
    <div className="relative mx-auto aspect-[3/4] w-[min(34vh,260px)]" aria-hidden="true">
      <div className={`${sheet} translate-x-5 translate-y-3 rotate-[6deg] opacity-40`} />
      <div className={`${sheet} translate-x-2 translate-y-1.5 rotate-[3deg] opacity-70`} />
      <div className={`${sheet} flex flex-col gap-3 p-6`}>
        <div className="h-2.5 w-1/3 rounded-full bg-[#e0edfb]" />
        <div className="h-3.5 w-4/5 rounded-full bg-[#082046]" />
        <div className="h-3.5 w-3/5 rounded-full bg-[#082046]" />
        <div className="mt-2 space-y-2">
          {[100, 92, 96, 70, 88, 60].map((w, i) => (
            <div key={i} className="h-2 rounded-full bg-[#dfe7f1]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-auto flex gap-2">
          <div className="h-6 w-16 rounded-md bg-[#e0edfb]" />
          <div className="h-6 w-12 rounded-md bg-[#e0edfb]" />
        </div>
        {/* The stamp */}
        <div className="stamp-in absolute -right-6 bottom-10 grid size-28 -rotate-12 place-items-center rounded-full border-[5px] border-[#0e7bf4] bg-white/85 text-[#0e7bf4] shadow-[0_0_0_4px_rgba(14,123,244,0.15)]">
          <div className="flex flex-col items-center leading-none">
            <ShieldCheck className="mb-1 size-7" strokeWidth={2.4} />
            <span className="text-[15px] font-black tracking-tight">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
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
  const step = sentTo ? 2 : 1;

  return (
    <div className="flex min-h-dvh flex-col bg-[#F0F4F8] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-10 lg:px-14 lg:py-8">
        <Logo subtitle="Staff portal" />

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#082046] sm:text-5xl">Staff sign-in</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#435775]">Your role decides which desk opens after you sign in.</p>

          <div className="mt-8 rounded-3xl border border-[#d5deea] bg-white p-6 shadow-[0_1px_2px_rgba(8,32,70,0.04),0_12px_32px_-16px_rgba(8,32,70,0.18)] sm:p-8">
            <div role="tablist" aria-label="Sign-in method" className="flex gap-6 border-b border-[#e3eaf3]">
              {(
                [
                  ['email', 'Email', Mail],
                  ['phone', 'Phone', Smartphone],
                  ['google', 'Google', null],
                ] as const
              ).map(([id, text, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={method === id}
                  onClick={() => switchMethod(id)}
                  className={cn(
                    '-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:text-[#0e7bf4]',
                    method === id ? 'border-[#0e7bf4] text-[#082046]' : 'border-transparent text-[#8a9bb3] hover:text-[#435775]',
                  )}
                >
                  {Icon ? <Icon className="size-4" /> : <span className="text-[13px] font-black">G</span>}
                  {text}
                </button>
              ))}
            </div>

            {method !== 'google' && (
              <ol className="mt-5 flex items-center gap-3 text-[13px] font-semibold" aria-label="Sign-in steps">
                {(['Password', 'Code'] as const).map((s, i) => (
                  <li key={s} className="flex items-center gap-2" aria-current={step === i + 1 ? 'step' : undefined}>
                    {i > 0 && <span className="h-px w-6 bg-[#d5deea]" aria-hidden="true" />}
                    <span
                      className={cn(
                        'grid size-6 place-items-center rounded-full text-xs',
                        step > i + 1 ? 'bg-[#00a884] text-white' : step === i + 1 ? 'bg-[#082046] text-white' : 'bg-[#eef3f9] text-[#8a9bb3]',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className={step >= i + 1 ? 'text-[#082046]' : 'text-[#8a9bb3]'}>{s}</span>
                  </li>
                ))}
              </ol>
            )}

            {error && (
              <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
                <ShieldAlert className="mt-px size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5">
              {method === 'google' ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#435775]">Use the Google account your staff role was granted to.</p>
                  {GOOGLE_CLIENT_ID ? (
                    <GoogleButton clientId={GOOGLE_CLIENT_ID} theme="outline" text="signin_with" onCredential={(c) => void signInWithGoogle(c)} />
                  ) : (
                    <p className="rounded-xl border border-[#d5deea] bg-[#F7F9FC] p-3 text-[13px] text-[#435775]">
                      Google sign-in isn&apos;t set up. Set <code className="font-semibold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> here and{' '}
                      <code className="font-semibold">GOOGLE_CLIENT_ID</code> on the API.
                    </p>
                  )}
                  {loading && <Loader2 className="mx-auto size-5 animate-spin text-[#0e7bf4]" />}
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
                    <label htmlFor="identifier" className="mb-1.5 block text-[13px] font-semibold text-[#243b5b]">
                      {isPhone ? 'Phone number' : 'Work email'}
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
                      className={input}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[#243b5b]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(input, 'pr-11')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#8a9bb3] hover:text-[#082046] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7bf4]/40"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className={primary}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {isPhone ? 'Send code by SMS' : 'Email me a code'}
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
                  <p className="text-sm text-[#435775]">
                    Enter the 6-digit code sent by {isPhone ? 'SMS' : 'email'} to{' '}
                    <span className="font-semibold text-[#082046]">{sentTo}</span>. It expires in 10 minutes.
                  </p>
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
                    className={cn(input, 'h-12 text-center text-lg font-bold tracking-[0.45em] tabular-nums')}
                  />
                  <button type="submit" disabled={loading || code.length !== 6} className={primary}>
                    {loading && <Loader2 className="size-4 animate-spin" />} Verify and sign in
                  </button>
                  <div className="flex justify-between text-[13px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSentTo(null)}
                      className="inline-flex items-center gap-1 text-[#536780] hover:text-[#082046]"
                    >
                      <ChevronLeft className="size-4" /> Change details
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendCode()}
                      disabled={loading}
                      className="text-[#0e7bf4] hover:text-[#0c6fdc] disabled:opacity-50"
                    >
                      Send a new code
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <aside className="relative hidden overflow-hidden bg-[#082046] text-white lg:order-last lg:m-4 lg:flex lg:flex-col lg:items-center lg:justify-center lg:rounded-[2.5rem] lg:p-12">
        <CheckedNotices />
        <p className="mt-14 max-w-sm text-center text-lg font-bold leading-snug">
          Nothing reaches citizens until someone on this team has checked it.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Desks in this portal">
          {['Review queue', 'Partner verification', 'Citizen support'].map((d) => (
            <li key={d} className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-semibold text-[#e0edfb]">
              {d}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#F0F4F8]" />}>
      <StaffLoginForm />
    </Suspense>
  );
}
