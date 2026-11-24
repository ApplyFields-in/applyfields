'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { MeResponse, PartnerDetail, UserSummary } from '@applyfields/types';
import { COLLEGE_PARTNER_TYPES, kycSubmitted } from '@applyfields/types/src/partner-documents';
import { apiGet, apiPost, getMyPartner } from './api';
import { flashToast } from '@applyfields/ui';

export const isInstitutionPartner = (p: Pick<PartnerDetail, 'type'>) => COLLEGE_PARTNER_TYPES.includes(p.type);

/**
 * Dashboard access: approved, or KYC sent and waiting for staff (setup only; nothing public until approved).
 * Skipped KYC or rejected → the under-review page to upload documents.
 */
export function canUseDashboard(p: PartnerDetail): boolean {
  return p.verification_status === 'verified' || (p.verification_status === 'pending' && kycSubmitted(p));
}

/** Where a signed-in partner belongs. */
export function partnerHome(p: PartnerDetail): string {
  const inst = isInstitutionPartner(p);
  if (canUseDashboard(p)) return inst ? '/institution/dashboard' : '/dashboard';
  return inst ? '/institution/under-review' : '/under-review';
}

export type PartnerAuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'authenticated_no_partner'
  | 'pending_verification'
  | 'verified'
  | 'rejected';

export type PartnerRole = 'owner' | 'staff';

interface PartnerAuthContextValue {
  user: UserSummary | null;
  partner: PartnerDetail | null;
  status: PartnerAuthStatus;
  loading: boolean;
  activeRole: PartnerRole;
  switchRole: (role: PartnerRole) => void;
  refreshSession: () => Promise<void>;
  setPartnerOptimistic: (updater: (prev: PartnerDetail | null) => PartnerDetail | null) => void;
  logout: () => Promise<void>;
}

const PartnerAuthContext = createContext<PartnerAuthContextValue>({
  user: null,
  partner: null,
  status: 'loading',
  loading: true,
  activeRole: 'owner',
  switchRole: () => {},
  refreshSession: async () => {},
  setPartnerOptimistic: () => {},
  logout: async () => {},
});

export function PartnerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PartnerAuthStatus>('loading');
  const [activeRole, setActiveRole] = useState<PartnerRole>('owner');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('applyfields_partner_role') as PartnerRole | null;
      if (storedRole === 'staff' || storedRole === 'owner') {
        setActiveRole(storedRole);
      }
    }
  }, []);

  const switchRole = useCallback((newRole: PartnerRole) => {
    setActiveRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('applyfields_partner_role', newRole);
    }
  }, []);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Try reading currentUser from localStorage first for immediate responsiveness
      let currentUser: UserSummary | null = null;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            currentUser = JSON.parse(stored);
          } catch {}
        }
      }

      // 2. Fetch fresh user info from API
      // (Was '/users/me', which the API doesn't have: the stale cached user was all that kept people in.)
      const userRes = await apiGet<MeResponse>('/me');
      if (userRes.data?.user) {
        currentUser = userRes.data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else if (userRes.status === 401) {
        // Session really ended (refresh failed too): don't keep showing the cached account.
        currentUser = null;
        localStorage.removeItem('currentUser');
      }

      setUser(currentUser);

      if (!currentUser) {
        setPartner(null);
        setStatus('unauthenticated');
        setLoading(false);
        return;
      }

      // 3. User is logged in, now fetch their partner profile
      const partnerRes = await getMyPartner();
      if (partnerRes.data) {
        setPartner(partnerRes.data);
        if (partnerRes.data.verification_status === 'verified') {
          setStatus('verified');
        } else if (partnerRes.data.verification_status === 'rejected') {
          setStatus('rejected');
        } else {
          setStatus('pending_verification');
        }
      } else {
        // No partner record linked to this user yet
        setPartner(null);
        setStatus('authenticated_no_partner');
      }
    } catch {
      setStatus('unauthenticated');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    const handleAuthChanged = () => {
      checkSession();
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, [checkSession]);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('auth-changed'));
    }
    setUser(null);
    setPartner(null);
    setStatus('unauthenticated');
    flashToast('Logged out successfully.');
  }, []);

  const setPartnerOptimistic = useCallback(
    (updater: (prev: PartnerDetail | null) => PartnerDetail | null) => {
      setPartner(updater);
    },
    [],
  );

  return (
    <PartnerAuthContext.Provider
      value={{
        user,
        partner,
        status,
        loading,
        activeRole,
        switchRole,
        refreshSession: checkSession,
        setPartnerOptimistic,
        logout,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  return useContext(PartnerAuthContext);
}
