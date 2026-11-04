/** Who is signed in, for the whole app. One fetch of GET /me on launch. */
import type { AuthResponse, MeResponse } from '@applyfields/types';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { api, setToken } from './api';
import { clearPersonalOffline } from './offline';
import { registerForPush, unregisterPush } from './push';

interface AuthValue {
  me: MeResponse | null;
  loading: boolean;
  signedIn: boolean;
  /** display name, falling back to the email/phone the account was made with */
  name: string;
  login: (identifier: string, password: string) => Promise<string | null>;
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

  const login = useCallback<AuthValue['login']>(
    async (identifier, password) => {
      // LoginDto takes one `identifier` (email or phone), same as the website.
      const id = identifier.trim();
      const res = await api.post<AuthResponse & { accessToken?: string }>('/auth/login', {
        identifier: id.includes('@') ? id.toLowerCase() : id,
        password,
        rememberMe: true,
      });
      if (res.error || !res.data) return res.error ?? 'Could not sign you in';
      if (res.data.accessToken) await setToken(res.data.accessToken);
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
      const res = await api.post<AuthResponse & { accessToken?: string }>('/auth/login/otp', {
        identifier: identifier.trim(),
        code: code.trim(),
        rememberMe: true,
      });
      if (res.error || !res.data) return res.error ?? 'Could not sign you in';
      if (res.data.accessToken) await setToken(res.data.accessToken);
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
      login,
      sendLoginOtp,
      loginWithOtp,
      logout,
      reload,
    }),
    [me, loading, login, sendLoginOtp, loginWithOtp, logout, reload],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
