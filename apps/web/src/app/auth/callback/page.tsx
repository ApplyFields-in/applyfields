'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { apiPost } from '@/lib/api';
import type { AuthResponse } from '@applyfields/types';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your account details...');

  useEffect(() => {
    async function processOAuthResponse() {
      try {
        if (typeof window === 'undefined') return;

        // 1. Extract params from search query and hash fragments
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : window.location.hash,
        );

        const error =
          queryParams.get('error_description') ||
          queryParams.get('error') ||
          hashParams.get('error_description') ||
          hashParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(error);
          if (window.opener) {
            window.opener.postMessage(
              { type: 'AF_OAUTH_ERROR', error },
              window.location.origin,
            );
            setTimeout(() => window.close(), 1200);
          }
          return;
        }

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const idToken = hashParams.get('id_token') || queryParams.get('id_token');
        const code = queryParams.get('code') || hashParams.get('code');
        const state = queryParams.get('state') || hashParams.get('state') || '';

        // Determine provider from state or url
        let provider: 'google' | 'microsoft' | 'apple' = 'google';
        if (state.includes('microsoft') || queryParams.get('provider') === 'microsoft') {
          provider = 'microsoft';
        } else if (state.includes('apple') || queryParams.get('provider') === 'apple') {
          provider = 'apple';
        }

        let userEmail: string | undefined;
        let userName: string | undefined;
        let userAvatar: string | undefined;

        // 2. Query user info directly if access token is present
        if (accessToken) {
          if (provider === 'google') {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (res.ok) {
                const info = await res.json();
                userEmail = info.email;
                userName = info.name;
                userAvatar = info.picture;
              }
            } catch {
              // Fallback to token decoding
            }
          } else if (provider === 'microsoft') {
            try {
              const res = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (res.ok) {
                const info = await res.json();
                userEmail = info.mail || info.userPrincipalName;
                userName = info.displayName;
              }
            } catch {
              // Fallback to token decoding
            }
          }
        }

        // If email is still unresolved, decode ID token payload (standard for Apple & Microsoft)
        if (!userEmail && idToken) {
          try {
            const parts = idToken.split('.');
            if (parts.length === 3) {
              const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
              userEmail = payload.email || payload.preferred_username || payload.upn;
              userName = payload.name || payload.displayName;
            }
          } catch {
            // Non-fatal, backend will decode with Buffer
          }
        }

        const payload = {
          type: 'AF_OAUTH_SUCCESS',
          provider,
          accessToken: accessToken || undefined,
          idToken: idToken || undefined,
          code: code || undefined,
          email: userEmail,
          name: userName,
          avatarUrl: userAvatar,
        };

        // 3. If in popup, communicate with parent window
        if (window.opener && !window.opener.closed) {
          setStatus('success');
          setMessage('Account connected! Returning to ApplyFields...');
          window.opener.postMessage(payload, window.location.origin);
          setTimeout(() => {
            window.close();
          }, 600);
          return;
        }

        // 4. Fallback if user was navigated in full-page mode
        const res = await apiPost<AuthResponse>('/auth/social-login', {
          provider,
          accessToken: accessToken || undefined,
          idToken: idToken || undefined,
          email: userEmail,
          name: userName,
          avatarUrl: userAvatar,
        });

        if (res.error || !res.data) {
          setStatus('error');
          setMessage(res.error || 'Failed to authenticate your account.');
          return;
        }

        localStorage.setItem('currentUser', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('auth-changed'));
        setStatus('success');
        setMessage('Signed in successfully! Redirecting...');
        setTimeout(() => {
          router.push('/account');
        }, 800);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Authentication failed. Please try again.');
      }
    }

    processOAuthResponse();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-cream p-8 text-center shadow-lg">
        {status === 'processing' && (
          <>
            <Loader2 className="mx-auto size-10 animate-spin text-sea" />
            <h2 className="mt-4 text-base font-bold text-teal">Connecting account</h2>
            <p className="mt-1 text-xs text-teal/60">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
            <h2 className="mt-4 text-base font-bold text-teal">Verified</h2>
            <p className="mt-1 text-xs text-teal/60">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <ShieldAlert className="mx-auto size-10 text-rose-600" />
            <h2 className="mt-4 text-base font-bold text-teal">Authentication notice</h2>
            <p className="mt-1 text-xs text-rose-600/90">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
          <Loader2 className="size-8 animate-spin text-sea" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
