import type { AdminMeResponse } from '@applyfields/types';
import { Badge, buttonClass, Card, Shell, Sidebar } from '@applyfields/ui';
import { Bell, LogIn, Search, ShieldCheck, WifiOff } from 'lucide-react';
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
  const primaryRole = staff?.roles?.[0]?.replace('_', ' ') ?? 'Content Admin';
  const displayName = staff?.name || staff?.email || 'Admin';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <form action="/opportunities" role="search" className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/50" aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search the portal"
          placeholder="Search opportunities, users, IDs…"
          className="h-9 w-full rounded-full border border-line bg-canvas pl-9 pr-9 text-xs placeholder:text-teal/50 outline-none focus:border-sea"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-cream/70 px-1.5 py-0.5 text-[10px] font-semibold text-teal/60">
          /
        </kbd>
      </form>
      <div className="ml-auto flex items-center gap-2.5">
        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-teal/70 hover:bg-cream hover:text-teal transition-colors"
          title="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-sea" />
        </Link>
        {staff ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-line bg-canvas py-1 pl-1.5 pr-3 shadow-xs">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#1A365D] text-[11px] font-bold text-white">
                {initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="max-w-[120px] truncate text-xs font-bold text-teal leading-tight sm:max-w-[160px]">
                  {displayName}
                </span>
                <span className="text-[10px] capitalize leading-none text-[#536780]">
                  {primaryRole}
                </span>
              </div>
            </div>
            <StaffLogoutButton />
          </div>
        ) : (
          <Link href="/login" className={buttonClass({ size: 'sm' })}>
            <LogIn aria-hidden="true" className="size-3.5" /> Staff log in
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
