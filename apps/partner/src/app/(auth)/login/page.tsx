'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FieldyMascot, GoogleButton, type FieldyMood } from '@applyfields/ui';
import { apiPost, getMyPartner } from '@/lib/api';
import { usePartnerAuth } from '@/lib/auth-context';
import { Building2, Eye, EyeOff, Store } from 'lucide-react';

type Persona = 'kiosk' | 'institution';

/** What each kind of partner handles at their desk: shown on the counter, not a sales list. */
const DESK_WORK: Record<Persona, string[]> = {
  kiosk: ['PAN card', 'Aadhaar update', 'MeeSeva certificates', 'Xerox & print'],
  institution: ['Admission enquiries', 'Programmes', 'Campus profile'],
};

const input =
  'block w-full rounded-xl border border-[#c9d6e6] bg-white px-3.5 py-2.5 text-sm text-[#082046] placeholder:text-[#8a9bb3] transition focus:border-[#0e7bf4] focus:outline-none focus:ring-4 focus:ring-[#0e7bf4]/15';
const label = 'block text-[13px] font-semibold text-[#243b5b]';
const primary =
  'flex w-full items-center justify-center rounded-xl bg-[#0e7bf4] py-3 text-sm font-bold text-white transition hover:bg-[#0c6fdc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0e7bf4]/30 disabled:opacity-50';

