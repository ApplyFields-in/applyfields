'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { AdminMeResponse } from '@applyfields/types';
import { Badge, buttonClass, Card, ScrollToTopButton, Shell, Sidebar } from '@applyfields/ui';
import {
  Activity,
  Bell,
  Briefcase,
  Building,
  CheckCircle2,
  Crown,
  ExternalLink,
  Globe,
  HandHelping,
  Inbox,
  Layers,
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
import { API_URL } from '@/lib/api';
import {
  DEPARTMENTS,
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

  // Detect initial department based on user roles or URL path
  const isSuperAdmin = Boolean(
    !staff ||
    staff.roles?.includes('super_admin') ||
    staff.roles?.includes('admin')
  );

  const [activeDepartment, setActiveDepartment] = useState<DepartmentType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentDepartment') as DepartmentType;
      if (saved && DEPARTMENTS[saved]) return saved;
    }

    // Auto-detect from pathname
    if (pathname.startsWith('/partners')) return 'partners';
    if (pathname.startsWith('/services') || pathname.startsWith('/assistance')) return 'services';
    if (pathname.startsWith('/review') || pathname.startsWith('/scrapers') || pathname.startsWith('/opportunities')) return 'apply';
    if (pathname.startsWith('/colleges') || pathname.startsWith('/careers')) return 'career';

    // Default based on staff role
    if (staff?.roles?.includes('partner_manager') || staff?.roles?.includes('partner_ops')) return 'partners';
    if (staff?.roles?.includes('services_officer') || staff?.roles?.includes('case_agent')) return 'services';
    if (staff?.roles?.includes('content_reviewer') || staff?.roles?.includes('scraper_lead')) return 'apply';
    if (staff?.roles?.includes('career_curator') || staff?.roles?.includes('institution_analyst')) return 'career';

    return 'super_admin';
  });

  // Keep department in sync with URL navigation
  useEffect(() => {
    if (isSuperAdmin) {
      if (pathname.startsWith('/partners')) {
        setActiveDepartment('partners');
      } else if (pathname.startsWith('/services') || pathname.startsWith('/assistance')) {
        setActiveDepartment('services');
      } else if (pathname.startsWith('/review') || pathname.startsWith('/scrapers')) {
        setActiveDepartment('apply');
      } else if (pathname.startsWith('/colleges') || pathname.startsWith('/careers')) {
        setActiveDepartment('career');
      } else if (pathname === '/' || pathname.startsWith('/audit') || pathname.startsWith('/analytics') || pathname.startsWith('/settings')) {
        setActiveDepartment('super_admin');
      }
    }
  }, [pathname, isSuperAdmin]);

  const handleSwitchDepartment = (dept: DepartmentType) => {
    setActiveDepartment(dept);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentDepartment', dept);
    }
    const targetPath = DEPARTMENTS[dept].homePath;
    router.push(targetPath);
  };

  const navGroups = useMemo(() => getNavForDepartment(activeDepartment), [activeDepartment]);
  const currentDeptMeta = DEPARTMENTS[activeDepartment] || DEPARTMENTS.super_admin;

  // Departmental Route Access Guard for scoped staff
  const userScopedDepartment: DepartmentType | null = useMemo(() => {
    if (isSuperAdmin) return null;
    if (staff?.roles?.some((r) => r.startsWith('partner'))) return 'partners';
    if (staff?.roles?.some((r) => r.startsWith('services') || r === 'case_agent')) return 'services';
    if (staff?.roles?.some((r) => r.startsWith('content') || r === 'reviewer' || r === 'scraper_lead')) return 'apply';
    if (staff?.roles?.some((r) => r.startsWith('career') || r === 'institution_analyst')) return 'career';
    return null;
  }, [staff, isSuperAdmin]);

  const isRestricted = useMemo(() => {
    if (!userScopedDepartment) return false;
    const allowed = [
      ...(userScopedDepartment === 'partners' ? ['/partners', '/assistance'] : []),
      ...(userScopedDepartment === 'services' ? ['/services', '/assistance'] : []),
      ...(userScopedDepartment === 'apply' ? ['/review', '/opportunities', '/updates', '/scrapers', '/sources'] : []),
      ...(userScopedDepartment === 'career' ? ['/colleges', '/careers'] : []),
    ];
    return !allowed.some((prefix) => pathname.startsWith(prefix));
  }, [userScopedDepartment, pathname]);

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
          isSuperAdmin={isSuperAdmin}
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
            <h2 className="text-xl font-black text-olive-950">
              Access Restricted to {DEPARTMENTS[userScopedDepartment].name} Staff
            </h2>
            <p className="text-xs text-olive-700/80 leading-relaxed max-w-md mx-auto">
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

