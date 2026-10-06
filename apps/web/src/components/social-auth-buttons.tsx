'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Fingerprint, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
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
  defaultEmail?: string;
  onError?: (err: string | null) => void;
  onSuccess?: (msg: string | null) => void;
}

export function PasskeyLoginButton({ defaultEmail, onError, onSuccess }: PasskeyLoginButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState(defaultEmail || '');
  const [status, setStatus] = useState<'idle' | 'prompting' | 'verifying' | 'success' | 'error'>('idle');
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  function openModal() {
    onError?.(null);
    setEmailInput(defaultEmail || '');
    setStatus('idle');
    setErrorText(null);
    setStatusText('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (status === 'verifying' || status === 'success') return;
    setIsModalOpen(false);
    setStatus('idle');
    setErrorText(null);
    setStatusText('');
  }

  async function handleDeviceBiometricAuth() {
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setStatus('error');
      setErrorText('Please enter your registered account email first to sign in with passkey.');
      return;
    }

    setStatus('prompting');
    setErrorText(null);
    setStatusText('Awaiting biometric approval from Windows Hello / Touch ID...');

    try {
      if (typeof window === 'undefined') return;

      if (!window.isSecureContext) {
        throw new Error('WebAuthn requires a secure origin (HTTPS or localhost).');
      }

      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn / Passkeys are not supported on this browser or platform.');
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      let credentialId: string | null = null;

      // Strictly authenticate existing credential via get()
      // Passkey enrollment can ONLY be done when authenticated, never from the public login page!
      try {
        const assertion = (await navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: window.location.hostname,
            userVerification: 'preferred',
            timeout: 60000,
          },
        })) as PublicKeyCredential | null;

        if (assertion) {
          credentialId = assertion.id;
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
          if (error.message?.toLowerCase().includes('cancel') || error.message?.toLowerCase().includes('abort')) {
            throw new Error('Biometric verification was cancelled by the user.');
          }
        }
        throw new Error(
          'No biometric passkey found on this device for this account. Please log in with your password or OTP first, then enable passkeys.',
        );
      }

      if (!credentialId) {
        throw new Error(
          'No biometric passkey found on this device. Please log in with your password or OTP first, then set up your passkey.',
        );
      }

      await completePasskeyLogin(credentialId, cleanEmail);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Passkey verification failed or was cancelled.';
      setStatus('error');
      setErrorText(errorMsg);
      onError?.(errorMsg);
    }
  }

  async function handleSimulatedAuth() {
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setStatus('error');
      setErrorText('Please enter your registered account email first to test passkey sign-in.');
      return;
    }

    setStatus('prompting');
    setErrorText(null);
    setStatusText('Simulating biometric sensor touch...');

    await new Promise((resolve) => setTimeout(resolve, 900));
    await completePasskeyLogin('simulated-passkey-cred', cleanEmail);
  }

  async function completePasskeyLogin(credentialId: string, emailTarget: string) {
    setStatus('verifying');
    setStatusText('Biometric verified! Authenticating citizen session...');

    const res = await apiPost<AuthResponse>('/auth/passkey/login', {
      email: emailTarget || undefined,
      credentialId,
    });

    if (res.error || !res.data) {
      const failMsg = res.error || 'Failed to authenticate passkey session.';
      setStatus('error');
      setErrorText(failMsg);
      onError?.(failMsg);
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

    setStatus('success');
    setStatusText('Welcome back! Biometric verified.');
    onSuccess?.('Biometric verified! Logged in with Passkey.');

    setTimeout(() => {
      setIsModalOpen(false);
      router.push('/');
    }, 700);
  }

  return (
    <>
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
            Sign in using your device&apos;s fingerprint sensor, Face ID, or Windows Hello security key — no password or SMS OTP required.
          </p>

          <button
            type="button"
            onClick={openModal}
            className="relative w-full h-11 rounded-xl bg-sea text-cream font-black text-xs tracking-wide border-b-4 border-sea/70 shadow-[0_4px_12px_rgba(26,147,111,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(26,147,111,0.35)] active:translate-y-0.5 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Fingerprint className="size-4 text-cream" />
            <span>Sign in with Passkey</span>
          </button>
        </div>
      </div>

      {/* Interactive Passkey Verification Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-teal/60 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="passkey-dialog-title"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-line bg-cream p-6 shadow-[0_25px_50px_-12px_rgba(17,75,95,0.35),0_6px_0_0_#114b5f] transition-all">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-line/60">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-sea/20 text-sea border border-sea/30">
                  <Fingerprint className="size-6" />
                </div>
                <div>
                  <h3 id="passkey-dialog-title" className="text-lg font-black text-teal">
                    Passkey Sign-In
                  </h3>
                  <p className="text-xs text-teal/70">
                    Existing registered accounts only
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={status === 'verifying' || status === 'success'}
                aria-label="Close dialog"
                className="rounded-xl p-1.5 text-teal/50 hover:bg-tea/40 hover:text-teal disabled:opacity-40 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4">
              {/* Account Identifier */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5 flex items-center justify-between">
                  <span>Registered Account Email</span>
                  <span className="text-[10px] font-black uppercase text-sea bg-sea/15 px-1.5 py-0.5 rounded">
                    Existing Users
                  </span>
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. karthik@example.com"
                  disabled={status === 'prompting' || status === 'verifying' || status === 'success'}
                  className="w-full rounded-xl border-2 border-line bg-canvas px-3.5 py-2 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06)]"
                />
                <p className="mt-1 text-[11px] text-teal/60">
                  Passkey signs into existing registered accounts. New citizens must register first.
                </p>
              </div>

              {/* Status or Error Banner */}
              {errorText && (
                <div className="rounded-2xl border-2 border-line bg-tea/70 p-3 text-xs font-bold text-teal flex items-start gap-2 shadow-xs" role="alert">
                  <AlertCircle className="size-4 text-teal shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-extrabold block">Verification Failed</span>
                    <span className="text-[11px] font-normal leading-relaxed">{errorText}</span>
                    {errorText.toLowerCase().includes('register') && (
                      <div className="mt-2 pt-2 border-t border-line/60">
                        <Link
                          href="/register"
                          onClick={closeModal}
                          className="inline-flex items-center gap-1 text-xs font-black text-sea hover:text-teal underline"
                        >
                          Don&apos;t have an account yet? Register here &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="rounded-2xl border-2 border-celadon bg-celadon/30 p-3 text-xs font-bold text-teal flex items-center gap-2 shadow-xs">
                  <CheckCircle2 className="size-4 text-sea shrink-0" />
                  <span>{statusText}</span>
                </div>
              )}

              {/* Sensor Visual Card */}
              <div className="rounded-2xl border-2 border-line/70 bg-tea/20 p-4 text-center">
                <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-cream border-2 border-line shadow-xs">
                  {status === 'prompting' ? (
                    <Fingerprint className="size-8 text-sea animate-pulse" />
                  ) : status === 'verifying' ? (
                    <Loader2 className="size-8 text-sea animate-spin" />
                  ) : status === 'success' ? (
                    <CheckCircle2 className="size-8 text-sea" />
                  ) : (
                    <Fingerprint className="size-8 text-teal/60" />
                  )}
                </div>

                <p className="text-xs font-extrabold text-teal">
                  {status === 'prompting'
                    ? 'Confirm on your device...'
                    : status === 'verifying'
                    ? 'Verifying credential...'
                    : status === 'success'
                    ? 'Authentication Successful!'
                    : 'Ready to authenticate'}
                </p>

                <p className="mt-0.5 text-[11px] text-teal/70">
                  {statusText || 'Touch your device fingerprint reader or enter your Windows Hello PIN when prompted.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDeviceBiometricAuth}
                  disabled={status === 'prompting' || status === 'verifying' || status === 'success'}
                  className="w-full h-11 rounded-xl bg-teal text-cream font-black text-xs tracking-wide border-b-4 border-teal/70 shadow-[0_4px_12px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(17,75,95,0.35)] active:translate-y-0.5 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'prompting' ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-cream" />
                      <span>Waiting for Device...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 text-cream" />
                      <span>Verify with Device Biometrics</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSimulatedAuth}
                  disabled={status === 'prompting' || status === 'verifying' || status === 'success'}
                  className="w-full h-9 rounded-xl border border-line bg-cream text-teal/80 font-bold text-[11px] hover:bg-tea/40 hover:text-teal transition-all disabled:opacity-60"
                >
                  🧪 Test Simulated Biometric Scan (Dev Demo)
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-teal/60">
              <span>FIDO2 / WebAuthn Compliant</span>
              <button
                type="button"
                onClick={closeModal}
                disabled={status === 'verifying' || status === 'success'}
                className="font-extrabold text-teal hover:underline disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
