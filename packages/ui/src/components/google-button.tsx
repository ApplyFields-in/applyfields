'use client';

/**
 * Google's own "Sign in with Google" button (Google Identity Services). Google shows the account
 * picker and gives back a signed ID token (`credential`). Pass it to POST /auth/social-login — the
 * API verifies it with Google; nothing in the browser vouches for an email.
 * Renders nothing when no client ID is configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID).
 */
import { useEffect, useRef } from 'react';

type GoogleId = {
  initialize(opts: { client_id: string; callback: (r: { credential?: string }) => void }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
};
const googleId = () => (window as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id;

export function GoogleButton({
  clientId,
  onCredential,
  text = 'continue_with',
  theme = 'outline',
}: {
  clientId: string | undefined;
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
}) {
  const holder = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  callback.current = onCredential;

  useEffect(() => {
    if (!clientId) return;
    const render = () => {
      const gis = googleId();
      if (!gis || !holder.current) return;
      gis.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) callback.current(credential);
        },
      });
      gis.renderButton(holder.current, {
        theme,
        size: 'large',
        shape: 'pill',
        text,
        width: Math.min(holder.current.offsetWidth || 400, 400),
      });
    };
    if (googleId()) return render();
    let script = document.getElementById('google-gsi-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', render);
    return () => script?.removeEventListener('load', render);
  }, [clientId, text, theme]);

  if (!clientId) return null;
  return <div ref={holder} className="flex min-h-11 w-full justify-center" />;
}
