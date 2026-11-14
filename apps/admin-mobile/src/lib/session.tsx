/**
 * Who is signed in to the admin app. Same rule as the admin website (apps/admin login):
 * password + a one-time code EVERY time (/auth/login/start → /auth/login/verify). Only that
 * session carries the `mfa` claim the API's StaffGuard needs for /admin/*; refresh keeps it.
 *   no session / 401   → login
 *   /admin/me 403      → not a staff account: signed out again with a message
 *   /admin/me 200      → staff (behind the Face ID / fingerprint gate, see lock.tsx)
 */
import type { AdminMeResponse, AuthResponse } from '@applyfields/types';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { api, hasStoredSession, saveSession, setToken } from './api';
import { registerForPush, unregisterPush } from './push';
import { loginId } from './staff';

export type SessionStatus = 'loading' | 'offline' | 'signed_out' | 'staff';

type Tokens = AuthResponse & { accessToken?: string; refreshToken?: string };

interface SessionValue {
  status: SessionStatus;
  staff: AdminMeResponse | null;
  error: string | null;
  /** True right after a password + code sign-in in this app run: no need to ask for Face ID on top. */
  fresh: boolean;
  /** Step 1: checks the password and sends the code. Returns where it went, or an error. */
  startLogin: (identifier: string, password: string) => Promise<{ error: string | null; sentTo?: string }>;
  /** Step 2: password + code → staff session. Returns an error string or null. */
  verifyLogin: (identifier: string, password: string, code: string) => Promise<string | null>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [staff, setStaff] = useState<AdminMeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);

  const reload = useCallback(async () => {
    // Nothing saved → straight to sign-in; don't wait on the API (Render can take 30 s+ to wake).
    if (!(await hasStoredSession())) {
      setStatus('signed_out');
      return;
    }
    const res = await api.get<AdminMeResponse>('/admin/me');
    if (res.data) {
      setStaff(res.data);
      setStatus('staff');
      setError(null);
      void registerForPush(); // staff alerts on this phone; silently skipped on emulators / no permission
      return;
    }
    setStaff(null);
    if (res.status === 0) {
      setStatus('offline');
      setError(res.error);
      return;
    }
    if (res.status === 403) {
      // Signed in fine, but the account has no staff role: don't keep that session on this phone.
      await api.post('/auth/logout');
      await setToken(null);
      setError('This account has no staff access. Ask a super admin to add your role.');
    }
    setStatus('signed_out');
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const startLogin = useCallback<SessionValue['startLogin']>(async (identifier, password) => {
    const res = await api.post<{ channel: 'email' | 'sms'; sentTo: string }>('/auth/login/start', {
      identifier: loginId(identifier),
      password,
    });
    if (res.error || !res.data) return { error: res.error ?? 'Could not send the code' };
    return { error: null, sentTo: res.data.sentTo };
  }, []);

  const verifyLogin = useCallback<SessionValue['verifyLogin']>(
    async (identifier, password, code) => {
      const res = await api.post<Tokens>('/auth/login/verify', {
        identifier: loginId(identifier),
        password,
        code: code.trim(),
        rememberMe: true,
      });
      if (res.error || !res.data) return res.error ?? 'Could not sign you in';
      await saveSession(res.data);
      setFresh(true);
      await reload();
      return null;
    },
    [reload],
  );

  const logout = useCallback(async () => {
    await unregisterPush().catch(() => undefined); // before logout: the call needs the session
    await api.post('/auth/logout');
    await setToken(null);
    setStaff(null);
    setFresh(false);
    setError(null);
    setStatus('signed_out');
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ status, staff, error, fresh, startLogin, verifyLogin, logout, reload }),
    [status, staff, error, fresh, startLogin, verifyLogin, logout, reload],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
