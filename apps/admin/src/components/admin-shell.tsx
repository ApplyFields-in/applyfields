'use client';

import React, { useState, useMemo } from 'react';
import type { AdminMeResponse } from '@applyfields/types';
import { buttonClass, Card, ScrollToTopButton, Shell, Sidebar } from '@applyfields/ui';
import {
  Bell,
  Building,
  Crown,
  ExternalLink,
  Globe,
  HandHelping,
  Inbox,
  Lock,
  LogIn,
  Search,
  ShieldCheck,
  ShieldAlert,
  Store,
  WifiOff,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { API_URL, PARTNER_URL, SERVICE_URL, WEB_URL } from '@/lib/api';
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

      {/* External Portals Switcher */}
      <div className="hidden 2xl:flex items-center gap-1 rounded-full border border-navy-200/80 bg-white/80 p-1 shadow-xs backdrop-blur-md">
        <a
          href={WEB_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-navy-800 hover:bg-navy-100/70 hover:text-navy-950 transition-colors"
          title="Open the citizen website"
        >
          <Globe className="size-3 text-navy-600" />
          <span>Web :3000</span>
          <ExternalLink className="size-2.5 opacity-40" />
        </a>
        <a
          href={SERVICE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-navy-800 hover:bg-navy-100/70 hover:text-navy-950 transition-colors"
          title="Open the services portal"
        >
          <Zap className="size-3 text-amber-600" />
          <span>Services :3003</span>
          <ExternalLink className="size-2.5 opacity-40" />
        </a>
        <a
          href={PARTNER_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-navy-800 hover:bg-navy-100/70 hover:text-navy-950 transition-colors"
          title="Open the partner portal"
        >
          <Store className="size-3 text-emerald-600" />
          <span>Partner :3002</span>
          <ExternalLink className="size-2.5 opacity-40" />
        </a>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-navy-800/80 hover:bg-navy-100/80 hover:text-navy-950 transition-colors"
          title="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-navy-600" />
        </Link>
        {staff ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-navy-200/80 bg-white/90 py-1 pl-1.5 pr-3 shadow-xs">
              <div className="flex size-7 items-center justify-center rounded-full bg-navy-800 text-[11px] font-bold text-white shadow-xs">
                {initials}
              </div>
              <div className="flex flex-col text-left">
                <span className="max-w-[120px] truncate text-xs font-bold text-navy-950 leading-tight sm:max-w-[160px]">
                  {displayName}
                </span>
                <span className="text-[10px] capitalize leading-none text-navy-700/80">
                  {primaryRole}
                </span>
              </div>
            </div>
            <StaffLogoutButton />
          </div>
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
        <span className="font-semibold text-navy-950">ApplyFields Operations Core (:3001)</span>
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
