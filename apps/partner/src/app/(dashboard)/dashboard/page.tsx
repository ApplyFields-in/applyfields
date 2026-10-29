'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePartnerAuth } from '@/lib/auth-context';
import { listPartnerBookings } from '@/lib/api';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  Layers,
  MapPin,
  MessageSquare,
  Phone,
  Power,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function PartnerDashboardPage() {
  const { partner, user } = usePartnerAuth();
  const [todayCount, setTodayCount] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await listPartnerBookings();
        if (res.data?.items) {
          const items = res.data.items;
          const todayIso = new Date().toISOString().slice(0, 10);
          const todays = items.filter(
            (b) =>
              (b.appointment_at && b.appointment_at.slice(0, 10) === todayIso) ||
              (b.created_at && b.created_at.slice(0, 10) === todayIso),
          );
          setTodayCount(todays.length);

          const rev = items.reduce((acc, b) => {
            if (b.status === 'completed' || b.status === 'in_progress' || b.status === 'accepted') {
              return acc + (b.final_paise ?? b.quoted_paise ?? 0) / 100;
            }
            return acc;
          }, 0);
          setTotalRevenue(rev);
        }
      } catch {}
    }

    loadStats();
  }, []);

  const businessName = partner?.business_name || 'Sri Balaji MeeSeva & Xerox Centre';
  const ownerName = partner?.owner_name || user?.email?.split('@')[0] || 'Center Operator';
  const category = partner?.type || 'meeseva';
  const isAvailable = partner?.is_available ?? true;
  const isVerified = partner?.verification_status === 'verified';
  const stateCode = partner?.state_code || 'TG';
  const district = partner?.district || 'Hyderabad';
  const city = partner?.city || 'Ameerpet';
  const pincode = partner?.pincode || '500016';
  const phone = partner?.phone || user?.phone || '+91 9876543210';
  const address = partner?.address || 'Shop #12, Ground Floor, Main Road';
  const lat = partner?.latitude || 17.437462;
  const lng = partner?.longitude || 78.448288;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Operator Command Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {ownerName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your center <span className="font-semibold text-emerald-400">{businessName}</span> is{' '}
              {isAvailable ? (
                <span className="font-semibold text-emerald-300">Online & ready for bookings</span>
              ) : (
                <span className="font-semibold text-rose-300">currently Offline</span>
              )}
              . Citizens reserving slots on <span className="font-mono text-emerald-300">service.applyfields.in</span> arrive with pre-filled forms.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20"
            >
              <Calendar className="h-4 w-4" /> Set Operating Hours
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Layers className="h-4 w-4" /> Rate Card
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Today&apos;s Bookings</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white">{todayCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {todayCount > 0 ? `${todayCount} citizen appointments queued` : 'Awaiting citizen appointments today'}
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Monthly Center Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-white">
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Direct citizen convenience fees</div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Center Availability</span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              <Power className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-2xl font-black text-white">
            <span
              className={`h-3 w-3 rounded-full ${
                isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            {isAvailable ? 'Online' : 'Offline'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Toggle anytime in top header</div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Customer Rating</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-300">
            {(partner?.rating_avg && partner.rating_avg > 0 ? partner.rating_avg : 5.0).toFixed(1)} / 5.0
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Verified Partner Badge active</div>
        </div>
      </div>

      {/* Main Grid: Details & Features */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Center Details & Next Sessions Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location & GPS Discovery Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  Center Location & GPS Coordinates
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Used by the citizen discovery engine on <span className="font-mono text-emerald-300">service.applyfields.in</span>
                </p>
              </div>
              <Link
                href="/settings"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Edit Location →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  Physical Address
                </span>
                <p className="mt-1 font-medium text-slate-200 leading-relaxed">{address}</p>
                <p className="text-slate-400 mt-0.5">
                  {city}, {district}, {stateCode} - {pincode}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  GPS Pinpoint Coordinates
                </span>
                <div className="mt-2 space-y-1 font-mono text-xs">
                  <div className="text-emerald-400">LAT: {lat}</div>
                  <div className="text-emerald-400">LNG: {lng}</div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Distance-based routing enabled
                </div>
              </div>
            </div>
          </div>

          {/* Partner Roadmap & Modules Preview */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                Partner Ecosystem Feature Roadmap
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Here is what is launching across the 5 sessions in our Swiggy-style partner expansion:
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {/* Session 17 */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                    17
                  </span>
                  <div>
                    <div className="font-bold text-white">Dedicated Partner Portal & Onboarding</div>
                    <div className="text-[11px] text-emerald-300">
                      Standalone app on partners.applyfields.com, KYC flow & GPS capture.
                    </div>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  CURRENT
                </span>
              </div>

              {/* Session 18 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs opacity-90">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                    18
                  </span>
                  <div>
                    <div className="font-bold text-slate-200">
                      Operating Hours & Slot Scheduling Engine
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Set working shifts, 30-min booking slots, custom rate card & service pricing.
                    </div>
                  </div>
                </div>
                <Link
                  href="/schedule"
                  className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white"
                >
                  Preview →
                </Link>
              </div>

              {/* Session 19 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs opacity-90">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                    19
                  </span>
                  <div>
                    <div className="font-bold text-slate-200">
                      Dedicated Citizen Services Portal (`service.applyfields.in`)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Unified citizen SSO, interactive service cart & main portal navigation links.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Upcoming</span>
              </div>

              {/* Session 20 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs opacity-90">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                    20
                  </span>
                  <div>
                    <div className="font-bold text-slate-200">
                      Dynamic Requirement Intake Forms & Slot Booking
                    </div>
                    <div className="text-[11px] text-slate-400">
                      PAN, Aadhaar, MeeSeva, Xerox upload forms with mandatory citizen documents.
                    </div>
                  </div>
                </div>
                <Link
                  href="/bookings"
                  className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white"
                >
                  Preview →
                </Link>
              </div>

              {/* Session 21 */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs opacity-90">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                    21
                  </span>
                  <div>
                    <div className="font-bold text-slate-200">
                      Two-Way Citizen Chat & Admin Geographic Map Desk
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Real-time chat desk with citizens, photo exchanges & staff geographic monitoring.
                    </div>
                  </div>
                </div>
                <Link
                  href="/messages"
                  className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white"
                >
                  Preview →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Verification & Contact Card */}
        <div className="space-y-6">
          {/* KYC Status Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              KYC & Compliance Status
            </h2>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400">Verification Pill:</span>
                {isVerified ? (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-bold text-emerald-400 text-[11px]">
                    Verified Center
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-bold text-amber-400 text-[11px]">
                    Under Review
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400">Storefront Listing:</span>
                <span className="text-slate-200 font-semibold">
                  {partner?.is_listed ? 'Public on service.applyfields.in' : 'Internal Preview Only'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400">Center Classification:</span>
                <span className="font-bold text-emerald-400 uppercase">
                  {category.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4">
              <Link
                href="/settings"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                View Documents & Settings <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-400" />
              Operator Support Hotline
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Need assistance with equipment, software configuration, or slot scheduling? Our dedicated partner desk is available 8:00 AM – 9:00 PM.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="tel:+919876543210"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-400" /> Call Operator Desk
              </a>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Operator Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
