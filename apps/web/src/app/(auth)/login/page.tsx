'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Card, buttonClass } from '@applyfields/ui';
import { apiPost } from '@/lib/api';
import { CheckCircle2, KeyRound, Lock, LogIn, Phone, ShieldCheck, User } from 'lucide-react';
import type { AuthResponse } from '@applyfields/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedNotice = searchParams.get('verified') === 'true';

  const [mode, setMode] = useState<'password' | 'otp' | 'forgot'>('password');

  // Password mode states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // OTP mode states
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Forgot password states
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    verifiedNotice ? 'Email/Phone verified successfully! You can now log in.' : null,
  );

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await apiPost<AuthResponse>('/auth/login', {
      identifier: identifier.trim(),
      password,
    });
    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to log in. Please check your credentials.');
      return;
    }

    // Access token is saved for client headers; refresh token is in httpOnly cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
    }

    setSuccess('Logged in successfully! Redirecting...');
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }

  async function handleSendOtp() {
    setError(null);
    if (!phone || !/^\+91[1-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid phone number formatted as +91XXXXXXXXXX');
      return;
    }

    setLoading(true);
    const res = await apiPost<{ success: boolean; message: string }>('/auth/otp/send', {
      target: phone.trim(),
      purpose: 'login',
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setOtpSent(true);
      setSuccess('A 6-digit login code has been generated.');
    }
  }

  async function handleOtpLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code.');
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
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(res.data.user));
    }

    setSuccess('Authenticated successfully! Redirecting...');
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }

  async function handleSendForgotOtp() {
    setError(null);
    if (!forgotTarget) {
      setError('Please enter your email or phone number.');
      return;
    }

    setLoading(true);
    const res = await apiPost<{ success: boolean; message: string }>('/auth/otp/send', {
      target: forgotTarget.trim(),
      purpose: 'reset_password',
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setForgotOtpSent(true);
      setSuccess('Reset code generated. Check your console in development mode.');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const res = await apiPost<{ success: boolean; message: string }>('/auth/password/reset', {
      target: forgotTarget.trim(),
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
    <div className="w-full max-w-md">
      <Card className="p-6 sm:p-8 border border-line bg-cream shadow-card">
        <div className="mb-6">
          <Badge tone="celadon" className="mb-2">Citizen Portal</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-teal">
            {mode === 'forgot' ? 'Reset password' : 'Log in to ApplyFields'}
          </h1>
          <p className="mt-1 text-sm text-teal/70">
            {mode === 'forgot'
              ? 'Enter your registered email or phone to reset your password.'
              : 'Access your saved opportunities, profile, and track application deadlines.'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <div className="mb-6 flex rounded-xl border border-line bg-tea/30 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setError(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                mode === 'password' ? 'bg-cream text-teal shadow-xs' : 'text-teal/70 hover:text-teal'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setError(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                mode === 'otp' ? 'bg-cream text-teal shadow-xs' : 'text-teal/70 hover:text-teal'
              }`}
            >
              One-Time Code (OTP)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-line bg-tea/40 p-3 text-xs font-medium text-teal" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-celadon bg-celadon/20 p-3 text-xs font-medium text-teal flex items-center gap-2">
            <CheckCircle2 className="size-4 text-sea shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                Email or Mobile Phone
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-teal/50" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or +919876543210"
                  className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-teal/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                  }}
                  className="text-[11px] font-semibold text-teal underline hover:text-sea"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-teal/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={buttonClass({ variant: 'primary', size: 'lg', className: 'w-full mt-2' })}
            >
              <LogIn className="size-4" />
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleOtpLogin} className="space-y-4">
            <div className="rounded-xl border border-line bg-tea/20 p-3 text-xs text-teal/80 flex items-start gap-2">
              <ShieldCheck className="size-4 text-sea shrink-0 mt-0.5" />
              <span>
                <strong>Dev Mode:</strong> OTP codes are logged to the API terminal console instead of sending SMS.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-2.5 size-4 text-teal/50" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    disabled={otpSent}
                    className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none disabled:opacity-60"
                    required
                  />
                </div>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className={buttonClass({ variant: 'secondary', size: 'md' })}
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
                    className={buttonClass({ variant: 'ghost', size: 'md' })}
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-line bg-canvas py-2.5 text-teal focus:outline-none"
                  required
                />
              </div>
            )}

            {otpSent && (
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className={buttonClass({ variant: 'primary', size: 'lg', className: 'w-full mt-2' })}
              >
                {loading ? 'Verifying...' : 'Sign In with OTP'}
              </button>
            )}
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                Registered Email or Phone
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={forgotTarget}
                  onChange={(e) => setForgotTarget(e.target.value)}
                  placeholder="user@example.com or +919876543210"
                  disabled={forgotOtpSent}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none disabled:opacity-60"
                  required
                />
                {!forgotOtpSent && (
                  <button
                    type="button"
                    onClick={handleSendForgotOtp}
                    disabled={loading}
                    className={buttonClass({ variant: 'secondary', size: 'md' })}
                  >
                    Send Code
                  </button>
                )}
              </div>
            </div>

            {forgotOtpSent && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-mono rounded-xl border border-line bg-canvas py-2 text-teal focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 size-4 text-teal/50" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || forgotOtp.length !== 6 || newPassword.length < 8}
                  className={buttonClass({ variant: 'primary', size: 'lg', className: 'w-full' })}
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
                className="text-xs text-teal/70 hover:text-teal underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-teal/70">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-bold text-teal underline hover:text-sea">
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
