'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  MapPin,
  ShoppingBag,
  User,
  Store,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  Sparkles,
  LocateFixed,
  Search,
  Briefcase,
  Send,
  Printer,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function Navbar() {
  const { user, isLoggedIn, logout, setDemoUser } = useAuth();
  const { totalQuantity, subtotal, setIsCartOpen } = useCart();

  const [locationName, setLocationName] = useState('Hyderabad (500016)');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tempLocation, setTempLocation] = useState('');

  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'http://localhost:3000';
  const PARTNER_URL = process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || 'http://localhost:3002';

  function handleSaveLocation() {
    if (tempLocation.trim()) {
      setLocationName(tempLocation.trim());
      setShowLocationModal(false);
    }
  }

  function handleDetectGps() {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationName('Current Location (GPS Active)');
          setShowLocationModal(false);
        },
        () => {
          alert('GPS permission not granted. Please enter PIN code manually.');
        },
      );
    }
  }

  return (
    <>
      <header className="sticky top-4 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 items-center gap-3 lg:grid-cols-4">
          {/* Left Capsule: Brand & Portal Identification */}
          <div className="flex items-center gap-3 rounded-[32px] border border-white bg-[#F0F4F8] p-2.5 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)] sm:px-5 sm:py-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0e7bf4] to-[#38bdf8] text-white font-black shadow-md shadow-[#0e7bf4]/25">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-[#082046]">
                    ApplyFields
                  </span>
                  <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#0e7bf4] border border-[#38bdf8]/30">
                    Services Hub
                  </span>
                </div>
                <p className="text-[10px] text-[#526987] font-semibold hidden sm:block">
                  MeeSeva · CSC · PAN · Aadhaar · Xerox
                </p>
              </div>
            </Link>

            {/* Quick Link to Main Web */}
            <nav className="hidden xl:flex items-center gap-1 border-l border-[#d5deea] pl-3 ml-2 text-xs font-bold text-[#526987]">
              <a
                href={MAIN_WEB_URL}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-colors hover:bg-white hover:text-[#082046]"
              >
                <Home className="size-3.5 text-[#0e7bf4]" />
                <span>Home</span>
              </a>
              <a
                href={`${MAIN_WEB_URL}/career`}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 transition-colors hover:bg-white hover:text-[#082046]"
              >
                <Compass className="size-3.5 text-[#0e7bf4]" />
                <span>Explore</span>
              </a>
            </nav>
          </div>

          {/* Center Capsule: Mode Switcher (Career / Apply / Services [Active]) */}
          <div className="hidden lg:flex items-center justify-center rounded-full border border-white bg-[#F0F4F8] p-1.5 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
            <div className="flex items-center gap-1 rounded-full bg-[#edf2f8] p-1 shadow-[inset_3px_3px_7px_#d8e0eb,inset_-3px_-3px_7px_#ffffff]">
              <a
                href={`${MAIN_WEB_URL}/career`}
                className="flex min-w-[76px] flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-bold text-[#082046] hover:text-[#0e7bf4] transition-all"
              >
                <Briefcase className="size-3.5 text-[#526987]" />
                <span>Career</span>
              </a>

              <a
                href={`${MAIN_WEB_URL}/apply`}
                className="flex min-w-[76px] flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-bold text-[#082046] hover:text-[#0e7bf4] transition-all"
              >
                <Send className="size-3.5 text-[#526987]" />
                <span>Apply</span>
              </a>

              <Link
                href="/"
                className="flex min-w-[76px] flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-bold bg-[#F0F4F8] text-[#0e7bf4] shadow-[3px_3px_7px_#d8e0eb,-3px_-3px_7px_#ffffff] transition-all"
              >
                <Printer className="size-3.5 text-[#0e7bf4]" />
                <span className="flex items-center gap-1">
                  <span>Services</span>
                  <span className="size-1.5 rounded-full bg-[#0e7bf4] animate-ping" />
                </span>
              </Link>
            </div>
          </div>

          {/* Right Capsule: Location + Cart + Account */}
          <div className="flex items-center justify-end gap-2 rounded-[32px] border border-white bg-[#F0F4F8] p-2.5 sm:px-4 sm:py-3 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
            {/* Location Pill */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#edf2f8] px-3 py-1.5 text-xs font-bold text-[#082046] shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff] hover:text-[#0e7bf4] transition"
              title="Change search location / PIN code"
            >
              <MapPin className="h-3.5 w-3.5 text-[#0e7bf4] shrink-0" />
              <span className="max-w-[100px] md:max-w-[130px] truncate">{locationName}</span>
            </button>

            {/* Visit Cart Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-2xl bg-[#0e7bf4] px-3.5 py-2 text-xs font-bold text-white shadow-clay-btn-azure transition hover:bg-[#0c6fdc] active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalQuantity > 0 ? (
                <span className="rounded-full bg-white px-1.5 py-0.2 text-[10px] font-black text-[#0e7bf4]">
                  {totalQuantity}
                </span>
              ) : null}
            </button>

            {/* User Account Menu */}
            <div className="relative">
              {isLoggedIn ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white border border-[#d5deea] shadow-sm text-xs font-black text-[#082046] hover:border-[#0e7bf4]"
                  >
                    {user?.full_name?.[0] || 'U'}
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-white bg-white p-3 shadow-2xl animate-in fade-in space-y-2">
                      <div className="border-b border-slate-100 pb-2">
                        <p className="text-xs font-bold text-[#082046] truncate">{user?.full_name || 'Citizen User'}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{user?.phone}</p>
                      </div>
                      <a
                        href={PARTNER_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-bold text-[#082046] hover:bg-[#F0F4F8]"
                      >
                        <Store className="h-3.5 w-3.5 text-[#0e7bf4]" />
                        <span>Partner Desk Login</span>
                      </a>
                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={setDemoUser}
                  className="rounded-2xl border border-[#d5deea] bg-white px-3 py-1.5 text-xs font-bold text-[#082046] shadow-sm hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Change Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white bg-[#F0F4F8] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d5deea] pb-3">
              <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#0e7bf4]" />
                Select Your City or Pincode
              </h3>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="text-slate-400 hover:text-[#082046] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#526987]">
              Enter your PIN code, mandal, or locality to view nearby MeeSeva and Xerox kiosks.
            </p>

            <div className="space-y-3">
              <div className="flex items-center rounded-2xl bg-white border border-[#d5deea] p-2 focus-within:border-[#0e7bf4] shadow-sm">
                <Search className="h-4 w-4 text-slate-400 ml-2 mr-2" />
                <input
                  type="text"
                  placeholder="e.g. 500016, Ameerpet, Gachibowli"
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#082046] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleDetectGps}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0e7bf4]/60 bg-[#e0edfb] py-2.5 text-xs font-bold text-[#0e7bf4] hover:bg-[#d0e5fb] transition"
              >
                <LocateFixed className="h-4 w-4" /> Use Current GPS Position
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#d5deea]">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-[#526987] hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                className="rounded-xl bg-[#0e7bf4] px-5 py-2 text-xs font-bold text-white shadow-clay-btn-azure hover:bg-[#0c6fdc]"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
