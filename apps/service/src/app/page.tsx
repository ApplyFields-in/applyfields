'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { listDirectoryPartners } from '@/lib/api';
import {
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Phone,
  ArrowRight,
  Filter,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Compass,
  Layers,
  LocateFixed,
  ListFilter,
  Train,
} from 'lucide-react';
import { useCart, CartPartner } from '@/lib/cart-context';
import { OpenStreetMap, MapCenterPin } from '@/components/open-street-map';

export interface VerifiedCenter {
  id: string;
  name: string;
  slug: string;
  type: 'meeseva' | 'csc' | 'xerox_printing' | 'browsing_centre';
  typeLabel: string;
  rating: number;
  reviewCount: number;
  distanceKm: number | null;
  address: string;
  city: string;
  district: string;
  pincode: string;
  phone: string;
  isOpenToday: boolean;
  openHours: string;
  slotDurationMinutes: number;
  lat: number | null;
  lng: number | null;
  landmark?: string;
  rateCard: {
    title: string;
    price: number;
    turnaround: string;
  }[];
}

const MAIN_WEB_URL =
  process.env.NEXT_PUBLIC_MAIN_WEB_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://applyfields.com' : 'http://localhost:3000');

/** Slugs seeded by database/changes/2026-11-06_likhith_top10_citizen_services_ts_ap.sql */
const POPULAR_GUIDES: [string, string][] = [
  ['pan-card', 'PAN Card'],
  ['passport', 'Passport'],
  ['integrated-certificate', 'Integrated (Caste) Certificate'],
  ['income-certificate', 'Income Certificate'],
  ['residence-certificate', 'Residence Certificate'],
  ['obc-ncl-certificate', 'OBC NCL Certificate'],
  ['ews-certificate', 'EWS Certificate'],
  ['driving-licence', 'Driving Licence / LL'],
  ['voter-id', 'Voter ID'],
  ['aadhaar-address-update', 'Aadhaar Address Update'],
];

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/** Distance from the user for centres with a map pin; centres without one sort last. */
function withDistance(list: VerifiedCenter[], at: { lat: number; lng: number }): VerifiedCenter[] {
  return list
    .map((c) => ({
      ...c,
      distanceKm: c.lat != null && c.lng != null ? calculateHaversineDistance(at.lat, at.lng, c.lat, c.lng) : null,
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}

export default function ServicesHomePage() {
  const [centers, setCenters] = useState<VerifiedCenter[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Location detection states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [focusedCenter, setFocusedCenter] = useState<VerifiedCenter | null>(null);
  const [activeLocation, setActiveLocation] = useState<string>('Enable Location');
  const [showAllAnyway, setShowAllAnyway] = useState<boolean>(false);

  const { addItem } = useCart();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function syncLocationFromStorage() {
      const stored = localStorage.getItem('applyfields_service_location');
      if (stored) {
        setActiveLocation(stored);
      }
      const coordsRaw = localStorage.getItem('applyfields_service_coords');
      if (coordsRaw) {
        try {
          const { lat, lng } = JSON.parse(coordsRaw);
          setUserLocation({ lat, lng });
        } catch {
          // ignore
        }
      }
    }

    syncLocationFromStorage();

    function handleLocationEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.location) {
        setActiveLocation(detail.location);
      }
      if (detail?.coords) {
        const { lat, lng } = detail.coords;
        setUserLocation({ lat, lng });
      } else {
        setUserLocation(null); // a typed area, not GPS: no distance sorting
      }
    }

    window.addEventListener('applyfields:location-change', handleLocationEvent);
    return () => {
      window.removeEventListener('applyfields:location-change', handleLocationEvent);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadDirectory() {
      try {
        const res = await listDirectoryPartners();
        if (mounted && res.data?.items) {
          const liveCenters: VerifiedCenter[] = res.data.items.map((p) => {
            const typeMapping: Record<string, VerifiedCenter['type']> = {
              meeseva: 'meeseva',
              csc: 'csc',
              xerox_printing: 'xerox_printing',
              browsing_centre: 'browsing_centre',
            };
            const partnerType = typeMapping[p.type] || 'meeseva';
            return {
              id: p.id,
              name: p.business_name,
              slug: p.slug,
              type: partnerType,
              typeLabel:
                p.type === 'meeseva'
                  ? 'MeeSeva Hub'
                  : p.type === 'csc'
                  ? 'CSC Digital Seva'
                  : p.type === 'xerox_printing'
                  ? 'Xerox & Print Desk'
                  : 'Cyber & Application Hub',
              // Real partner data only; missing fields stay empty and the card hides them.
              rating: p.rating_avg ?? 0,
              reviewCount: p.rating_count ?? 0,
              distanceKm: null,
              address: p.address ?? '',
              city: p.city ?? '',
              district: p.district ?? '',
              pincode: p.pincode ?? '',
              phone: p.phone ?? '',
              isOpenToday: p.is_available,
              openHours: '',
              slotDurationMinutes: 30,
              lat: p.latitude ?? null,
              lng: p.longitude ?? null,
              landmark: p.district || undefined,
              // Only services with a set price can go in the cart (the user must see the amount first).
              rateCard: (p.services ?? [])
                .filter((s) => s.charge_paise != null)
                .map((s) => ({
                  title: s.name,
                  price: (s.charge_paise as number) / 100,
                  turnaround: s.estimated_time_text ?? '',
                })),
            };
          });

          setCenters(liveCenters);
        }
      } catch (err) {
        console.warn('Could not load the centre directory:', err);
      }
    }

    loadDirectory();
    return () => {
      mounted = false;
    };
  }, []);

  function handleEnableLocation() {
    setIsLocating(true);
    setLocationNotice(null);

    const fail = (msg: string) => {
      setIsLocating(false);
      setLocationNotice(msg);
      setTimeout(() => setLocationNotice(null), 4000);
    };
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      fail('Location is not available in this browser. Showing all centres.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const label = 'GPS: Current location';
        setUserLocation(coords);
        setShowAllAnyway(false);
        setActiveLocation(label);
        setIsLocating(false);
        setLocationNotice('Location on. Centres are sorted by distance from you.');
        setTimeout(() => setLocationNotice(null), 5000);
        localStorage.setItem('applyfields_service_location', label);
        localStorage.setItem('applyfields_service_coords', JSON.stringify(coords));
        window.dispatchEvent(new CustomEvent('applyfields:location-change', { detail: { location: label, coords } }));
      },
      () => fail('Location permission denied. Showing all centres.'),
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  // Sorted by distance once we know where the user is; "far away" = the nearest pinned centre is > 30 km.
  const sortedCenters = userLocation ? withDistance(centers, userLocation) : centers;
  const nearestKm = sortedCenters[0]?.distanceKm;
  const gpsFarAway = !showAllAnyway && nearestKm != null && nearestKm > 30;

  const filteredCenters = sortedCenters.filter((c) => {
    // If user's GPS is far away from all centers, show 0 centers
    if (gpsFarAway) return false;

    // Check active location filter if specified and not default/all
    const loc = activeLocation.toLowerCase().trim();
    const isSpecificLocation =
      loc !== 'enable location' &&
      loc !== 'all centers' &&
      loc !== 'all centers (hyderabad metro)' &&
      !loc.startsWith('gps:');

    let matchesActiveLocation = true;
    if (isSpecificLocation) {
      const tokens = loc.split(/[\s,/-]+/).filter((t) => t.length > 2);
      matchesActiveLocation = tokens.some(
        (token) =>
          c.city.toLowerCase().includes(token) ||
          c.district.toLowerCase().includes(token) ||
          c.address.toLowerCase().includes(token) ||
          (c.landmark && c.landmark.toLowerCase().includes(token)) ||
          c.pincode.includes(token),
      );
    }

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'meeseva' && (c.type === 'meeseva' || c.type === 'csc')) ||
      (selectedCategory === 'xerox' && c.type === 'xerox_printing') ||
      (selectedCategory === 'pan_aadhaar' &&
        c.rateCard.some(
          (s) => s.title.toLowerCase().includes('pan') || s.title.toLowerCase().includes('aadhaar'),
        )) ||
      (selectedCategory === 'exams' &&
        c.rateCard.some((s) => s.title.toLowerCase().includes('ssc') || s.title.toLowerCase().includes('upsc')));

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.pincode.includes(q) ||
      c.rateCard.some((s) => s.title.toLowerCase().includes(q));

    return matchesActiveLocation && matchesCategory && matchesSearch;
  });

  const mapPins: MapCenterPin[] = filteredCenters.flatMap((c) =>
    c.lat == null || c.lng == null
      ? []
      : [{
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.typeLabel,
    address: c.address,
    city: c.city,
    lat: c.lat,
    lng: c.lng,
    distanceKm: c.distanceKm ?? undefined,
    phone: c.phone,
    rating: c.rating,
    isOpen: c.isOpenToday,
  }]);

  return (
    <div className="space-y-10 pb-24 pt-6">
      {/* Toast Notification */}
      {locationNotice && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-2xl border border-white bg-white/95 px-5 py-3 text-xs font-bold text-[#082046] shadow-2xl backdrop-blur-md animate-in fade-in">
          <Navigation className="h-4 w-4 text-[#0e7bf4] shrink-0" />
          <span>{locationNotice}</span>
        </div>
      )}

      {/* Hero Section — Claymorphic Card Container */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] border border-white bg-gradient-to-b from-white via-white to-[#F8FAFC] p-8 sm:p-12 lg:p-16 shadow-[8px_14px_32px_-12px_rgba(8,32,70,0.18),-8px_-8px_24px_rgba(255,255,255,0.95)]">
          {/* Subtle Ambient Azure Aura */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#0e7bf4]/10 via-[#38bdf8]/15 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-gradient-to-tr from-[#e0edfb]/80 to-transparent blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-3xl text-center space-y-6">
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-[#082046] leading-[1.1]">
              Zero waiting lines at your{' '}
              <span className="bg-gradient-to-r from-[#0e7bf4] via-[#082046] to-[#0e7bf4] bg-clip-text text-transparent">
                local MeeSeva &amp; digital center.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#526987] leading-relaxed">
              Reserve guaranteed 15-to-30 minute appointment slots at verified MeeSeva kiosks, CSC points, and Xerox desks. Arrive with pre-filled forms and get priority assistance.
            </p>

            {/* Search Box & GPS Locator Action */}
            <div className="max-w-2xl mx-auto pt-2 space-y-3">
              <div className="flex items-center rounded-2xl bg-[#edf2f8] p-2 shadow-clay-inset border border-white focus-within:ring-2 focus-within:ring-[#0e7bf4]/20 transition">
                <div className="pl-3 text-[#526987]">
                  <Search className="h-5 w-5 text-[#0e7bf4]" />
                </div>
                <input
                  type="text"
                  placeholder="Search by PIN code, center name, or service (e.g., MeeSeva, PAN Card, Xerox)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[#082046] placeholder:text-[#7896bc] outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#526987] hover:text-[#082046] px-2 font-bold"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="cut-corner-btn shrink-0 rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white shadow-clay-btn-azure hover:bg-[#0c6fdc] transition"
                >
                  Search
                </button>
              </div>

              {/* Enable Location Quick Action Button */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isLocating}
                  onClick={handleEnableLocation}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border border-[#d5deea] px-4 py-2 text-xs font-bold text-[#082046] shadow-sm hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition active:scale-95"
                >
                  <LocateFixed className={`h-4 w-4 text-[#0e7bf4] ${isLocating ? 'animate-spin' : ''}`} />
                  <span>
                    {isLocating
                      ? 'Detecting GPS Location...'
                      : userLocation
                        ? 'GPS Location Active (Recalibrate)'
                        : 'Enable Location to View Nearby Centers'}
                  </span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
              {[
                { id: 'all', label: 'All Verified Centers' },
                { id: 'meeseva', label: 'MeeSeva & CSC' },
                { id: 'xerox', label: 'Xerox & Printing' },
                { id: 'pan_aadhaar', label: 'PAN & Aadhaar' },
                { id: 'exams', label: 'Exam Application Desks' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`cut-corner-tab rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#0e7bf4] text-white shadow-clay-btn-azure'
                      : 'bg-white text-[#082046] border border-[#d5deea] shadow-sm hover:border-[#0e7bf4]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-step guides (gov_services on the main portal) for the most-asked TS/AP services */}
      <section className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8" aria-labelledby="guides-heading">
        <h2 id="guides-heading" className="text-sm font-black text-[#082046]">
          Step-by-step guides: do it yourself, or book a centre below
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {POPULAR_GUIDES.map(([slug, label]) => (
            <a
              key={slug}
              href={`${MAIN_WEB_URL}/services/${slug}`}
              className="rounded-full border border-[#d5deea] bg-white px-3 py-1.5 text-xs font-bold text-[#082046] hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition"
            >
              {label}
            </a>
          ))}
        </div>
      </section>

      {/* Directory Section with View Switcher (Grid vs OpenStreetMap) */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d5deea] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#082046] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#0e7bf4]" />
              Verified Digital Centers Near You
            </h2>
            <p className="text-xs text-[#526987] mt-0.5">
              Showing {filteredCenters.length} active service centers matching your preferences.
            </p>
          </div>

          {/* Mode View Switcher Capsule */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-2xl bg-[#edf2f8] p-1 shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#0e7bf4] shadow-sm'
                    : 'text-[#526987] hover:text-[#082046]'
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" /> Cards Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition ${
                  viewMode === 'map'
                    ? 'bg-white text-[#0e7bf4] shadow-sm'
                    : 'text-[#526987] hover:text-[#082046]'
                }`}
              >
                <Compass className="h-3.5 w-3.5" /> OpenStreetMap View
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display based on viewMode */}
        {filteredCenters.length === 0 ? (
          <div className="rounded-3xl border border-white bg-white p-12 text-center shadow-[8px_10px_24px_-12px_rgba(8,32,70,0.12)] space-y-4 my-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e0edfb] text-[#0e7bf4]">
              <MapPin className="h-8 w-8 text-[#0e7bf4]" />
            </div>
            <h3 className="text-2xl font-black text-[#082046]">No nearby service centers found</h3>
            <p className="text-sm text-[#526987] max-w-lg mx-auto leading-relaxed">
              We currently do not have verified MeeSeva kiosks, CSC points, or Xerox centers listed within{' '}
              <strong className="text-[#082046]">{activeLocation !== 'Enable Location' ? activeLocation : 'your detected location'}</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setActiveLocation('All Centers');
                  setShowAllAnyway(true);
                  setSearchQuery('');
                  setSelectedCategory('all');
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('applyfields_service_location', 'All Centers');
                    window.dispatchEvent(
                      new CustomEvent('applyfields:location-change', {
                        detail: { location: 'All Centers' },
                      }),
                    );
                  }
                }}
                className="rounded-2xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white shadow-clay-btn-azure hover:bg-[#0c6fdc] transition active:scale-95"
              >
                View All Centres
              </button>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="space-y-4">
            <div className="rounded-[32px] border border-white bg-white p-3 shadow-clay-card">
              <OpenStreetMap
                pins={mapPins}
                selectedPinId={focusedCenter?.id}
                userLat={userLocation?.lat}
                userLng={userLocation?.lng}
                height="560px"
              />
            </div>
          </div>
        ) : (
          /* Cards Grid with Claymorphic & Cut-Edge Styling */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((center) => {
              const partnerInfo: CartPartner = {
                id: center.id,
                name: center.name,
                slug: center.slug,
                type: center.type,
                address: center.address,
                city: center.city,
                district: center.district,
                phone: center.phone,
              };

              return (
                <div
                  key={center.id}
                  className="group relative flex flex-col justify-between cut-corner-card rounded-[28px] border border-white bg-white p-6 shadow-clay-card transition-all hover:shadow-clay-card-hover hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    {/* Top Row: Type Badge + Distance & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#0e7bf4] border border-[#38bdf8]/30">
                        {center.typeLabel}
                      </span>

                      <div className="flex items-center gap-2">
                        {center.isOpenToday ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Open Today
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                            Closed
                          </span>
                        )}

                        {center.distanceKm != null && (
                          <span className="rounded-full bg-[#edf2f8] px-2 py-0.5 text-[10px] font-mono font-bold text-[#082046]">
                            {center.distanceKm} km away
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Center Name & Address */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#082046] group-hover:text-[#0e7bf4] transition">
                        <Link href={`/partner/${center.slug}`}>{center.name}</Link>
                      </h3>
                      <p className="mt-1 text-xs text-[#526987] flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="h-3.5 w-3.5 text-[#0e7bf4] shrink-0 mt-0.5" />
                        <span>{[center.address, center.city].filter(Boolean).join(', ') || 'Address on the centre page'}</span>
                      </p>
                    </div>

                    {/* Operational Timings */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#526987]">
                      {center.openHours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#0e7bf4]" />
                          <span>Hours: <strong className="text-[#082046]">{center.openHours}</strong></span>
                        </div>
                      )}
                      {center.phone && (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{center.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Rate Card Quick Snippet (only priced services) */}
                    {center.rateCard.length > 0 && (
                    <div className="rounded-2xl bg-[#F0F4F8] p-3 space-y-2 border border-white shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#526987]">
                        <span>Popular Services Offered</span>
                        <span className="text-[#0e7bf4] text-[10px] font-mono">1-Click Add</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {center.rateCard.map((svc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              addItem(
                                {
                                  id: `${center.id}-s-${idx}`,
                                  title: svc.title,
                                  category: center.typeLabel,
                                  price: svc.price,
                                  turnaround: svc.turnaround,
                                },
                                partnerInfo,
                              )
                            }
                            className="flex flex-col text-left rounded-xl bg-white p-2 text-xs border border-[#d5deea] hover:border-[#0e7bf4] transition shadow-sm active:scale-95"
                          >
                            <span className="text-[#082046] truncate font-semibold text-[11px]">{svc.title}</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-mono font-black text-[#0e7bf4]">₹{svc.price}</span>
                              <span className="text-[10px] text-[#526987] font-mono">{svc.turnaround}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#d5deea] pt-4">
                    {center.lat != null && (
                    <button
                      type="button"
                      onClick={() => {
                        setFocusedCenter(center);
                        setViewMode('map');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526987] hover:text-[#0e7bf4] transition"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#0e7bf4]" />
                      <span>View on Map</span>
                    </button>
                    )}

                    <Link
                      href={`/partner/${center.slug}`}
                      className="cut-corner-btn inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white shadow-clay-btn-azure hover:bg-[#0c6fdc] transition active:scale-95"
                    >
                      <span>Explore Center &amp; Slots</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
