import type { AdminMeResponse } from '@applyfields/types';
import { Badge, buttonClass, Card, Shell, Sidebar } from '@applyfields/ui';
import { LogIn, Search, ShieldCheck, WifiOff } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { API_URL } from '@/lib/api';
import { NAV } from '@/lib/nav';
import { StaffLogoutButton } from './staff-logout-button';
import { ApiStatus } from './api-status';

export function AdminShell({
  children,
  staff,
}: {
  children: ReactNode;
  staff?: AdminMeResponse | null;
}) {
  return (
    <Shell
      sidebar={<Sidebar groups={NAV} subtitle="Internal Portal" footer={<SidebarFooter />} />}
      topbar={<Topbar staff={staff} />}
      footer={<Footer />}
    >
      {children}
    </Shell>
  );
}

function SidebarFooter() {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-cream/10 p-3 text-xs text-cream/85">
      <ShieldCheck className="size-4 shrink-0 text-celadon" aria-hidden="true" />
      Staff only. Every action here is recorded in the audit log.
    </div>
  );
}

function Topbar({ staff }: { staff?: AdminMeResponse | null }) {
  const primaryRole = staff?.roles?.[0]?.replace('_', ' ') ?? 'staff';

  return (
    <>
      <form action="/opportunities" role="search" className="relative hidden max-w-xl flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/80" aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search the portal"
          placeholder="Search opportunities, users, partners…"
          className="h-10 w-full rounded-full border border-line bg-cream pl-10 pr-4 text-sm placeholder:text-teal/80"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Badge tone="celadon" className="hidden md:inline-flex">
          Internal Portal
        </Badge>
        {staff ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-line bg-cream/60 py-1 pl-1.5 pr-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-teal text-xs font-bold text-cream">
                {(staff.name || staff.email || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="max-w-[120px] truncate text-xs font-bold text-ink sm:max-w-[160px]">
                  {staff.name || staff.email}
                </span>
                <span className="text-[10px] capitalize leading-none text-teal/70">
                  {primaryRole}
                </span>
              </div>
            </div>
            <Badge tone="celadon" className="hidden sm:inline-flex text-xs capitalize font-semibold">
              {primaryRole}
            </Badge>
            <StaffLogoutButton />
          </div>
        ) : (
          <Link href="/login" className={buttonClass()}>
            <LogIn aria-hidden="true" /> Staff log in
          </Link>
        )}
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-3 border-t border-line px-4 py-5 text-xs text-teal/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <p>ApplyFields Internal Portal · for the ApplyFields team only</p>
      <ApiStatus />
    </footer>
  );
}


export function ApiOffline() {
  return (
    <Card tone="tea" className="flex items-start gap-3 p-5">
      <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">Can’t reach the API</p>
        <p className="mt-1 text-sm">
          This portal reads from <code className="font-mono">{API_URL}</code>. Start it with{' '}
          <code className="font-mono font-semibold">pnpm dev:api</code>.
        </p>
      </div>
    </Card>
  );
}
