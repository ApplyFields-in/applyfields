import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import type { AdminMeResponse } from '@applyfields/types';
import { AdminShell } from '@/components/admin-shell';
import { apiGetWithStatus } from '@/lib/api';
import { Card, Logo } from '@applyfields/ui';
import { ShieldAlert } from 'lucide-react';
import { StaffLogoutButton } from '@/components/staff-logout-button';

export default async function MainLayout({ children }: { children: ReactNode }) {
  await connection();
  const res = await apiGetWithStatus<AdminMeResponse>('/admin/me');

  if (res.status === 401) {
    redirect('/login');
  }

  if (res.status === 403) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-paper text-ink">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex justify-center">
            <Logo subtitle="Internal Portal" />
          </div>
          <Card className="p-8 text-center border-terracotta/30 shadow-clay-card">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
              <ShieldAlert className="size-8" />
            </div>
            <h1 className="text-xl font-bold text-ink">You don&apos;t have staff access</h1>
            <p className="mt-2 text-sm text-teal/80">
              Your account is registered as a citizen, but has not been granted any staff permissions on the Internal Portal.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <StaffLogoutButton />
              <a
                href="http://localhost:3000"
                className="inline-flex items-center justify-center rounded-full border border-line bg-cream px-4 py-2 text-xs font-semibold text-teal hover:bg-cream/80 transition-colors"
              >
                Go to Citizen Portal
              </a>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <AdminShell staff={res.data}>{children}</AdminShell>;
}
