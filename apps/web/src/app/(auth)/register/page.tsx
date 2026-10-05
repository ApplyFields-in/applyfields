'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Badge, buttonClass } from '@applyfields/ui';
import { apiPost } from '@/lib/api';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { CountryPhoneInput } from '@/components/country-phone-input';
import type { UserSummary } from '@applyfields/types';

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [target, setTarget] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      setError('Please provide a valid email address to prevent fake account registrations.');
      return;
    }

    // Phone is optional, but if entered it must have valid digits
    const cleanPhone = phone.trim();
    const hasPhoneDigits = cleanPhone.replace(/^\+\d+/, '').length > 0;
    if (hasPhoneDigits && !/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
      setError('Please enter a valid phone number with your country code selected.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError('You must accept both the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    const res = await apiPost<{ user: UserSummary; message: string; target: string }>(
      '/auth/register',
      {
        email: cleanEmail,
        phone: hasPhoneDigits ? cleanPhone : undefined,
        password,
      },
    );
    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to register. Please check your details and try again.');
      return;
    }

    setTarget(res.data.target);
    setSuccessMsg(res.data.message);
    setStep('verify');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    const purpose = target.includes('@') ? 'verify_email' : 'verify_phone';
    const res = await apiPost<{ verified: boolean; message: string }>(
      '/auth/otp/verify',
      {
        target,
        purpose,
        code: otpCode,
      },
    );
    setLoading(false);

    if (res.error || !res.data) {
      setError(res.error || 'Verification failed. Please check the code.');
      return;
    }

    setSuccessMsg('Email successfully verified! Redirecting to login...');
    setTimeout(() => {
      router.push('/login?verified=true');
    }, 1500);
  }

  async function handleResendOtp() {
    setError(null);
    setLoading(true);
    const purpose = target.includes('@') ? 'verify_email' : 'verify_phone';
    const res = await apiPost<{ success: boolean; message: string }>('/auth/otp/send', {
      target,
      purpose,
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg('A new verification code has been generated.');
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="p-6 sm:p-8 border border-line bg-cream shadow-card">
        {step === 'form' ? (
          <div>
            <div className="mb-6">
              <Badge tone="celadon" className="mb-2">Citizen Registration</Badge>
              <h1 className="text-2xl font-bold tracking-tight text-teal">Create your account</h1>
              <p className="mt-1 text-sm text-teal/70">
                To prevent fake accounts, a one-time verification code (OTP) will be sent to your email.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-line bg-tea/40 p-3 text-xs font-medium text-teal" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                  Email Address <span className="text-sea font-bold">* (Verified via OTP)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-teal/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="karthik@example.com"
                    className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-teal/60">
                  Verification OTP will be sent here to prevent fake or duplicate accounts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                  Mobile Number <span className="font-normal text-teal/60">(Select country code)</span>
                </label>
                <CountryPhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="9876543210"
                />
                <p className="mt-1 text-[11px] text-teal/60">Click the country flag to change country code.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-teal/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 size-4 text-teal/50" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-line">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-teal/80">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-line accent-teal"
                  />
                  <span>
                    I agree to the <span className="font-semibold text-teal underline">Terms of Service</span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-teal/80">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-line accent-teal"
                  />
                  <span>
                    I agree to the <span className="font-semibold text-teal underline">Privacy Policy</span> (as required under DPDP Act 2023)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={buttonClass({ variant: 'primary', size: 'lg', className: 'w-full mt-4' })}
              >
                {loading ? 'Creating account...' : 'Create Account & Send Email OTP'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-teal/70">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-teal underline hover:text-sea">
                Log in here
              </Link>
            </p>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="inline-flex items-center gap-1.5 text-xs text-teal/70 hover:text-teal mb-4"
            >
              <ArrowLeft className="size-3.5" /> Back to details
            </button>

            <div className="mb-6">
              <Badge tone="celadon" className="mb-2">Email Verification</Badge>
              <h2 className="text-2xl font-bold tracking-tight text-teal">Verify your email</h2>
              <p className="mt-1 text-sm text-teal/70">
                To prevent fake email accounts, enter the 6-digit code sent to <strong className="text-teal font-semibold">{target}</strong>.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-line bg-tea/40 p-3 text-xs font-medium text-teal" role="alert">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-xl border border-celadon bg-celadon/20 p-3 text-xs font-medium text-teal flex items-center gap-2">
                <CheckCircle2 className="size-4 text-sea shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="mb-4 rounded-xl border border-line bg-tea/20 p-3 text-xs text-teal/80 flex items-start gap-2">
              <ShieldCheck className="size-4 text-sea shrink-0 mt-0.5" />
              <span>
                <strong>Dev Mode:</strong> OTP codes are logged to the API terminal console instead of sending email.
              </span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal/80 mb-1">
                  6-Digit Email OTP
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

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className={buttonClass({ variant: 'primary', size: 'lg', className: 'w-full' })}
              >
                {loading ? 'Verifying...' : 'Verify Email & Complete Registration'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs font-semibold text-teal hover:underline disabled:opacity-50"
                >
                  Didn&apos;t receive code? Resend Email OTP
                </button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
