'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { flashToast } from '@applyfields/ui';
import { apiPost } from '@/lib/api';
import { usePartnerAuth } from '@/lib/auth-context';

const input =
  'block w-full rounded-xl border border-[#c9d6e6] bg-white px-3.5 py-2.5 text-sm text-[#082046] placeholder:text-[#8a9bb3] transition focus:border-[#0e7bf4] focus:outline-none focus:ring-4 focus:ring-[#0e7bf4]/15';
const label = 'block text-[13px] font-semibold text-[#243b5b]';
const primary =
  'flex w-full items-center justify-center rounded-xl bg-[#0e7bf4] py-3 text-sm font-bold text-white transition hover:bg-[#0c6fdc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0e7bf4]/30 disabled:opacity-50';

/**
 * Partner sign-up: create the account, confirm the code, sign in, then fill in the centre or college form.
 * Separate entry points: /signup?type=centre (xerox / MeeSeva / CSC shops) and /signup?type=college.
 */
function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isCollege = params.get('type') === 'college';
  const { refreshSession } = usePartnerAuth();

  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [target, setTarget] = useState<string | null>(null); // set once the code is sent
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const contactValue = () => {
    const v = contact.trim();
    return /^\d{10}$/.test(v) ? { phone: `+91${v}` } : { email: v.toLowerCase() };
  };

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const c = contactValue();
    if (fullName.trim().length < 2) return setError('Enter your full name.');
    if (!('phone' in c) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
      return setError('Enter a 10-digit mobile number or an email address.');
    }
    if (password.length < 8) return setError('Choose a password of at least 8 characters.');
    if (!agreed) return setError('Please accept the Partner Terms and Privacy Policy.');

    setLoading(true);
    const res = await apiPost<{ target: string; devOtp?: string }>('/auth/register', {
      fullName: fullName.trim(),
      ...c,
      password,
    });
    setLoading(false);
    if (res.error || !res.data) return setError(res.error || 'Could not create the account. Try again.');
    setTarget(res.data.target);
    if (res.data.devOtp) setCode(res.data.devOtp);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setError(null);
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code.');

    setLoading(true);
    const purpose = target.includes('@') ? 'verify_email' : 'verify_phone';
    const ok = await apiPost('/auth/otp/verify', { target, purpose, code });
    if (ok.error) {
      setLoading(false);
      return setError(ok.error);
    }
    // Verified now, so a plain password sign-in gives a session straight away.
    const login = await apiPost<{ user: unknown }>('/auth/login', { identifier: target, password, rememberMe: true });
    setLoading(false);
    if (!login.data?.user) {
      flashToast('Account created. Please sign in.');
      return router.push('/login');
    }
    localStorage.setItem('currentUser', JSON.stringify(login.data.user));
    window.dispatchEvent(new Event('auth-changed'));
    await refreshSession();
    flashToast('Account created. Now tell us about your ' + (isCollege ? 'college.' : 'centre.'));
    router.push(isCollege ? '/institution/onboard' : '/onboard');
  }

  async function resend() {
    if (!target) return;
    setError(null);
    const purpose = target.includes('@') ? 'verify_email' : 'verify_phone';
    const res = await apiPost<{ devOtp?: string }>('/auth/otp/send', { target, purpose });
    if (res.error) setError(res.error);
    else {
      flashToast('A new code was sent.');
      if (res.data?.devOtp) setCode(res.data.devOtp);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] px-4 py-12">
      <main className="mx-auto max-w-md rounded-3xl border border-[#d5deea] bg-white p-6 shadow-[0_12px_32px_-16px_rgba(8,32,70,0.18)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0e7bf4]">
          {isCollege ? 'College partner' : 'Service centre partner'}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-[#082046]">
          {isCollege ? 'Register your college' : 'Register your centre'}
        </h1>
        <p className="mt-2 text-sm text-[#435775]">
          {isCollege
            ? 'Step 1 of 3: create your account. Next you pick your college and get your authorisation letter.'
            : 'Step 1 of 3: create your account. Next you add your shop details, services and ID for approval.'}
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
            {error}
          </p>
        )}

        {!target ? (
          <form onSubmit={createAccount} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="name" className={label}>
                {isCollege ? 'Your name (admissions officer)' : 'Owner name'}
              </label>
              <input id="name" className={`${input} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="contact" className={label}>
                Mobile number or email
              </label>
              <input
                id="contact"
                className={`${input} mt-1`}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={isCollege ? 'admissions@yourcollege.edu.in' : 'yourshop@gmail.com'}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className={label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`${input} mt-1`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <label className="flex items-start gap-2.5 text-xs text-[#435775]">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-4" />
              <span>I accept the ApplyFields Partner Terms and Privacy Policy.</span>
            </label>
            <button type="submit" disabled={loading} className={primary}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 space-y-4" noValidate>
            <p className="text-sm text-[#243b5b]">
              We sent a 6-digit code to <strong>{target}</strong>.
            </p>
            <div>
              <label htmlFor="code" className={label}>
                Code
              </label>
              <input
                id="code"
                inputMode="numeric"
                maxLength={6}
                className={`${input} mt-1 tracking-[0.4em]`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoComplete="one-time-code"
              />
            </div>
            <button type="submit" disabled={loading} className={primary}>
              {loading ? 'Checking…' : 'Confirm and continue'}
            </button>
            <button type="button" onClick={() => void resend()} className="w-full text-xs font-semibold text-[#0e7bf4] hover:underline">
              Send a new code
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#435775]">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-[#0e7bf4] hover:underline">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F0F4F8]" />}>
      <SignupForm />
    </Suspense>
  );
}
