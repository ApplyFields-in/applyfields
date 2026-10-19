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
} from 'lucide-react';

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

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