function LoginFormContent() {
  const router = useRouter();
  const { refreshSession } = usePartnerAuth();

  const [persona, setPersona] = useState<Persona>('kiosk');
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  // Set only when the account still has to confirm its email/phone once (first sign-in).
  const [codeTo, setCodeTo] = useState<string | null>(null);
  // Remember me: stay signed in across browser restarts until sign-out.
  const [rememberMe, setRememberMe] = useState(true);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Fieldy waves once when the counter opens, and celebrates a successful sign-in.
  const [mood, setMood] = useState<FieldyMood>('greeting');

  async function routeAfterLogin() {
    await refreshSession();
    const partnerRes = await getMyPartner();
    if (partnerRes.data) {
      const isInst = ['college', 'university', 'training_institute'].includes(partnerRes.data.type);
      if (partnerRes.data.verification_status === 'verified') {
        router.push(isInst ? '/institution/dashboard' : '/dashboard');
      } else {
        router.push(isInst ? '/institution/under-review' : '/under-review');
      }
    } else {
      router.push(persona === 'institution' ? '/institution/onboard' : '/onboard');
    }
  }

  function signedIn(user: unknown, message: string) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-changed'));
    setSuccess(message);
    setMood('success');
    setTimeout(() => void routeAfterLogin(), 600);
  }

  /** Google sign-in: the API verifies the token with Google, then we route like any other login. */
  async function handleGoogle(credential: string) {
    setError(null);
    setLoading(true);
    const res = await apiPost<{ user: unknown }>('/auth/social-login', { provider: 'google', credential });
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error || 'Google sign-in failed. Try again, or use your password.');
      return;
    }
    signedIn(res.data.user, 'Signed in with Google. Opening your desk…');
  }

  /** Bare 10-digit numbers are Indian mobiles; emails pass through. */
  const loginId = () => {
    const v = phoneOrEmail.trim();
    return /^\d{10}$/.test(v) ? `+91${v}` : v;
  };

  async function handlePasswordLogin(e?: React.FormEvent, resend = false) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    if (!phoneOrEmail.trim()) {
      setError('Enter the mobile number or email you registered with.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    // Verified accounts sign in with the password alone; a never-verified account gets one code, once.
    const res =
      !codeTo || resend
        ? await apiPost<{ user: unknown } | { verificationRequired: true; sentTo: string }>('/auth/login', {
            identifier: loginId(),
            password,
            rememberMe,
          })
        : await apiPost<{ user: unknown }>('/auth/login/verify', {
            identifier: loginId(),
            password,
            code: code.trim(),
            rememberMe,
          });
    setLoading(false);

    if (res.error || !res.data) {
      setError(
        res.error ||
          (codeTo ? 'That code did not work. Check it or send a new one.' : 'Sign-in failed. Check your details and try again.'),
      );
      return;
    }
    if ('verificationRequired' in res.data) {
      setCodeTo(res.data.sentTo);
      setCode('');
      setSuccess(`First sign-in: enter the 6-digit code sent to ${res.data.sentTo}. You won't be asked again.`);
      return;
    }
    signedIn(res.data.user, 'Signed in. Opening your desk…');
  }

  async function handleSendOtp() {
    setError(null);
    if (!phoneOrEmail.trim()) {
      setError('Enter the mobile number you registered with.');
      return;
    }
    setLoading(true);
    const res = await apiPost('/auth/otp/send', { target: loginId(), purpose: 'login' });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setOtpSent(true);
    setSuccess('We sent you a 6-digit code.');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otpCode.trim().length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    const res = await apiPost<{ user: unknown }>('/auth/login/otp', {
      identifier: loginId(),
      code: otpCode.trim(),
      rememberMe,
    });
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error || 'That code did not work. Check it or send a new one.');
      return;
    }
    signedIn(res.data.user, 'Verified. Opening your desk…');
  }

  const isInst = persona === 'institution';
  const rememberBox = (
    <label className="flex items-center gap-2.5 text-[13px] font-medium text-[#435775]">
      <input
        type="checkbox"
        checked={rememberMe}
        onChange={(e) => setRememberMe(e.target.checked)}
        className="size-4 rounded accent-[#0e7bf4]"
      />
      Keep me signed in on this device
    </label>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F0F4F8] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* The counter: Fieldy at an arched service window. One mascot for every screen size. */}
      <aside className="relative overflow-hidden bg-[#082046] px-4 pb-6 pt-5 text-white lg:order-last lg:m-4 lg:flex lg:flex-col lg:items-center lg:justify-center lg:rounded-[2.5rem] lg:p-10">
        {/* Concentric arches echo the window; quiet, decorative only */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden items-end justify-center lg:flex">
          {[150, 118, 88].map((w) => (
            <div
              key={w}
              className="absolute bottom-[-6%] rounded-t-full border border-white/[0.06]"
              style={{ width: `${w}%`, aspectRatio: '1 / 1.15' }}
            />
          ))}
        </div>

        <div className="relative flex items-center gap-4 lg:flex-col lg:gap-0">
          {/* Signboard */}
          <div className="order-2 lg:order-none lg:mb-5 lg:flex lg:flex-col lg:items-center">
            <div className="hidden h-5 w-24 justify-between px-3 lg:flex" aria-hidden="true">
              <span className="w-px bg-white/30" />
              <span className="w-px bg-white/30" />
            </div>
            <div className="rounded-2xl bg-[#e0edfb] px-4 py-2.5 text-[#082046] lg:px-6 lg:py-3 lg:text-center">
              <p className="flex items-center gap-2 text-sm font-extrabold lg:justify-center lg:text-base">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full rounded-full bg-[#00a884] opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-[#00a884]" />
                </span>
                {isInst ? 'Admissions desk' : 'Partner desk'} open
              </p>
              <p className="text-xs font-medium text-[#435775]">ApplyFields partner network</p>
            </div>
          </div>

          {/* Arched window */}
          <div className="order-1 shrink-0 rounded-t-full border-[6px] border-[#0e7bf4] bg-[#0e7bf4] p-0 shadow-[0_0_0_6px_rgba(224,237,251,0.12)] lg:order-none lg:border-[10px]">
            <FieldyMascot
              mood={mood}
              className="h-24 w-20 rounded-t-full sm:h-28 sm:w-24 lg:h-[min(46vh,380px)] lg:w-[min(36vh,300px)]"
            />
          </div>

          {/* Counter ledge with the work this desk does */}
          <div className="hidden w-[min(52vh,440px)] flex-col items-center lg:flex">
            <div className="h-3.5 w-full rounded-full bg-[#e0edfb]" aria-hidden="true" />
            <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="What this desk handles">
              {DESK_WORK[persona].map((w) => (
                <li key={w} className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-semibold text-[#e0edfb]">
                  {w}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-sm text-center text-sm leading-relaxed text-[#b9cbe3]">
              {isInst
                ? 'Students reach you through ApplyFields. Answer their enquiries and keep your campus details current.'
                : 'Citizens book a slot on ApplyFields and arrive with their documents. You serve them and close the request here.'}
            </p>
          </div>
        </div>
      </aside>

      {/* The form */}
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-10 lg:px-14 lg:py-8">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0e7bf4]/20">
          <Image src="/logo-mark.png" alt="" width={36} height={36} className="size-9 object-contain" />
          <span className="text-lg font-black tracking-tight text-[#082046]">
            ApplyFields <span className="font-semibold text-[#435775]">Partners</span>
          </span>
        </Link>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-8">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[#082046] sm:text-5xl">
            Welcome back
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#435775]">
            {isInst ? 'Sign in to answer admission enquiries.' : "Sign in to see today's bookings at your centre."}
          </p>

          <div className="mt-8 rounded-3xl border border-[#d5deea] bg-white p-6 shadow-[0_1px_2px_rgba(8,32,70,0.04),0_12px_32px_-16px_rgba(8,32,70,0.18)] sm:p-8">
            {/* Who is signing in */}
            <div role="radiogroup" aria-label="I run a" className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F0F4F8] p-1.5">
              {(
                [
                  ['kiosk', 'Service centre', Store],
                  ['institution', 'College', Building2],
                ] as const
              ).map(([value, text, Icon]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={persona === value}
                  onClick={() => {
                    setPersona(value);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0e7bf4]/20 ${
                    persona === value ? 'bg-white text-[#082046] shadow-sm' : 'text-[#536780] hover:text-[#082046]'
                  }`}
                >
                  <Icon className={`size-4 ${persona === value ? (value === 'kiosk' ? 'text-[#00a884]' : 'text-[#0e7bf4]') : ''}`} />
                  {text}
                </button>
              ))}
            </div>

            {/* How to sign in */}
            <div className="mt-6 flex gap-6 border-b border-[#e3eaf3]" role="tablist" aria-label="Sign-in method">
              {(
                [
                  ['password', 'Password'],
                  ['otp', 'Mobile code'],
                ] as const
              ).map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => {
                    setMode(value);
                    setError(null);
                  }}
                  className={`-mb-px border-b-2 pb-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:text-[#0e7bf4] ${
                    mode === value ? 'border-[#0e7bf4] text-[#082046]' : 'border-transparent text-[#8a9bb3] hover:text-[#435775]'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="mt-5" aria-live="polite">
              {error && (
                <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
                  {error}
                </p>
              )}
              {success && (
                <p className="mb-4 rounded-xl border border-[#00a884]/25 bg-[#00a884]/[0.07] px-3.5 py-2.5 text-[13px] font-medium text-[#006b54]">
                  {success}
                </p>
              )}
            </div>

            {mode === 'password' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-id" className={label}>
                    {isInst ? 'Official email or mobile' : 'Mobile number or email'}
                  </label>
                  <input
                    id="login-id"
                    type="text"
                    autoComplete="username"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder={isInst ? 'admissions@college.ac.in' : '98765 43210'}
                    className={`mt-1.5 ${input}`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className={label}>
                    Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${input} pr-11`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8a9bb3] transition hover:text-[#082046] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7bf4]/40"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {codeTo && (
                  <div>
                    <label htmlFor="login-code" className={label}>
                      6-digit code sent to {codeTo}
                    </label>
                    <input
                      id="login-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className={`mt-1.5 ${input} text-center text-lg tracking-[0.4em] tabular-nums`}
                    />
                    <div className="mt-2 flex justify-between text-[13px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setCodeTo(null);
                          setCode('');
                          setSuccess(null);
                        }}
                        className="text-[#536780] hover:text-[#082046]"
                      >
                        Change details
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handlePasswordLogin(undefined, true)}
                        className="text-[#0e7bf4] hover:text-[#0c6fdc] disabled:opacity-50"
                      >
                        Send a new code
                      </button>
                    </div>
                  </div>
                )}

                {rememberBox}
                <button type="submit" disabled={loading || (codeTo !== null && code.length !== 6)} className={primary}>
                  {loading ? 'Signing in…' : codeTo ? 'Verify and sign in' : 'Sign in'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="otp-phone" className={label}>
                    Registered mobile number
                  </label>
                  <input
                    id="otp-phone"
                    type="tel"
                    autoComplete="tel-national"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="98765 43210"
                    className={`mt-1.5 ${input}`}
                  />
                </div>

                {!otpSent ? (
                  <button type="button" onClick={handleSendOtp} disabled={loading} className={primary}>
                    {loading ? 'Sending code…' : 'Send code'}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label htmlFor="otp-code" className={label}>
                        6-digit code
                      </label>
                      <input
                        id="otp-code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        className={`mt-1.5 ${input} text-center text-lg tracking-[0.4em] tabular-nums`}
                        required
                      />
                    </div>
                    {rememberBox}
                    <button type="submit" disabled={loading} className={primary}>
                      {loading ? 'Verifying…' : 'Verify and sign in'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full text-center text-[13px] font-semibold text-[#536780] hover:text-[#082046]"
                    >
                      Didn&apos;t get it? Send a new code
                    </button>
                  </form>
                )}
              </div>
            )}

            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <div className="mt-6">
                <div className="mb-4 flex items-center gap-3 text-xs font-medium text-[#8a9bb3]" aria-hidden="true">
                  <span className="h-px flex-1 bg-[#e3eaf3]" /> or <span className="h-px flex-1 bg-[#e3eaf3]" />
                </div>
                <GoogleButton
                  clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                  theme="outline"
                  onCredential={(c) => void handleGoogle(c)}
                />
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-[#435775]">
            {isInst ? 'Your college isn’t on ApplyFields yet? ' : 'New to ApplyFields? '}
            <Link
              href={isInst ? '/institution/onboard' : '/onboard'}
              className="font-bold text-[#0e7bf4] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {isInst ? 'Register your college' : 'Register your centre'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F4F8]" />}>
      <LoginFormContent />
    </Suspense>
  );
}
