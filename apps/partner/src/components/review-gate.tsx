'use client';

/**
 * Wraps the centre dashboard and the college desk.
 * - Signed out / no partner / KYC not sent / rejected / wrong desk → sent to the right page.
 * - KYC sent, waiting for staff → banner; `locked` pages show a lock card; `readOnly` disables every form control.
 * The API enforces the same locks; this only keeps people from hitting them.
 */
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Clock, Lock } from 'lucide-react';
import { canUseDashboard, isInstitutionPartner, partnerHome, usePartnerAuth } from '@/lib/auth-context';

export function ReviewGate({
  banner,
  locked,
  lockedText,
  readOnly = false,
  children,
}: {
  banner: string;
  locked: string[];
  lockedText: string;
  readOnly?: boolean;
  children: ReactNode;
}) {
  const { status, partner } = usePartnerAuth();
  const router = useRouter();
  const pathname = usePathname();

  let target: string | null = null;
  if (status === 'unauthenticated') target = '/login';
  else if (status === 'authenticated_no_partner') target = pathname.startsWith('/institution') ? '/institution/onboard' : '/onboard';
  else if (partner && (!canUseDashboard(partner) || isInstitutionPartner(partner) !== pathname.startsWith('/institution'))) {
    target = partnerHome(partner);
  }

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (status === 'loading' || !partner || target) return null;
  if (partner.verification_status === 'verified') return <>{children}</>;

  return (
    <>
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p>
          <strong className="text-amber-300">Under review.</strong> {banner}
        </p>
      </div>
      {locked.includes(pathname) ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm font-semibold text-white">Opens after approval</p>
          <p className="mt-1 text-xs text-slate-400">{lockedText}</p>
        </div>
      ) : readOnly ? (
        // Native: a disabled fieldset disables every input and button inside it.
        <fieldset disabled className="contents">
          {children}
        </fieldset>
      ) : (
        children
      )}
    </>
  );
}
