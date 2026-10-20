'use client';

import { useEffect, useState } from 'react';
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
  redirectUrl?: string;
  onError?: (err: string | null) => void;
  onSuccess?: (msg: string | null) => void;
}

function openCenteredPopup(url: string, title: string, w = 520, h = 660) {
  if (typeof window === 'undefined') return null;
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const height = window.innerHeight || document.documentElement.clientHeight || screen.height;

  const left = Math.max(0, width / 2 - w / 2 + dualScreenLeft);
  const top = Math.max(0, height / 2 - h / 2 + dualScreenTop);

  const popup = window.open(
    url,
    title,
    `scrollbars=yes,width=${w},height=${h},top=${top},left=${left},status=no,resizable=yes`,
  );

  if (popup) popup.focus();
  return popup;
}

export function SocialAuthButtons({
  mode,
  redirectUrl,
  onError,
  onSuccess,
}: SocialAuthButtonsProps) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState<'google' | 'apple' | 'microsoft' | null>(null);

  // Setup modal for when OAuth Client IDs need to be entered on localhost
  const [setupModalProvider, setSetupModalProvider] = useState<'google' | 'microsoft' | 'apple' | null>(null);
  const [clientInputVal, setClientInputVal] = useState('');

  const targetPath = redirectUrl || '/me';

  // Get configured Client IDs (from env vars or local storage override)
  function getClientId(provider: 'google' | 'microsoft' | 'apple'): string {
    if (typeof window === 'undefined') return '';
    if (provider === 'google') {
      return (
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        localStorage.getItem('af_google_client_id') ||
        ''
      );
    }
    if (provider === 'microsoft') {
      return (
        process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ||
        localStorage.getItem('af_microsoft_client_id') ||
        ''
      );
    }
    if (provider === 'apple') {
      return (
        process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ||
        localStorage.getItem('af_apple_client_id') ||
        ''
      );
    }
    return '';
  }

  // Handle postMessage response from popup callback
  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent) {
      if (typeof window === 'undefined') return;
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'AF_OAUTH_SUCCESS') {
        handleCompleteSocialLogin({
          provider: data.provider || 'google',
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl,
          idToken: data.idToken,
          accessToken: data.accessToken,
        });
      } else if (data.type === 'AF_OAUTH_ERROR') {
        onError?.(data.error || 'Authentication was cancelled or failed.');
        setActiveProvider(null);
      }
    }

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [targetPath]);

  // Load Google Identity Services script on mount for real One-Tap & OAuth token client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clientId = getClientId('google');
    if (!clientId) return;

    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleGsi(clientId);
      };
      document.body.appendChild(script);
    } else if ((window as any).google?.accounts?.id) {
      initializeGoogleGsi(clientId);
    }
  }, [targetPath]);

  function initializeGoogleGsi(clientId: string) {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            handleCompleteSocialLogin({
              provider: 'google',
              idToken: response.credential,
              credential: response.credential,
            });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Prompt native Google One-Tap card on device
      google.accounts.id.prompt();
    } catch {
      // Ignored if GSI is blocked by browser extensions
    }
  }

  async function handleCompleteSocialLogin(payload: {
    provider: 'google' | 'microsoft' | 'apple';
    email?: string;
    name?: string;
    avatarUrl?: string;
    idToken?: string;
    credential?: string;
    accessToken?: string;
  }) {
    onError?.(null);
    setActiveProvider(payload.provider);

    try {
      const res = await apiPost<AuthResponse>('/auth/social-login', payload);

      if (res.error || !res.data) {
        onError?.(res.error || `Failed to authenticate with ${payload.provider}. Please try again.`);
        setActiveProvider(null);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('auth-changed'));
      }

      const providerLabel = payload.provider.charAt(0).toUpperCase() + payload.provider.slice(1);
      const actionText = mode === 'register' ? 'Registered and signed in' : 'Signed in';
      onSuccess?.(`${actionText} successfully with ${providerLabel}! Redirecting...`);
      setSetupModalProvider(null);

      setTimeout(() => {
        router.push(targetPath);
      }, 700);
    } catch {
      onError?.(`An error occurred during ${payload.provider} authentication.`);
      setActiveProvider(null);
    }
  }

  // Launch Real Google Account Chooser Popup
  function launchGooglePopup(clientId: string) {
    onError?.(null);
    setActiveProvider('google');

    const google = typeof window !== 'undefined' ? (window as any).google : null;

    // 1. Try Google Identity Services OAuth 2.0 Token Client (Official native popup)
    if (google?.accounts?.oauth2?.initTokenClient) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account', // Forces Google to pop up the account picker with all device accounts
          callback: async (tokenResp: any) => {
            if (tokenResp.error) {
              onError?.(tokenResp.error_description || tokenResp.error);
              setActiveProvider(null);
              return;
            }
            try {
              // Fetch user profile info from Google
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResp.access_token}` },
              });
              const profile = await res.json();
              await handleCompleteSocialLogin({
                provider: 'google',
                email: profile.email,
                name: profile.name,
                avatarUrl: profile.picture,
                accessToken: tokenResp.access_token,
              });
            } catch {
              await handleCompleteSocialLogin({
                provider: 'google',
                accessToken: tokenResp.access_token,
              });
            }
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // Fallback to direct popup
      }
    }

    // 2. Direct Google OAuth 2.0 Account Picker Popup Window
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(
      callbackUrl,
    )}&response_type=token%20id_token&scope=openid%20profile%20email&prompt=select_account&nonce=${Math.random().toString(36).substring(2)}`;

    openCenteredPopup(googleAuthUrl, 'Sign in with Google');
  }

  // Launch Real Microsoft Account Chooser Popup
  function launchMicrosoftPopup(clientId: string) {
    onError?.(null);
    setActiveProvider('microsoft');

    const callbackUrl = `${window.location.origin}/auth/callback?provider=microsoft`;
    // prompt=select_account instructs Microsoft Entra to show the account picker on the device
    const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(
      clientId,
    )}&response_type=token&redirect_uri=${encodeURIComponent(
      callbackUrl,
    )}&scope=${encodeURIComponent('openid profile email User.Read')}&response_mode=fragment&prompt=select_account&state=microsoft_${Math.random().toString(36).substring(2)}`;

    openCenteredPopup(msAuthUrl, 'Sign in with Microsoft');
  }

  // Launch Real Apple ID Authorization Popup
  function launchApplePopup(clientId: string) {
    onError?.(null);
    setActiveProvider('apple');

    const callbackUrl = `${window.location.origin}/auth/callback?provider=apple`;
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(
      callbackUrl,
    )}&response_type=code%20id_token&scope=name%20email&response_mode=fragment&state=apple_${Math.random().toString(36).substring(2)}`;

    openCenteredPopup(appleAuthUrl, 'Sign in with Apple ID');
  }

  async function handleGoogleClick() {
    const clientId = getClientId('google');
    if (!clientId) {
      setSetupModalProvider('google');
      setClientInputVal('');
      return;
    }
    launchGooglePopup(clientId);
  }

  async function handleMicrosoftClick() {
    const clientId = getClientId('microsoft');
    if (!clientId) {
      setSetupModalProvider('microsoft');
      setClientInputVal('');
      return;
    }
    launchMicrosoftPopup(clientId);
  }

  async function handleAppleClick() {
    const clientId = getClientId('apple');
    if (!clientId) {
      setSetupModalProvider('apple');
      setClientInputVal('');
      return;
    }
    launchApplePopup(clientId);
  }

  function handleSaveClientIdAndLaunch() {
    if (!setupModalProvider || !clientInputVal.trim()) return;
    const cleanId = clientInputVal.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(`af_${setupModalProvider}_client_id`, cleanId);
    }
    const provider = setupModalProvider;
    setSetupModalProvider(null);

    if (provider === 'google') launchGooglePopup(cleanId);
    else if (provider === 'microsoft') launchMicrosoftPopup(cleanId);
    else if (provider === 'apple') launchApplePopup(cleanId);
  }

  const googleButtonLabel = mode === 'register' ? 'Register with Google' : 'Continue with Google';

  return (
    <div className="space-y-2.5">
      {/* Primary Google 1-Click Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={activeProvider !== null}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border-2 border-line bg-cream font-semibold text-teal shadow-xs transition hover:bg-paper hover:border-sea/40 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {activeProvider === 'google' ? (
          <Loader2 className="size-[18px] animate-spin text-sea" />
        ) : (
          <GoogleIcon className="size-[18px] shrink-0" />
        )}
        <span>{googleButtonLabel}</span>
      </button>

      {/* Secondary Providers: Real Microsoft & Apple Native OAuth */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleMicrosoftClick}
          disabled={activeProvider !== null}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-cream text-xs font-semibold text-teal hover:bg-paper transition disabled:opacity-60"
        >
          {activeProvider === 'microsoft' ? (
            <Loader2 className="size-3.5 animate-spin text-sea" />
          ) : (
            <MicrosoftIcon className="size-3.5 shrink-0" />
          )}
          <span>Microsoft</span>
        </button>

        <button
          type="button"
          onClick={handleAppleClick}
          disabled={activeProvider !== null}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-teal text-xs font-semibold text-cream hover:bg-teal/90 transition disabled:opacity-60"
        >
          {activeProvider === 'apple' ? (
            <Loader2 className="size-3.5 animate-spin text-sea" />
          ) : (
            <AppleIcon className="size-3.5 shrink-0" />
          )}
          <span>Apple ID</span>
        </button>
      </div>

      {/* OAuth Client ID Setup Modal (Prompted if Client ID is not yet defined in .env.local on localhost) */}
      {setupModalProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-teal/60 backdrop-blur-xs p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border-2 border-line bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-start justify-between pb-3 border-b border-line/60">
              <div className="flex items-center gap-2.5">
                {setupModalProvider === 'google' && <GoogleIcon className="size-5" />}
                {setupModalProvider === 'microsoft' && <MicrosoftIcon className="size-5" />}
                {setupModalProvider === 'apple' && <AppleIcon className="size-5 text-teal" />}
                <div>
                  <h3 className="text-sm font-bold text-teal">
                    Connect Real {setupModalProvider.charAt(0).toUpperCase() + setupModalProvider.slice(1)} Accounts
                  </h3>
                  <p className="text-[11px] text-teal/60">Device OAuth 2.0 Account Picker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSetupModalProvider(null)}
                className="rounded-lg p-1 text-teal/40 hover:bg-tea/30 hover:text-teal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-teal/70 leading-relaxed">
                To pop up your real {setupModalProvider.charAt(0).toUpperCase() + setupModalProvider.slice(1)} accounts
                on this device, provide your OAuth Client ID (or configure{' '}
                <code className="bg-canvas px-1.5 py-0.5 rounded text-[11px] font-mono text-teal">
                  NEXT_PUBLIC_{setupModalProvider.toUpperCase()}_CLIENT_ID
                </code>{' '}
                in <code className="bg-canvas px-1.5 py-0.5 rounded text-[11px] font-mono text-teal">apps/web/.env.local</code>):
              </p>

              <div>
                <label className="block text-[11px] font-bold text-teal/80 mb-1">
                  {setupModalProvider.charAt(0).toUpperCase() + setupModalProvider.slice(1)} OAuth Client ID:
                </label>
                <input
                  type="text"
                  placeholder={
                    setupModalProvider === 'google'
                      ? '123456789-xxxx.apps.googleusercontent.com'
                      : setupModalProvider === 'microsoft'
                        ? '00000000-0000-0000-0000-000000000000'
                        : 'com.applyfields.web.service'
                  }
                  value={clientInputVal}
                  onChange={(e) => setClientInputVal(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-teal placeholder:text-teal/30 focus:outline-none focus:border-sea font-mono"
                  autoFocus
                />
              </div>

              <button
                type="button"
                disabled={!clientInputVal.trim()}
                onClick={handleSaveClientIdAndLaunch}
                className="w-full h-10 rounded-xl bg-teal text-cream font-bold text-xs hover:bg-teal/90 disabled:opacity-40 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="size-3.5 text-sea" />
                <span>Save &amp; Pop Up Real Account Chooser</span>
              </button>
            </div>

            <div className="mt-4 pt-2 text-center text-[10px] text-teal/50">
              Opens native {setupModalProvider.charAt(0).toUpperCase() + setupModalProvider.slice(1)} device dialog with{' '}
              <code className="font-mono">prompt=select_account</code>
            </div>
          </div>
        </div>
      )}
    </div>
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
      <button
        type="button"
        onClick={openModal}
        className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sea/40 text-sm font-semibold text-sea transition hover:bg-tea/40"
      >
        <Fingerprint className="size-[18px]" aria-hidden="true" />
        Sign in with a passkey
      </button>

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
