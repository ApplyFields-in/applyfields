'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Logo } from '@applyfields/ui';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/api';

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('from') || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your staff email or phone.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.accessToken) {
        const msg = data?.message
          ? Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message
          : 'Invalid login credentials.';
        setError(msg);
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }

      setSuccess('Logged in successfully! Verifying staff access...');

      // Small delay then redirect
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error. Could not connect to API server.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-paper sm:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Logo subtitle="Internal Portal" />
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1 text-xs font-semibold text-teal">
            <ShieldCheck className="size-3.5 text-sea" aria-hidden="true" />
            Staff Authorization Required
          </div>
        </div>

        <Card className="p-7 shadow-clay-card">
          <h1 className="text-xl font-bold text-ink">Staff Sign In</h1>
          <p className="mt-1 text-xs text-teal/80">
            Sign in with your ApplyFields account credentials to access the Internal Portal.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/10 p-3 text-xs text-terracotta font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl border border-sea/30 bg-sea/10 p-3 text-xs text-sea font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold text-teal/90 mb-1.5">
                Staff Email or Phone
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. applyfields@gmail.com"
                  className="h-10 w-full rounded-xl border border-line bg-cream pl-10 pr-3.5 text-sm text-ink placeholder:text-teal/50 focus:border-sea focus:outline-none focus:ring-1 focus:ring-sea"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" aria-label="Password" className="block text-xs font-bold text-teal/90">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/60" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your staff password"
                  className="h-10 w-full rounded-xl border border-line bg-cream pl-10 pr-10 text-sm text-ink placeholder:text-teal/50 focus:border-sea focus:outline-none focus:ring-1 focus:ring-sea"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-teal/60 hover:text-teal transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-cream shadow-clay-card hover:bg-teal/90 disabled:opacity-60 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In to Portal <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-line/60 pt-4 text-center text-[11px] text-teal/70">
            Internal Portal is restricted to verified staff with active roles in <code className="font-mono">user_roles</code>.
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center p-6 bg-paper text-teal">
          <p className="text-sm font-semibold">Loading staff portal...</p>
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}

