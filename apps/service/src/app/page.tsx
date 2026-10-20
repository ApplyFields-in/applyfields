'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  ShieldCheck,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  Building2,
  Printer,
  CreditCard,
  Fingerprint,
  FileCheck2,
  Phone,
  CheckCircle2,
  Navigation,
  LocateFixed,
  Layers,
  Map as MapIcon,
  ListFilter,
  Compass,
} from 'lucide-react';
import { useCart, CartPartner } from '@/lib/cart-context';
import { OpenStreetMap, type MapCenterPin } from '@/components/open-street-map';

export interface VerifiedCenter {
  id: string;
  name: string;
  slug: string;
  type: 'meeseva' | 'csc' | 'xerox_printing' | 'browsing_centre' | 'application_assistance';
  typeLabel: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  address: string;
  city: string;
  district: string;
  pincode: string;
  phone: string;
  isOpenToday: boolean;
  openHours: string;
  slotDurationMinutes: number;
  lat: number;
  lng: number;
  sampleServices: { title: string; price: number; turnaround: string }[];
}

const SAMPLE_CENTERS: VerifiedCenter[] = [
  {
    id: 'pt-1',
    name: 'Sri Balaji MeeSeva & Xerox Centre',
    slug: 'sri-balaji-meeseva-ameerpet',
    type: 'meeseva',
    typeLabel: 'MeeSeva & Xerox',
    rating: 4.9,
    reviewCount: 218,
    distanceKm: 0.8,
    address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042, Main Road',
    city: 'Ameerpet',
    district: 'Hyderabad',
    pincode: '500016',
    phone: '+91 98480 12345',
    isOpenToday: true,
    openHours: '09:00 AM – 08:00 PM',
    slotDurationMinutes: 30,
    lat: 17.437462,
    lng: 78.448288,
    sampleServices: [
      { title: 'B&W Xerox / Print', price: 3, turnaround: 'Instant' },
      { title: 'Aadhaar PVC Smart Card', price: 50, turnaround: '15m' },
      { title: 'Caste & Income Certificate', price: 100, turnaround: 'Same Day' },
      { title: 'New PAN Card NSDL', price: 150, turnaround: 'Same Day' },
    ],
  },
  {
    id: 'pt-2',
    name: 'Om Sai CSC Digital Seva Kiosk',
    slug: 'om-sai-csc-digital-seva',
    type: 'csc',
    typeLabel: 'CSC Digital Seva',
    rating: 4.8,
    reviewCount: 164,
    distanceKm: 1.4,
    address: 'Near Old Bus Stand, Beside SBI ATM',
    city: 'SR Nagar',
    district: 'Hyderabad',
    pincode: '500038',
    phone: '+91 97005 54321',
    isOpenToday: true,
    openHours: '09:30 AM – 07:30 PM',
    slotDurationMinutes: 30,
    lat: 17.44421,
    lng: 78.444102,
    sampleServices: [
      { title: 'Aadhaar Biometric & Demographic Update', price: 50, turnaround: 'Same Day' },
      { title: 'Instant e-PAN Card', price: 80, turnaround: '1-2h' },
      { title: 'Ayushman Bharat Golden Card', price: 30, turnaround: 'Instant' },
      { title: 'White Ration Card Linking', price: 50, turnaround: 'Same Day' },
    ],
  },
  {
    id: 'pt-3',
    name: 'Saraswati Xerox & Cyber Point',
    slug: 'saraswati-xerox-cyber-point',
    type: 'xerox_printing',
    typeLabel: 'Xerox & Application Hub',
    rating: 4.9,
    reviewCount: 312,
    distanceKm: 2.1,
    address: 'Opposite Government Polytechnic College Gate',
    city: 'Masab Tank',
    district: 'Hyderabad',
    pincode: '500028',
    phone: '+91 99890 99887',
    isOpenToday: true,
    openHours: '08:30 AM – 09:00 PM',
    slotDurationMinutes: 15,
    lat: 17.404245,
    lng: 78.45512,
    sampleServices: [
      { title: 'Bulk Syllabus & Project Print', price: 2, turnaround: 'Instant' },
      { title: 'Color Project Spiral Binding', price: 40, turnaround: '15m' },
      { title: 'SSC & UPSC Online Registration', price: 150, turnaround: 'Same Day' },
      { title: 'Passport Photo 8 Copies', price: 50, turnaround: '10m' },
    ],
  },
  {
    id: 'pt-4',
    name: 'Kakatiya MeeSeva & Citizen Facilitation Desk',
    slug: 'kakatiya-meeseva-secunderabad',
    type: 'meeseva',
    typeLabel: 'State MeeSeva Hub',
    rating: 4.7,
    reviewCount: 142,
    distanceKm: 3.5,
    address: 'Plot 44, Clock Tower Commercial Complex',
    city: 'Secunderabad',
    district: 'Hyderabad',
    pincode: '500003',
    phone: '+91 94401 22334',
    isOpenToday: false,
    openHours: '10:00 AM – 06:00 PM',
    slotDurationMinutes: 30,
    lat: 17.4399,
    lng: 78.4983,
    sampleServices: [
      { title: 'Encumbrance Certificate (EC)', price: 150, turnaround: 'Same Day' },
      { title: 'Residence / Nativity Certificate', price: 100, turnaround: 'Same Day' },
      { title: 'EWS General Reservation Certificate', price: 150, turnaround: 'Same Day' },
    ],
  },
  {
    id: 'pt-5',
    name: 'Sri Sai Digital MeeSeva & Printing Kiosk',
    slug: 'sri-sai-digital-gachibowli',
    type: 'meeseva',
    typeLabel: 'MeeSeva & IT Hub',
    rating: 4.9,
    reviewCount: 284,
    distanceKm: 4.2,
    address: 'Shop #4, Opp Municipal Complex, Main Road',
    city: 'Gachibowli',
    district: 'Hyderabad',
    pincode: '500032',
    phone: '+91 98480 22334',
    isOpenToday: true,
    openHours: '09:00 AM – 07:30 PM',
    slotDurationMinutes: 30,
    lat: 17.440081,
    lng: 78.348915,
    sampleServices: [
      { title: 'New PAN Card (Form 49A)', price: 107, turnaround: 'Same Day' },
      { title: 'Income & Caste Verification', price: 90, turnaround: 'Same Day' },
      { title: 'High-Speed Spiral Binding', price: 35, turnaround: 'Instant' },
    ],
  },
  {
    id: 'pt-6',
    name: 'KPHB Cyber Zone & Online Forms Desk',
    slug: 'kphb-cyber-zone-kukatpally',
    type: 'browsing_centre',
    typeLabel: 'Cyber Cafe & Online Exam Desk',
    rating: 4.8,
    reviewCount: 195,
    distanceKm: 5.0,
    address: 'Near KPHB Metro Station, Pillar 782',
    city: 'Kukatpally',
    district: 'Hyderabad',
    pincode: '500072',
    phone: '+91 98660 88990',
    isOpenToday: true,
    openHours: '08:00 AM – 10:00 PM',
    slotDurationMinutes: 20,
    lat: 17.4933,
    lng: 78.3995,
    sampleServices: [
      { title: 'Webcam Photo & Signature Scan', price: 40, turnaround: 'Instant' },
      { title: 'JEE / NEET / EAMCET Online Filing', price: 120, turnaround: 'Same Day' },
      { title: 'Legal Paper Deed Printout', price: 10, turnaround: 'Instant' },
    ],
  },
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

export default function ServicesHomePage() {
  const [centers, setCenters] = useState<VerifiedCenter[]>(SAMPLE_CENTERS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Location detection states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [focusedCenter, setFocusedCenter] = useState<VerifiedCenter | null>(null);

  const { addItem } = useCart();

  function handleEnableLocation() {
    setIsLocating(true);
    setLocationNotice(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      applyDefaultLocation(17.4374, 78.4482, 'Defaulting to Ameerpet, Hyderabad center point.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });

        // Calculate distances to all centers
        const updated = SAMPLE_CENTERS.map((c) => ({
          ...c,
          distanceKm: calculateHaversineDistance(lat, lng, c.lat, c.lng),
        })).sort((a, b) => a.distanceKm - b.distanceKm);

        setCenters(updated);
        setIsLocating(false);
        setLocationNotice('GPS Location Enabled! Centers sorted by closest proximity to you.');
        setTimeout(() => setLocationNotice(null), 5000);
      },
      (err) => {
        // Fallback realistic coordinates for demonstration
        applyDefaultLocation(17.4374, 78.4482, 'GPS permission denied. Centered on Hyderabad Core.');
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  function applyDefaultLocation(lat: number, lng: number, msg: string) {
    setUserLocation({ lat, lng });
    const updated = SAMPLE_CENTERS.map((c) => ({
      ...c,
      distanceKm: calculateHaversineDistance(lat, lng, c.lat, c.lng),
    })).sort((a, b) => a.distanceKm - b.distanceKm);

    setCenters(updated);
    setIsLocating(false);
    setLocationNotice(msg);
    setTimeout(() => setLocationNotice(null), 4000);
  }

  const filteredCenters = centers.filter((c) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'meeseva' && (c.type === 'meeseva' || c.type === 'csc')) ||
      (selectedCategory === 'xerox' && c.type === 'xerox_printing') ||
      (selectedCategory === 'pan_aadhaar' &&
        c.sampleServices.some(
          (s) => s.title.toLowerCase().includes('pan') || s.title.toLowerCase().includes('aadhaar'),
        )) ||
      (selectedCategory === 'exams' &&
        c.sampleServices.some((s) => s.title.toLowerCase().includes('ssc') || s.title.toLowerCase().includes('upsc')));

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.pincode.includes(q) ||
      c.sampleServices.some((s) => s.title.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const mapPins: MapCenterPin[] = filteredCenters.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.typeLabel,
    address: c.address,
    city: c.city,
    lat: c.lat,
    lng: c.lng,
    distanceKm: c.distanceKm,
    phone: c.phone,
    rating: c.rating,
    isOpen: c.isOpenToday,
  }));

  return (
    <div className="space-y-12 pb-20">
      {/* Location Detected Toast Notification */}
      {locationNotice && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-slate-900/95 px-5 py-3 text-xs font-semibold text-cyan-300 shadow-2xl backdrop-blur-md animate-in fade-in">
          <Navigation className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{locationNotice}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ApplyFields Citizen Services · OpenStreetMap Live GPS Discovery</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Zero waiting lines at your{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              local MeeSeva &amp; digital center.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Reserve dedicated 15-to-30 minute appointment slots at verified MeeSeva kiosks, CSC points, and Xerox desks. Arrive with pre-filled forms and get priority assistance.
          </p>

          {/* Search Box & GPS Locator Action */}
          <div className="max-w-2xl mx-auto pt-4 space-y-3">
            <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-md focus-within:border-cyan-400 transition">
              <div className="pl-3 text-slate-400">
                <Search className="h-5 w-5 text-cyan-400" />
              </div>
              <input
                type="text"
                placeholder="Search by PIN code, center name, or service (e.g., MeeSeva, PAN Card, Xerox)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-white px-2"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Enable Location Quick Action Button */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isLocating}
                onClick={handleEnableLocation}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition shadow-sm"
              >
                <LocateFixed className={`h-4 w-4 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
                <span>
                  {isLocating
                    ? 'Detecting GPS Location...'
                    : userLocation
                      ? '✓ GPS Location Enabled (Recalibrate)'
                      : 'Enable Location to View Nearby Centers'}
                </span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
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
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Section with View Switcher (Grid vs OpenStreetMap) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              Verified Digital Centers Near You
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredCenters.length} active service centers matching your preferences.
            </p>
          </div>

          {/* Mode View Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                  viewMode === 'grid'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" /> Cards Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition ${
                  viewMode === 'map'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" /> OpenStreetMap View
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: OpenStreetMap Interactive Map */}
        {viewMode === 'map' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-cyan-400" /> Showing real-time OpenStreetMap pins for {mapPins.length} service centers
              </span>
              <span className="text-emerald-400 font-semibold font-mono">
                Click any center chip below to center map &amp; get directions
              </span>
            </div>

            <OpenStreetMap
              pins={mapPins}
              userLat={userLocation?.lat || null}
              userLng={userLocation?.lng || null}
              height="550px"
              showDirections={true}
            />
          </div>
        ) : (
          /* View Mode: Cards Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700 hover:bg-slate-900/90"
                >
                  <div className="space-y-4">
                    {/* Top Row: Type Pill, Distance, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                          {center.typeLabel}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-400">
                          <Navigation className="h-3 w-3 text-cyan-400" /> {center.distanceKm} km away
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-300">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {center.rating}
                          <span className="text-slate-500 font-normal">({center.reviewCount})</span>
                        </span>

                        {center.isOpenToday ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            Open Now
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                            Closed Today
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Center Name & Address */}
                    <div>
                      <h3 className="text-lg font-bold text-white hover:text-cyan-300 transition">
                        <Link href={`/partner/${center.slug}`}>{center.name}</Link>
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{center.address}, {center.city}</span>
                      </p>
                    </div>

                    {/* Operational Timings */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Hours: <strong className="text-slate-200">{center.openHours}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-mono">{center.phone}</span>
                      </div>
                    </div>

                    {/* Rate Card Quick Snippet */}
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <span>Popular Services Offered</span>
                        <span className="text-cyan-400 text-[10px] font-mono">1-Click Add</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {center.sampleServices.map((svc, idx) => (
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
                            className="flex flex-col text-left rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-xs hover:border-cyan-400 hover:bg-slate-900 transition"
                          >
                            <span className="text-slate-300 truncate font-medium text-[11px]">{svc.title}</span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-mono font-bold text-cyan-300">₹{svc.price}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{svc.turnaround}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFocusedCenter(center);
                        setViewMode('map');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition"
                    >
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      <span>View on OpenStreetMap</span>
                    </button>

                    <Link
                      href={`/partner/${center.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition shadow-sm"
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
