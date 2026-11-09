'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getPartnerBySlug } from '@/lib/api';
import { trackServiceEvent } from '@/lib/analytics/tracker';
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
  const rawSlug = (params?.slug as string) || '';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addItem, items, setIsCartOpen, totalQuantity, subtotal } = useCart();

  // Location detection states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Filled from GET /partners/:slug; empty fields stay empty and the page hides them.
  const emptyPartner: CenterProfile = {
    id: '',
    name: '',
    slug: rawSlug,
    type: 'meeseva',
    address: '',
    city: '',
    district: '',
    phone: '',
    lat: 0,
    lng: 0,
    rating: 0,
    reviewCount: 0,
    openHours: '',
    landmark: '',
    metroStation: '',
    pincode: '',
  };

  const [partner, setPartner] = useState<CenterProfile>(emptyPartner);
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [partnerServices, setPartnerServices] = useState<ServiceDetail[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadPartnerProfile() {
      try {
        const res = await getPartnerBySlug(rawSlug);
        if (mounted && res.data) {
          const p = res.data;
          setPartner({
            id: p.id,
            name: p.business_name,
            slug: p.slug,
            type: p.type,
            address: p.address ?? '',
            city: p.city ?? '',
            district: p.district ?? '',
            phone: p.phone ?? '',
            lat: p.latitude ?? 0,
            lng: p.longitude ?? 0,
            rating: p.rating_avg ?? 0,
            reviewCount: p.rating_count ?? 0,
            openHours: '',
            landmark: '',
            metroStation: '',
            pincode: p.pincode ?? '',
          });
          setLoadState('ok');

          // Only priced services can be added (the user must see the amount before paying).
          setPartnerServices(
            (p.services ?? [])
              .filter((s) => s.charge_paise != null)
              .map((s) => ({
                id: s.id,
                title: s.name,
                category: 'meeseva',
                categoryLabel: 'MeeSeva / Revenue',
                description: s.description ?? '',
                price: (s.charge_paise as number) / 100,
                turnaround: s.estimated_time_text ?? '',
                requiredDocs: [],
              })),
          );
        } else if (mounted) {
          setLoadState('missing');
        }
        trackServiceEvent('service_browse', {
          entity_type: 'partner',
          entity_id: rawSlug,
          metadata: { partner_slug: rawSlug },
        });
      } catch (err) {
        console.warn('Could not fetch partner details:', err);
        if (mounted) setLoadState('missing');
      }
    }

    loadPartnerProfile();
    return () => {
      mounted = false;
    };
  }, [rawSlug]);

  function handleEnableLocation() {
    setIsLocating(true);
    setGeoNotice(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLocating(false);
      setGeoNotice('Location is not available in this browser.');
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
        setIsLocating(false);
        setGeoNotice('Location permission denied.');
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  const filteredServices = partnerServices.filter(
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

  const hasPin = partner.lat !== 0 || partner.lng !== 0;

  if (loadState !== 'ok') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center text-[#526987] space-y-3">
        {loadState === 'loading' ? (
          <p className="text-sm">Loading centre…</p>
        ) : (
          <>
            <p className="text-base font-bold text-[#082046]">We couldn&apos;t find this centre</p>
            <Link href="/" className="inline-block rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white">
              See all centres
            </Link>
          </>
        )}
      </div>
    );
  }

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
                  {distanceKm} km from you
                </span>
              ) : (
                <span className="rounded-full bg-[#edf2f8] px-3 py-1 text-xs font-mono font-bold text-[#526987]">
                  {partner.city}, {partner.district}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-[#082046] tracking-tight">
              {partner.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#526987] flex items-center gap-1.5 leading-relaxed max-w-2xl font-medium">
              <MapPin className="h-4 w-4 text-[#0e7bf4] shrink-0" />
              <span>
                {[partner.address, partner.city, partner.district].filter(Boolean).join(', ')}
                {partner.pincode && ` - ${partner.pincode}`}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              {partner.reviewCount > 0 && (
              <span className="flex items-center gap-1 font-bold text-amber-600">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {partner.rating}{' '}
                <span className="text-[#526987] font-normal">
                  ({partner.reviewCount} verified citizen reviews)
                </span>
              </span>
              )}

              {partner.openHours && (
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold border-l border-[#d5deea] pl-4">
                  <Clock className="h-3.5 w-3.5" />
                  Open Today: {partner.openHours}
                </span>
              )}
            </div>
          </div>

          {/* Contact & Booking Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            {partner.phone && (
            <>
            <a
              href={`tel:${partner.phone}`}
              className="cut-corner-btn inline-flex items-center justify-center gap-2 rounded-xl border border-[#d5deea] bg-white px-5 py-2.5 text-xs font-bold text-[#082046] shadow-sm hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition"
            >
              <Phone className="h-4 w-4 text-[#0e7bf4]" /> Call Operator Desk
            </a>
            <a
              href={`https://wa.me/${partner.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="cut-corner-btn inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp Operator
            </a>
            </>
            )}
          </div>
        </div>
      </div>

      {/* OpenStreetMap Location & Proximity Directions Card (only with a real pin) */}
      {hasPin && (
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

            {partner.metroStation && (
            <div className="rounded-2xl bg-[#edf2f8] p-3.5 space-y-1 shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
              <span className="text-[10px] font-bold text-[#526987] uppercase tracking-wider">
                Nearest Metro / Transit
              </span>
              <p className="text-xs font-bold text-[#082046] flex items-center gap-1">
                <Train className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{partner.metroStation}</span>
              </p>
            </div>
            )}

            {partner.landmark && (
            <div className="rounded-2xl bg-[#edf2f8] p-3.5 space-y-1 shadow-[inset_2px_2px_5px_#d5deea,inset_-2px_-2px_5px_#ffffff]">
              <span className="text-[10px] font-bold text-[#526987] uppercase tracking-wider">
                Prominent Landmark
              </span>
              <p className="text-xs font-bold text-[#082046] truncate">
                {partner.landmark}
              </p>
            </div>
            )}

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
      )}

      {/* Service Catalog & Rate Card */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d5deea] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#082046] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#0e7bf4]" />
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
                            {doc}
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
