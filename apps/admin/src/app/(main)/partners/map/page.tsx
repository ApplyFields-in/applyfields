'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Store,
  ShieldCheck,
  AlertTriangle,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  ArrowLeft,
  Navigation,
  Layers,
  Star,
  Check,
  ExternalLink,
  Users,
} from 'lucide-react';

interface PartnerPin {
  id: string;
  name: string;
  type: 'meeseva' | 'csc' | 'xerox_printing' | 'passport_studio' | 'consultant';
  ownerName: string;
  phone: string;
  state: string;
  district: string;
  mandal: string;
  coordinates: { x: number; y: number }; // Percentage for interactive SVG layout
  status: 'verified' | 'pending' | 'suspended';
  todayBookings: number;
  totalDelivered: number;
  rating: number;
}

const PARTNER_PINS: PartnerPin[] = [
  {
    id: 'p-1',
    name: 'Sri Sai MeeSeva & Digital Kiosk',
    type: 'meeseva',
    ownerName: 'P. Venkat Rao',
    phone: '+91 98480 22334',
    state: 'Telangana',
    district: 'Hyderabad',
    mandal: 'Serilingampally (Gachibowli)',
    coordinates: { x: 48, y: 56 },
    status: 'verified',
    todayBookings: 14,
    totalDelivered: 420,
    rating: 4.9,
  },
  {
    id: 'p-2',
    name: 'Balaji Xerox, Lamination & Cyber Point',
    type: 'xerox_printing',
    ownerName: 'K. Balaji',
    phone: '+91 99891 12345',
    state: 'Telangana',
    district: 'Hyderabad',
    mandal: 'Ameerpet Coaching Hub',
    coordinates: { x: 50, y: 52 },
    status: 'verified',
    todayBookings: 28,
    totalDelivered: 1250,
    rating: 4.8,
  },
  {
    id: 'p-3',
    name: 'Digital India CSC Center #104',
    type: 'csc',
    ownerName: 'S. Ramakrishna',
    phone: '+91 94401 56789',
    state: 'Telangana',
    district: 'Hyderabad',
    mandal: 'Dilsukhnagar Metro',
    coordinates: { x: 53, y: 58 },
    status: 'verified',
    todayBookings: 9,
    totalDelivered: 310,
    rating: 4.7,
  },
  {
    id: 'p-4',
    name: 'Sri Venkateswara MeeSeva Center',
    type: 'meeseva',
    ownerName: 'V. Srinivasa Murthy',
    phone: '+91 98660 77889',
    state: 'Telangana',
    district: 'Rangareddy',
    mandal: 'Kukatpally Housing Board',
    coordinates: { x: 46, y: 50 },
    status: 'verified',
    todayBookings: 18,
    totalDelivered: 680,
    rating: 4.9,
  },
  {
    id: 'p-5',
    name: 'Royal Digital Photo Studio & Passport Desk',
    type: 'passport_studio',
    ownerName: 'M. Azharuddin',
    phone: '+91 97000 44556',
    state: 'Telangana',
    district: 'Hyderabad',
    mandal: 'Charminar Old City',
    coordinates: { x: 51, y: 62 },
    status: 'pending',
    todayBookings: 3,
    totalDelivered: 85,
    rating: 4.6,
  },
  {
    id: 'p-6',
    name: 'Kakatiya Citizen Services & Typing Desk',
    type: 'csc',
    ownerName: 'D. Srinivas',
    phone: '+91 99499 88112',
    state: 'Telangana',
    district: 'Warangal',
    mandal: 'Hanamkonda Subedari',
    coordinates: { x: 62, y: 44 },
    status: 'verified',
    todayBookings: 11,
    totalDelivered: 290,
    rating: 4.8,
  },
  {
    id: 'p-7',
    name: 'Andhra Pragathi Gramina MeeSeva Kiosk',
    type: 'meeseva',
    ownerName: 'Ch. Venkanna',
    phone: '+91 98492 33445',
    state: 'Andhra Pradesh',
    district: 'Krishna',
    mandal: 'Vijayawada Benz Circle',
    coordinates: { x: 70, y: 65 },
    status: 'verified',
    todayBookings: 22,
    totalDelivered: 890,
    rating: 4.9,
  },
  {
    id: 'p-8',
    name: 'Sagar Coastal Cyber Cafe & Online Applications',
    type: 'xerox_printing',
    ownerName: 'G. Mohan',
    phone: '+91 98488 66778',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    mandal: 'MVP Colony Sector 3',
    coordinates: { x: 82, y: 38 },
    status: 'verified',
    todayBookings: 15,
    totalDelivered: 510,
    rating: 4.7,
  },
  {
    id: 'p-9',
    name: 'Manair Citizen Assistance Center',
    type: 'csc',
    ownerName: 'B. Ravinder',
    phone: '+91 94900 11223',
    state: 'Telangana',
    district: 'Karimnagar',
    mandal: 'Collectorate Complex',
    coordinates: { x: 56, y: 36 },
    status: 'pending',
    todayBookings: 0,
    totalDelivered: 40,
    rating: 4.5,
  },
];

