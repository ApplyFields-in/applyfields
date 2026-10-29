'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  ShoppingBag,
  User,
  Store,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  LocateFixed,
  Search,
  Briefcase,
  Send,
  Printer,
  FileText,
  Home,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function Navbar() {
  const { user, isLoggedIn, logout, setDemoUser } = useAuth();
  const { totalQuantity, subtotal, setIsCartOpen } = useCart();

  const [locationName, setLocationName] = useState('Enable Location');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tempLocation, setTempLocation] = useState('');

  const MAIN_WEB_URL = process.env.NEXT_PUBLIC_MAIN_WEB_URL || 'http://localhost:3000';
  const PARTNER_URL = process.env.NEXT_PUBLIC_PARTNER_PORTAL_URL || 'http://localhost:3002';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('applyfields_service_location');
      if (saved) setLocationName(saved);
    }
  }, []);

  function handleSaveLocation(customLoc?: string) {
    const loc = customLoc || tempLocation.trim();
    if (loc) {
      setLocationName(loc);
      setShowLocationModal(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('applyfields_service_location', loc);
        localStorage.removeItem('applyfields_service_coords');
        window.dispatchEvent(
          new CustomEvent('applyfields:location-change', { detail: { location: loc } }),
        );
      }
    }
  }

  function handleDetectGps() {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const loc = 'Current GPS Location';
          setLocationName(loc);
          setShowLocationModal(false);
          localStorage.setItem('applyfields_service_location', loc);
          localStorage.setItem('applyfields_service_coords', JSON.stringify({ lat, lng }));
          window.dispatchEvent(
            new CustomEvent('applyfields:location-change', {
              detail: { location: loc, coords: { lat, lng } },
            }),
          );
        },
        () => {
          alert('GPS permission not granted. Please pick a location suggestion or enter PIN code.');
        },
      );
    }
  }

  return (
    <>
      <header className="sticky top-4 z-50 mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_1fr] items-center">
          {/* Left Capsule: Brand & Portal Identification */}
          <div className="flex items-center gap-3 justify-start rounded-[32px] border border-white bg-[#F0F4F8] p-2.5 sm:px-5 sm:py-3 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <Image
                src="/logo-mark.png"
                alt="ApplyFields Logo"
                width={36}
                height={36}
                className="size-9 shrink-0 object-contain transition-transform group-hover:scale-105"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-[#082046]">
                    Apply<span className="text-[#0e7bf4]">Fields</span>
                  </span>
                  <span className="rounded-md bg-[#e0edfb] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#0e7bf4] border border-[#38bdf8]/30">
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
            </nav>
          </div>

          {/* Center Capsule: Mode Switcher in Exact Middle (Career / Apply / Services [Active]) */}
          <div className="hidden lg:flex items-center justify-center justify-self-center rounded-full border border-white bg-[#F0F4F8] p-1.5 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
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
                <span>Services</span>
              </Link>

              <Link
                href="/desk"
                className="flex min-w-[76px] flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[11px] font-bold text-[#082046] hover:text-[#0e7bf4] transition-all"
              >
                <FileText className="size-3.5 text-[#526987]" />
                <span>Filing Desk</span>
              </Link>
            </div>
          </div>

          {/* Right Capsule: Location + Cart + Account */}
          <div className="flex items-center justify-end justify-self-end gap-2 rounded-[32px] border border-white bg-[#F0F4F8] p-2.5 sm:px-4 sm:py-3 shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.22),-8px_-8px_20px_rgba(255,255,255,0.95)]">
            {/* Location Pill */}
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2f8] px-3 py-1.5 text-xs font-bold text-[#082046] shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff] hover:text-[#0e7bf4] transition"
              title="Click to enable location or choose nearby area"
            >
              <LocateFixed className="h-3.5 w-3.5 text-[#0e7bf4] shrink-0" />
              <span className="max-w-[110px] md:max-w-[140px] truncate">{locationName}</span>
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
                className="text-slate-400 hover:text-[#082046]"
              >
                <X className="size-4" />
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
                <LocateFixed className="h-4 w-4" /> Enable Location / Use Current GPS
              </button>

              <div>
                <p className="text-[11px] font-bold text-[#526987] uppercase tracking-wider mb-1.5">
                  Suggested Localities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Ameerpet (500016)',
                    'Kukatpally (500072)',
                    'Madhapur (500081)',
                    'Dilsukhnagar (500060)',
                    'SR Nagar (500038)',
                    'Secunderabad (500003)',
                  ].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleSaveLocation(loc)}
                      className="rounded-lg bg-white border border-[#d5deea] px-2.5 py-1 text-xs font-semibold text-[#082046] hover:border-[#0e7bf4] hover:text-[#0e7bf4] hover:bg-[#edf4fc] transition shadow-xs"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
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
                onClick={() => handleSaveLocation()}
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
