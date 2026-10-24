'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePartnerAuth } from '@/lib/auth-context';
import { updatePartner } from '@/lib/api';
import { ScrollToTopButton } from '@applyfields/ui';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Power,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';

export default function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, partner, logout, setPartnerOptimistic } = usePartnerAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Fallback partner details if still fetching or previewing
  const centerName = partner?.business_name || 'Sri Balaji MeeSeva & Xerox Centre';
  const centerType = partner?.type || 'meeseva';
  const isAvailable = partner?.is_available ?? true;
  const isVerified = partner?.verification_status === 'verified';

  async function handleToggleAvailability(newState: boolean) {
    setUpdatingAvailability(true);
    // Optimistic UI update
    setPartnerOptimistic((prev) => (prev ? { ...prev, is_available: newState } : null));

    try {
      await updatePartner({ is_available: newState });
      setStatusToast(
        newState
          ? '🟢 Center is now Online & accepting citizen bookings!'
          : '🔴 Center marked as Offline / Closed for today.',
      );
      setTimeout(() => setStatusToast(null), 3000);
    } catch {
      setStatusToast('Failed to update availability status.');
    } finally {
      setUpdatingAvailability(false);
    }
  }

  const navItems = [
    {
      name: 'Overview Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Operating Schedule & Slots',
      href: '/schedule',
      icon: Calendar,
      badge: 'Session 18',
    },
    {
      name: 'Services & Rate Card',
      href: '/services',
      icon: Layers,
      badge: 'Session 18',
    },
    {
      name: 'Bookings Desk',
      href: '/bookings',
      icon: FileCheck2,
      badge: 'Session 20',
    },
    {
      name: 'Communication Desk',
      href: '/messages',
      icon: MessageSquare,
      badge: 'Session 21',
    },
    {
      name: 'Center Settings & KYC',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-slate-800 lg:bg-slate-900/80 lg:backdrop-blur-xl">
        {/* Brand / Center Box */}
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">ApplyFields</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold uppercase text-emerald-400">
                  PARTNER
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-300 mt-0.5">{centerName}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono uppercase text-slate-300">
              {centerType.replace('_', ' ')}
            </span>
            {isVerified ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Clock className="h-3 w-3" /> Under Review
              </span>
            )}
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
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
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
            <div className="text-[11px] font-semibold text-slate-400">Operator Session</div>
            <div className="text-white font-medium truncate mt-0.5">
              {partner?.owner_name || user?.email || 'Center Operator'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {partner?.phone || user?.phone || '+91 9876543210'}
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

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Operator Header */}
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
              <h1 className="text-sm font-bold text-white tracking-tight">{centerName}</h1>
              <p className="text-[11px] text-slate-400">
                {partner?.city || 'Ameerpet'}, {partner?.state_code || 'TG'} ·{' '}
                <span className="font-mono text-emerald-400">{partner?.pincode || '500016'}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Live Availability Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Availability Switch */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => handleToggleAvailability(true)}
                disabled={updatingAvailability}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isAvailable
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Online
              </button>

              <button
                type="button"
                onClick={() => handleToggleAvailability(false)}
                disabled={updatingAvailability}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  !isAvailable
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-300" />
                Offline
              </button>
            </div>

            {/* View Citizen Storefront Preview */}
            <a
              href={`https://service.applyfields.in/partners/${partner?.slug || 'preview'}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <Compass className="h-3.5 w-3.5 text-emerald-400" /> Storefront Preview
            </a>
          </div>
        </header>

        {/* Status Toast */}
        {statusToast && (
          <div className="bg-emerald-600 px-4 py-2 text-center text-xs font-semibold text-white transition-all">
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
                <div className="font-bold text-white text-sm">ApplyFields Partner</div>
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
                          ? 'bg-emerald-500 text-slate-950 font-bold'
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

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          <div className="flex-1">{children}</div>
          <footer className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>ApplyFields Partner Operator Desk · Real-time Workspace</span>
            <ScrollToTopButton className="text-slate-400 hover:text-white border-slate-800 hover:border-slate-700 hover:bg-slate-800/50" />
          </footer>
        </main>

      </div>
    </div>
  );
}
