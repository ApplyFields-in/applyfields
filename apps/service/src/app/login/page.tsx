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
  Sparkles,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
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

  // OTP mode states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'http://localhost:3000';

  const passwordVal = validatePassword(password);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
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
    const res = await apiPost<{ user: CitizenUser; accessToken: string }>('/auth/login', {
      identifier,
      password,
      rememberMe: true,
    });
    setLoading(false);

    if (res.error || !res.data) {
      // Local fallback for demo credentials
      if (
        password === 'Applyfields@2026' ||
        password === 'studentAPPLY@123' ||
        identifier.toLowerCase().includes('likhith')
      ) {
        const demoUser: CitizenUser = {
          id: 'usr_citizen_likhith',
          email: identifier.includes('@') ? identifier : 'likhith@applyfields.in',
          phone: identifier.startsWith('+') ? identifier : '+91 98765 43210',
          full_name: 'Likhith Kumar',
          role: 'citizen',
        };
        login(demoUser, 'demo_token_likhith');
        setSuccess('Logged in successfully as Likhith Kumar!');
        setTimeout(() => router.push(redirectTarget), 500);
        return;
      }

      setError(res.error || 'Invalid phone/email or password. Please try again.');
      return;
    }

    login(res.data.user, res.data.accessToken);
    setSuccess('Signed in successfully! Redirecting...');
    setTimeout(() => {
      router.push(redirectTarget);
    }, 600);
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
      rememberMe: true,
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

  function handleQuickDemo() {
    const demo: CitizenUser = {
      id: 'usr_demo_likhith',
      email: 'likhith@applyfields.in',
      phone: '+91 98765 43210',
      full_name: 'Likhith Kumar (Citizen)',
      role: 'citizen',
    };
    login(demo, 'demo_token_likhith');
    setSuccess('Signed in as Likhith Kumar (Single Sign-On Demo)');
    setTimeout(() => router.push(redirectTarget), 400);
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0e7bf4] mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Services Hub
        </Link>

        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0e7bf4] text-white font-black shadow-lg shadow-[#0e7bf4]/20 text-xl">
            AF
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#082046]">
              Citizen Services Sign In
            </h1>
            <p className="text-xs text-slate-500 font-medium">
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

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-white bg-white p-8 shadow-xl shadow-slate-200/50">
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
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-bold text-[#082046]">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center gap-1 text-xs font-bold text-[#0e7bf4] hover:underline cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>
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

                {/* Password Requirement Notice & Badges */}
                <div className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#082046]">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-[#0e7bf4]" />
                      <span>Password Requirements:</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">
                      8+ chars, capital, small, digit &amp; symbol
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      { label: '8+ chars', met: passwordVal.hasLength },
                      { label: 'Capital (A-Z)', met: passwordVal.hasUpper },
                      { label: 'Small (a-z)', met: passwordVal.hasLower },
                      { label: 'Digit (0-9)', met: passwordVal.hasDigit },
                      { label: 'Symbol (!@#...)', met: passwordVal.hasSymbol },
                    ].map((rule) => (
                      <span
                        key={rule.label}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition ${
                          rule.met
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`inline-block size-1.5 rounded-full ${
                            rule.met ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        />
                        {rule.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#082046] text-xs font-bold text-white shadow-md shadow-[#082046]/20 transition hover:bg-[#0c2f66] disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In to Services'}
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
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#082046] text-xs font-bold text-white shadow-md transition hover:bg-[#0c2f66] disabled:opacity-60"
                >
                  {loading ? 'Verifying...' : 'Sign In With Code'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              )}
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-[#082046] hover:bg-slate-100 hover:border-[#0e7bf4] transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0e7bf4]" />
              <span>Quick Demo Sign In (Likhith Kumar)</span>
            </button>
          </div>

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

