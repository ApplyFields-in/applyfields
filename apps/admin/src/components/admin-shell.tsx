import type { AdminMeResponse } from '@applyfields/types';
import { Badge, buttonClass, Card, ScrollToTopButton, Shell, Sidebar } from '@applyfields/ui';
import {
  Activity,
  Bell,
  ExternalLink,
  Globe,
  LogIn,
  Search,
  ShieldCheck,
  Store,
  WifiOff,
  Zap,
} from 'lucide-react';
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
      sidebar={<Sidebar groups={NAV} subtitle="Global Operations" footer={<SidebarFooter />} />}
      topbar={<Topbar staff={staff} />}
      footer={<Footer />}
    >
      {children}
    </Shell>
  );
}

function SidebarFooter() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/10 p-3 text-xs text-cream/90 backdrop-blur-xs border border-white/10">
      <div className="flex items-center gap-1.5 font-bold text-white">
        <ShieldCheck className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <span>Admin Core · Root Access</span>
      </div>
      <p className="text-[11px] text-cream/75 leading-relaxed">
        Governs Citizen Web (:3000), Services Hub (:3003), and Partner Network (:3002). Every action is audited.
      </p>
    </div>
  );
}

function Topbar({ staff }: { staff?: AdminMeResponse | null }) {
  const primaryRole = staff?.roles?.[0]?.replace('_', ' ') ?? 'Global Administrator';
  const displayName = staff?.name || staff?.email || 'Admin';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Search Input */}
      <form action="/opportunities" role="search" className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-olive-700/60" aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search the portal"
          placeholder="Search opportunities, users, colleges, IDs…"
          className="h-9 w-full rounded-full border border-olive-200/80 bg-white/90 pl-9 pr-9 text-xs text-olive-950 placeholder:text-olive-700/50 outline-none transition-all focus:border-olive-600 focus:bg-white focus:ring-2 focus:ring-olive-600/15"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-olive-200 bg-olive-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-olive-800/70">
          /
        </kbd>
      </form>

      {/* Multi-Portal Navigation Switcher (Clear Visual Separation of Portals) */}
      <div className="hidden xl:flex items-center gap-1 rounded-full border border-olive-200/80 bg-white/80 p-1 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 rounded-full bg-olive-800 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          Admin Core :3001
        </div>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-olive-800 hover:bg-olive-100/70 hover:text-olive-950 transition-colors"
          title="Open Citizen Web Portal (localhost:3000)"
        >
          <Globe className="size-3 text-olive-600" />
          <span>Web :3000</span>
          <ExternalLink className="size-2.5 opacity-40" />
        </a>
        <a
          href="http://localhost:3003"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-olive-800 hover:bg-olive-100/70 hover:text-olive-950 transition-colors"
          title="Open Citizen Services Hub (localhost:3003)"
        >
          <Zap className="size-3 text-amber-600" />
          <span>Services :3003</span>
          <ExternalLink className="size-2.5 opacity-40" />
        </a>
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-olive-800 hover:bg-olive-100/70 hover:text-olive-950 transition-colors"
          title="Open Partner & Operator Portal (localhost:3002)"
        >
          <Store className="size-3 text-emerald-600" />
          <span>Partner :3002</span>
          <ExternalLink className="size-2.5 opacity-40" />
        </a>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-olive-800/80 hover:bg-olive-100/80 hover:text-olive-950 transition-colors"
          title="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-olive-600" />
        </Link>
        {staff ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-olive-200/80 bg-white/90 py-1 pl-1.5 pr-3 shadow-xs">
              <div className="flex size-7 items-center justify-center rounded-full bg-olive-800 text-[11px] font-bold text-white shadow-xs">
                {initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="max-w-[120px] truncate text-xs font-bold text-olive-950 leading-tight sm:max-w-[160px]">
                  {displayName}
                </span>
                <span className="text-[10px] capitalize leading-none text-olive-700/80">
                  {primaryRole}
                </span>
              </div>
            </div>
            <StaffLogoutButton />
          </div>
        ) : (
          <Link href="/login" className={buttonClass({ size: 'sm', className: 'bg-olive-800 hover:bg-olive-900 text-white shadow-xs' })}>
            <LogIn aria-hidden="true" className="size-3.5" /> Staff log in
          </Link>
        )}
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-3 border-t border-olive-200/60 bg-white/60 px-4 py-4 text-xs text-olive-900/80 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-olive-950">ApplyFields Operations Core (:3001)</span>
        <span className="text-olive-400">·</span>
        <span>Ecosystem Control:</span>
        <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="text-olive-700 hover:underline">Citizen Web (:3000)</a>
        <span className="text-olive-400">|</span>
        <a href="http://localhost:3003" target="_blank" rel="noreferrer" className="text-olive-700 hover:underline">Services Hub (:3003)</a>
        <span className="text-olive-400">|</span>
        <a href="http://localhost:3002" target="_blank" rel="noreferrer" className="text-olive-700 hover:underline">Partner Network (:3002)</a>
      </div>
      <div className="flex items-center gap-4">
        <ScrollToTopButton className="text-olive-700 hover:text-olive-950 border-olive-200/80 hover:border-olive-400" />
        <ApiStatus />
      </div>
    </footer>
  );
}

export function ApiOffline() {
  return (
    <Card tone="tea" className="flex items-start gap-3 p-5 border-amber-300 bg-amber-50/80">
      <WifiOff className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
      <div>
        <p className="font-bold text-amber-900">Can’t reach the API</p>
        <p className="mt-1 text-sm text-amber-800">
          This portal reads from <code className="font-mono">{API_URL}</code>. Start it with{' '}
          <code className="font-mono font-semibold">pnpm dev:api</code>.
        </p>
      </div>
    </Card>
  );
}
