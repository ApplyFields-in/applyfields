'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  Send,
  ArrowRight,
  HandHelping,
  FileCheck2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { PartnerDetail, PartnerRegistrationInput, PartnerType } from '@applyfields/types';
import { apiPost } from '@/lib/api';
import { PARTNER_PORTAL_URL } from '@/lib/urls';

const PARTNER_CATEGORIES: { id: PartnerType; label: string; desc: string }[] = [
  { id: 'csc', label: 'CSC (Common Service Center)', desc: 'Official digital seva center with government certificate services' },
  { id: 'meeseva', label: 'MeeSeva Facilitation Center', desc: 'Authorized state citizen services kiosk' },
  { id: 'browsing_centre', label: 'Cyber Cafe / Online Point', desc: 'Internet browsing and computer application submission hub' },
  { id: 'xerox_printing', label: 'Xerox & Scanning Center', desc: 'Document photo, printing and scan submission desk' },
  { id: 'application_assistance', label: 'Application Assistance Agency', desc: 'Professional exam and competitive test form filing desk' },
  { id: 'college', label: 'College / Degree Institution', desc: 'Higher education institution desk for student inquiries' },
  { id: 'consultant', label: 'Career Counselor / Consultant', desc: 'Individual guidance and admission advisor' },
];

const STATES = [
  { code: 'TG', name: 'Telangana' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'DL', name: 'Delhi NCR' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
];

export default function PartnerPage() {
  const [partnerType, setPartnerType] = useState<PartnerType>('csc');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [stateCode, setStateCode] = useState('TG');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredPartner, setRegisteredPartner] = useState<PartnerDetail | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: PartnerRegistrationInput = {
      business_name: businessName.trim(),
      type: partnerType,
      owner_name: ownerName.trim(),
      phone: phone.trim().replace(/\s+/g, ''),
      whatsapp: whatsapp.trim() ? whatsapp.trim().replace(/\s+/g, '') : undefined,
      email: email.trim() || undefined,
      address: address.trim(),
      state_code: stateCode,
      district: district.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      description: description.trim() || undefined,
    };

    const res = await apiPost<PartnerDetail, PartnerRegistrationInput>(
      '/partners/register',
      payload,
    );

    setIsSubmitting(false);

    if (res.error || !res.data) {
      setErrorMsg(res.error || 'Failed to submit partner application. Please verify details.');
    } else {
      setRegisteredPartner(res.data);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <Store className="size-4" />
          <span>Partner Network · Centers &amp; Institutions</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          Partner Portal
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          Empower citizens in your locality. Register your facilitation center, cyber cafe, college desk, or service kiosk on ApplyFields to receive walk-ins, offer transparent form assistance, and build verified community trust.
        </p>
      </div>

      {/* Dedicated Standalone App Banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
            ⚡ Dedicated Operator Portal Now Live
          </span>
          <h2 className="text-xl font-bold mt-2">ApplyFields Partner Portal (partners.applyfields.com)</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            For MeeSeva kiosk operators, CSC digital seva centers, Xerox shops, and Cyber Cafes. Access your dedicated workspace, weekly shift schedule, custom rate card, and citizen booking queue.
          </p>
        </div>
        <a
          href={PARTNER_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400 transition text-sm shrink-0 shadow-lg shadow-emerald-500/25"
        >
          Open Partner Portal <ArrowRight className="size-4" />
        </a>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0e7bf4]">
            <Store className="size-5" />
          </div>
          <h2 className="text-base font-bold text-[#082046]">Citizen Service Centers</h2>
          <p className="text-xs text-[#536780]">
            For CSC, MeeSeva, cyber cafes, and xerox shops offering exam form filling, scanning, and certificate assistance.
          </p>
          <ul className="space-y-1.5 text-xs text-[#435775]">
            <li className="flex items-center gap-1.5">✓ Verified location badge</li>
            <li className="flex items-center gap-1.5">✓ Direct local citizen walk-ins</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <Building2 className="size-5" />
          </div>
          <h2 className="text-base font-bold text-[#082046]">Colleges &amp; Universities</h2>
          <p className="text-xs text-[#536780]">
            For higher education institutions seeking verified candidate admission inquiries and program profile listings.
          </p>
          <ul className="space-y-1.5 text-xs text-[#435775]">
            <li className="flex items-center gap-1.5">✓ Official degree profiles</li>
            <li className="flex items-center gap-1.5">✓ Student comparison matrix</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="size-5" />
          </div>
          <h2 className="text-base font-bold text-[#082046]">Counselors &amp; Mentors</h2>
          <p className="text-xs text-[#536780]">
            For certified educational counselors and career guides providing one-on-one student pathway navigation.
          </p>
          <ul className="space-y-1.5 text-xs text-[#435775]">
            <li className="flex items-center gap-1.5">✓ Verified credential audit</li>
            <li className="flex items-center gap-1.5">✓ Career mode integration</li>
          </ul>
        </div>
      </div>

      {/* Onboarding Form Container */}
      <div className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#082046]">Partner Registration &amp; Verification</h2>
            <p className="mt-1 text-xs text-[#536780]">
              Submit your center details for verification. Once approved by ApplyFields staff, your center will be listed in the Citizen Assistance Directory.
            </p>
          </div>

          {registeredPartner ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-sm text-emerald-900 space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-base">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" /> Application Successfully Received!
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Thank you, <strong>{registeredPartner.owner_name}</strong>. Your partner profile for{' '}
                <strong>{registeredPartner.business_name}</strong> (Slug: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">{registeredPartner.slug}</code>) has been logged in our verification queue.
              </p>
              <div className="rounded-xl bg-white/70 p-3 text-xs text-emerald-900 border border-emerald-200 space-y-1">
                <div><strong>Location:</strong> {registeredPartner.city}, {registeredPartner.district} ({registeredPartner.pincode})</div>
                <div><strong>Status:</strong> Under Review (Pending Staff Verification)</div>
                <div><strong>Mobile:</strong> {registeredPartner.phone}</div>
              </div>
              <p className="text-xs text-emerald-700">
                Our verification team will review your center information and contact you to verify authorization before listing your profile live on the public directory.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegisteredPartner(null);
                  setBusinessName('');
                  setOwnerName('');
                  setPhone('');
                  setWhatsapp('');
                  setEmail('');
                  setAddress('');
                  setDistrict('');
                  setCity('');
                  setPincode('');
                  setDescription('');
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                Register another center
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="partnerType" className="block text-xs font-bold text-[#082046]">
                    Partner Category *
                  </label>
                  <select
                    id="partnerType"
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value as PartnerType)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  >
                    {PARTNER_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="businessName" className="block text-xs font-bold text-[#082046]">
                    Center / Business Name *
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    required
                    placeholder="e.g. Sri Balaji Digital Seva & Cyber Center"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="ownerName" className="block text-xs font-bold text-[#082046]">
                    Owner / Manager Full Name *
                  </label>
                  <input
                    id="ownerName"
                    type="text"
                    required
                    placeholder="Full name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-[#082046]">
                    Mobile Number (10 digits) *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    pattern="[6-9][0-9]{9}"
                    title="10-digit Indian mobile number"
                    placeholder="e.g. 9848012345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-xs font-bold text-[#082046]">
                    WhatsApp Number (Optional)
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    placeholder="e.g. 9848012345"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-[#082046]">
                    Email Address (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="contact@center.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-xs font-bold text-[#082046]">
                    Shop / Center Address *
                  </label>
                  <input
                    id="address"
                    type="text"
                    required
                    placeholder="Shop/Door No., Landmark, Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="stateCode" className="block text-xs font-bold text-[#082046]">
                    State *
                  </label>
                  <select
                    id="stateCode"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  >
                    {STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="district" className="block text-xs font-bold text-[#082046]">
                    District *
                  </label>
                  <input
                    id="district"
                    type="text"
                    required
                    placeholder="e.g. Hyderabad / Rangareddy"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-xs font-bold text-[#082046]">
                    City / Town / Village *
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    placeholder="e.g. Dilsukhnagar"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-xs font-bold text-[#082046]">
                    6-Digit PIN Code *
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    required
                    pattern="[1-9][0-9]{5}"
                    maxLength={6}
                    placeholder="500060"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-xs font-bold text-[#082046]">
                    Services Offered &amp; Facilities (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="e.g. High-speed scanners, biometric iris scanner, color printers, UPSC/SSC application submission help."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3.5 py-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#082046] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#061835] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Center for Verification'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
