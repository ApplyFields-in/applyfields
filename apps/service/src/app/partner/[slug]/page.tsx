'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin,
  ShieldCheck,
  Star,
  Clock,
  Phone,
  MessageSquare,
  ArrowRight,
  Plus,
  Check,
  ShoppingBag,
  Building2,
  Navigation,
  Sparkles,
  Compass,
  ExternalLink,
  LocateFixed,
  Train,
  CheckCircle2,
} from 'lucide-react';
import { useCart, CartPartner } from '@/lib/cart-context';
import { OpenStreetMap, MapCenterPin } from '@/components/open-street-map';

interface ServiceDetail {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  price: number;
  turnaround: string;
  requiredDocs: string[];
}

interface CenterProfile extends CartPartner {
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  openHours: string;
  landmark: string;
  metroStation: string;
  pincode: string;
}

const REGISTERED_CENTERS: Record<string, CenterProfile> = {
  'sri-balaji-meeseva-ameerpet': {
    id: 'pt-1',
    name: 'Sri Balaji MeeSeva & Xerox Centre',
    slug: 'sri-balaji-meeseva-ameerpet',
    type: 'meeseva',
    address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042, Main Road',
    city: 'Ameerpet',
    district: 'Hyderabad',
    phone: '+91 98480 12345',
    lat: 17.437462,
    lng: 78.448288,
    rating: 4.9,
    reviewCount: 218,
    openHours: '09:00 AM – 08:00 PM',
    landmark: 'Opp Metro Pillar 1042, Beside Sarathi Studios',
    metroStation: 'Ameerpet Interchange (250m)',
    pincode: '500016',
  },
  'om-sai-csc-digital-seva': {
    id: 'pt-2',
    name: 'Om Sai CSC Digital Seva Kiosk',
    slug: 'om-sai-csc-digital-seva',
    type: 'csc',
    address: 'Near Old Bus Stand, Beside SBI ATM',
    city: 'SR Nagar',
    district: 'Hyderabad',
    phone: '+91 97005 54321',
    lat: 17.44421,
    lng: 78.444102,
    rating: 4.8,
    reviewCount: 164,
    openHours: '09:30 AM – 07:30 PM',
    landmark: 'Beside State Bank of India ATM',
    metroStation: 'SR Nagar Metro (400m)',
    pincode: '500038',
  },
  'saraswati-xerox-cyber-point': {
    id: 'pt-3',
    name: 'Saraswati Xerox & Cyber Point',
    slug: 'saraswati-xerox-cyber-point',
    type: 'xerox_printing',
    address: 'Opposite Government Polytechnic College Gate',
    city: 'Masab Tank',
    district: 'Hyderabad',
    phone: '+91 99890 99887',
    lat: 17.404245,
    lng: 78.45512,
    rating: 4.9,
    reviewCount: 312,
    openHours: '08:30 AM – 09:00 PM',
    landmark: 'Opp Government Polytechnic College Gate',
    metroStation: 'Lakdi-ka-pul Metro (1.2 km)',
    pincode: '500028',
  },
  'kakatiya-meeseva-secunderabad': {
    id: 'pt-4',
    name: 'Kakatiya MeeSeva & Citizen Facilitation Desk',
    slug: 'kakatiya-meeseva-secunderabad',
    type: 'meeseva',
    address: 'Plot 44, Clock Tower Commercial Complex',
    city: 'Secunderabad',
    district: 'Hyderabad',
    phone: '+91 94401 22334',
    lat: 17.4399,
    lng: 78.4983,
    rating: 4.7,
    reviewCount: 142,
    openHours: '10:00 AM – 06:00 PM',
    landmark: 'Clock Tower Commercial Complex',
    metroStation: 'Parade Ground Metro (500m)',
    pincode: '500003',
  },
  'sri-sai-digital-gachibowli': {
    id: 'pt-5',
    name: 'Sri Sai Digital MeeSeva & Printing Kiosk',
    slug: 'sri-sai-digital-gachibowli',
    type: 'meeseva',
    address: 'Shop #4, Opp Municipal Complex, Main Road',
    city: 'Gachibowli',
    district: 'Hyderabad',
    phone: '+91 98480 22334',
    lat: 17.440081,
    lng: 78.348915,
    rating: 4.9,
    reviewCount: 284,
    openHours: '09:00 AM – 07:30 PM',
    landmark: 'Opp Municipal Complex, Main Road',
    metroStation: 'Raidurg Metro (2.4 km)',
    pincode: '500032',
  },
  'kphb-cyber-zone-kukatpally': {
    id: 'pt-6',
    name: 'KPHB Cyber Zone & Online Forms Desk',
    slug: 'kphb-cyber-zone-kukatpally',
    type: 'browsing_centre',
    address: 'Near KPHB Metro Station, Pillar 782',
    city: 'Kukatpally',
    district: 'Hyderabad',
    phone: '+91 98660 88990',
    lat: 17.4933,
    lng: 78.3995,
    rating: 4.8,
    reviewCount: 195,
    openHours: '08:00 AM – 10:00 PM',
    landmark: 'Near Metro Pillar 782',
    metroStation: 'KPHB Colony Metro (150m)',
    pincode: '500072',
  },
};