const BLACKSPOTS = [
  { name: 'Nizamabad Rural (Bheemgal Mandal)', searchVolume: '3,420 monthly searches', status: '0 Active Centers' },
  { name: 'Mahabubnagar (Jadcherla Industrial Belt)', searchVolume: '2,890 monthly searches', status: '0 Active Centers' },
  { name: 'Nalgonda (Miryalaguda Town)', searchVolume: '2,450 monthly searches', status: '0 Active Centers' },
  { name: 'Khammam (Sathupally Coal Belt)', searchVolume: '1,980 monthly searches', status: '0 Active Centers' },
];

export default function AdminPartnerMapPage() {
  const [selectedPin, setSelectedPin] = useState<PartnerPin | null>(PARTNER_PINS[0]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightBlackspots, setHighlightBlackspots] = useState(false);

  const filteredPins = PARTNER_PINS.filter((pin) => {
    const matchesType = filterType === 'all' || pin.type === filterType;
    const matchesStatus = filterStatus === 'all' || pin.status === filterStatus;
    const matchesSearch =
      pin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.mandal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Partners List
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-cyan-400/10 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
              Admin Geographic Supervision
            </span>
            <span className="text-xs text-slate-400">Coverage Density &amp; Blackspot Matrix</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Partner Network Geographic Map
          </h1>
          <p className="text-xs text-slate-400">
            Real-time visual monitoring of verified partner kiosks, active booking volumes, and unserved territory blackspots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHighlightBlackspots(!highlightBlackspots)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              highlightBlackspots
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-rose-400'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Blackspot Detector {highlightBlackspots ? '(Active)' : ''}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Partner Kiosks</span>
          <div className="text-2xl font-black text-white">48 Centers</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Across 18 Districts</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Verified &amp; Live</span>
          <div className="text-2xl font-black text-emerald-400">38 Verified</div>
          <span className="text-[10px] text-slate-400">Zero pending complaints</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Pending Staff Review</span>
          <div className="text-2xl font-black text-amber-400">8 Centers</div>
          <span className="text-[10px] text-amber-300/80">KYC documents awaiting signoff</span>
        </div>

        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-rose-300">Unserved Blackspots</span>
          <div className="text-2xl font-black text-rose-400">14 Mandals</div>
          <span className="text-[10px] text-rose-300/80">High search demand, 0 kiosks</span>
        </div>
      </div>

      {/* Interactive Map & Side Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left: Interactive Regional Map Canvas (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-950 p-6 flex flex-col relative overflow-hidden shadow-2xl">
          {/* Map Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4 z-10">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Regional Density View (TG &amp; AP Grid)</span>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 text-xs">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-400 outline-none"
              >
                <option value="all">All Service Types</option>
                <option value="meeseva">MeeSeva Centers</option>
                <option value="csc">CSC Kiosks</option>
                <option value="xerox_printing">Xerox &amp; Print Desks</option>
                <option value="passport_studio">Passport Studios</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-400 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>
          </div>

          {/* SVG Map Canvas with Topological Grid */}
          <div className="flex-1 w-full relative rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 flex items-center justify-center p-4 min-h-[420px]">
            {/* Background Map Graphic Coordinates */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Regional Outline Simulation */}
              <path
                d="M 120 100 Q 250 80 400 120 T 600 200 Q 550 350 450 420 T 250 380 Q 150 250 120 100 Z"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Simulated Geographic Labels */}
            <div className="absolute top-8 left-10 text-[11px] font-mono font-bold text-slate-600">
              NORTH ZONE (Karimnagar / Nizamabad)
            </div>
            <div className="absolute top-1/2 left-10 text-[11px] font-mono font-bold text-slate-600">
              CAPITAL REGION (GHMC / Hyderabad)
            </div>
            <div className="absolute bottom-8 right-12 text-[11px] font-mono font-bold text-slate-600">
              COASTAL ZONE (Vijayawada / Vizag)
            </div>

            {/* Blackspot Warning Zones */}
            {highlightBlackspots && (
              <>
                <div className="absolute top-24 left-24 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/50 backdrop-blur-sm text-center animate-pulse">
                  <div className="text-[10px] font-bold text-rose-300">BLACKSPOT DETECTED</div>
                  <div className="text-[9px] text-slate-400">Nizamabad Rural · 0 Kiosks</div>
                </div>
                <div className="absolute bottom-20 left-36 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/50 backdrop-blur-sm text-center animate-pulse">
                  <div className="text-[10px] font-bold text-rose-300">BLACKSPOT DETECTED</div>
                  <div className="text-[9px] text-slate-400">Jadcherla Industrial · 0 Kiosks</div>
                </div>
              </>
            )}

            {/* Interactive Pins */}
            {filteredPins.map((pin) => {
              const isSelected = selectedPin?.id === pin.id;
              const isVerified = pin.status === 'verified';

              return (
                <button
                  key={pin.id}
                  type="button"
                  style={{ left: `${pin.coordinates.x}%`, top: `${pin.coordinates.y}%` }}
                  onClick={() => setSelectedPin(pin)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all group z-20 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg border backdrop-blur-md transition-all ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 border-white ring-4 ring-cyan-400/30'
                        : isVerified
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                          : 'bg-amber-950/90 text-amber-300 border-amber-500/60'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isVerified ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="truncate max-w-[100px]">{pin.name.split(' ')[0]}</span>
                    <span className="opacity-75 font-mono">({pin.todayBookings})</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Footer Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Verified Partner Kiosk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pending KYC Verification
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> High Demand Blackspot
              </span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              Showing {filteredPins.length} Center Pins
            </span>
          </div>
        </div>

        {/* Right: Selected Partner Inspection Desk (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-6">
          {selectedPin ? (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-300 font-mono">
                    {selectedPin.type.replace('_', ' ')}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      selectedPin.status === 'verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {selectedPin.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-2 leading-snug">
                  {selectedPin.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{selectedPin.mandal}, {selectedPin.district}</span>
                </p>
              </div>

              {/* Operator details */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Registered Owner:</span>
                  <span className="font-semibold text-white">{selectedPin.ownerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Phone Number:</span>
                  <span className="font-mono text-cyan-300">{selectedPin.phone}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Today&apos;s Bookings:</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedPin.todayBookings} citizens</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>All-Time Delivered:</span>
                  <span className="font-bold text-white font-mono">{selectedPin.totalDelivered} completed</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Citizen Rating:</span>
                  <span className="font-bold text-amber-300 flex items-center">
                    <Star className="inline size-3.5 fill-amber-300 text-amber-300 mr-1" />
                    {selectedPin.rating} / 5.0
                  </span>
                </div>
              </div>

              {/* Supervision Actions */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Staff Administrative Actions
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => alert(`Opening KYC verification documents for ${selectedPin.name}...`)}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-200 font-semibold hover:border-cyan-400 text-center transition"
                  >
                    Inspect KYC Docs
                  </button>
                  <button
                    type="button"
                    onClick={() => alert(`Launching bookings audit ledger for ${selectedPin.name}...`)}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-200 font-semibold hover:border-cyan-400 text-center transition"
                  >
                    Audit Bookings
                  </button>
                </div>

                {selectedPin.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => alert(`Approved ${selectedPin.name}! Verified badge granted.`)}
                    className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    <Check className="inline size-3.5 mr-1" />
                    Approve &amp; Issue Verified Badge
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert(`Opening partner status modification desk for ${selectedPin.name}...`)}
                    className="w-full rounded-xl bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition"
                  >
                    Manage Center Listing
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs my-auto">
              Click any pin on the map to inspect center operations.
            </div>
          )}

          {/* Blackspot Quick Panel */}
          <div className="rounded-2xl border border-rose-900/30 bg-rose-950/20 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Priority Onboarding Targets
            </span>
            <div className="space-y-1.5 text-[11px]">
              {BLACKSPOTS.slice(0, 2).map((b, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-300">
                  <span className="truncate max-w-[160px] font-medium">{b.name}</span>
                  <span className="text-[10px] font-mono text-rose-400">{b.searchVolume}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
