'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { useAuth, type CitizenUser } from '@/lib/auth-context';

/**
 * Landing page for "Services" links on applyfields.com: trades the one-time code in the URL
 * fragment for a session on this site (same account), then opens the portal.
 */
export default function SsoPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get('code');
    history.replaceState(null, '', '/sso'); // drop the code from the address bar and history
    if (!code) return router.replace('/');
    void apiPost<{ user: CitizenUser; accessToken: string }>('/auth/handoff/exchange', { code }).then((res) => {
      if (!res.data) return setFailed(true);
      login(res.data.user, res.data.accessToken);
      router.replace('/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, []);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 text-center text-sm text-[#243b5b]">
      {failed ? (
        <p>
          That sign-in link expired.{' '}
          <Link href="/login" className="font-bold text-[#0e7bf4] underline">
            Sign in
          </Link>{' '}
          with the same ApplyFields account.
        </p>
      ) : (
        <p>Signing you in with your ApplyFields account…</p>
      )}
    </main>
  );
}