const PARTNER_SERVICES: ServiceDetail[] = [
  {
    id: 'svc-1',
    title: 'Black & White Laser Print / Xerox',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'High-speed 75 GSM double/single-sided print for application forms and study materials.',
    price: 3,
    turnaround: 'Instant (2-5m)',
    requiredDocs: ['Digital File (PDF/Word) or Hard Copy'],
  },
  {
    id: 'svc-2',
    title: 'Full Color Printout (Admit Cards / Certs)',
    category: 'xerox',
    categoryLabel: 'Xerox & Print Desk',
    description: 'Clear photographic color printing on glossy or bright-white sheets.',
    price: 15,
    turnaround: 'Instant (2-5m)',
    requiredDocs: ['Digital PDF or Image File'],
  },
  {
    id: 'svc-3',
    title: 'High-Quality UIDAI Aadhaar PVC Smart Card',
    category: 'aadhaar',
    categoryLabel: 'Aadhaar Services',
    description: 'Pocket plastic smart card with embossed holographic security seal and verified QR code.',
    price: 50,
    turnaround: '15 Mins',
    requiredDocs: ['Aadhaar Number & Registered Mobile', 'eAadhaar PDF'],
  },
  {
    id: 'svc-4',
    title: 'Aadhaar Demographic Update Assistance',
    category: 'aadhaar',
    categoryLabel: 'Aadhaar Services',
    description: 'Document verification and correction filing for name, address, or date of birth.',
    price: 50,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Valid Address Proof (Electricity bill / Voter ID)'],
  },
  {
    id: 'svc-5',
    title: 'Instant e-PAN Card Application',
    category: 'pan',
    categoryLabel: 'PAN Card Desk',
    description: 'Paperless digital PAN generation directly linked with Aadhaar OTP.',
    price: 80,
    turnaround: '1-2 Hours',
    requiredDocs: ['Aadhaar Card with active mobile linking'],
  },
  {
    id: 'svc-6',
    title: 'New Physical NSDL / UTI PAN Card Application',
    category: 'pan',
    categoryLabel: 'PAN Card Desk',
    description: 'Complete registration with digital photograph, signature stamping, and home delivery.',
    price: 150,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Aadhaar Card', '2 Passport Photos', 'Signature Scan'],
  },
  {
    id: 'svc-7',
    title: 'Integrated Caste / Community Certificate Filing',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / Revenue',
    description: 'Official revenue department OBC-NCL, SC, ST or BC certificate filing with acknowledgment.',
    price: 100,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Applicant Aadhaar', 'School TC / Marksheet', 'Parent Ration Card'],
  },
  {
    id: 'svc-8',
    title: 'Integrated Income Certificate Application',
    category: 'meeseva',
    categoryLabel: 'MeeSeva / Revenue',
    description: 'Essential certificate for state fee reimbursement, scholarship eligibility, and housing schemes.',
    price: 100,
    turnaround: 'Same Day Filing',
    requiredDocs: ['Food Security / White Ration Card', 'Salary Proof or Self Declaration'],
  },
  {
    id: 'svc-9',
    title: 'SSC CGL / CHSL / MTS Online Registration Assistance',
    category: 'exams',
    categoryLabel: 'Exam & Job Form Filing',
    description: 'OTR profile setup, AI-compliant live photo capture, exam city sorting, and fee payment check.',
    price: 150,
    turnaround: 'Same Day Filing',
    requiredDocs: ['10th / 12th / Degree Certificates', 'Photo & Signature Scan'],
  },
];

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

