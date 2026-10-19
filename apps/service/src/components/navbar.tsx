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
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: Brand & Portal Badge */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-500 text-slate-950 font-black shadow-md shadow-cyan-500/20">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight text-white">ApplyFields</span>
                  <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/30">
                    Services Hub
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">MeeSeva · CSC · Xerox · PAN · Aadhaar</p>
              </div>
            </Link>

            {/* Back to main portal link */}
            <a
              href={MAIN_WEB_URL}
              className="hidden lg:inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition ml-3 border-l border-slate-800 pl-4"
            >
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>Jobs &amp; Guidance Portal</span>
              <ArrowUpRight className="h-3 w-3 text-slate-500" />
            </a>
          </div>

          {/* Center: Location Pin Selector */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:text-white transition shadow-inner"
            >
              <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="max-w-[160px] truncate">{locationName}</span>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                Change
              </span>
            </button>
          </div>

          {/* Right: Partner link, Cart trigger & Profile */}
          <div className="flex items-center gap-3">
            <a
              href={`${PARTNER_URL}/onboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <Store className="h-3.5 w-3.5" />
              <span>Become a Partner</span>
            </a>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition shadow-sm"
              title="Open Service Cart"
            >
              <ShoppingBag className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Cart</span>
              {totalQuantity > 0 && (
                <span className="rounded-full bg-cyan-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
                  {totalQuantity}
                </span>
              )}
              {subtotal > 0 && (
                <span className="font-mono text-white text-xs border-l border-cyan-500/40 pl-2">
                  ₹{subtotal}
                </span>
              )}
            </button>

            {/* Profile Dropdown / Sign in */}
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 transition"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500 font-bold text-slate-950 text-[10px]">
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate font-medium">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl space-y-1 text-xs">
                    <div className="p-2 border-b border-slate-800">
                      <p className="font-bold text-white truncate">{user.full_name || 'Citizen'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <a
                      href={`${MAIN_WEB_URL}/applications`}
                      className="flex items-center gap-2 rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      My Applications &amp; Vault
                    </a>
                    <a
                      href={`${MAIN_WEB_URL}/profile`}
                      className="flex items-center gap-2 rounded-xl p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      Unified Account Profile
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl p-2 text-rose-400 hover:bg-rose-500/10 text-left font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={setDemoUser}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Demo Login
                </button>
                <a
                  href={`${MAIN_WEB_URL}/login`}
                  className="rounded-xl bg-cyan-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
                >
                  Sign In
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-400" /> Select Your Location
              </h3>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Find MeeSeva, CSC digital seva, and Xerox centers closest to your home or college.
            </p>

            <button
              type="button"
              onClick={handleDetectGps}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <LocateFixed className="h-4 w-4" /> Use Current GPS Location
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-bold uppercase">Or Search Manually</span>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1">
                Enter PIN code, Mandal, or City
              </label>
              <input
                type="text"
                placeholder="e.g. 500016, Ameerpet, Gachibowli..."
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400 text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
              >
                Apply Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
