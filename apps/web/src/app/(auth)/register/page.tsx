'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Badge } from '@applyfields/ui';
import { apiPost } from '@/lib/api';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { CountryPhoneInput } from '@/components/country-phone-input';
import { OtpInput } from '@/components/otp-input';
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
  const [devOtp, setDevOtp] = useState<string | null>(null);

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
    const res = await apiPost<{ user: UserSummary; message: string; target: string; devOtp?: string }>(
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
    if (res.data.devOtp) {
      setDevOtp(res.data.devOtp);
      setOtpCode(res.data.devOtp);
    }
    setStep('verify');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
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
    const res = await apiPost<{ success: boolean; message: string; devOtp?: string }>('/auth/otp/send', {
      target,
      purpose,
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg('A new verification code has been generated.');
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
        setOtpCode(res.data.devOtp);
      }
    }
  }

  return (
    <div className="w-full max-w-md [perspective:1000px]">
      <Card className="p-6 sm:p-8 border-2 border-line bg-cream rounded-3xl shadow-[0_20px_40px_-10px_rgba(17,75,95,0.22),0_6px_0_0_#114b5f] transition-all">
        {step === 'form' ? (
          <div>
            {/* 3D Stepper Indicator */}
            <div className="mb-6 flex items-center justify-between border-b border-line/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-teal text-cream font-mono text-xs font-black shadow-[0_2px_0_0_#1a936f]">
                  1
                </span>
                <span className="text-xs font-black text-teal">Account Details</span>
              </div>
              <div className="h-0.5 w-12 bg-line" />
              <div className="flex items-center gap-2 opacity-50">
                <span className="flex size-7 items-center justify-center rounded-xl border border-line bg-canvas text-teal/70 font-mono text-xs font-bold">
                  2
                </span>
                <span className="text-xs font-bold text-teal/70">Email OTP</span>
              </div>
            </div>

            <div className="mb-6">
              <Badge tone="celadon" className="mb-2 shadow-xs">Citizen Registration</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal">Create account</h1>
              <p className="mt-1 text-xs sm:text-sm text-teal/70">
                To prevent fake accounts, a verification code (OTP) will be sent to your email.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border-2 border-line bg-tea/50 p-3.5 text-xs font-bold text-teal shadow-xs" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] font-black text-sea uppercase bg-tea/50 px-2 py-0.5 rounded-md border border-line">
                    Verified via OTP
                  </span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 size-4 text-teal/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="karthik@example.com"
                    className="w-full rounded-xl border-2 border-line bg-canvas pl-10 pr-3 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f] transition-all"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-teal/60">
                  Verification OTP will be sent here to prevent fake registrations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                  Mobile Number <span className="font-normal text-teal/60">(Optional • Select country code)</span>
                </label>
                <CountryPhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="9876543210"
                />
                <p className="mt-1 text-[11px] text-teal/60">Click the country flag to select country code.</p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 size-4 text-teal/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border-2 border-line bg-canvas pl-10 pr-3 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 size-4 text-teal/50" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border-2 border-line bg-canvas pl-10 pr-3 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-line/70">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-teal/80">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-line accent-teal"
                  />
                  <span>
                    I agree to the <span className="font-black text-teal underline">Terms of Service</span>
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
                    I agree to the <span className="font-black text-teal underline">Privacy Policy</span> (as required under DPDP Act 2023)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-teal text-cream font-black text-sm tracking-wide border-b-4 border-teal/70 shadow-[0_6px_14px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(17,75,95,0.35)] active:translate-y-1 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UserPlus className="size-4" />
                {loading ? 'Creating account...' : 'Create Account & Send Email OTP'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-teal/70">
              Already have an account?{' '}
              <Link href="/login" className="font-extrabold text-teal underline hover:text-sea">
                Log in here
              </Link>
            </p>
          </div>
        ) : (
          <div>
            {/* 3D Stepper Indicator Active Step 2 */}
            <div className="mb-6 flex items-center justify-between border-b border-line/60 pb-4">
              <div className="flex items-center gap-2 opacity-60">
                <span className="flex size-7 items-center justify-center rounded-xl bg-sea text-cream font-mono text-xs font-black">
                  ✓
                </span>
                <span className="text-xs font-bold text-teal">Account Details</span>
              </div>
              <div className="h-0.5 w-12 bg-sea" />
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-xl bg-teal text-cream font-mono text-xs font-black shadow-[0_2px_0_0_#1a936f]">
                  2
                </span>
                <span className="text-xs font-black text-teal">Email OTP</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('form')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal/70 hover:text-teal mb-4 transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to details
            </button>

            <div className="mb-4">
              <Badge tone="celadon" className="mb-2 shadow-xs">Step 2 of 2</Badge>
              <h2 className="text-2xl font-extrabold tracking-tight text-teal">Verify your email</h2>
              <p className="mt-1 text-xs sm:text-sm text-teal/70">
                To prevent fake email accounts, enter the 6-digit code sent to <strong className="text-teal font-extrabold">{target}</strong>.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border-2 border-line bg-tea/50 p-3.5 text-xs font-bold text-teal shadow-xs" role="alert">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-2xl border-2 border-celadon bg-celadon/25 p-3.5 text-xs font-bold text-teal flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 className="size-4 text-sea shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {devOtp && (
              <div className="mb-4 rounded-2xl border-2 border-sea bg-sea/15 p-3.5 text-xs text-teal shadow-xs flex items-center justify-between gap-3">
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

            <div className="mb-4 rounded-2xl border border-line bg-tea/30 p-3 text-xs text-teal/80 flex items-start gap-2 shadow-inner">
              <ShieldCheck className="size-4 text-sea shrink-0 mt-0.5" />
              <span>
                <strong>Dev Mode:</strong> OTP codes are logged to the API terminal console instead of sending email.
              </span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-2 text-center">
                  Enter 6-Digit Email Code
                </label>
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  disabled={loading}
                  length={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full h-12 mt-2 rounded-xl bg-teal text-cream font-black text-sm tracking-wide border-b-4 border-teal/70 shadow-[0_6px_14px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email & Complete Registration'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs font-bold text-teal hover:underline disabled:opacity-50"
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