export default function PartnerStorefrontPage() {
  const params = useParams();
  const rawSlug = (params?.slug as string) || 'sri-balaji-meeseva-ameerpet';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addItem, items, setIsCartOpen, totalQuantity, subtotal } = useCart();

  // Location detection states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const partner: CenterProfile =
    REGISTERED_CENTERS[rawSlug] || {
      id: 'pt-1',
      name: 'Sri Balaji MeeSeva & Xerox Centre',
      slug: rawSlug,
      type: 'meeseva',
      address: 'Shop #12, Ground Floor, Opp Metro Pillar 1042, Main Road',
      city: 'Ameerpet',
      district: 'Hyderabad',
      phone: '+91 98480 12345',
      lat: 17.437462,
      lng: 78.448288,
      rating: 4.9,
      reviewCount: 218,
      openHours: '09:00 AM – 08:00 PM (30m Slots)',
      landmark: 'Opp Metro Pillar 1042, Beside Sarathi Studios',
      metroStation: 'Ameerpet Interchange (250m)',
      pincode: '500016',
    };

  function handleEnableLocation() {
    setIsLocating(true);
    setGeoNotice(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const fallbackLat = 17.4485;
      const fallbackLng = 78.455;
      setUserLocation({ lat: fallbackLat, lng: fallbackLng });
      const dist = calculateHaversineDistance(fallbackLat, fallbackLng, partner.lat, partner.lng);
      setDistanceKm(dist);
      setIsLocating(false);
      setGeoNotice(`Geolocation not supported. Showing estimated ~${dist} km from Central Hyderabad.`);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserLocation({ lat: uLat, lng: uLng });
        const dist = calculateHaversineDistance(uLat, uLng, partner.lat, partner.lng);
        setDistanceKm(dist);
        setIsLocating(false);
        setGeoNotice(`Location detected! You are approx ${dist} km away from this MeeSeva center.`);
      },
      () => {
        const fallbackLat = 17.4485;
        const fallbackLng = 78.455;
        setUserLocation({ lat: fallbackLat, lng: fallbackLng });
        const dist = calculateHaversineDistance(fallbackLat, fallbackLng, partner.lat, partner.lng);
        setDistanceKm(dist);
        setIsLocating(false);
        setGeoNotice(`Permission denied. Centered on Hyderabad Core (~${dist} km away).`);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  const filteredServices = PARTNER_SERVICES.filter(
    (s) => selectedCategory === 'all' || s.category === selectedCategory,
  );

  const centerPin: MapCenterPin = {
    id: partner.id,
    name: partner.name,
    slug: partner.slug,
    type: partner.type,
    address: partner.address,
    city: partner.city,
    lat: partner.lat,
    lng: partner.lng,
    distanceKm: distanceKm ?? undefined,
    phone: partner.phone,
    rating: partner.rating,
    isOpen: true,
  };

  const osmDirectionsUrl = userLocation
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLocation.lat}%2C${userLocation.lng}%3B${partner.lat}%2C${partner.lng}`
    : `https://www.openstreetmap.org/?mlat=${partner.lat}&mlon=${partner.lng}#map=16/${partner.lat}/${partner.lng}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526987] hover:text-[#082046] transition"
        >
          ← Back to All Centers
        </Link>
        <span className="text-[11px] text-[#0e7bf4] font-mono font-bold flex items-center gap-1">
          <Compass className="h-3.5 w-3.5" />
          <span>OpenStreetMap Verified GPS Pin</span>
        </span>
      </div>

      {/* Partner Storefront Header Card — Claymorphic & Cut-Corner */}
      <div className="cut-corner-card rounded-[32px] border border-white bg-gradient-to-r from-white via-white to-[#F0F7FF] p-6 sm:p-8 shadow-clay-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0e7bf4] border border-[#38bdf8]/30">
                MeeSeva &amp; CSC Digital Hub
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> ApplyFields Verified Center
              </span>
              {distanceKm !== null ? (
                <span className="rounded-full bg-[#edf2f8] px-3 py-1 text-xs font-mono font-bold text-[#082046]">
                  📍 {distanceKm} km from you
                </span>
              ) : (
                <span className="rounded-full bg-[#edf2f8] px-3 py-1 text-xs font-mono font-bold text-[#526987]">
                  📍 {partner.city}, {partner.district}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-[#082046] tracking-tight">
              {partner.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#526987] flex items-center gap-1.5 leading-relaxed max-w-2xl font-medium">
              <MapPin className="h-4 w-4 text-[#0e7bf4] shrink-0" />
              <span>
                {partner.address}, {partner.city}, {partner.district} - {partner.pincode}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <span className="flex items-center gap-1 font-bold text-amber-600">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {partner.rating}{' '}
                <span className="text-[#526987] font-normal">
                  ({partner.reviewCount} verified citizen reviews)
                </span>
              </span>

              <span className="flex items-center gap-1.5 text-emerald-700 font-bold border-l border-[#d5deea] pl-4">
                <Clock className="h-3.5 w-3.5" />
                Open Today: {partner.openHours}
              </span>
            </div>
          </div>

          {/* Contact & Booking Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <a
              href={`tel:${partner.phone || '+91 98480 12345'}`}
              className="cut-corner-btn inline-flex items-center justify-center gap-2 rounded-xl border border-[#d5deea] bg-white px-5 py-2.5 text-xs font-bold text-[#082046] shadow-sm hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition"
            >
              <Phone className="h-4 w-4 text-[#0e7bf4]" /> Call Operator Desk
            </a>
            <a
              href={`https://wa.me/${(partner.phone || '919848012345').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="cut-corner-btn inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp Operator
            </a>
          </div>
        </div>
      </div>

      {/* OpenStreetMap Location & Proximity Directions Card */}
      <div className="cut-corner-card rounded-[32px] border border-white bg-white p-6 sm:p-8 space-y-6 shadow-clay-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#d5deea] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#0e7bf4] animate-ping" />
              <h2 className="text-lg sm:text-xl font-black text-[#082046] flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#0e7bf4]" />
                OpenStreetMap Storefront Location &amp; Directions
              </h2>
            </div>
            <p className="text-xs text-[#526987]">
              Interactive OpenStreetMap pinpoint for this service center person. Enable your GPS location to view walking / driving distance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEnableLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0e7bf4]/40 bg-[#e0edfb] px-4 py-2 text-xs font-bold text-[#0e7bf4] hover:bg-[#d0e5fb] transition shadow-sm active:scale-95"
            >
              <LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Enable My Location'}</span>
            </button>

            <a
              href={osmDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="cut-corner-btn inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] transition shadow-clay-btn-azure active:scale-95"
            >
              <Navigation className="h-4 w-4" />
              <span>Get OpenStreetMap Route</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {geoNotice && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#38bdf8]/40 bg-[#e0edfb] p-3 text-xs font-bold text-[#0e7bf4]">
            <Navigation className="h-4 w-4 text-[#0e7bf4] shrink-0" />
            <span>{geoNotice}</span>
          </div>
        )}

        {/* Embedded OpenStreetMap Preview */}
        <div className="space-y-4">
          <div className="rounded-[28px] overflow-hidden border border-[#d5deea] shadow-inner">
            <OpenStreetMap
              centerLat={partner.lat}
              centerLng={partner.lng}
              zoom={16}
              userLat={userLocation?.lat}
              userLng={userLocation?.lng}
              pins={[centerPin]}
              selectedPinId={partner.id}
              height="380px"
            />
          </div>

          {/* Location Badges & Landmark Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#edf2f8] p-3.5 space-y-1 shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
              <span className="text-[10px] font-bold text-[#526987] uppercase tracking-wider">
                GPS Coordinates
              </span>
              <p className="text-xs font-mono font-black text-[#0e7bf4]">
                {partner.lat.toFixed(6)}° N, {partner.lng.toFixed(6)}° E
              </p>
            </div>

            <div className="rounded-2xl bg-[#edf2f8] p-3.5 space-y-1 shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
              <span className="text-[10px] font-bold text-[#526987] uppercase tracking-wider">
                Nearest Metro / Transit
              </span>
              <p className="text-xs font-bold text-[#082046] flex items-center gap-1">
                <Train className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{partner.metroStation}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-[#edf2f8] p-3.5 space-y-1 shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
              <span className="text-[10px] font-bold text-[#526987] uppercase tracking-wider">
                Prominent Landmark
              </span>
              <p className="text-xs font-bold text-[#082046] truncate">
                {partner.landmark}
              </p>
            </div>

            <div className="rounded-2xl bg-[#edf2f8] p-3.5 space-y-1 shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
              <span className="text-[10px] font-bold text-[#526987] uppercase tracking-wider">
                Your Distance
              </span>
              <p className="text-xs font-mono font-black text-emerald-700">
                {distanceKm !== null ? `~${distanceKm} km away` : 'Click "Enable Location"'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Catalog & Rate Card */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d5deea] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#082046] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#0e7bf4]" />
              Available Services &amp; Official Rate Card
            </h2>
            <p className="text-xs text-[#526987] mt-0.5">
              Add services to your visit cart. Arrive at your reserved slot with documents ready.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Services' },
              { id: 'xerox', label: 'Xerox & Print' },
              { id: 'aadhaar', label: 'Aadhaar' },
              { id: 'pan', label: 'PAN Card' },
              { id: 'meeseva', label: 'MeeSeva' },
              { id: 'exams', label: 'Exam Filing' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`cut-corner-tab rounded-xl px-3.5 py-1.5 font-bold transition ${
                  selectedCategory === tab.id
                    ? 'bg-[#0e7bf4] text-white shadow-clay-btn-azure'
                    : 'bg-white text-[#082046] border border-[#d5deea] shadow-sm hover:border-[#0e7bf4]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid with Cut-Corner Styling */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const inCart = items.some((it) => it.serviceId === service.id);

            return (
              <div
                key={service.id}
                className="cut-corner-card flex flex-col justify-between rounded-[24px] border border-white bg-white p-5 shadow-clay-card transition hover:shadow-clay-card-hover"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="cut-corner-badge rounded-md bg-[#e0edfb] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#0e7bf4] border border-[#38bdf8]/30">
                      {service.categoryLabel}
                    </span>
                    <span className="font-mono text-base font-black text-[#0e7bf4]">
                      ₹{service.price}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[#082046] leading-snug">{service.title}</h3>
                  <p className="text-xs text-[#526987] leading-relaxed">{service.description}</p>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#526987] font-semibold">
                    <Clock className="h-3 w-3 text-[#0e7bf4]" />
                    <span>
                      Turnaround: <strong className="text-[#082046]">{service.turnaround}</strong>
                    </span>
                  </div>

                  {service.requiredDocs.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold text-[#7896bc] uppercase tracking-wider">
                        Documents Needed:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.requiredDocs.map((doc, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-[#edf2f8] px-2 py-0.5 text-[10px] font-semibold text-[#082046]"
                          >
                            📎 {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#d5deea]">
                  {inCart ? (
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <Check className="h-4 w-4" /> Added (Open Cart)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          {
                            id: service.id,
                            title: service.title,
                            category: service.categoryLabel,
                            price: service.price,
                            turnaround: service.turnaround,
                          },
                          partner,
                        )
                      }
                      className="cut-corner-btn inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0e7bf4] py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] transition shadow-clay-btn-azure active:scale-95"
                    >
                      <Plus className="h-4 w-4" /> Add to Visit Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Cart Bar if items exist */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
          <div className="flex items-center justify-between rounded-3xl border border-white bg-white/95 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0e7bf4] text-white font-bold shadow-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#082046]">
                  {totalQuantity} {totalQuantity === 1 ? 'service' : 'services'} added
                </p>
                <p className="text-[11px] text-[#0e7bf4] font-mono font-black">
                  Total: ₹{subtotal}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="cut-corner-btn inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c6fdc] transition shadow-clay-btn-azure active:scale-95"
            >
              <span>View Cart &amp; Book Slot</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
