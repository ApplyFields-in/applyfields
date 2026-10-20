'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Phone,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
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
  landmark?: string;
  sampleServices: {
    title: string;
    price: number;
    turnaround: string;
  }[];
}

const SAMPLE_CENTERS: VerifiedCenter[] = [
  {
    id: 'pt-1',
    name: 'Sri Balaji MeeSeva & Xerox Centre',
    slug: 'sri-balaji-meeseva-ameerpet',
    type: 'meeseva',
    typeLabel: 'MeeSeva Hub',
    rating: 4.9,
    reviewCount: 218,
    distanceKm: 0.8,
    address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042',
    city: 'Ameerpet',
    district: 'Hyderabad',
    pincode: '500016',
    phone: '+91 98480 12345',
    isOpenToday: true,
    openHours: '09:00 AM – 08:00 PM',
    slotDurationMinutes: 30,
    lat: 17.437462,
    lng: 78.448288,
    landmark: 'Beside Sarathi Studios',
    sampleServices: [
      { title: 'Aadhaar PVC Smart Card (UIDAI Official)', price: 50, turnaround: '15m' },
      { title: 'New PAN Card Application (Form 49A)', price: 150, turnaround: 'Same Day' },
      { title: 'Integrated Caste & Income Certificate', price: 100, turnaround: 'Same Day' },
      { title: 'High-Speed B&W Xerox Print (75 GSM)', price: 3, turnaround: 'Instant' },
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
    landmark: 'Beside SBI ATM',
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
    landmark: 'Opp Polytechnic Gate',
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
    landmark: 'Clock Tower Complex',
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
    landmark: 'Opp Municipal Complex',
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
    landmark: 'Near Metro Pillar 782',
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

        const updated = SAMPLE_CENTERS.map((c) => ({
          ...c,
          distanceKm: calculateHaversineDistance(lat, lng, c.lat, c.lng),
        })).sort((a, b) => a.distanceKm - b.distanceKm);

        setCenters(updated);
        setIsLocating(false);
        setLocationNotice('GPS Location Enabled! Centers sorted by closest proximity to you.');
        setTimeout(() => setLocationNotice(null), 5000);
      },
      () => {
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
    <div className="space-y-10 pb-24 pt-6">
      {/* Toast Notification */}
      {locationNotice && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-2xl border border-white bg-white/95 px-5 py-3 text-xs font-bold text-[#082046] shadow-2xl backdrop-blur-md animate-in fade-in">
          <Navigation className="h-4 w-4 text-[#0e7bf4] shrink-0" />
          <span>{locationNotice}</span>
        </div>
      )}

      {/* Hero Section — Claymorphic Card Container */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[36px] border border-white bg-gradient-to-b from-white via-white to-[#F8FAFC] p-8 sm:p-12 lg:p-16 shadow-[8px_14px_32px_-12px_rgba(8,32,70,0.18),-8px_-8px_24px_rgba(255,255,255,0.95)]">
          {/* Subtle Ambient Azure Aura */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-gradient-to-br from-[#0e7bf4]/10 via-[#38bdf8]/15 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-gradient-to-tr from-[#e0edfb]/80 to-transparent blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-3xl text-center space-y-6">
            {/* Cut-Corner Pill Badge */}
            <div className="inline-flex items-center gap-2 cut-corner-badge rounded-xl border border-[#38bdf8]/40 bg-[#e0edfb] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#0e7bf4]">
              <Sparkles className="h-3.5 w-3.5 text-[#0e7bf4]" />
              <span>ApplyFields Services · OpenStreetMap GPS Discovery</span>
            </div>

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
                        ? '✓ GPS Location Enabled (Recalibrate)'
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

      {/* Directory Section with View Switcher (Grid vs OpenStreetMap) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
        {viewMode === 'map' ? (
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

                        <span className="rounded-full bg-[#edf2f8] px-2 py-0.5 text-[10px] font-mono font-bold text-[#082046]">
                          📍 {center.distanceKm} km
                        </span>
                      </div>
                    </div>

                    {/* Center Name & Address */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#082046] group-hover:text-[#0e7bf4] transition">
                        <Link href={`/partner/${center.slug}`}>{center.name}</Link>
                      </h3>
                      <p className="mt-1 text-xs text-[#526987] flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="h-3.5 w-3.5 text-[#0e7bf4] shrink-0 mt-0.5" />
                        <span>{center.address}, {center.city}</span>
                      </p>
                    </div>

                    {/* Operational Timings */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#526987]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#0e7bf4]" />
                        <span>Hours: <strong className="text-[#082046]">{center.openHours}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{center.phone}</span>
                      </div>
                    </div>

                    {/* Rate Card Quick Snippet */}
                    <div className="rounded-2xl bg-[#F0F4F8] p-3 space-y-2 border border-white shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#526987]">
                        <span>Popular Services Offered</span>
                        <span className="text-[#0e7bf4] text-[10px] font-mono">1-Click Add</span>
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
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#d5deea] pt-4">
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