interface TopbarProps {
  staff?: AdminMeResponse | null;
  activeDepartment: DepartmentType;
  isSuperAdmin: boolean;
  onSwitchDepartment: (dept: DepartmentType) => void;
}

function Topbar({ staff, activeDepartment, isSuperAdmin, onSwitchDepartment }: TopbarProps) {
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
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-olive-700/60" aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="Search the portal"
          placeholder="Search records, users, IDs…"
          className="h-9 w-full rounded-full border border-olive-200/80 bg-white/90 pl-9 pr-9 text-xs text-olive-950 placeholder:text-olive-700/50 outline-none transition-all focus:border-olive-600 focus:bg-white focus:ring-2 focus:ring-olive-600/15"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-olive-200 bg-olive-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-olive-800/70">
          /
        </kbd>
      </form>

      {/* DEPARTMENT SWITCHER OR LOCKED DEPARTMENT BADGE */}
      {isSuperAdmin ? (
        <div className="hidden lg:flex items-center gap-1 rounded-full border border-olive-200/80 bg-white/90 p-1 shadow-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => onSwitchDepartment('super_admin')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeDepartment === 'super_admin'
                ? 'bg-olive-800 text-white shadow-xs'
                : 'text-olive-700 hover:text-olive-950 hover:bg-olive-50'
            }`}
          >
            <Crown className="size-3.5 text-amber-300" />
            <span>Master Cockpit</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchDepartment('partners')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeDepartment === 'partners'
                ? 'bg-olive-800 text-white shadow-xs'
                : 'text-olive-700 hover:text-olive-950 hover:bg-olive-50'
            }`}
          >
            <Store className="size-3.5 text-emerald-400" />
            <span>Partners</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchDepartment('services')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeDepartment === 'services'
                ? 'bg-olive-800 text-white shadow-xs'
                : 'text-olive-700 hover:text-olive-950 hover:bg-olive-50'
            }`}
          >
            <HandHelping className="size-3.5 text-blue-400" />
            <span>Citizen Services</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchDepartment('apply')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeDepartment === 'apply'
                ? 'bg-olive-800 text-white shadow-xs'
                : 'text-olive-700 hover:text-olive-950 hover:bg-olive-50'
            }`}
          >
            <Inbox className="size-3.5 text-indigo-400" />
            <span>Apply & Review</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchDepartment('career')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeDepartment === 'career'
                ? 'bg-olive-800 text-white shadow-xs'
                : 'text-olive-700 hover:text-olive-950 hover:bg-olive-50'
            }`}
          >
            <Building className="size-3.5 text-rose-400" />
            <span>Career & Colleges</span>
          </button>
        </div>
      ) : (
        /* Department Locked Badge for Departmental Staff */
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-olive-50 border border-olive-200 text-xs font-bold text-olive-900">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>{DEPARTMENTS[activeDepartment].name}</span>
          <span className="text-[10px] font-mono text-olive-600 bg-white px-2 py-0.5 rounded border border-olive-200">
            {DEPARTMENTS[activeDepartment].badge}
          </span>
        </div>
      )}

      {/* External Portals Switcher */}
      <div className="hidden 2xl:flex items-center gap-1 rounded-full border border-olive-200/80 bg-white/80 p-1 shadow-xs backdrop-blur-md">
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
        <span>Departmental Cockpit System</span>
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
