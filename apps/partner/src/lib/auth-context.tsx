'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { PartnerDetail, UserSummary } from '@applyfields/types';
import { apiGet, apiPost, getMyPartner } from './api';

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
      const userRes = await apiGet<UserSummary>('/users/me');
      if (userRes.data) {
        currentUser = userRes.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
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
