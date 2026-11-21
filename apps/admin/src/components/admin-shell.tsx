'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { AdminMeResponse } from '@applyfields/types';
import { buttonClass, Card, ScrollToTopButton, Shell, Sidebar } from '@applyfields/ui';
import {
  Bell,
  Building,
  ChevronDown,
  Crown,
  ExternalLink,
  Globe,
  HandHelping,
  Inbox,
  LayoutGrid,
  Lock,
  LogIn,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  WifiOff,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { BACKEND_API_URL, PARTNER_URL, SERVICE_URL, WEB_URL } from '@/lib/api';
import {
  DEPARTMENTS,
  canOpenPath,
  departmentForPath,
  departmentsForRoles,
  getNavForDepartment,
  type DepartmentType,
} from '@/lib/nav';
import { StaffLogoutButton } from './staff-logout-button';
import { ApiStatus } from './api-status';

export function AdminShell({
  children,
  staff,
}: {
  children: ReactNode;
  staff?: AdminMeResponse | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Dashboards come from the server-verified roles (/admin/me), never from what the login page picked.
  const departments = useMemo(() => departmentsForRoles(staff?.roles), [staff?.roles]);
  const homeDepartment = departments[0] ?? 'super_admin';

  // The last department the user picked wins while it owns the current page; otherwise the page decides.
  const [chosenDepartment, setChosenDepartment] = useState<DepartmentType>(homeDepartment);
  const activeDepartment = departmentForPath(departments, pathname, chosenDepartment);

  const handleSwitchDepartment = (dept: DepartmentType) => {
    setChosenDepartment(dept);
    router.push(DEPARTMENTS[dept].homePath);
  };

  const navGroups = useMemo(() => getNavForDepartment(activeDepartment), [activeDepartment]);
  const currentDeptMeta = DEPARTMENTS[activeDepartment] || DEPARTMENTS.super_admin;

  // The API enforces the same mapping; this just shows a clear page instead of empty 403 widgets.
  const isRestricted = !canOpenPath(departments, pathname);
  const userScopedDepartment: DepartmentType | null = isRestricted ? homeDepartment : null;

  return (
    <Shell
      sidebar={
        <Sidebar
          groups={navGroups}
          subtitle={currentDeptMeta.name}
          footer={<SidebarFooter department={currentDeptMeta} />}
        />
      }
      topbar={
        <Topbar
          staff={staff}
          activeDepartment={activeDepartment}
          departments={departments}
          onSwitchDepartment={handleSwitchDepartment}
        />
      }
      footer={<Footer />}
    >
      {isRestricted && userScopedDepartment ? (
        <div className="mx-auto max-w-xl py-16 text-center space-y-5">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <ShieldAlert className="size-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              <Lock className="size-3.5" /> Department Boundary Enforced
            </div>
            <h2 className="text-xl font-black text-navy-950">
              Access Restricted to {DEPARTMENTS[userScopedDepartment].name} Staff
            </h2>
            <p className="text-xs text-navy-700/80 leading-relaxed max-w-md mx-auto">
              Your staff credentials are scoped strictly to the <strong>{DEPARTMENTS[userScopedDepartment].name}</strong> department. 
              You do not have administrative clearance to access operations outside your assigned department.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Link
              href={DEPARTMENTS[userScopedDepartment].homePath}
              className={buttonClass({ variant: 'primary', size: 'md' })}
            >
              Return to {DEPARTMENTS[userScopedDepartment].shortLabel} Cockpit
            </Link>
          </div>
        </div>
      ) : (
        children
      )}
    </Shell>
  );
}

function SidebarFooter({ department }: { department: typeof DEPARTMENTS.super_admin }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/10 p-3 text-xs text-cream/90 backdrop-blur-xs border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <ShieldCheck className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>{department.shortLabel}</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/15 text-white/90">
          {department.badge}
        </span>
      </div>
      <p className="text-[11px] text-cream/75 leading-relaxed">
        {department.description}
      </p>
    </div>
  );
}

const DEPARTMENT_TABS: Record<DepartmentType, string> = {
  super_admin: 'Master Cockpit',
  partners: 'Partners',
  services: 'Citizen Services',
  apply: 'Apply & Review',
  career: 'Career & Colleges',
};

const DEPARTMENT_ICONS: Record<DepartmentType, ReactNode> = {
  super_admin: <Crown className="size-3.5 text-amber-300" />,
  partners: <Store className="size-3.5 text-emerald-400" />,
  services: <HandHelping className="size-3.5 text-blue-400" />,
  apply: <Inbox className="size-3.5 text-indigo-400" />,
  career: <Building className="size-3.5 text-rose-400" />,
};

interface TopbarProps {
  staff?: AdminMeResponse | null;
  activeDepartment: DepartmentType;
  departments: DepartmentType[];
  onSwitchDepartment: (dept: DepartmentType) => void;
}

function Topbar({ staff, activeDepartment, departments, onSwitchDepartment }: TopbarProps) {
  const primaryRole = staff?.roles?.[0]?.replace('_', ' ') ?? 'Global Administrator';
  const displayName = staff?.name || staff?.email || 'Admin';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // The Portals / account menus are <details>: close them on an outside click or Esc.
  useEffect(() => {
    const close = (e: Event) => {
      document.querySelectorAll<HTMLDetailsElement>('header details[open]').forEach((d) => {
        if (e instanceof KeyboardEvent ? e.key === 'Escape' : !d.contains(e.target as Node)) d.open = false;
      });
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  return (
    <>
      {/* Search Input */}
      <form action="/opportunities" role="search" className="relative hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-700/60" aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search the portal"
          placeholder="Search records, users, IDs…"
          className="h-9 w-full rounded-full border border-navy-200/80 bg-white/90 pl-9 pr-9 text-xs text-navy-950 placeholder:text-navy-700/50 outline-none transition-all focus:border-navy-600 focus:bg-white focus:ring-2 focus:ring-navy-600/15"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-navy-200 bg-navy-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-navy-800/70">
          /
        </kbd>
      </form>

      {/* DEPARTMENT SWITCHER (only the user's own departments) OR LOCKED BADGE */}
      {departments.length > 1 ? (
        <div className="hidden lg:flex items-center gap-1 rounded-full border border-navy-200/80 bg-white/90 p-1 shadow-xs backdrop-blur-md">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => onSwitchDepartment(dept)}
              aria-pressed={activeDepartment === dept}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                activeDepartment === dept
                  ? 'bg-navy-800 text-white shadow-xs'
                  : 'text-navy-700 hover:text-navy-950 hover:bg-navy-50'
              }`}
            >
              {DEPARTMENT_ICONS[dept]}
              <span>{DEPARTMENT_TABS[dept]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 border border-navy-200 text-xs font-bold text-navy-900">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>{DEPARTMENTS[activeDepartment].name}</span>
          <span className="text-[10px] font-mono text-navy-600 bg-white px-2 py-0.5 rounded border border-navy-200">
            {DEPARTMENTS[activeDepartment].badge}
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {/* Other portals: one menu instead of three pills */}
        <details className="group relative hidden md:block">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-navy-800 transition-colors hover:bg-navy-100/70 [&::-webkit-details-marker]:hidden">
            <LayoutGrid className="size-3.5 text-navy-600" aria-hidden="true" />
            Portals
            <ChevronDown className="size-3 text-navy-500 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-navy-200/80 bg-white p-1.5 shadow-xl">
            {[
              { href: WEB_URL, icon: <Globe className="size-4 text-navy-600" />, name: 'Citizen website', hint: 'Jobs, exams, careers' },
              { href: SERVICE_URL, icon: <Zap className="size-4 text-amber-600" />, name: 'Services portal', hint: 'PAN, Aadhaar, MeeSeva bookings' },
              { href: PARTNER_URL, icon: <Store className="size-4 text-emerald-600" />, name: 'Partner portal', hint: 'Centres and institutions' },
            ].map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-navy-50"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy-50">{p.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-navy-950">{p.name}</span>
                  <span className="block truncate text-[11px] text-navy-700/70">{p.hint}</span>
                </span>
                <ExternalLink className="size-3 shrink-0 text-navy-400" aria-hidden="true" />
              </a>
            ))}
          </div>
        </details>

        <Link
          href="/notifications"
          className="rounded-full p-2 text-navy-800/80 transition-colors hover:bg-navy-100/80 hover:text-navy-950"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </Link>

        {staff ? (
          /* Account menu: name + role + log out in one place */
          <details className="group relative">
            <summary
              className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-navy-200/80 bg-white/90 py-1 pl-1 pr-2.5 shadow-xs transition-colors hover:border-navy-300 [&::-webkit-details-marker]:hidden"
              aria-label={`Account menu for ${displayName}`}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-navy-800 text-[11px] font-bold text-white">
                {initials}
              </span>
              <span className="hidden flex-col text-left sm:flex">
                <span className="max-w-[140px] truncate text-xs font-bold leading-tight text-navy-950">{displayName}</span>
                <span className="text-[10px] capitalize leading-none text-navy-700/80">{primaryRole}</span>
              </span>
              <ChevronDown className="size-3 text-navy-500 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-navy-200/80 bg-white p-1.5 shadow-xl">
              <div className="border-b border-navy-100 px-3 pb-2.5 pt-2">
                <p className="truncate text-xs font-bold text-navy-950">{displayName}</p>
                {staff.email && <p className="truncate text-[11px] text-navy-700/70">{staff.email}</p>}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {staff.roles.map((r) => (
                    <span key={r} className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-navy-800">
                      {r.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <StaffLogoutButton className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50" />
            </div>
          </details>
        ) : (
          <Link href="/login" className={buttonClass({ size: 'sm', className: 'bg-navy-800 hover:bg-navy-900 text-white shadow-xs' })}>
            <LogIn aria-hidden="true" className="size-3.5" /> Staff log in
          </Link>
        )}
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-3 border-t border-navy-200/60 bg-white/60 px-4 py-4 text-xs text-navy-900/80 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-navy-950">ApplyFields Operations Core</span>
        <span className="text-navy-400">·</span>
        <span>Departmental Cockpit System</span>
      </div>
      <div className="flex items-center gap-4">
        <ScrollToTopButton className="text-navy-700 hover:text-navy-950 border-navy-200/80 hover:border-navy-400" />
        <ApiStatus />
      </div>
    </footer>
  );
}

/** `status`/`error` from apiGetWithStatus: a non-zero status means the API answered with an error, not that it is down. */
export function ApiOffline({ status = 0, error }: { status?: number; error?: string }) {
  if (status > 0) {
    return (
      <Card tone="tea" className="flex items-start gap-3 p-5 border-amber-300 bg-amber-50/80">
        <WifiOff className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <p className="font-bold text-amber-900">The API returned an error ({status})</p>
          <p className="mt-1 text-sm text-amber-800">{error ?? 'No details.'}</p>
        </div>
      </Card>
    );
  }
  return (
    <Card tone="tea" className="flex items-start gap-3 p-5 border-amber-300 bg-amber-50/80">
      <WifiOff className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
      <div>
        <p className="font-bold text-amber-900">Can’t reach the API</p>
        {error && <p className="mt-1 text-sm text-amber-800">{error}</p>}
        <p className="mt-1 text-sm text-amber-800">
          This portal reads from <code className="font-mono">{BACKEND_API_URL}</code>. Start it with{' '}
          <code className="font-mono font-semibold">pnpm dev:api</code>.
        </p>
      </div>
    </Card>
  );
}
