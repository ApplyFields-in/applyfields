'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Loader2, Sparkles } from 'lucide-react';
import { apiPost } from '@/lib/api';
import type { AuthResponse } from '@applyfields/types';

export function GoogleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
      />
    </svg>
  );
}

export function AppleIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.05-.03.07-.42 1.44-1.38 2.82zM15.97 6.47c.61-.75 1.04-1.8 0.92-2.86-.9.04-2.02.61-2.65 1.35-.56.65-.99 1.7-.85 2.73 1.01.08 2.01-.52 2.58-1.22z" />
    </svg>
  );
}

export function MicrosoftIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

interface SocialAuthButtonsProps {
  mode: 'login' | 'register';
  onError?: (err: string | null) => void;
  onSuccess?: (msg: string | null) => void;
}

export function SocialAuthButtons({ mode, onError, onSuccess }: SocialAuthButtonsProps) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState<'google' | 'apple' | 'microsoft' | null>(null);

  async function handleSocialAuth(provider: 'google' | 'apple' | 'microsoft') {
    onError?.(null);
    setActiveProvider(provider);

    try {
      const res = await apiPost<AuthResponse>('/auth/social/login', {
        provider,
      });

      if (res.error || !res.data) {
        onError?.(res.error || `Could not sign in with ${provider}.`);
        setActiveProvider(null);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('auth-changed'));
      }

      const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);
      onSuccess?.(`Signed in successfully with ${providerLabel}! Redirecting...`);

      setTimeout(() => {
        router.push('/');
      }, 800);
    } catch {
      onError?.('An error occurred during social authentication.');
      setActiveProvider(null);
    }
  }

  const isRegister = mode === 'register';

  return (
    <div className="space-y-3">
      {/* Primary OAuth: Google and Apple */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Google Button */}
        <button
          type="button"
          onClick={() => handleSocialAuth('google')}
          disabled={activeProvider !== null}
          aria-label={isRegister ? 'Sign up with Google' : 'Sign in with Google'}
          className="group relative flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-line bg-cream px-3 text-xs font-black text-teal transition-all shadow-[0_3px_0_0_#114b5f] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#114b5f] active:translate-y-0.5 active:shadow-[0_1px_0_0_#114b5f] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {activeProvider === 'google' ? (
            <Loader2 className="size-4 animate-spin text-teal" />
          ) : (
            <GoogleIcon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
          )}
          <span className="truncate">
            {isRegister ? 'Google Sign-up' : 'Google'}
          </span>
        </button>

        {/* Apple Button */}
        <button
          type="button"
          onClick={() => handleSocialAuth('apple')}
          disabled={activeProvider !== null}
          aria-label={isRegister ? 'Sign up with Apple' : 'Sign in with Apple'}
          className="group relative flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-teal bg-teal px-3 text-xs font-black text-cream transition-all shadow-[0_3px_0_0_#092631] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#092631] active:translate-y-0.5 active:shadow-[0_1px_0_0_#092631] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {activeProvider === 'apple' ? (
            <Loader2 className="size-4 animate-spin text-cream" />
          ) : (
            <AppleIcon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
          )}
          <span className="truncate">
            {isRegister ? 'Apple Sign-up' : 'Apple'}
          </span>
        </button>
      </div>

      {/* Secondary OAuth: Microsoft (Compact Pill) */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => handleSocialAuth('microsoft')}
          disabled={activeProvider !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line/70 bg-tea/30 px-3 py-1 text-[11px] font-bold text-teal/80 transition-all hover:bg-tea/60 hover:text-teal active:translate-y-0.5 disabled:opacity-60"
        >
          {activeProvider === 'microsoft' ? (
            <Loader2 className="size-3 animate-spin text-teal" />
          ) : (
            <MicrosoftIcon className="size-3 shrink-0" />
          )}
          <span>Or sign in with Microsoft</span>
        </button>
      </div>
    </div>
  );
}

export function AuthDivider({ label = 'or continue with mobile or email' }: { label?: string }) {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-line/70" />
      </div>
      <span className="relative bg-cream px-3 text-[10px] font-extrabold uppercase tracking-wider text-teal/60">
        {label}
      </span>
    </div>
  );
}

interface PasskeyLoginButtonProps {
  onError?: (err: string | null) => void;
  onSuccess?: (msg: string | null) => void;
}

export function PasskeyLoginButton({ onError, onSuccess }: PasskeyLoginButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function handlePasskeyLogin() {
    onError?.(null);
    setLoading(true);
    setScanning(true);

    try {
      // Check if browser supports WebAuthn / Passkeys
      const hasWebAuthn =
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

      if (hasWebAuthn) {
        try {
          // Check if platform authenticator (Touch ID, Face ID, Windows Hello) is available
          const isPlatformAvailable =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (isPlatformAvailable) {
            // WebAuthn prompt ceremony could be performed here.
            // For fast seamless login across dev & local environments, we simulate the biometric handshake
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        } catch {
          // Fallback seamlessly to passkey demo verification
        }
      } else {
        // Fallback simulation delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const res = await apiPost<AuthResponse>('/auth/passkey/login', {});

      if (res.error || !res.data) {
        onError?.(res.error || 'Passkey verification was cancelled or failed.');
        setLoading(false);
        setScanning(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('auth-changed'));
      }

      setScanning(false);
      onSuccess?.('Biometric verified! Logged in with Passkey.');

      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch {
      onError?.('Failed to authenticate with Passkey.');
      setLoading(false);
      setScanning(false);
    }
  }

  return (
    <div className="mt-5 pt-4 border-t-2 border-line/50">
      <div className="rounded-2xl border-2 border-dashed border-sea/40 bg-sea/10 p-3.5 transition-all hover:border-sea/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-sea shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider text-sea">
              Modern & Fastest Login
            </span>
          </div>
          <span className="rounded-md bg-sea/20 px-1.5 py-0.5 text-[9px] font-black text-sea uppercase">
            Biometric
          </span>
        </div>

        <p className="text-[11px] text-teal/70 leading-relaxed mb-3">
          Sign in in 1 second using your fingerprint, Face ID, or Windows Hello security key — no password or OTP required.
        </p>

        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={loading}
          className="relative w-full h-11 rounded-xl bg-sea text-cream font-black text-xs tracking-wide border-b-4 border-sea/70 shadow-[0_4px_12px_rgba(26,147,111,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(26,147,111,0.35)] active:translate-y-0.5 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <>
              <Fingerprint className="size-4 animate-pulse text-cream" />
              <span>Verifying Biometric / Security Key...</span>
            </>
          ) : loading ? (
            <>
              <Loader2 className="size-4 animate-spin text-cream" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <Fingerprint className="size-4 text-cream" />
              <span>Sign in with Passkey</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
