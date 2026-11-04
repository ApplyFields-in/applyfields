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

import { api, setToken } from './api';
import { registerForPush, unregisterPush } from './push';

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
  login: (identifier: string, password: string) => Promise<string | null>;
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
    async (res: { data: (AuthResponse & { accessToken?: string }) | null; error: string | null }) => {
      if (res.error || !res.data) return res.error ?? 'Could not sign you in';
      if (res.data.accessToken) await setToken(res.data.accessToken);
      await reload();
      return null;
    },
    [reload],
  );

  const login = useCallback<SessionValue['login']>(
    async (identifier, password) => {
      const id = identifier.trim();
      // LoginDto takes one `identifier` (email or phone), same as the website.
      return afterLogin(
        await api.post<AuthResponse & { accessToken?: string }>('/auth/login', {
          identifier: id.includes('@') ? id.toLowerCase() : id,
          password,
          rememberMe: true,
        }),
      );
    },
    [afterLogin],
  );

  const sendLoginOtp = useCallback<SessionValue['sendLoginOtp']>(async (identifier) => {
    const res = await api.post('/auth/otp/send', { target: identifier.trim(), purpose: 'login' });
    return res.error ?? null;
  }, []);

  const loginWithOtp = useCallback<SessionValue['loginWithOtp']>(
    async (identifier, code) =>
      afterLogin(
        await api.post<AuthResponse & { accessToken?: string }>('/auth/login/otp', {
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
    () => ({ status, me, partner, error, login, sendLoginOtp, loginWithOtp, logout, reload, setPartner }),
    [status, me, partner, error, login, sendLoginOtp, loginWithOtp, logout, reload, setPartner],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
