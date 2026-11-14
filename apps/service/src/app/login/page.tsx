'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Circle,
  ExternalLink,
} from 'lucide-react';
import { GoogleButton } from '@applyfields/ui';
import { apiPost } from '@/lib/api';
import { useAuth, type CitizenUser } from '@/lib/auth-context';

export function validatePassword(password: string) {
  const hasLength = (password || '').length >= 8;
  const hasUpper = /[A-Z]/.test(password || '');
  const hasLower = /[a-z]/.test(password || '');
  const hasDigit = /[0-9]/.test(password || '');
  const hasSymbol = /[^A-Za-z0-9]/.test(password || '');
  return {
    hasLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSymbol,
    isValid: hasLength && hasUpper && hasLower && hasDigit && hasSymbol,
  };
}

function ServiceLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || searchParams.get('next') || searchParams.get('from');
  const redirectTarget = rawRedirect && rawRedirect !== '/login' ? rawRedirect : '/';

  const { login } = useAuth();

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [credType, setCredType] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Set only when the account still has to confirm its email/phone once (first sign-in).
  const [codeTo, setCodeTo] = useState<string | null>(null);
  // Remember me: stay signed in across browser restarts until sign-out.
  const [rememberMe, setRememberMe] = useState(true);
  const [code, setCode] = useState('');

  // OTP mode states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'http://localhost:3000';

  const passwordVal = validatePassword(password);

  async function handlePasswordLogin(e?: React.FormEvent, resend = false) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    const identifier = credType === 'phone' ? phone.trim() : email.trim();
    if (!identifier || (credType === 'phone' && identifier.length < 5)) {
      setError(credType === 'phone' ? 'Please enter your mobile number.' : 'Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    // Verified accounts sign in with the password alone; a never-verified account gets one code, once.
    type Session = { user: CitizenUser; accessToken: string };
    const res = !codeTo || resend
      ? await apiPost<Session | { verificationRequired: true; sentTo: string }>('/auth/login', {
          identifier,
          password,
          rememberMe,
        })
      : await apiPost<Session>('/auth/login/verify', { identifier, password, code: code.trim(), rememberMe });
    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error || (codeTo ? 'That code did not work. Check it or send a new one.' : 'Invalid phone/email or password. Please try again.'));
      return;
    }
    if ('verificationRequired' in res.data) {
      setCodeTo(res.data.sentTo);
      setCode('');
      setSuccess(`First sign-in: confirm it's you with the 6-digit code sent to ${res.data.sentTo}. You won't be asked again.`);
      return;
    }

    login(res.data.user, res.data.accessToken);
    setSuccess('Signed in successfully! Redirecting...');
    setTimeout(() => {
      router.push(redirectTarget);
    }, 600);
  }

  /** Google sign-in: the API verifies the token with Google. */
  async function handleGoogle(credential: string) {
    setError(null);
    setLoading(true);
    const res = await apiPost<{ user: CitizenUser; accessToken: string }>('/auth/social-login', {
      provider: 'google',
      credential,
    });
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.error || 'Google sign-in failed. Please try again.');
      return;
    }
    login(res.data.user, res.data.accessToken);
    setSuccess('Signed in with Google! Redirecting...');
    setTimeout(() => router.push(redirectTarget), 600);
  }

  async function handleSendOtp() {
    setError(null);
    setSuccess(null);
    const target = credType === 'phone' ? phone.trim() : email.trim();

    if (!target || (credType === 'phone' && target.length < 5)) {
      setError('Please provide your registered mobile number or email.');
      return;
    }

    setLoading(true);
    const res = await apiPost<{ success: boolean; message: string; devOtp?: string }>('/auth/otp/send', {
      target,
      purpose: 'login',
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setOtpSent(true);
      setSuccess(`A 6-digit verification code has been sent to ${target}.`);
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
        setOtpCode(res.data.devOtp);
      }
    }
  }

  async function handleOtpLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    const target = credType === 'phone' ? phone.trim() : email.trim();
    setLoading(true);
    const res = await apiPost<{ user: CitizenUser; accessToken: string }>('/auth/login/otp', {
      identifier: target,
      phone: credType === 'phone' ? target : undefined,
      email: credType === 'email' ? target : undefined,
      code: otpCode.trim(),
      rememberMe,
    });
    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Invalid OTP code.');
      return;
    }

    login(res.data.user, res.data.accessToken);
    setSuccess('Authenticated successfully! Redirecting...');
    setTimeout(() => router.push(redirectTarget), 600);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0e7bf4] mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Services Hub
        </Link>

        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#0e7bf4] text-white font-black shadow-lg shadow-[#0e7bf4]/20 text-xl">
            AF
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-[#082046]">
              Citizen Services Sign In
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Access MeeSeva, CSC, PAN, Aadhaar bookings &amp; documents
            </p>
          </div>
        </div>

        {/* Single Sign-On Info Banner */}
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-[#082046] flex items-start gap-2.5 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-[#0e7bf4] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#082046]">Unified ApplyFields Account</p>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              Use the <strong>exact same account</strong> (e.g. your registered phone or email) across both{' '}
              <a href={MAIN_WEB_URL} target="_blank" rel="noreferrer" className="text-[#0e7bf4] font-semibold underline inline-flex items-center gap-0.5">
                Citizen Opportunities <ExternalLink className="h-3 w-3 inline" />
              </a>{' '}
              and <strong>Citizen Services</strong>.
            </p>
          </div>
        </div>

        {/* Tab switcher: Password vs OTP */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-[#d5deea] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setError(null);
            }}
            className={`h-10 rounded-xl text-xs font-bold transition ${
              mode === 'password'
                ? 'bg-[#082046] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#082046]'
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
            className={`h-10 rounded-xl text-xs font-bold transition ${
              mode === 'otp'
                ? 'bg-[#082046] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#082046]'
            }`}
          >
            One-Time Code (OTP)
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="rounded-3xl border border-white bg-white p-6 sm:p-7 shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              {/* Identifier Input */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-[#082046]">
                    {credType === 'phone' ? 'Mobile Number' : 'Email Address'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCredType(credType === 'phone' ? 'email' : 'phone');
                      setError(null);
                    }}
                    className="text-xs font-bold text-[#0e7bf4] hover:underline"
                  >
                    {credType === 'phone' ? 'Use email instead' : 'Use mobile number instead'}
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    {credType === 'phone' ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  {credType === 'phone' ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-11 w-full rounded-2xl border border-[#d5deea] bg-[#F8FAFC] pl-10 pr-4 text-xs font-semibold text-[#082046] placeholder-slate-400 transition focus:border-[#0e7bf4] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0e7bf4]/10"
                      required
                    />
                  ) : (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@example.com"
                      className="h-11 w-full rounded-2xl border border-[#d5deea] bg-[#F8FAFC] pl-10 pr-4 text-xs font-semibold text-[#082046] placeholder-slate-400 transition focus:border-[#0e7bf4] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0e7bf4]/10"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Password Input with Show Password Option */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#082046]">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-2xl border border-[#d5deea] bg-[#F8FAFC] pl-10 pr-11 text-xs font-semibold text-[#082046] placeholder-slate-400 transition focus:border-[#0e7bf4] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0e7bf4]/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-[#082046] transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password requirements: a strength bar + checklist, shown once typing starts */}
                {password && (() => {
                  const rules = [
                    { label: '8+ characters', met: passwordVal.hasLength },
                    { label: 'Uppercase (A-Z)', met: passwordVal.hasUpper },
                    { label: 'Lowercase (a-z)', met: passwordVal.hasLower },
                    { label: 'Number (0-9)', met: passwordVal.hasDigit },
                    { label: 'Symbol (!@#…)', met: passwordVal.hasSymbol },
                  ];
                  const metCount = rules.filter((r) => r.met).length;
                  return (
                    <div className="mt-2.5 rounded-2xl border border-[#e3eaf3] bg-[#F8FAFC] p-3">
                      <div className="flex items-center gap-1" aria-hidden="true">
                        {rules.map((r, i) => (
                          <span
                            key={r.label}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < metCount ? (metCount === 5 ? 'bg-emerald-500' : 'bg-[#0e7bf4]') : 'bg-[#dfe7f1]'
                            }`}
                          />
                        ))}
                      </div>
                      <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-semibold">
                        {rules.map((rule) => (
                          <li
                            key={rule.label}
                            className={`flex items-center gap-1.5 ${rule.met ? 'text-emerald-700' : 'text-slate-500'}`}
                          >
                            {rule.met ? (
                              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                            ) : (
                              <Circle className="size-3.5 shrink-0 text-slate-300" />
                            )}
                            {rule.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>

              {codeTo && (
                <div>
                  <label htmlFor="login-code" className="block text-xs font-bold text-slate-700">
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
                    className="mt-1.5 block h-12 w-full rounded-2xl border border-slate-200 bg-white text-center font-mono text-lg font-bold tracking-[0.4em] text-[#082046] focus:border-[#082046] focus:outline-none focus:ring-2 focus:ring-[#082046]/15"
                  />
                  <div className="mt-2 flex justify-between text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeTo(null);
                        setCode('');
                        setSuccess(null);
                      }}
                      className="text-slate-500 hover:text-[#082046]"
                    >
                      Change details
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handlePasswordLogin(undefined, true)}
                      className="text-[#0e7bf4] hover:underline disabled:opacity-50"
                    >
                      Send a new code
                    </button>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="size-4 accent-current" />
                Keep me signed in on this device
              </label>
              <button
                type="submit"
                disabled={loading || (codeTo !== null && code.length !== 6)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#082046] text-xs font-bold text-white shadow-md shadow-[#082046]/20 transition hover:bg-[#0c2f66] disabled:opacity-60"
              >
                {loading ? 'Signing in...' : codeTo ? 'Verify and sign in' : 'Sign In to Services'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin} className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-[#082046]">
                    {credType === 'phone' ? 'Mobile Number' : 'Email Address'}
                  </label>
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setCredType(credType === 'phone' ? 'email' : 'phone');
                        setError(null);
                      }}
                      className="text-xs font-bold text-[#0e7bf4] hover:underline"
                    >
                      {credType === 'phone' ? 'Use email instead' : 'Use mobile instead'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type={credType === 'phone' ? 'tel' : 'email'}
                    value={credType === 'phone' ? phone : email}
                    onChange={(e) => (credType === 'phone' ? setPhone(e.target.value) : setEmail(e.target.value))}
                    disabled={otpSent}
                    placeholder={credType === 'phone' ? '+91 98765 43210' : 'yourname@example.com'}
                    className="h-11 flex-1 rounded-2xl border border-[#d5deea] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#082046] placeholder-slate-400 transition focus:border-[#0e7bf4] focus:bg-white focus:outline-none"
                    required
                  />
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="h-11 px-4 rounded-2xl border border-[#d5deea] bg-[#0e7bf4] text-xs font-bold text-white shadow hover:bg-[#0c6fdc] transition"
                    >
                      Send Code
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="h-11 px-3 rounded-2xl border border-[#d5deea] bg-white text-xs font-bold text-[#082046] hover:bg-slate-50 transition"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              {otpSent && devOtp && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 px-3.5 py-2.5 text-xs">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-500">Dev Mode Code</span>
                    <span className="font-mono text-base font-black tracking-widest text-[#082046]">{devOtp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtp)}
                    className="rounded-xl bg-[#0e7bf4] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#0c6fdc]"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {otpSent && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#082046]">6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="h-12 w-full text-center font-mono text-xl tracking-[0.5em] font-black rounded-2xl border border-[#d5deea] bg-[#F8FAFC] text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                    required
                  />
                </div>
              )}

              {otpSent && (
                <>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="size-4 accent-current" />
                  Keep me signed in on this device
                </label>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#082046] text-xs font-bold text-white shadow-md transition hover:bg-[#0c2f66] disabled:opacity-60"
                >
                  {loading ? 'Verifying...' : 'Sign In With Code'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
                </>
              )}
            </form>
          )}

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">or</p>
              <GoogleButton clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} onCredential={(c) => void handleGoogle(c)} />
            </div>
          )}

          {/* Register Link */}
          <div className="mt-5 text-center text-xs text-slate-500 font-medium">
            Don&apos;t have an ApplyFields account yet?{' '}
            <a
              href={`${MAIN_WEB_URL}/register`}
              className="font-bold text-[#0e7bf4] hover:underline"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceLoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-semibold text-slate-500">Loading sign in...</div>}>
      <ServiceLoginForm />
    </Suspense>
  );
}

