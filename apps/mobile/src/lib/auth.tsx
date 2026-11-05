/** Who is signed in, for the whole app. One fetch of GET /me on launch. */
import type { AuthResponse, MeResponse } from '@applyfields/types';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { api, saveSession, setToken } from './api';
import { clearPersonalOffline } from './offline';
import { registerForPush, unregisterPush } from './push';

/** LoginDto takes one `identifier` (email or phone), same as the website. Emails are lower-cased. */
function loginId(identifier: string): string {
  const id = identifier.trim();
  return id.includes('@') ? id.toLowerCase() : id;
}

interface AuthValue {
  me: MeResponse | null;
  loading: boolean;
  signedIn: boolean;
  /** display name, falling back to the email/phone the account was made with */
  name: string;
  /**
   * Password sign-in. Verified accounts are signed in straight away ({ error: null }). An account that
   * never confirmed its email/phone gets a one-time code instead: { sentTo } → finish with login().
   */
  startLogin: (identifier: string, password: string) => Promise<{ error: string | null; sentTo?: string }>;
  /** First sign-in only: password + the one-time code → session. Returns an error string or null. */
  login: (identifier: string, password: string, code: string) => Promise<string | null>;
  /** Send a 6-digit login code to the email/phone. Returns an error string or null. */
  sendLoginOtp: (identifier: string) => Promise<string | null>;
  /** Sign in with the code from sendLoginOtp. Returns an error string or null. */
  loginWithOtp: (identifier: string, code: string) => Promise<string | null>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const res = await api.get<MeResponse>('/me');
    setMe(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Hand the device's push token to the notification engine once we know who this is.
  useEffect(() => {
    if (me) void registerForPush();
  }, [me]);

  const startLogin = useCallback<AuthValue['startLogin']>(
    async (identifier, password) => {
      const res = await api.post<
        (AuthResponse & { accessToken?: string; refreshToken?: string }) | { verificationRequired: true; sentTo: string }
      >('/auth/login', { identifier: loginId(identifier), password, rememberMe: true });
      if (res.error || !res.data) return { error: res.error ?? 'Could not sign you in' };
      if ('verificationRequired' in res.data) return { error: null, sentTo: res.data.sentTo };
      await saveSession(res.data);
      await reload();
      return { error: null };
    },
    [reload],
  );

  const login = useCallback<AuthValue['login']>(
    async (identifier, password, code) => {
      const res = await api.post<AuthResponse & { accessToken?: string; refreshToken?: string }>('/auth/login/verify', {
        identifier: loginId(identifier),
        password,
        code: code.trim(),
        rememberMe: true,
      });
      if (res.error || !res.data) return res.error ?? 'Could not sign you in';
      await saveSession(res.data);
      await reload();
      return null;
    },
    [reload],
  );

  const sendLoginOtp = useCallback<AuthValue['sendLoginOtp']>(async (identifier) => {
    const res = await api.post('/auth/otp/send', {
      target: identifier.trim(),
      purpose: 'login',
    });
    return res.error ?? null;
  }, []);

  const loginWithOtp = useCallback<AuthValue['loginWithOtp']>(
    async (identifier, code) => {
      const res = await api.post<AuthResponse & { accessToken?: string; refreshToken?: string }>('/auth/login/otp', {
        identifier: identifier.trim(),
        code: code.trim(),
        rememberMe: true,
      });
      if (res.error || !res.data) return res.error ?? 'Could not sign you in';
      await saveSession(res.data);
      await reload();
      return null;
    },
    [reload],
  );

  const logout = useCallback(async () => {
    await unregisterPush();
    await api.post('/auth/logout');
    await setToken(null);
    clearPersonalOffline();
    setMe(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      me,
      loading,
      signedIn: !!me,
      name: me?.profile?.full_name || me?.user.email || me?.user.phone || 'Your account',
      startLogin,
      login,
      sendLoginOtp,
      loginWithOtp,
      logout,
      reload,
    }),
    [me, loading, startLogin, login, sendLoginOtp, loginWithOtp, logout, reload],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
