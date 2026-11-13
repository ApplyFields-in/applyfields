/**
 * Who is signed in and which partner workspace they get. Same decision the web
 * partner portal makes after login (apps/partner/src/app/(auth)/login/page.tsx):
 *   no account            → login
 *   account, no partner   → onboard
 *   partner not verified  → under review (or rejected)
 *   verified centre       → centre workspace (bookings, chat, services, schedule)
 *   verified college      → institution workspace (enquiries, desk profile)
 */
import type { AuthResponse, MeResponse, PartnerDetail } from '@applyfields/types';
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import { api, saveSession, setToken } from './api';
import { registerForPush, unregisterPush } from './push';

/** LoginDto takes one `identifier` (email or phone), same as the website. Emails are lower-cased. */
function loginId(identifier: string): string {
  const id = identifier.trim();
  return id.includes('@') ? id.toLowerCase() : id;
}

export type SessionStatus =
  | 'loading'
  | 'offline'
  | 'signed_out'
  | 'no_partner'
  | 'pending'
  | 'rejected'
  | 'centre'
  | 'institution';

const INSTITUTION_TYPES = new Set(['college', 'university', 'training_institute']);

export function isInstitution(partner: Pick<PartnerDetail, 'type'> | null): boolean {
  return !!partner && INSTITUTION_TYPES.has(partner.type);
}

export function statusFor(partner: PartnerDetail | null): SessionStatus {
  if (!partner) return 'no_partner';
  if (partner.verification_status === 'rejected') return 'rejected';
  if (partner.verification_status !== 'verified') return 'pending';
  return isInstitution(partner) ? 'institution' : 'centre';
}

interface SessionValue {
  status: SessionStatus;
  me: MeResponse | null;
  partner: PartnerDetail | null;
  error: string | null;
  /**
   * Password sign-in. Verified accounts are signed in straight away ({ error: null }). An account that
   * never confirmed its email/phone gets a one-time code instead: { sentTo } → finish with login().
   */
  startLogin: (identifier: string, password: string) => Promise<{ error: string | null; sentTo?: string }>;
  /** First sign-in only: password + the one-time code → session. Returns an error string or null. */
  login: (identifier: string, password: string, code: string) => Promise<string | null>;
  sendLoginOtp: (identifier: string) => Promise<string | null>;
  loginWithOtp: (identifier: string, code: string) => Promise<string | null>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
  /** Replace the partner after a PATCH so the header/toggle update without a refetch. */
  setPartner: (next: PartnerDetail) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [me, setMe] = useState<MeResponse | null>(null);
  const [partner, setPartnerState] = useState<PartnerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const meRes = await api.get<MeResponse>('/me');
    if (!meRes.data) {
      setMe(null);
      setPartnerState(null);
      // status 0 = no network; anything else (401) means there is no session.
      setStatus(meRes.status === 0 ? 'offline' : 'signed_out');
      setError(meRes.status === 0 ? meRes.error : null);
      return;
    }
    setMe(meRes.data);

    const pRes = await api.get<PartnerDetail>('/partners/me');
    if (pRes.status === 0) {
      setStatus('offline');
      setError(pRes.error);
      return;
    }
    // 404/403 = this account has no partner record yet.
    setPartnerState(pRes.data);
    setStatus(statusFor(pRes.data));
    setError(null);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (me) void registerForPush();
  }, [me]);

  const afterLogin = useCallback(
    async (res: { data: (AuthResponse & { accessToken?: string; refreshToken?: string }) | null; error: string | null }) => {
      if (res.error || !res.data) return res.error ?? 'Could not sign you in';
      await saveSession(res.data);
      await reload();
      return null;
    },
    [reload],
  );

  const startLogin = useCallback<SessionValue['startLogin']>(
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

  const login = useCallback<SessionValue['login']>(
    async (identifier, password, code) =>
      afterLogin(
        await api.post<AuthResponse & { accessToken?: string; refreshToken?: string }>('/auth/login/verify', {
          identifier: loginId(identifier),
          password,
          code: code.trim(),
          rememberMe: true,
        }),
      ),
    [afterLogin],
  );

  const sendLoginOtp = useCallback<SessionValue['sendLoginOtp']>(async (identifier) => {
    const res = await api.post('/auth/otp/send', { target: identifier.trim(), purpose: 'login' });
    return res.error ?? null;
  }, []);

  const loginWithOtp = useCallback<SessionValue['loginWithOtp']>(
    async (identifier, code) =>
      afterLogin(
        await api.post<AuthResponse & { accessToken?: string; refreshToken?: string }>('/auth/login/otp', {
          identifier: identifier.trim(),
          code: code.trim(),
          rememberMe: true,
        }),
      ),
    [afterLogin],
  );

  const logout = useCallback(async () => {
    await unregisterPush();
    await api.post('/auth/logout');
    await setToken(null);
    setMe(null);
    setPartnerState(null);
    setStatus('signed_out');
  }, []);

  const setPartner = useCallback((next: PartnerDetail) => {
    setPartnerState(next);
    setStatus(statusFor(next));
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ status, me, partner, error, startLogin, login, sendLoginOtp, loginWithOtp, logout, reload, setPartner }),
    [status, me, partner, error, startLogin, login, sendLoginOtp, loginWithOtp, logout, reload, setPartner],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
