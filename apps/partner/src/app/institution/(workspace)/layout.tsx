'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePartnerAuth } from '@/lib/auth-context';
import { getPartnerInstitutionDesk, updatePartnerInstitutionDesk } from '@/lib/api';
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Power,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { InstitutionPartnerProfile } from '@applyfields/types';

export default function InstitutionWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, partner, logout } = usePartnerAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [instProfile, setInstProfile] = useState<InstitutionPartnerProfile | null>(null);
  const [admissionsActive, setAdmissionsActive] = useState(true);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadDesk() {
      try {
        const res = await getPartnerInstitutionDesk();
        if (res.data) {
          setInstProfile(res.data);
        }
      } catch {
        // Fallback or demo
      }
    }
    loadDesk();
  }, []);

  const collegeName = instProfile?.name || partner?.business_name || 'Chaitanya Bharathi Institute of Technology';
  const collegeSlug = instProfile?.slug || 'cbit-hyderabad';
  const ownership = instProfile?.ownership || 'autonomous';
  const inquiriesCount = instProfile?.enquiries_count ?? 18;
  const officerName = partner?.owner_name || user?.email || 'Dr. K. Venkatesh Rao (Dean)';


  const navItems = [
    {
      name: 'Admissions Overview',
      href: '/institution/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Student Inquiries Desk',
      href: '/institution/inquiries',
      icon: Users,
      badge: `${inquiriesCount} Leads`,
    },
    {
      name: 'Programs & Seat Matrix',
      href: '/institution/programs',
      icon: GraduationCap,
      badge: `${instProfile?.courses_count || 12} Courses`,
    },
    {
      name: 'Campus Profile & NIRF/NAAC',
      href: '/institution/profile',
      icon: Building2,
    },
    {
      name: 'Admissions Desk Settings',
      href: '/institution/settings',
      icon: Settings,
    },
  ];

  function toggleAdmissions(status: boolean) {
    setAdmissionsActive(status);
    setStatusToast(
      status
        ? '🟢 Admissions Cycle marked OPEN. Students can submit inquiries.'
        : '🔴 Admissions Cycle marked CLOSED for current academic session.',
    );
    setTimeout(() => setStatusToast(null), 3000);
  }

  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'http://localhost:3000';

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-slate-800 lg:bg-slate-900/80 lg:backdrop-blur-xl">
        {/* Brand Header */}
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black shadow-lg shadow-blue-500/20 text-lg">
              🏛️
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">ApplyFields</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-bold uppercase text-blue-300">
                  INSTITUTION
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-300 mt-0.5">{collegeName}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono uppercase text-blue-300">
              {ownership}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Verified Desk
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs mb-3">
            <div className="text-[11px] font-semibold text-slate-400">Admissions Officer</div>
            <div className="text-white font-medium truncate mt-0.5">{officerName}</div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5 truncate">
              {instProfile?.contact_email || user?.email || 'admissions@college.ac.in'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout().then(() => router.push('/login'))}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-850 py-2.5 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out of Desk
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white tracking-tight">{collegeName}</h1>
              <p className="text-[11px] text-slate-400">
                Official Admissions Desk (Founder Doc §21) ·{' '}
                <span className="font-mono text-blue-400">NIRF Ranked Institution</span>
              </p>
            </div>
          </div>

          {/* Controls: Admissions Toggle & Public Directory Link */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => toggleAdmissions(true)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  admissionsActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
                Admissions Open
              </button>
              <button
                type="button"
                onClick={() => toggleAdmissions(false)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  !admissionsActive
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Closed
              </button>
            </div>

            <a
              href={`${MAIN_WEB_URL}/career/colleges/${collegeSlug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <Compass className="h-3.5 w-3.5 text-blue-400" />
              <span>Public College Profile</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
          </div>
        </header>

        {statusToast && (
          <div className="bg-blue-600 px-4 py-2 text-center text-xs font-semibold text-white transition-all">
            {statusToast}
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900 border-r border-slate-800 p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="font-bold text-white text-sm">ApplyFields Institution</div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="flex-1">{children}</div>
          <footer className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>ApplyFields Institutional Admissions Desk (Founder Doc §21) · Direct College Channel</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
