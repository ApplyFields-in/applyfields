'use client';

import React, { useEffect, useState } from 'react';
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
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import type { PartnerDirectoryResponse, PartnerSummary } from '@applyfields/types';
import { apiGet } from '@/lib/api';

const SERVICE_FILTERS = [
  { id: 'all', label: 'All Centers', type: undefined },
  { id: 'meeseva_csc', label: 'MeeSeva & CSC', type: 'csc' },
  { id: 'cyber_xerox', label: 'Cyber Points & Xerox', type: 'browsing_centre' },
  { id: 'assistance', label: 'Online Form Assistance', type: 'application_assistance' },
  { id: 'institution', label: 'Colleges & Institutions', type: 'college' },
];

export default function AssistancePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<PartnerSummary[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<PartnerSummary | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch real partners from database
  useEffect(() => {
    let isCancelled = false;
    const fetchPartners = async () => {
      setLoading(true);
      const params = new URLSearchParams();

      const currentFilter = SERVICE_FILTERS.find((f) => f.id === activeFilter);
      if (currentFilter?.type) {
        params.append('type', currentFilter.type);
      }
      if (searchLocation.trim()) {
        params.append('q', searchLocation.trim());
      }

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await apiGet<PartnerDirectoryResponse>(`/partners/directory${queryStr}`);

      if (!isCancelled) {
        setCenters(response?.items ?? []);
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPartners, 250);
    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [activeFilter, searchLocation]);

  const handleBookCenter = (center: PartnerSummary) => {
    setSelectedCenter(center);
    setSelectedServiceId(center.services?.[0]?.id ?? '');
    setBookingError(null);
  };

  const confirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCenter) return;

    setIsSubmittingBooking(true);
    setBookingError(null);

    const { apiPost } = await import('@/lib/api');
    const res = await apiPost<any, any>('/bookings', {
      partner_id: selectedCenter.id,
      partner_service_id: selectedServiceId || undefined,
      contact_phone: userPhone.trim().replace(/\s+/g, '') || undefined,
      user_note: bookingNotes.trim() || undefined,
    });

    setIsSubmittingBooking(false);

    if (res.error) {
      if (res.status === 401) {
        setBookingError('Please sign in or create an account to submit and track assistance requests.');
      } else {
        setBookingError(res.error);
      }
    } else {
      setBookingSuccess(
        `Assistance request #${res.data.id.slice(0, 8)} confirmed with ${selectedCenter.business_name}. You can track status in your Applications dashboard.`,
      );
      setSelectedCenter(null);
      setUserPhone('');
      setBookingNotes('');
    }
  };

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
            Locate verified nearby MeeSeva, Common Service Centers (CSC), cyber points, and authorized counselors for hassle-free online form submission and certificate services.
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
                className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
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

      {/* Success Banner */}
      {bookingSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>
              Assistance request initiated for <strong>{bookingSuccess}</strong>. The center coordinator has been notified.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBookingSuccess(null)}
            className="font-bold underline ml-2 hover:text-emerald-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Centers Directory */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-[#c4d2e3] bg-white p-5 space-y-4"
              >
                <div className="h-5 w-24 rounded bg-slate-200" />
                <div className="h-6 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
                <div className="h-10 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : centers.length === 0 ? (
          /* Real Zero-State: No Dummy Data */
          <div className="rounded-3xl border border-dashed border-[#c4d2e3] bg-white p-12 text-center space-y-4">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#F0F4F8] text-[#0e7bf4]">
              <Store className="size-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h2 className="text-base font-bold text-[#082046]">
                No verified partner centers found
              </h2>
              <p className="text-xs text-[#536780]">
                {searchLocation.trim()
                  ? `No verified centers found matching "${searchLocation}". Try searching a different district, state, or PIN code.`
                  : 'There are currently no verified partner centers listed under this category.'}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {searchLocation && (
                <button
                  type="button"
                  onClick={() => setSearchLocation('')}
                  className="rounded-xl border border-[#c4d2e3] bg-white px-4 py-2 text-xs font-semibold text-[#082046] hover:bg-[#F0F4F8]"
                >
                  Clear search
                </button>
              )}
              <Link
                href="/partner"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white hover:bg-[#061835]"
              >
                <Store className="size-3.5" /> Register your center
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {centers.map((center) => (
              <div
                key={center.id}
                className="rounded-2xl border border-[#c4d2e3] bg-white p-5 shadow-sm transition hover:border-[#91a8c7] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0e7bf4]">
                      {center.type.replace('_', ' ')}
                    </span>
                    {center.verification_status === 'verified' && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="size-3.5" /> Verified
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#082046] leading-snug">
                    {center.business_name}
                  </h3>

                  <p className="flex items-start gap-1.5 text-xs text-[#536780]">
                    <MapPin className="size-3.5 shrink-0 text-[#0e7bf4] mt-0.5" />
                    <span>
                      {center.address ? `${center.address}, ` : ''}
                      {center.city || center.district}, {center.state_code || ''}
                      {center.pincode ? ` - ${center.pincode}` : ''}
                    </span>
                  </p>

                  {center.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-[#536780]">
                      <Phone className="size-3.5 shrink-0 text-slate-400" />
                      <span>{center.phone}</span>
                    </p>
                  )}

                  {center.services && center.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {center.services.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-lg bg-[#F0F4F8] px-2 py-0.5 text-[10px] font-semibold text-[#243b5b]"
                        >
                          {s.name}
                          {s.charge_text ? ` (${s.charge_text})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#082046]">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span>{center.rating_avg.toFixed(1)}</span>
                    <span className="font-normal text-[#536780]">({center.rating_count})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {center.phone && (
                      <a
                        href={`tel:${center.phone}`}
                        className="rounded-xl border border-[#c4d2e3] px-3 py-1.5 text-xs font-semibold text-[#082046] hover:bg-[#F0F4F8]"
                      >
                        Call
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBookCenter(center)}
                      className="rounded-xl bg-[#0e7bf4] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c6fdc]"
                    >
                      Request Help
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Help Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#c4d2e3] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#082046]">Request In-Person Assistance</h3>
                <p className="text-xs text-[#536780]">{selectedCenter.business_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCenter(null)}
                className="text-xs font-semibold text-[#536780] hover:text-[#082046]"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={confirmBooking} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#082046]">Your Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 text-xs text-[#082046] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046]">Service Needed</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 text-xs text-[#082046] outline-none"
                >
                  {selectedCenter.services && selectedCenter.services.length > 0 ? (
                    selectedCenter.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.charge_text ? `(${s.charge_text})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="">General Online Application &amp; Form Assistance</option>
                      <option value="pan_aadhaar">PAN / Aadhaar / Certificate Assistance</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046]">Preferred Date / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow morning around 11:00 AM"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 text-xs text-[#082046] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCenter(null)}
                  className="rounded-xl border border-[#c4d2e3] px-4 py-2 text-xs font-semibold text-[#435775]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="rounded-xl bg-[#082046] px-5 py-2 text-xs font-bold text-white hover:bg-[#061835] disabled:opacity-60"
                >
                  {isSubmittingBooking ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transparent Service Guarantee */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-5 text-xs text-[#435775] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#082046]">
          <ShieldCheck className="size-4 text-[#0e7bf4]" />
          <span>Fair Service &amp; Fee Standard</span>
        </div>
        <p>
          Verified centers on the ApplyFields Assistance Network agree to clear, transparent assistance charges (typically ₹50–₹100 for form filling and scanning). Official government recruitment fees are paid directly to the official government authority portal.
        </p>
      </div>
    </div>
  );
}
