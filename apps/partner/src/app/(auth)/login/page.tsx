'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleButton } from '@applyfields/ui';
import { apiPost, getMyPartner } from '@/lib/api';
import { usePartnerAuth } from '@/lib/auth-context';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = usePartnerAuth();

  const [persona, setPersona] = useState<'kiosk' | 'institution'>('kiosk');
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

  async function routeAfterLogin() {
    await refreshSession();
    const partnerRes = await getMyPartner();
    if (partnerRes.data) {
      const isInst =
        ['college', 'university', 'training_institute'].includes(partnerRes.data.type);
      if (partnerRes.data.verification_status === 'verified') {
        router.push(isInst ? '/institution/dashboard' : '/dashboard');
      } else {
        router.push(isInst ? '/institution/under-review' : '/under-review');
      }
    } else {
      router.push(persona === 'institution' ? '/institution/onboard' : '/onboard');
    }
  }


  /** Google sign-in: the API verifies the token with Google, then we route like any other login. */
  async function handleGoogle(credential: string) {
    setError(null);
    setLoading(true);
    const res = await apiPost<{ user: unknown }>('/auth/social-login', { provider: 'google', credential });
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error || 'Google sign-in failed. Please try again.');
      return;
    }
    localStorage.setItem('currentUser', JSON.stringify(res.data.user));
    window.dispatchEvent(new Event('auth-changed'));
    setSuccess('Signed in with Google! Loading workspace...');
    setTimeout(() => routeAfterLogin(), 600);
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
      setError('Please enter your registered phone number or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    // Verified accounts sign in with the password alone; a never-verified account gets one code, once.
    const res = !codeTo || resend
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
      setError(res.error || (codeTo ? 'That code did not work. Check it or send a new one.' : 'Failed to login. Please check your credentials.'));
      return;
    }
    if ('verificationRequired' in res.data) {
      setCodeTo(res.data.sentTo);
      setCode('');
      setSuccess(`First sign-in: confirm it's you with the 6-digit code sent to ${res.data.sentTo}. You won't be asked again.`);
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('auth-changed'));
    }

    setSuccess('Signed in successfully! Loading operator workspace...');
    setTimeout(() => {
      routeAfterLogin();
    }, 600);
  }

  async function handleSendOtp() {
    setError(null);
    if (!phoneOrEmail.trim()) {
      setError('Please enter your registered mobile number or email.');
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
      setError('Please enter the 6-digit code.');
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
      setError(res.error || 'Invalid OTP code.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('auth-changed'));
    }

    setSuccess('Verified successfully! Loading workspace...');
    setTimeout(() => {
      routeAfterLogin();
    }, 600);
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Partner Network Home
        </Link>

        {/* Persona Segmented Controller (Founder Doc §20 vs §21) */}
        <div className="mb-6 flex rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setPersona('kiosk');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              persona === 'kiosk'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Service Kiosk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPersona('institution');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              persona === 'institution'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>College / University</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-slate-950 font-black shadow-lg text-xl transition-all ${
              persona === 'institution'
                ? 'bg-gradient-to-tr from-blue-500 to-indigo-400 text-white shadow-blue-500/25'
                : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {persona === 'institution' ? (
              <Building2 className="h-6 w-6 text-white" />
            ) : (
              <Store className="h-6 w-6 text-slate-950" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {persona === 'institution' ? 'Institution Sign In' : 'Operator Sign In'}
            </h1>
            <p className="text-xs text-slate-400">
              {persona === 'institution'
                ? 'College & University Admissions Desk (Founder Doc §21)'
                : 'ApplyFields Dedicated Partner Desk (MeeSeva / CSC / Xerox)'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              mode === 'password'
                ? persona === 'institution'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('otp');
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              mode === 'otp'
                ? persona === 'institution'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mobile OTP Login
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300">
              {success}
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  {persona === 'institution'
                    ? 'Official Institutional Email or Phone'
                    : 'Mobile Number or Email'}
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder={
                      persona === 'institution'
                        ? 'e.g. admissions@cbit.ac.in or 9876543210'
                        : 'e.g. 9876543210 or center@gmail.com'
                    }
                    className={`block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      persona === 'institution'
                        ? 'focus:border-blue-500 focus:ring-blue-500'
                        : 'focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    {persona === 'institution' ? 'Admissions Desk Password' : 'Operator Password'}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                </div>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      persona === 'institution'
                        ? 'focus:border-blue-500 focus:ring-blue-500'
                        : 'focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Requirements Notice */}
                <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between font-semibold text-slate-300">
                    <span>Password requirements:</span>
                    <span className="text-[10px] text-slate-500">8+ chars, capital, small, digit &amp; symbol</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[
                      { label: '8+ chars', met: password.length >= 8 },
                      { label: 'A-Z', met: /[A-Z]/.test(password) },
                      { label: 'a-z', met: /[a-z]/.test(password) },
                      { label: '0-9', met: /[0-9]/.test(password) },
                      { label: 'Symbol', met: /[^A-Za-z0-9]/.test(password) },
                    ].map((r) => (
                      <span
                        key={r.label}
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                          r.met
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                        }`}
                      >
                        <span className={`inline-block size-1 rounded-full ${r.met ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {codeTo && (
                <div>
                  <label htmlFor="login-code" className="block text-xs font-semibold text-slate-300">
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
                    className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="mt-2 flex justify-between text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeTo(null);
                        setCode('');
                        setSuccess(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      Change details
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handlePasswordLogin(undefined, true)}
                      className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                    >
                      Send a new code
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="size-4 accent-current" />
                Keep me signed in on this device
              </label>
              <button
                type="submit"
                disabled={loading || (codeTo !== null && code.length !== 6)}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 ${
                  persona === 'institution'
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                {loading
                  ? 'Signing in...'
                  : codeTo
                  ? 'Verify and sign in'
                  : persona === 'institution'
                  ? 'Sign In to Admissions Desk'
                  : 'Sign In to Operator Workspace'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Registered Mobile Number
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="10-digit mobile number"
                    className={`block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                      persona === 'institution'
                        ? 'focus:border-blue-500 focus:ring-blue-500'
                        : 'focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 ${
                    persona === 'institution'
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className={`block w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2.5 text-sm tracking-widest font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                          persona === 'institution'
                            ? 'focus:border-blue-500 focus:ring-blue-500'
                            : 'focus:border-emerald-500 focus:ring-emerald-500'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="size-4 accent-current" />
                    Keep me signed in on this device
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 ${
                      persona === 'institution'
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    }`}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Enter'}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Didn&apos;t receive code? Resend OTP
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div className="mt-5 space-y-3">
              <p className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-500">or</p>
              <GoogleButton
                clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
                theme="filled_black"
                onCredential={(c) => void handleGoogle(c)}
              />
            </div>
          )}

          <div className="mt-6 border-t border-slate-800 pt-6 text-center">
            {persona === 'institution' ? (
              <p className="text-xs text-slate-400">
                Representative from a college or university?{' '}
                <Link
                  href="/institution/onboard"
                  className="font-semibold text-blue-400 hover:text-blue-300"
                >
                  Claim or Register your College Desk →
                </Link>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Not registered as a partner yet?{' '}
                <Link
                  href="/onboard"
                  className="font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Register your shop now →
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          Loading sign in desk...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
