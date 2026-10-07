'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@applyfields/ui';
import { apiPost } from '@/lib/api';
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, LogIn, Mail, Phone, ShieldCheck } from 'lucide-react';
import { CountryPhoneInput, extractNationalDigits, isValidPhone } from '@/components/country-phone-input';
import { OtpInput } from '@/components/otp-input';
import { AuthDivider, PasskeyLoginButton, SocialAuthButtons } from '@/components/social-auth-buttons';
import type { AuthResponse } from '@applyfields/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedNotice = searchParams.get('verified') === 'true';

  const [mode, setMode] = useState<'password' | 'otp' | 'forgot'>('password');

  // Password mode states
  const [passwordCredType, setPasswordCredType] = useState<'phone' | 'email'>('phone');
  const [passwordPhone, setPasswordPhone] = useState('+91');
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // OTP mode states
  const [phone, setPhone] = useState('+91');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Forgot password states
  const [forgotCredType, setForgotCredType] = useState<'phone' | 'email'>('phone');
  const [forgotPhone, setForgotPhone] = useState('+91');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    verifiedNotice ? 'Email verified successfully! You can now log in.' : null,
  );

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const target = passwordCredType === 'phone' ? passwordPhone.trim() : passwordEmail.trim();
    if (passwordCredType === 'phone') {
      const national = extractNationalDigits(target);
      if (!national || !isValidPhone(target)) {
        setError('Please select your country and enter your mobile number.');
        return;
      }
    } else {
      if (!target.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setLoading(true);
    const res = await apiPost<AuthResponse>('/auth/login', {
      identifier: target,
      password,
    });
    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to log in. Please check your credentials.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('auth-changed'));
    }

    setSuccess('Logged in successfully! Redirecting...');
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }

  async function handleSendOtp() {
    setError(null);
    const cleanPhone = phone.trim();
    if (!isValidPhone(cleanPhone)) {
      setError('Please select your country and enter your mobile number.');
      return;
    }

    setLoading(true);
    const res = await apiPost<{ success: boolean; message: string; devOtp?: string }>('/auth/otp/send', {
      target: cleanPhone,
      purpose: 'login',
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setOtpSent(true);
      setSuccess('A 6-digit login code has been generated.');
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
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    const res = await apiPost<AuthResponse>('/auth/login/otp', {
      phone: phone.trim(),
      code: otpCode.trim(),
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

    setSuccess('Authenticated successfully! Redirecting...');
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }

  async function handleSendForgotOtp() {
    setError(null);
    const target = forgotCredType === 'phone' ? forgotPhone.trim() : forgotEmail.trim();
    if (forgotCredType === 'phone') {
      if (!isValidPhone(target)) {
        setError('Please select your country and enter your mobile number.');
        return;
      }
    } else {
      if (!target.includes('@')) {
        setError('Please enter your email address.');
        return;
      }
    }

    setLoading(true);
    const res = await apiPost<{ success: boolean; message: string; devOtp?: string }>('/auth/otp/send', {
      target,
      purpose: 'reset_password',
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setForgotOtpSent(true);
      setSuccess('Reset code generated.');
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
        setForgotOtp(res.data.devOtp);
      }
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    const target = forgotCredType === 'phone' ? forgotPhone.trim() : forgotEmail.trim();

    setLoading(true);
    const res = await apiPost<{ success: boolean; message: string }>('/auth/password/reset', {
      target,
      code: forgotOtp.trim(),
      newPassword,
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setSuccess('Password reset successfully. You may now log in.');
    setMode('password');
    setForgotOtpSent(false);
  }

  return (
    <div className="w-full max-w-md [perspective:1000px]">
      <Card className="p-6 sm:p-8 border-2 border-line bg-cream rounded-3xl shadow-[0_20px_40px_-10px_rgba(17,75,95,0.22),0_6px_0_0_#114b5f] transition-all">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal">
            {mode === 'forgot' ? 'Reset password' : 'Log in to ApplyFields'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-teal/70">
            {mode === 'forgot'
              ? 'Choose phone or email to receive your password reset code.'
              : 'Access your saved opportunities, profile, and application deadlines.'}
          </p>
        </div>

        {/* Social Authentication: Google & Apple (Primary) */}
        {mode !== 'forgot' && (
          <div className="mb-4">
            <SocialAuthButtons mode="login" onError={setError} onSuccess={setSuccess} />
            <AuthDivider label="or sign in with password / otp" />
          </div>
        )}

        {/* 3D Segmented Tab Switcher (Password vs OTP) */}
        {mode !== 'forgot' && (
          <div className="mb-6 flex rounded-2xl border-2 border-line/70 bg-tea/30 p-1.5 shadow-[inset_0_2px_4px_rgba(17,75,95,0.06)]">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setError(null);
              }}
              className={`flex-1 rounded-xl py-2 text-xs font-black transition-all ${
                mode === 'password'
                  ? 'bg-cream text-teal border border-line shadow-[0_3px_0_0_#114b5f,0_4px_8px_rgba(17,75,95,0.1)] -translate-y-0.5'
                  : 'text-teal/70 hover:text-teal hover:bg-tea/40'
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
              className={`flex-1 rounded-xl py-2 text-xs font-black transition-all ${
                mode === 'otp'
                  ? 'bg-cream text-teal border border-line shadow-[0_3px_0_0_#114b5f,0_4px_8px_rgba(17,75,95,0.1)] -translate-y-0.5'
                  : 'text-teal/70 hover:text-teal hover:bg-tea/40'
              }`}
            >
              One-Time Code (OTP)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border-2 border-line bg-tea/50 p-3.5 text-xs font-bold text-teal shadow-xs" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border-2 border-celadon bg-celadon/25 p-3.5 text-xs font-bold text-teal flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="size-4 text-sea shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {/* Phone vs Email Selector */}
            <div>
              <div className="flex rounded-xl border-2 border-line/70 bg-tea/20 p-1 shadow-inner mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordCredType('phone');
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    passwordCredType === 'phone'
                      ? 'bg-cream text-teal border border-line shadow-xs -translate-y-0.5'
                      : 'text-teal/70 hover:text-teal'
                  }`}
                >
                  <Phone className="size-3.5 text-sea" />
                  <span>Mobile Phone</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordCredType('email');
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    passwordCredType === 'email'
                      ? 'bg-cream text-teal border border-line shadow-xs -translate-y-0.5'
                      : 'text-teal/70 hover:text-teal'
                  }`}
                >
                  <Mail className="size-3.5 text-sea" />
                  <span>Email Address</span>
                </button>
              </div>

              {passwordCredType === 'phone' ? (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                    Mobile Number <span className="font-normal text-teal/60">(Click flag for country code)</span>
                  </label>
                  <CountryPhoneInput
                    value={passwordPhone}
                    onChange={setPasswordPhone}
                    placeholder="9876543210"
                  />
                  <p className="mt-1 text-[11px] text-teal/60">
                    Select your country code from the dropdown list.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 size-4 text-teal/50" />
                    <input
                      type="email"
                      value={passwordEmail}
                      onChange={(e) => setPasswordEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border-2 border-line bg-canvas pl-10 pr-3 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f] transition-all"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                  }}
                  className="text-[11px] font-bold text-teal underline hover:text-sea"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-teal/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-line bg-canvas pl-10 pr-10 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-teal/50 hover:text-teal transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-xl bg-teal text-cream font-black text-sm tracking-wide border-b-4 border-teal/70 shadow-[0_6px_14px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(17,75,95,0.35)] active:translate-y-1 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="size-4" />
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div className="rounded-2xl border border-line bg-tea/30 p-3 text-xs text-teal/80 flex items-start gap-2 shadow-inner">
              <ShieldCheck className="size-4 text-sea shrink-0 mt-0.5" />
              <span>
                <strong>Dev Mode:</strong> OTP codes are logged to the API terminal console instead of sending SMS.
              </span>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                Mobile Number <span className="font-normal text-teal/60">(Select country code)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <CountryPhoneInput
                    value={phone}
                    onChange={setPhone}
                    disabled={otpSent}
                    placeholder="9876543210"
                  />
                </div>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="h-10 px-4 rounded-xl bg-tea/60 text-teal font-extrabold text-xs border-b-2 border-teal/30 hover:bg-tea active:translate-y-0.5 active:border-b-0 transition-all shrink-0"
                  >
                    Send OTP
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="h-10 px-3 rounded-xl bg-transparent text-teal font-bold text-xs hover:bg-tea/30 transition-all shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-teal/60">Click the country flag to select country code.</p>
            </div>

            {otpSent && devOtp && (
              <div className="rounded-2xl border-2 border-sea bg-sea/15 p-3.5 text-xs text-teal shadow-xs flex items-center justify-between gap-3">
                <div>
                  <span className="font-extrabold text-sea block">🧪 Development Mode Code:</span>
                  <span className="font-mono text-base font-black tracking-widest text-teal">{devOtp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(devOtp)}
                  className="px-3 py-1.5 rounded-xl bg-sea text-cream font-extrabold text-xs hover:bg-sea/90 active:translate-y-0.5 transition-all shadow-xs shrink-0"
                >
                  Auto-fill Code
                </button>
              </div>
            )}

            {otpSent && (
              <div className="pt-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-2 text-center">
                  Enter 6-Digit Code
                </label>
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={loading}
                  length={6}
                />
              </div>
            )}

            {otpSent && (
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full h-12 mt-2 rounded-xl bg-teal text-cream font-black text-sm tracking-wide border-b-4 border-teal/70 shadow-[0_6px_14px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(17,75,95,0.35)] active:translate-y-1 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Sign In with OTP'}
              </button>
            )}
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex rounded-xl border-2 border-line/70 bg-tea/20 p-1 shadow-inner mb-3">
              <button
                type="button"
                disabled={forgotOtpSent}
                onClick={() => {
                  setForgotCredType('phone');
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  forgotCredType === 'phone'
                    ? 'bg-cream text-teal border border-line shadow-xs -translate-y-0.5'
                    : 'text-teal/70 hover:text-teal'
                } disabled:opacity-60`}
              >
                <Phone className="size-3.5 text-sea" />
                <span>Mobile Phone</span>
              </button>
              <button
                type="button"
                disabled={forgotOtpSent}
                onClick={() => {
                  setForgotCredType('email');
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  forgotCredType === 'email'
                    ? 'bg-cream text-teal border border-line shadow-xs -translate-y-0.5'
                    : 'text-teal/70 hover:text-teal'
                } disabled:opacity-60`}
              >
                <Mail className="size-3.5 text-sea" />
                <span>Email Address</span>
              </button>
            </div>

            {forgotCredType === 'phone' ? (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                  Mobile Number <span className="font-normal text-teal/60">(Select country code)</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <CountryPhoneInput
                      value={forgotPhone}
                      onChange={setForgotPhone}
                      disabled={forgotOtpSent}
                      placeholder="9876543210"
                    />
                  </div>
                  {!forgotOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      disabled={loading}
                      className="h-10 px-4 rounded-xl bg-tea/60 text-teal font-extrabold text-xs border-b-2 border-teal/30 hover:bg-tea active:translate-y-0.5 active:border-b-0 transition-all shrink-0"
                    >
                      Send Code
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-teal/60">Click the country flag to select country code.</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                  Registered Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={forgotOtpSent}
                    className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f] disabled:opacity-60"
                    required
                  />
                  {!forgotOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      disabled={loading}
                      className="h-10 px-4 rounded-xl bg-tea/60 text-teal font-extrabold text-xs border-b-2 border-teal/30 hover:bg-tea active:translate-y-0.5 active:border-b-0 transition-all shrink-0"
                    >
                      Send Code
                    </button>
                  )}
                </div>
              </div>
            )}

            {forgotOtpSent && (
              <>
                {devOtp && (
                  <div className="rounded-2xl border-2 border-sea bg-sea/15 p-3.5 text-xs text-teal shadow-xs flex items-center justify-between gap-3">
                    <div>
                      <span className="font-extrabold text-sea block">🧪 Development Mode Code:</span>
                      <span className="font-mono text-base font-black tracking-widest text-teal">{devOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotOtp(devOtp)}
                      className="px-3 py-1.5 rounded-xl bg-sea text-cream font-extrabold text-xs hover:bg-sea/90 active:translate-y-0.5 transition-all shadow-xs shrink-0"
                    >
                      Auto-fill Code
                    </button>
                  </div>
                )}

                <div className="pt-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-2 text-center">
                    6-Digit Reset Code
                  </label>
                  <OtpInput
                    value={forgotOtp}
                    onChange={setForgotOtp}
                    disabled={loading}
                    length={6}
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 size-4 text-teal/50" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border-2 border-line bg-canvas pl-10 pr-10 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-3 text-teal/50 hover:text-teal transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || forgotOtp.length !== 6 || newPassword.length < 8}
                  className="w-full h-12 mt-2 rounded-xl bg-teal text-cream font-black text-sm tracking-wide border-b-4 border-teal/70 shadow-[0_6px_14px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Set New Password'}
                </button>
              </>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setError(null);
                }}
                className="text-xs font-bold text-teal/80 hover:text-teal underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Modern & Faster Sign-In: Passkey */}
        {mode !== 'forgot' && (
          <PasskeyLoginButton
            defaultEmail={passwordCredType === 'email' ? passwordEmail : undefined}
            onError={setError}
            onSuccess={setSuccess}
          />
        )}

        <p className="mt-6 text-center text-xs text-teal/70">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-extrabold text-teal underline hover:text-sea">
            Create free account
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md p-8 text-center text-teal">
          <p className="text-sm">Loading sign in...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
