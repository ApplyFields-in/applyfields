'use client';

/**
 * "Continue with Google" using Google's own button (Google Identity Services). Google shows the
 * account picker and hands us a signed ID token; the API checks it with Google and that it was
 * issued for our Client ID (auth.service verifyGoogleToken). Nothing here vouches for an email.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { GoogleButton } from '@applyfields/ui';
import { apiPost } from '@/lib/api';
import type { AuthResponse } from '@applyfields/types';

interface SocialAuthButtonsProps {
  mode: 'login' | 'register';
  redirectUrl?: string;
  onError?: (err: string | null) => void;
  onSuccess?: (msg: string | null) => void;
}

export function SocialAuthButtons({ mode, redirectUrl, onError, onSuccess }: SocialAuthButtonsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const targetPath = redirectUrl && redirectUrl !== '/me' ? redirectUrl : '/account';

  async function complete(credential: string) {
    onError?.(null);
    setBusy(true);
    const res = await apiPost<AuthResponse>('/auth/social-login', { provider: 'google', credential });
    if (res.error || !res.data) {
      onError?.(res.error || 'Google sign-in failed. Please try again.');
      setBusy(false);
      return;
    }
    localStorage.setItem('currentUser', JSON.stringify(res.data.user));
    window.dispatchEvent(new Event('auth-changed'));
    onSuccess?.(`${mode === 'register' ? 'Account created' : 'Signed in'} with Google! Redirecting...`);
    setTimeout(() => router.push(targetPath), 700);
  }

  if (busy) return <Loader2 className="mx-auto size-5 animate-spin text-sea" aria-label="Signing in with Google" />;
  return (
    <GoogleButton
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      text={mode === 'register' ? 'signup_with' : 'continue_with'}
      onCredential={(c) => void complete(c)}
    />
  );
}

export function AuthDivider({ label = 'or continue with mobile or email' }: { label?: string }) {
  return (
    <div className="relative my-5 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-line" />
      </div>
      <span className="relative bg-cream px-3 text-xs font-medium text-teal/50">{label}</span>
    </div>
  );
}
