'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { API_URL } from '@/lib/api';

export function StaffLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }

    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1.5 text-xs font-semibold text-teal hover:bg-cream/80 hover:text-ink disabled:opacity-50 transition-colors"
      title="Log out from Internal Portal"
    >
      <LogOut className="size-3.5 text-teal/70" aria-hidden="true" />
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  );
}
