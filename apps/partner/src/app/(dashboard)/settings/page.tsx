'use client';

import { useEffect, useState } from 'react';
import { usePartnerAuth } from '@/lib/auth-context';
import { updatePartner, uploadPartnerDoc } from '@/lib/api';
import type { PartnerUpdateInput } from '@applyfields/types';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  LocateFixed,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UploadCloud,
  User,
  Compass,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Navigation,
  Users,
  UserPlus,
  Trash2,
  Shield,
  X,
} from 'lucide-react';

interface SubOperatorItem {
  id: string;
  name: string;
  phone: string;
  counterName: string;
  role: 'staff';
  status: 'active' | 'suspended';
  addedOn: string;
}

export default function PartnerSettingsPage() {
  const { partner, user, refreshSession, setPartnerOptimistic } = usePartnerAuth();

  const [businessName, setBusinessName] = useState(partner?.business_name || '');
  const [ownerName, setOwnerName] = useState(partner?.owner_name || '');
  const [phone, setPhone] = useState(partner?.phone || '');
  const [whatsapp, setWhatsapp] = useState(partner?.whatsapp || '');
  const [address, setAddress] = useState(partner?.address || '');
  const [city, setCity] = useState(partner?.city || '');
  const [district, setDistrict] = useState(partner?.district || '');
  const [stateCode, setStateCode] = useState(partner?.state_code || 'TG');
  const [pincode, setPincode] = useState(partner?.pincode || '');
  const [latitude, setLatitude] = useState<number | null>(partner?.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(partner?.longitude || null);
  const [mapZoom, setMapZoom] = useState(15);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<SubOperatorItem[]>([
    {
      id: 'staff-1',
      name: 'Ramesh Varma',
      phone: '+91 98480 11223',
      counterName: 'Counter 1 (Recruitment & Job Desk)',
      role: 'staff',
      status: 'active',
      addedOn: '15 Oct 2026',
    },
    {
      id: 'staff-2',
      name: 'Priya Mudhiraj',
      phone: '+91 98480 33445',
      counterName: 'Counter 2 (Scanning & MeeSeva Desk)',
      role: 'staff',
      status: 'active',
      addedOn: '22 Oct 2026',
    },
  ]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffCounter, setNewStaffCounter] = useState('Counter 1 (Intake Desk)');

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPhone.trim()) return;

    const newOperator: SubOperatorItem = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      counterName: newStaffCounter,
      role: 'staff',
      status: 'active',
      addedOn: 'Today',
    };

    setStaffList((prev) => [...prev, newOperator]);
    setNewStaffName('');
    setNewStaffPhone('');
    setShowAddStaffModal(false);
    setSuccess('New counter operator account created.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveStaff = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    setSuccess('Operator account removed.');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Sync state if partner changes
  useEffect(() => {
    if (partner) {
      setBusinessName(partner.business_name);
      setOwnerName(partner.owner_name || '');
      setPhone(partner.phone || '');
      setWhatsapp(partner.whatsapp || '');
      setAddress(partner.address || '');
      setCity(partner.city || '');
      setDistrict(partner.district || '');
      setStateCode(partner.state_code || 'TG');
      setPincode(partner.pincode || '');
      setLatitude(partner.latitude);
      setLongitude(partner.longitude);
    }
  }, [partner]);

  function handleDetectGps() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setSuccess('GPS location updated to current position.');
        setTimeout(() => setSuccess(null), 3000);
      },
      () => {
        setError('Could not retrieve current GPS position.');
      },
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const input: PartnerUpdateInput = {
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      address: address.trim(),
      city: city.trim(),
      district: district.trim(),
      state_code: stateCode.toUpperCase(),
      pincode: pincode.trim(),
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    };

    const res = await updatePartner(input);
    setSaving(false);

    if (res.error || !res.data) {
      setError(res.error || 'Failed to update center settings');
      return;
    }

    setPartnerOptimistic(() => res.data);
    setSuccess('Center profile updated successfully!');
    setTimeout(() => setSuccess(null), 3000);
    await refreshSession();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Center Profile & KYC Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your establishment information, physical address, GPS pinpoint, and compliance documents.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business & Owner Info */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-400" />
            General Center Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300">
                Center / Shop Full Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Owner / Manager Full Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Center Classification
              </label>
              <input
                type="text"
                disabled
                value={(partner?.type || 'meeseva').toUpperCase()}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-bold text-emerald-400 uppercase opacity-75"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                WhatsApp Business Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Address & GPS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Physical Address & Geolocation
            </h2>
            <button
              type="button"
              onClick={handleDetectGps}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <LocateFixed className="h-3.5 w-3.5" /> Re-calibrate GPS
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300">
                Shop Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                City / Mandal / Town
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                State Code (e.g. TG, AP, KA)
              </label>
              <input
                type="text"
                maxLength={2}
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Postal PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                GPS Latitude
              </label>
              <input
                type="number"
                step="any"
                value={latitude ?? ''}
                onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                GPS Longitude
              </label>
              <input
                type="number"
                step="any"
                value={longitude ?? ''}
                onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* OpenStreetMap Live Pinpoint Preview */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-emerald-400" />
                  OpenStreetMap Live Pinpoint Preview
                </p>
                <p className="text-[11px] text-slate-400">
                  Citizens on ApplyFields discover your center and get turn-by-turn routing using this OpenStreetMap pin.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.max(12, z - 1))}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${latitude ?? 17.437462}&mlon=${longitude ?? 78.448288}#map=${mapZoom}/${latitude ?? 17.437462}/${longitude ?? 78.448288}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                >
                  <span>Open in OSM</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Map Frame */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden h-[240px]">
              <iframe
                title="Center Location on OpenStreetMap"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(
                  (longitude ?? 78.448288) -
                  0.012 / Math.pow(1.5, mapZoom - 14)
                ).toFixed(6)}%2C${(
                  (latitude ?? 17.437462) -
                  (0.012 / Math.pow(1.5, mapZoom - 14)) * 0.7
                ).toFixed(6)}%2C${(
                  (longitude ?? 78.448288) +
                  0.012 / Math.pow(1.5, mapZoom - 14)
                ).toFixed(6)}%2C${(
                  (latitude ?? 17.437462) +
                  (0.012 / Math.pow(1.5, mapZoom - 14)) * 0.7
                ).toFixed(6)}&layer=mapnik&marker=${latitude ?? 17.437462}%2C${longitude ?? 78.448288}`}
                className="w-full h-full border-0 filter contrast-[0.95] brightness-[0.92]"
                loading="lazy"
              />

              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/95 px-2.5 py-1 text-[11px] font-mono text-emerald-400 shadow backdrop-blur-md">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {(latitude ?? 17.437462).toFixed(5)} N, {(longitude ?? 78.448288).toFixed(5)} E
                  </span>
                </div>
                <div className="pointer-events-auto rounded-lg border border-slate-800 bg-slate-900/95 px-2.5 py-1 text-[10px] text-slate-300 shadow backdrop-blur-md">
                  Live OpenStreetMap Tiles
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Documents Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Verified KYC & License Records
            </h2>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              {partner?.verification_status === 'verified' ? 'Verified' : 'Under Review'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-slate-200 font-medium">Shop & Establishment / CSC Certificate</span>
              </div>
              <span className="font-semibold text-emerald-400">Active</span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-200 font-medium">Storefront Exterior Name Board Photo</span>
              </div>
              <span className="font-semibold text-emerald-400">Inspected</span>
            </div>
          </div>
        </div>

        {/* Staff & Counter Operator Permissions Section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                Staff Sub-Accounts & Counter Access
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Grant counter staff logins for walk-in POS, document scanning, and order filing without sharing wallet or settlement access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
              <span>Add Counter Staff</span>
            </button>
          </div>

          {/* Active Staff List */}
          <div className="space-y-3">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{staff.name}</span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                      Counter Operator
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                      {staff.status}
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono">
                    {staff.phone} - Assigned to: <strong className="text-slate-200">{staff.counterName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">Added: {staff.addedOn}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStaff(staff.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove Operator"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <Shield className="size-4 text-emerald-400" />
              <span>Role Permissions Breakdown</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-1 text-slate-300">
                <p className="font-semibold text-emerald-400">Center Owner (Current Account):</p>
                <p className="text-slate-400">Full control over Cash Drawer, Bank IFSC/Account settings, Escrow payout withdrawals, and rate cards.</p>
              </div>
              <div className="space-y-1 text-slate-300">
                <p className="font-semibold text-amber-400">Counter Staff / Sub-Operators:</p>
                <p className="text-slate-400">Restricted to walk-in customer POS intake, camera/scanner tools, order filing, and customer WhatsApp dispatch.</p>
              </div>
            </div>
          </div>

          {/* Add Staff Modal */}
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserPlus className="size-4 text-emerald-400" />
                    <span>Create Counter Operator Login</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300">Staff Full Name</label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Suresh Reddy"
                      className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300">Mobile Number (Login Identifier)</label>
                    <input
                      type="text"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      placeholder="+91 98480 99887"
                      className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white font-mono placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300">Assigned Desk / Counter</label>
                    <select
                      value={newStaffCounter}
                      onChange={(e) => setNewStaffCounter(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Counter 1 (Intake & POS)">Counter 1 (Intake & POS)</option>
                      <option value="Counter 2 (Govt Filing Desk)">Counter 2 (Govt Filing Desk)</option>
                      <option value="Counter 3 (Scanning & Photo Desk)">Counter 3 (Scanning & Photo Desk)</option>
                    </select>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] text-amber-300 space-y-1">
                    <p className="font-bold">Security Constraint:</p>
                    <p>This operator will not have access to your bank settlement ledger or wallet withdrawals.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddStaff}
                    disabled={!newStaffName.trim() || !newStaffPhone.trim()}
                    className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
