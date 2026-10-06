'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Fingerprint, Loader2, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { apiPost } from '@/lib/api';
import type { UserSummary } from '@applyfields/types';

export function PasskeyEnrollModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [status, setStatus] = useState<'idle' | 'prompting' | 'registering' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    function checkStatus() {
      if (typeof window === 'undefined') return;

      try {
        const rawUser = localStorage.getItem('currentUser');
        const token = localStorage.getItem('accessToken');

        if (!rawUser || !token) {
          setIsOpen(false);
          setCurrentUser(null);
          return;
        }

        const user = JSON.parse(rawUser) as UserSummary;
        setCurrentUser(user);

        // Check if user has already enrolled a passkey
        const isEnrolledLocally = localStorage.getItem(`passkey_enrolled_${user.id}`) === 'true';
        if (user.has_passkey || isEnrolledLocally) {
          setIsOpen(false);
          return;
        }

        // Check if user dismissed the prompt for this session / account
        const isDismissed = localStorage.getItem(`passkey_prompt_dismissed_${user.id}`) === 'true';
        if (isDismissed) {
          setIsOpen(false);
          return;
        }

        // Prompt the user bigly!
        setIsOpen(true);
        setStatus('idle');
        setErrorMessage(null);
      } catch {
        // Ignore parse errors
      }
    }

    checkStatus();

    window.addEventListener('auth-changed', checkStatus);
    return () => {
      window.removeEventListener('auth-changed', checkStatus);
    };
  }, []);

  function handleDismiss() {
    if (!currentUser) return;
    localStorage.setItem(`passkey_prompt_dismissed_${currentUser.id}`, 'true');
    setIsOpen(false);
  }

  async function handleCreatePasskey() {
    if (!currentUser) return;
    setStatus('prompting');
    setErrorMessage(null);
    setStatusMessage('Please verify your fingerprint, Face ID, or Windows Hello PIN on your device...');

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
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const targetAccount = currentUser.email || currentUser.phone || 'citizen';

      let credentialId: string | null = null;

      try {
        const newCred = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'ApplyFields Citizen Portal', id: window.location.hostname },
            user: {
              id: userId,
              name: targetAccount,
              displayName: targetAccount.split('@')[0],
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 }, // ES256
              { type: 'public-key', alg: -257 }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'preferred',
              residentKey: 'preferred',
            },
            timeout: 60000,
          },
        })) as PublicKeyCredential | null;

        if (newCred) {
          credentialId = newCred.id;
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
          throw new Error('Biometric registration prompt was cancelled or timed out.');
        }
        throw error;
      }

      if (!credentialId) {
        throw new Error('No biometric credential was created by device.');
      }

      await savePasskeyToBackend(credentialId);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not create passkey on this device.';
      setStatus('error');
      setErrorMessage(errorMsg);
    }
  }

  async function handleSimulatePasskey() {
    if (!currentUser) return;
    setStatus('prompting');
    setErrorMessage(null);
    setStatusMessage('Simulating biometric passkey enrollment on this device...');

    await new Promise((resolve) => setTimeout(resolve, 900));
    await savePasskeyToBackend('simulated-passkey-device');
  }

  async function savePasskeyToBackend(credentialId: string) {
    if (!currentUser) return;
    setStatus('registering');
    setStatusMessage('Binding passkey securely to your citizen account...');

    const res = await apiPost<{ success: boolean; message: string; user: UserSummary }>(
      '/auth/passkey/register',
      {
        credentialId,
        credentialName: 'Primary Device Authenticator',
      },
    );

    if (res.error || !res.data) {
      setStatus('error');
      setErrorMessage(res.error || 'Failed to save passkey on server.');
      return;
    }

    // Mark as enrolled
    localStorage.setItem(`passkey_enrolled_${currentUser.id}`, 'true');

    // Update currentUser in localStorage
    const updatedUser = { ...currentUser, has_passkey: true };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    setStatus('success');
    setStatusMessage('✓ Biometric Passkey activated! You can now use 1-click sign-in next time.');

    setTimeout(() => {
      setIsOpen(false);
    }, 1400);
  }

  if (!isOpen || !currentUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-teal/70 backdrop-blur-md p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passkey-enroll-title"
    >
      <div className="w-full max-w-lg rounded-3xl border-3 border-teal bg-cream p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(17,75,95,0.4),0_8px_0_0_#114b5f] transition-all">
        {/* Header with Close */}
        <div className="flex items-start justify-between pb-4 border-b border-line/60">
          <div className="flex items-center gap-3.5">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-sea/20 text-sea border-2 border-sea/30 shadow-xs">
              <Fingerprint className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md bg-sea/20 px-2 py-0.5 text-[10px] font-black uppercase text-sea">
                  Security Recommendation
                </span>
                <span className="rounded-md bg-tea/50 px-2 py-0.5 text-[10px] font-extrabold text-teal">
                  1-Click Login
                </span>
              </div>
              <h2 id="passkey-enroll-title" className="text-xl sm:text-2xl font-black text-teal tracking-tight">
                Enable Biometric Passkey
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={status === 'registering' || status === 'success'}
            aria-label="Dismiss passkey setup"
            className="rounded-xl p-1.5 text-teal/50 hover:bg-tea/40 hover:text-teal disabled:opacity-40 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <p className="text-xs sm:text-sm text-teal/80 leading-relaxed font-medium">
            Welcome, <strong className="text-teal font-extrabold">{currentUser.email || currentUser.phone}</strong>! Set up Touch ID, Face ID, or Windows Hello on this device so you can sign in in under 1 second next time without typing passwords or waiting for SMS codes.
          </p>

          {/* Three Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="rounded-2xl border border-line bg-canvas p-3 text-center shadow-2xs">
              <Zap className="size-5 text-sea mx-auto mb-1.5" />
              <p className="text-xs font-black text-teal">1-Second Sign-In</p>
              <p className="text-[11px] text-teal/60 mt-0.5">No passwords or OTPs needed</p>
            </div>
            <div className="rounded-2xl border border-line bg-canvas p-3 text-center shadow-2xs">
              <ShieldCheck className="size-5 text-sea mx-auto mb-1.5" />
              <p className="text-xs font-black text-teal">Device Hardware</p>
              <p className="text-[11px] text-teal/60 mt-0.5">Protected by your secure chip</p>
            </div>
            <div className="rounded-2xl border border-line bg-canvas p-3 text-center shadow-2xs">
              <Sparkles className="size-5 text-sea mx-auto mb-1.5" />
              <p className="text-xs font-black text-teal">Phishing-Proof</p>
              <p className="text-[11px] text-teal/60 mt-0.5">Cannot be stolen or shared</p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl border-2 border-line bg-tea/70 p-3.5 text-xs font-bold text-teal flex items-start gap-2.5 shadow-xs" role="alert">
              <AlertCircle className="size-4 text-teal shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Setup Incomplete</span>
                <span className="text-[11px] font-normal">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Status Feedback */}
          {status === 'success' && (
            <div className="rounded-2xl border-2 border-celadon bg-celadon/30 p-3.5 text-xs font-bold text-teal flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="size-4 text-sea shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleCreatePasskey}
              disabled={status === 'prompting' || status === 'registering' || status === 'success'}
              className="w-full h-12 rounded-2xl bg-teal text-cream font-black text-sm tracking-wide border-b-4 border-teal/70 shadow-[0_6px_16px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(17,75,95,0.35)] active:translate-y-0.5 active:border-b-0 active:shadow-none transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'prompting' ? (
                <>
                  <Fingerprint className="size-5 animate-pulse text-sea" />
                  <span>Touch Fingerprint Sensor / Confirm PIN...</span>
                </>
              ) : status === 'registering' ? (
                <>
                  <Loader2 className="size-5 animate-spin text-cream" />
                  <span>Enrolling Passkey...</span>
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 className="size-5 text-sea" />
                  <span>Passkey Activated!</span>
                </>
              ) : (
                <>
                  <Fingerprint className="size-5 text-cream" />
                  <span>Set Up Passkey on this Device</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleSimulatePasskey}
                disabled={status === 'prompting' || status === 'registering' || status === 'success'}
                className="text-[11px] font-bold text-teal/70 hover:text-teal underline disabled:opacity-50"
              >
                🧪 Simulate Biometric Setup (Dev Test)
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                disabled={status === 'registering' || status === 'success'}
                className="h-9 px-4 rounded-xl border border-line bg-canvas text-teal font-extrabold text-xs hover:bg-tea/30 active:translate-y-0.5 transition-all disabled:opacity-40"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
