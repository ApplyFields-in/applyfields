'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HandHelping,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  Phone,
  Store,
  ShieldCheck,
  Star,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface PartnerCenter {
  id: string;
  name: string;
  type: string;
  location: string;
  district: string;
  state: string;
  rating: number;
  reviewsCount: number;
  services: string[];
  hours: string;
  phone: string;
  verified: boolean;
}

const DEMO_CENTERS: PartnerCenter[] = [
  {
    id: 'center-1',
    name: 'Sri Sai MeeSeva & Online Citizen Services',
    type: 'MeeSeva / CSC Center',
    location: 'Shop 12, Main Road, Dilsukhnagar',
    district: 'Hyderabad',
    state: 'Telangana',
    rating: 4.8,
    reviewsCount: 142,
    services: ['Online Form Filling', 'Caste & Income Certificates', 'Aadhaar Print', 'Document Scanning'],
    hours: '9:00 AM – 8:30 PM (Mon–Sat)',
    phone: '+91 98480 12345',
    verified: true,
  },
  {
    id: 'center-2',
    name: 'Kaveri Citizen Facilitation & Cyber Hub',
    type: 'CSC Facilitation Center',
    location: 'Opp. Bus Station, 4th Block, Jayanagar',
    district: 'Bengaluru',
    state: 'Karnataka',
    rating: 4.9,
    reviewsCount: 215,
    services: ['UPSC/KPSC Form Filling', 'PAN Card Assistance', 'Passport Appointments', 'Biometric Verify'],
    hours: '9:30 AM – 9:00 PM (All days)',
    phone: '+91 94480 54321',
    verified: true,
  },
  {
    id: 'center-3',
    name: 'National Digital Seva Kendra',
    type: 'Common Service Center (CSC)',
    location: 'Near Metro Station Gate 2, Laxmi Nagar',
    district: 'East Delhi',
    state: 'Delhi',
    rating: 4.7,
    reviewsCount: 98,
    services: ['SSC / DSSSB Online Apply', 'Scholarship Portals (NSP)', 'Challan Payment', 'Print & Scan'],
    hours: '10:00 AM – 8:00 PM (Mon–Sat)',
    phone: '+91 98110 67890',
    verified: true,
  },
];

const SERVICE_FILTERS = [
  { id: 'all', label: 'All Centers' },
  { id: 'csc', label: 'MeeSeva & CSC' },
  { id: 'form_filling', label: 'Exam Form Filling' },
  { id: 'certificates', label: 'Certificates & Domicile' },
];

export default function AssistancePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  const [bookedCenter, setBookedCenter] = useState<string | null>(null);

  const filteredCenters = DEMO_CENTERS.filter((c) => {
    if (searchLocation.trim()) {
      const q = searchLocation.toLowerCase();
      return (
        c.location.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
            <HandHelping className="size-4" />
            <span>Citizen Network · In-Person Help</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
            Find Assistance
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#435775]">
            Locate verified nearby MeeSeva, Common Service Centers (CSC), cyber points, and authorized counselors for hassle-free online form submission.
          </p>
        </div>

        <div>
          <Link
            href="/partner"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#c4d2e3] bg-white px-4 py-2.5 text-xs font-semibold text-[#082046] shadow-sm transition hover:bg-[#F0F4F8]"
          >
            <Store className="size-4 text-[#0e7bf4]" /> Register as a Center
          </Link>
        </div>
      </div>

      {/* Search & Location Bar */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-4 py-2.5">
            <MapPin className="mr-3 size-4 text-[#536780]" />
            <input
              type="text"
              placeholder="Search by city, district, locality, or pincode..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full bg-transparent text-sm text-[#082046] outline-none placeholder:text-[#71839b]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {SERVICE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  activeFilter === f.id
                    ? 'bg-[#082046] text-white shadow-sm'
                    : 'bg-[#F0F4F8] text-[#435775] hover:bg-[#e2eaf4] hover:text-[#082046]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Centers List */}
      <div className="space-y-4">
        {bookedCenter && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center justify-between">
            <span>
              ✓ Assistance booking initiated with <strong>{bookedCenter}</strong>. You will receive an SMS confirmation with contact details.
            </span>
            <button
              type="button"
              onClick={() => setBookedCenter(null)}
              className="font-bold underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCenters.map((center) => (
            <div
              key={center.id}
              className="rounded-2xl border border-[#c4d2e3] bg-white p-5 shadow-sm transition hover:border-[#91a8c7] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-bold text-[#0e7bf4]">
                    {center.type}
                  </span>
                  {center.verified && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheck className="size-3.5" /> Verified
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#082046] leading-snug">
                  {center.name}
                </h3>

                <p className="flex items-start gap-1.5 text-xs text-[#536780]">
                  <MapPin className="size-3.5 shrink-0 text-[#0e7bf4] mt-0.5" />
                  <span>
                    {center.location}, {center.district}, {center.state}
                  </span>
                </p>

                <p className="flex items-center gap-1.5 text-xs text-[#536780]">
                  <Clock className="size-3.5 shrink-0 text-slate-400" />
                  <span>{center.hours}</span>
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {center.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-[#F0F4F8] px-2 py-0.5 text-[10px] font-semibold text-[#243b5b]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-bold text-[#082046]">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{center.rating}</span>
                  <span className="font-normal text-[#536780]">({center.reviewsCount})</span>
                </div>

                <button
                  type="button"
                  onClick={() => setBookedCenter(center.name)}
                  className="rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c6fdc]"
                >
                  Request Help
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparent Service Guarantee */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-5 text-xs text-[#435775] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#082046]">
          <ShieldCheck className="size-4 text-[#0e7bf4]" />
          <span>Fair Service &amp; Fee Standard</span>
        </div>
        <p>
          Verified centers on the ApplyFields Assistance Network agree to clear, transparent assistance charges (typically ₹50–₹100 for form filling and scanning). Official government recruitment fees are paid directly to the government agency portal.
        </p>
      </div>
    </div>
  );
}
