'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost } from './api';

export interface CitizenUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
}

interface AuthContextType {
  user: CitizenUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (user: CitizenUser, token?: string) => void;
  logout: () => Promise<void>;
  setDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoggedIn: false,
  login: () => {},
  logout: async () => {},
  setDemoUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CitizenUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncAuth = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // 1. Check shared localStorage (Cross-subdomain synchronization in dev)
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.id || parsed.email)) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch {}
    }

    // 2. Check API /me session
    try {
      const res = await apiGet<{ user: CitizenUser; profile?: { full_name?: string } }>('/me');
      if (res.data && res.data.user) {
        const u = {
          ...res.data.user,
          full_name: res.data.profile?.full_name || res.data.user.full_name,
        };
        setUser(u);
        localStorage.setItem('currentUser', JSON.stringify(u));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncAuth();

    function handleStorage() {
      syncAuth();
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-changed', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-changed', handleStorage);
    };
  }, [syncAuth]);

  async function logout() {
    try {
      await apiPost('/auth/logout');
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event('auth-changed'));
    }
    setUser(null);
  }

  function login(u: CitizenUser, token?: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(u));
      if (token) {
        localStorage.setItem('accessToken', token);
      }
      window.dispatchEvent(new Event('auth-changed'));
    }
    setUser(u);
  }

  function setDemoUser() {
    const demo: CitizenUser = {
      id: 'usr_demo_arvind',
      email: 'arvind.kumar@example.com',
      full_name: 'Arvind Kumar',
      phone: '+91 98765 43210',
    };
    login(demo);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        login,
        logout,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
