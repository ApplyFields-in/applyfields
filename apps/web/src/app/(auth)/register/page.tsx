'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { ArrowLeft, ArrowRight, Check, Mail, User } from 'lucide-react';
import { CountryPhoneInput, extractNationalDigits, isValidPhone } from '@/components/country-phone-input';
import { OtpInput } from '@/components/otp-input';
import { AuthDivider, SocialAuthButtons } from '@/components/social-auth-buttons';
import { Checkbox, DevCode, IconInput, LABEL, Notice, PasswordInput, PRIMARY, TEXT_BTN } from '@/components/auth-ui';
import type { UserSummary } from '@applyfields/types';

function Steps({ step }: { step: 'form' | 'verify' }) {
  const verifying = step === 'verify';
  return (
    <ol className="flex items-center gap-3 text-sm font-semibold">
      <li aria-current={verifying ? undefined : 'step'} className="flex items-center gap-2 text-teal">
        <span className={`grid size-7 place-items-center rounded-full text-xs font-bold text-cream ${verifying ? 'bg-sea' : 'bg-teal'}`}>
          {verifying ? <Check className="size-3.5" aria-label="Done" /> : '1'}
        </span>
        Account details
      </li>
      <li aria-hidden="true" className={`h-px flex-1 ${verifying ? 'bg-sea' : 'bg-line'}`} />
      <li aria-current={verifying ? 'step' : undefined} className={`flex items-center gap-2 ${verifying ? 'text-teal' : 'text-teal/50'}`}>
        <span
          className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
            verifying ? 'bg-teal text-cream' : 'border border-line'
          }`}
        >
          2
        </span>
        Verify account
      </li>
    </ol>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || searchParams.get('target') || searchParams.get('next') || '/me';

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [fullName, setFullName] = useState('');
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

    const cleanName = fullName.trim();
    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      setError('Please provide a valid email address to prevent fake account registrations.');
      return;
    }

    // Phone is optional, but if entered it must have valid digits
    const cleanPhone = phone.trim();
    const nationalDigits = extractNationalDigits(cleanPhone);
    const hasPhoneDigits = nationalDigits.length > 0;
    if (hasPhoneDigits && !isValidPhone(cleanPhone)) {
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
        fullName: cleanName,
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
    const res = await apiPost<{ verified: boolean; message: string }>('/auth/otp/verify', {
      target,
      purpose,
      code: otpCode,
    });

    if (res.error || !res.data) {
      setLoading(false);
      setError(res.error || 'Verification failed. Please check the code.');
      return;
    }

    // Auto-login after successful verification — go straight to dashboard
    const loginRes = await apiPost<{ user: UserSummary }>('/auth/login', {
      identifier: email.toLowerCase().trim(),
      password,
      rememberMe: true,
    });
    setLoading(false);

    if (loginRes.data?.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(loginRes.data.user));
        window.dispatchEvent(new Event('auth-changed'));
      }
      setSuccessMsg('Account verified! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/');
      }, 800);
    } else {
      // Fallback: if auto-login fails, send to login page
      setSuccessMsg('Email verified! Redirecting to login...');
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 1500);
    }
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

  if (step === 'verify') {
    return (
      <div className="w-full">
        <Steps step={step} />

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-teal sm:text-4xl">Verify your email</h1>
        <p className="mt-2 text-base text-teal/60">
          Enter the 6-digit code we sent to <strong className="font-semibold text-teal">{target}</strong>.
        </p>

        <Notice error={error} success={successMsg} />

        <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
          {devOtp && <DevCode code={devOtp} onFill={() => setOtpCode(devOtp)} />}

          <div>
            <span className={LABEL}>6-digit code</span>
            <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} length={6} />
            <p className="mt-1.5 text-xs text-teal/50">Dev mode: the code appears in the API terminal, no email is sent.</p>
          </div>

          <button type="submit" disabled={loading || otpCode.length !== 6} className={PRIMARY}>
            {loading ? 'Verifying...' : 'Verify and continue'}
            {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
          </button>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep('form')}
              className={`${TEXT_BTN} flex items-center gap-1.5`}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to details
            </button>
            <button type="button" onClick={handleResendOtp} disabled={loading} className={`${TEXT_BTN} disabled:opacity-50`}>
              Send the code again
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Steps step={step} />

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-teal sm:text-4xl">Create your account</h1>
      <p className="mt-2 text-base text-teal/60">Sign up to explore opportunities tailored for you.</p>

      <Notice error={error} success={successMsg} />

      <form onSubmit={handleRegister} className="mt-5 space-y-4">
        <div>
          <label htmlFor="reg-name" className={LABEL}>
            Full name
          </label>
          <IconInput
            icon={User}
            id="reg-name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="reg-email" className={LABEL}>
            Email address
          </label>
          <IconInput
            icon={Mail}
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="reg-phone" className="text-sm font-semibold text-teal">
              Mobile number
            </label>
            <span className="text-xs text-teal/50">Optional</span>
          </div>
          <CountryPhoneInput id="reg-phone" value={phone} onChange={setPhone} placeholder="9876543210" />
        </div>

        <div>
          <label htmlFor="reg-password" className={LABEL}>
            Create password
          </label>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            required
          />
        </div>

        <div>
          <label htmlFor="reg-confirm" className={LABEL}>
            Confirm password
          </label>
          <PasswordInput
            id="reg-confirm"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            required
          />
        </div>

        <div className="space-y-2.5 pt-1">
          <Checkbox checked={agreeTerms} onChange={setAgreeTerms}>
            I agree to the <span className="font-semibold text-teal underline">Terms of Service</span>
          </Checkbox>
          <Checkbox checked={agreePrivacy} onChange={setAgreePrivacy}>
            I agree to the <span className="font-semibold text-teal underline">Privacy Policy</span> (as required
            under DPDP Act 2023)
          </Checkbox>
        </div>

        <button type="submit" disabled={loading} className={PRIMARY}>
          {loading ? 'Creating account...' : 'Create account'}
          {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
        </button>
      </form>

      <AuthDivider label="or" />
      <SocialAuthButtons
        mode="register"
        redirectUrl={redirectTarget}
        onError={setError}
        onSuccess={setSuccessMsg}
      />

      <p className="mt-6 text-center text-sm text-teal/60">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-sea hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-sm text-teal/60">Loading registration...</p>}>
      <RegisterForm />
    </Suspense>
  );
}
