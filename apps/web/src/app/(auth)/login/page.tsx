'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { ArrowLeft, ArrowRight, KeyRound, Mail } from 'lucide-react';
import { CountryPhoneInput, extractNationalDigits, isValidPhone } from '@/components/country-phone-input';
import { OtpInput } from '@/components/otp-input';
import { AuthDivider, PasskeyLoginButton, SocialAuthButtons } from '@/components/social-auth-buttons';
import {
  Checkbox,
  DevCode,
  IconInput,
  LABEL,
  Notice,
  PasswordInput,
  PRIMARY,
  SIDE_BTN,
  TEXT_BTN,
} from '@/components/auth-ui';
import type { AuthResponse } from '@applyfields/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedNotice = searchParams.get('verified') === 'true';
  const redirectTarget = searchParams.get('redirect') || searchParams.get('target') || searchParams.get('next') || '/me';

  const [mode, setMode] = useState<'password' | 'otp' | 'forgot'>('password');

  // Password mode states
  const [passwordCredType, setPasswordCredType] = useState<'phone' | 'email'>('phone');
  const [passwordPhone, setPasswordPhone] = useState('+91');
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const [rememberMe, setRememberMe] = useState(true);
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
      rememberMe,
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
      router.push(redirectTarget);
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

    setSuccess('Authenticated successfully! Redirecting...');
    setTimeout(() => {
      router.push(redirectTarget);
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

  const switchMode = (next: 'password' | 'otp' | 'forgot') => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-extrabold tracking-tight text-teal sm:text-4xl">
        {mode === 'forgot' ? 'Reset your password' : 'Welcome back!'}
      </h1>
      <p className="mt-2 text-base text-teal/60">
        {mode === 'forgot'
          ? "We'll send a reset code to your mobile number or email."
          : 'Log in to explore opportunities tailored for you.'}
      </p>

      {mode !== 'forgot' && (
        <div className="mt-6">
          <SocialAuthButtons
            mode="login"
            redirectUrl={redirectTarget}
            onError={setError}
            onSuccess={setSuccess}
          />
          <AuthDivider label="or sign in with password / mobile" />
        </div>
      )}

      {mode !== 'forgot' && (
        <div role="tablist" aria-label="How to log in" className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
          {(['password', 'otp'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`h-10 rounded-lg text-sm font-semibold transition ${
                mode === m ? 'bg-cream text-teal shadow-[0_2px_8px_-2px_rgb(8_32_70/0.18)]' : 'text-teal/55 hover:text-teal'
              }`}
            >
              {m === 'password' ? 'Password' : 'One-time code'}
            </button>
          ))}
        </div>
      )}

      <Notice error={error} success={success} />

      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="mt-5 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="login-id" className="text-sm font-semibold text-teal">
                {passwordCredType === 'phone' ? 'Mobile number' : 'Email address'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setPasswordCredType(passwordCredType === 'phone' ? 'email' : 'phone');
                  setError(null);
                }}
                className="text-xs font-semibold text-sea hover:underline"
              >
                {passwordCredType === 'phone' ? 'Use email instead' : 'Use mobile number instead'}
              </button>
            </div>
            {passwordCredType === 'phone' ? (
              <CountryPhoneInput id="login-id" value={passwordPhone} onChange={setPasswordPhone} placeholder="9876543210" />
            ) : (
              <IconInput
                icon={Mail}
                id="login-id"
                type="email"
                autoComplete="email"
                value={passwordEmail}
                onChange={(e) => setPasswordEmail(e.target.value)}
                placeholder="yourname@example.com"
                required
              />
            )}
          </div>

          <div>
            <label htmlFor="login-password" className={LABEL}>
              Password
            </label>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Checkbox checked={rememberMe} onChange={setRememberMe}>
              Remember me
            </Checkbox>
            <button type="button" onClick={() => switchMode('forgot')} className={TEXT_BTN}>
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={loading} className={PRIMARY}>
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </button>
        </form>
      )}

      {mode === 'otp' && (
        <form onSubmit={handleOtpLogin} className="mt-5 space-y-4">
          <div>
            <label htmlFor="otp-phone" className={LABEL}>
              Mobile number
            </label>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <CountryPhoneInput id="otp-phone" value={phone} onChange={setPhone} disabled={otpSent} placeholder="9876543210" />
              </div>
              {!otpSent ? (
                <button type="button" onClick={handleSendOtp} disabled={loading} className={SIDE_BTN}>
                  Send code
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  className={SIDE_BTN}
                >
                  Change
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-teal/50">Dev mode: the code appears in the API terminal, no SMS is sent.</p>
          </div>

          {otpSent && devOtp && <DevCode code={devOtp} onFill={() => setOtpCode(devOtp)} />}

          {otpSent && (
            <>
              <div>
                <span className={LABEL}>Enter the 6-digit code</span>
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} length={6} />
              </div>
              <Checkbox checked={rememberMe} onChange={setRememberMe}>
                Remember me
              </Checkbox>
              <button type="submit" disabled={loading || otpCode.length !== 6} className={PRIMARY}>
                {loading ? 'Checking code...' : 'Sign in'}
                {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
              </button>
            </>
          )}
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="forgot-id" className="text-sm font-semibold text-teal">
                {forgotCredType === 'phone' ? 'Mobile number' : 'Email address'}
              </label>
              {!forgotOtpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotCredType(forgotCredType === 'phone' ? 'email' : 'phone');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-sea hover:underline"
                >
                  {forgotCredType === 'phone' ? 'Use email instead' : 'Use mobile number instead'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                {forgotCredType === 'phone' ? (
                  <CountryPhoneInput
                    id="forgot-id"
                    value={forgotPhone}
                    onChange={setForgotPhone}
                    disabled={forgotOtpSent}
                    placeholder="9876543210"
                  />
                ) : (
                  <IconInput
                    icon={Mail}
                    id="forgot-id"
                    type="email"
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="yourname@example.com"
                    disabled={forgotOtpSent}
                    required
                  />
                )}
              </div>
              {!forgotOtpSent && (
                <button type="button" onClick={handleSendForgotOtp} disabled={loading} className={SIDE_BTN}>
                  Send code
                </button>
              )}
            </div>
          </div>

          {forgotOtpSent && (
            <>
              {devOtp && <DevCode code={devOtp} onFill={() => setForgotOtp(devOtp)} />}

              <div>
                <span className={LABEL}>6-digit reset code</span>
                <OtpInput value={forgotOtp} onChange={setForgotOtp} disabled={loading} length={6} />
              </div>

              <div>
                <label htmlFor="new-password" className={LABEL}>
                  New password
                </label>
                <PasswordInput
                  id="new-password"
                  icon={KeyRound}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="At least 8 characters"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || forgotOtp.length !== 6 || newPassword.length < 8}
                className={PRIMARY}
              >
                {loading ? 'Saving...' : 'Set new password'}
              </button>
            </>
          )}

          <button type="button" onClick={() => switchMode('password')} className={`${TEXT_BTN} flex items-center gap-1.5`}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </button>
        </form>
      )}

      {mode !== 'forgot' && (
        <div className="mt-5">
          <PasskeyLoginButton
            defaultEmail={passwordCredType === 'email' ? passwordEmail : undefined}
            onError={setError}
            onSuccess={setSuccess}
          />
        </div>
      )}

      <p className="mt-6 text-center text-sm text-teal/60">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-sea hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-teal/60">Loading sign in...</p>}>
      <LoginForm />
    </Suspense>
  );
}
